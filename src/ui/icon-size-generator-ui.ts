/**
 * Icon Size Generator UI
 * 2-tier architecture with device modes (like Spacing/Gap)
 * 
 * Level 1: Primitives (iconSize.10, iconSize.16...) → Primitives collection
 * Level 2: Semantic (iconSize.interactive.button) → Icon Size collection with Desktop/Tablet/Mobile modes
 */

import {
  IconSizePrimitive,
  IconSizeSemanticToken,
  IconSizeCategory,
  DEFAULT_ICON_SIZE_PRIMITIVES,
  DEFAULT_ICON_SIZE_SEMANTIC_TOKENS,
  ICON_SIZE_CATEGORIES,
} from '../types/icon-size-tokens';

import { storageGet, storageSet, storageDelete, STORAGE_KEYS } from './storage-utils';

// ============================================
// STATE
// ============================================

interface IconSizeState {
  primitives: IconSizePrimitive[];
  semanticTokens: IconSizeSemanticToken[];
}

function createDefaultIconSizeState(): IconSizeState {
  return {
    primitives: [...DEFAULT_ICON_SIZE_PRIMITIVES],
    semanticTokens: [...DEFAULT_ICON_SIZE_SEMANTIC_TOKENS],
  };
}

let iconSizeState: IconSizeState = createDefaultIconSizeState();

let activeIconSizeCategory: IconSizeCategory | 'all' = 'all';
let activeIconSizeTab: 'primitives' | 'semantic' | 'export' = 'primitives';

// ============================================
// STORAGE (using figma.clientStorage via postMessage)
// ============================================

async function saveIconSizeState(): Promise<void> {
  try {
    await storageSet(STORAGE_KEYS.ICON_SIZE_STATE, iconSizeState);
    console.log('[IconSize] State saved');
  } catch (e) {
    console.error('[IconSize] Failed to save state:', e);
  }
}

async function loadIconSizeState(): Promise<void> {
  try {
    const saved = await storageGet<IconSizeState>(STORAGE_KEYS.ICON_SIZE_STATE);
    if (saved) {
      const defaults = createDefaultIconSizeState();
      iconSizeState = {
        primitives: saved.primitives || defaults.primitives,
        semanticTokens: saved.semanticTokens || defaults.semanticTokens,
      };
      console.log('[IconSize] State loaded');
    } else {
      iconSizeState = createDefaultIconSizeState();
      console.log('[IconSize] No saved state, using defaults');
    }
  } catch (e) {
    console.error('[IconSize] Failed to load state:', e);
    iconSizeState = createDefaultIconSizeState();
  }
}

/** Сброс Icon Size к дефолтным значениям */
export async function resetIconSizeToDefaults(): Promise<void> {
  try {
    await storageDelete(STORAGE_KEYS.ICON_SIZE_STATE);
  } catch (e) {
    console.warn('[IconSize] Failed to clear storage:', e);
  }
  
  iconSizeState = createDefaultIconSizeState();
  activeIconSizeCategory = 'all';
  activeIconSizeTab = 'primitives';
  
  renderIconSizePrimitives();
  renderIconSizeCategoryTabs();
  renderIconSizeSemanticTokens();
  
  console.log('[IconSize] Reset to defaults');
}

// ============================================
// INIT
// ============================================

export function initIconSizeUI(): void {
  const container = document.getElementById('prim-icon-size');
  if (!container) return;
  
  // Render initial content with defaults
  renderIconSizePrimitives();
  renderIconSizeCategoryTabs();
  renderIconSizeSemanticTokens();
  
  // Setup event delegation for all clicks inside container
  container.onclick = (e) => {
    const target = e.target as HTMLElement;
    
    // Tab button click (Примитивы / Семантика / Экспорт)
    const tabBtn = target.closest('.typo-tab[data-icon-size-tab]') as HTMLElement;
    if (tabBtn) {
      e.preventDefault();
      const tabId = tabBtn.getAttribute('data-icon-size-tab');
      if (tabId) {
        const tab = tabId.replace('icon-size-', '') as 'primitives' | 'semantic' | 'export';
        setActiveIconSizeTab(tab);
      }
      return;
    }
    
    // Primitive item click
    const primItem = target.closest('.spacing-prim-item[data-icon-size-primitive]') as HTMLElement;
    if (primItem) {
      const name = primItem.getAttribute('data-icon-size-primitive');
      if (name) toggleIconSizePrimitive(name);
      return;
    }
    
    // Category tab click
    const catTab = target.closest('.category-tab[data-icon-size-category]') as HTMLElement;
    if (catTab) {
      const catId = catTab.getAttribute('data-icon-size-category') as IconSizeCategory | 'all';
      if (catId) {
        activeIconSizeCategory = catId;
        renderIconSizeCategoryTabs();
        renderIconSizeSemanticTokens();
      }
      return;
    }
    
    // Export/Generate buttons
    if (target.id === 'btn-generate-icon-size-primitives' || target.id === 'export-icon-size-primitives') {
      exportIconSizePrimitivesToFigma();
      return;
    }
    if (target.id === 'export-icon-size-semantic') {
      exportIconSizeSemanticToFigma();
      return;
    }
    if (target.id === 'export-icon-size-all') {
      exportIconSizePrimitivesToFigma();
      setTimeout(() => exportIconSizeSemanticToFigma(), 500);
      return;
    }
    if (target.id === 'btn-docs-icon-size') {
      generateIconSizeDocumentation();
      return;
    }
    
    // Copy code buttons
    if (target.id === 'export-icon-size-css') {
      exportIconSizeCode('css');
      return;
    }
    if (target.id === 'export-icon-size-scss') {
      exportIconSizeCode('scss');
      return;
    }
    if (target.id === 'export-icon-size-json') {
      exportIconSizeCode('json');
      return;
    }
  };
  
  // Load saved state asynchronously
  loadIconSizeState().then(() => {
    renderIconSizePrimitives();
    renderIconSizeCategoryTabs();
    renderIconSizeSemanticTokens();
  });
}

// ============================================
// TAB MANAGEMENT
// ============================================

function setActiveIconSizeTab(tab: 'primitives' | 'semantic' | 'export'): void {
  activeIconSizeTab = tab;
  
  const container = document.getElementById('prim-icon-size');
  if (!container) return;
  
  // Update tab buttons
  const tabs = container.querySelectorAll('.typo-tab[data-icon-size-tab]');
  tabs.forEach(t => {
    const tabId = t.getAttribute('data-icon-size-tab');
    t.classList.toggle('active', tabId === `icon-size-${tab}`);
  });
  
  // Update content panels
  const contents = container.querySelectorAll('.typo-tab-content');
  contents.forEach(c => c.classList.remove('active'));
  
  const activePanel = document.getElementById(`icon-size-${tab}`);
  if (activePanel) activePanel.classList.add('active');
}

// ============================================
// RENDER PRIMITIVES
// ============================================

function renderIconSizePrimitives(): void {
  const grid = document.getElementById('icon-size-primitives-grid');
  if (!grid) return;
  
  grid.innerHTML = iconSizeState.primitives.map(prim => {
    // Scale preview size for display (max 48px)
    const previewSize = Math.min(prim.value, 48);
    return `
      <div class="spacing-prim-item ${prim.selected ? 'enabled' : ''}" 
           data-icon-size-primitive="${prim.name}"
           title="iconSize.${prim.name} = ${prim.value}px">
        <div class="prim-icon-preview" style="width: ${previewSize}px; height: ${previewSize}px;">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width: 100%; height: 100%;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <span class="prim-name">${prim.name}</span>
        <span class="prim-value">${prim.value}px</span>
      </div>
    `;
  }).join('');
  
  updateIconSizePrimitivesCount();
}

function toggleIconSizePrimitive(name: string): void {
  const prim = iconSizeState.primitives.find(p => p.name === name);
  if (prim) {
    prim.selected = !prim.selected;
    renderIconSizePrimitives();
    saveIconSizeState();
  }
}

function updateIconSizePrimitivesCount(): void {
  const countEl = document.getElementById('icon-size-primitives-count');
  if (countEl) {
    const enabled = iconSizeState.primitives.filter(p => p.selected).length;
    const total = iconSizeState.primitives.length;
    countEl.textContent = `${enabled}/${total}`;
  }
}

// ============================================
// RENDER CATEGORY TABS
// ============================================

function renderIconSizeCategoryTabs(): void {
  const container = document.getElementById('icon-size-category-tabs');
  if (!container) return;
  
  const categories: (IconSizeCategory | 'all')[] = [
    'all',
    'interactive',
    'form',
    'navigation',
    'status',
    'notification',
    'data',
    'media',
    'empty',
    'modal',
    'card',
    'list',
    'action',
    'loading',
    'special',
  ];
  
  container.innerHTML = categories.map(cat => {
    const isActive = activeIconSizeCategory === cat;
    const label = cat === 'all' ? 'Все' : ICON_SIZE_CATEGORIES[cat].label;
    const count = cat === 'all' 
      ? iconSizeState.semanticTokens.length
      : iconSizeState.semanticTokens.filter(t => t.category === cat).length;
    
    return `
      <button class="category-tab ${isActive ? 'active' : ''}" 
              data-icon-size-category="${cat}">
        ${label} <span class="cat-count">${count}</span>
      </button>
    `;
  }).join('');
}

// ============================================
// RENDER SEMANTIC TOKENS (with device modes)
// ============================================

function renderIconSizeSemanticTokens(): void {
  const container = document.getElementById('icon-size-semantic-list');
  if (!container) return;
  
  // Filter tokens by category
  const filteredTokens = activeIconSizeCategory === 'all'
    ? iconSizeState.semanticTokens
    : iconSizeState.semanticTokens.filter(t => t.category === activeIconSizeCategory);
  
  // Group by category
  const grouped = new Map<IconSizeCategory, IconSizeSemanticToken[]>();
  filteredTokens.forEach(token => {
    const list = grouped.get(token.category) || [];
    list.push(token);
    grouped.set(token.category, list);
  });
  
  let html = '';
  
  grouped.forEach((tokens, category) => {
    html += `
      <div class="spacing-semantic-category">
        <div class="semantic-category-header">
          <span class="semantic-category-name">${ICON_SIZE_CATEGORIES[category].label}</span>
          <span class="semantic-category-desc">${ICON_SIZE_CATEGORIES[category].description}</span>
        </div>
        <div class="spacing-semantic-tokens">
          ${tokens.map(t => {
            // Check if values differ across devices
            const hasDifference = t.desktop !== t.tablet || t.tablet !== t.mobile;
            const previewSize = Math.min(parseInt(t.desktop), 32);
            
            return `
            <div class="spacing-semantic-item ${hasDifference ? 'has-variation' : ''}" title="${t.description || t.path}">
              <div class="semantic-icon-preview" style="width: ${previewSize}px; height: ${previewSize}px;">
                <svg viewBox="0 0 24 24" fill="var(--color-primary)" style="width: 100%; height: 100%;">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <div class="semantic-token-info">
                <span class="semantic-token-name">${t.name}</span>
                <span class="semantic-token-path">${t.path}</span>
              </div>
              <div class="semantic-token-devices">
                <span class="device-value" title="Desktop">🖥 ${t.desktop}</span>
                <span class="device-value" title="Tablet">📱 ${t.tablet}</span>
                <span class="device-value" title="Mobile">📲 ${t.mobile}</span>
              </div>
            </div>
          `}).join('')}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html || '<div class="empty-message">Нет токенов в выбранной категории</div>';
  
  // Update count badge
  const countEl = document.getElementById('icon-size-semantic-count');
  if (countEl) {
    countEl.textContent = String(filteredTokens.length);
  }
}

// ============================================
// EXPORT TO FIGMA
// ============================================

function exportIconSizePrimitivesToFigma(): void {
  const enabled = iconSizeState.primitives.filter(p => p.selected);
  if (enabled.length === 0) {
    alert('Выберите хотя бы один примитив');
    return;
  }
  
  parent.postMessage({
    pluginMessage: {
      type: 'create-icon-size-primitives',
      primitives: enabled.map(p => ({ name: p.name, value: p.value }))
    }
  }, '*');
  
  showExportStatus('Примитивы отправлены в Figma...', 'info');
}

function exportIconSizeSemanticToFigma(): void {
  // Send tokens with device mode structure
  parent.postMessage({
    pluginMessage: {
      type: 'create-icon-size-semantic',
      tokens: iconSizeState.semanticTokens.map(t => ({
        id: t.id,
        path: t.path,
        category: t.category,
        name: t.name,
        description: t.description,
        desktop: t.desktop,
        tablet: t.tablet,
        mobile: t.mobile,
      }))
    }
  }, '*');
  
  showExportStatus('Семантические токены с режимами устройств отправлены в Figma...', 'info');
}

function generateIconSizeDocumentation(): void {
  parent.postMessage({
    pluginMessage: { type: 'generate-icon-size-documentation' }
  }, '*');
  
  showExportStatus('Генерация документации...', 'info');
}

// ============================================
// EXPORT CODE
// ============================================

function exportIconSizeCode(format: 'css' | 'scss' | 'json'): void {
  let content = '';
  const enabled = iconSizeState.primitives.filter(p => p.selected);

  if (format === 'css') {
    content = `:root {\n`;
    content += `  /* Icon Size Primitives */\n`;
    enabled.forEach(p => {
      content += `  --icon-size-${p.name}: ${p.value}px;\n`;
    });
    content += `\n  /* Icon Size Semantic Tokens (Desktop values) */\n`;
    iconSizeState.semanticTokens.forEach(t => {
      const cssName = t.path.replace(/\./g, '-');
      content += `  --${cssName}: var(--icon-size-${t.desktop});\n`;
    });
    content += `}\n`;
    
    // Add media queries for tablet/mobile
    content += `\n/* Tablet */\n@media (max-width: 1024px) {\n  :root {\n`;
    iconSizeState.semanticTokens.filter(t => t.tablet !== t.desktop).forEach(t => {
      const cssName = t.path.replace(/\./g, '-');
      content += `    --${cssName}: var(--icon-size-${t.tablet});\n`;
    });
    content += `  }\n}\n`;
    
    content += `\n/* Mobile */\n@media (max-width: 768px) {\n  :root {\n`;
    iconSizeState.semanticTokens.filter(t => t.mobile !== t.tablet).forEach(t => {
      const cssName = t.path.replace(/\./g, '-');
      content += `    --${cssName}: var(--icon-size-${t.mobile});\n`;
    });
    content += `  }\n}\n`;
    
  } else if (format === 'scss') {
    content = `// Icon Size Primitives\n`;
    enabled.forEach(p => {
      content += `$icon-size-${p.name}: ${p.value}px;\n`;
    });
    content += `\n// Icon Size Semantic Tokens (with device variations)\n`;
    iconSizeState.semanticTokens.forEach(t => {
      const scssName = t.path.replace(/\./g, '-');
      content += `$${scssName}-desktop: $icon-size-${t.desktop};\n`;
      content += `$${scssName}-tablet: $icon-size-${t.tablet};\n`;
      content += `$${scssName}-mobile: $icon-size-${t.mobile};\n`;
    });
  } else if (format === 'json') {
    const data = {
      primitives: Object.fromEntries(
        enabled.map(p => [`iconSize.${p.name}`, { value: p.value, type: 'number' }])
      ),
      semantic: Object.fromEntries(
        iconSizeState.semanticTokens.map(t => [t.path, { 
          desktop: { ref: `{iconSize.${t.desktop}}`, value: parseInt(t.desktop) },
          tablet: { ref: `{iconSize.${t.tablet}}`, value: parseInt(t.tablet) },
          mobile: { ref: `{iconSize.${t.mobile}}`, value: parseInt(t.mobile) },
          type: 'number',
          description: t.description
        }])
      )
    };
    content = JSON.stringify(data, null, 2);
  }

  // Copy to clipboard
  navigator.clipboard.writeText(content).then(() => {
    showExportStatus(`Скопировано в буфер обмена (${format.toUpperCase()})`, 'success');
  }).catch(() => {
    showExportStatus('Ошибка копирования', 'error');
  });
}

// ============================================
// HELPERS
// ============================================

function showExportStatus(message: string, type: 'info' | 'success' | 'error'): void {
  const statusEl = document.getElementById('icon-size-export-status');
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.className = `export-status export-status-${type}`;
    statusEl.textContent = message;
    
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
}

// ============================================
// PUBLIC API
// ============================================

export function getIconSizePrimitives(): IconSizePrimitive[] {
  return iconSizeState.primitives;
}

export function getIconSizeSemanticTokens(): IconSizeSemanticToken[] {
  return iconSizeState.semanticTokens;
}
