/**
 * Gap Generator UI
 * 2-tier architecture for flex/grid gap values
 * 
 * Level 1: Primitives (gap.0, gap.4...) → Primitives collection
 * Level 2: Semantic (gap.inline.icon, gap.action.group) → Gap collection
 */

import {
  GapState,
  GapPrimitive,
  GapSemanticToken,
  GapCategory,
  GAP_CATEGORIES,
  createDefaultGapState,
  getGapTokensByCategory,
  getEnabledGapPrimitives,
} from '../types/gap-tokens';

// ============================================
// STATE
// ============================================

let gapState: GapState = createDefaultGapState();
let activeGapCategory: GapCategory = 'inline';
let activeGapTab: 'primitives' | 'semantic' | 'export' = 'primitives';
let gapInitialized = false;

// ============================================
// INIT
// ============================================

export function initGapUI(): void {
  // Always reload state and re-render
  loadGapState();
  
  const container = document.getElementById('prim-gap');
  if (!container) {
    console.warn('Gap: container #prim-gap not found');
    return;
  }
  
  // Render content
  renderGapPrimitives();
  renderGapCategoryTabs();
  renderGapSemanticTokens();
  
  // Only attach event listeners once
  if (gapInitialized) return;
  gapInitialized = true;
  
  // Tab switching (scoped to #prim-gap container)
  const tabBtns = container.querySelectorAll('.typo-tab[data-gap-tab]');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-gap-tab');
      if (tabId) {
        const tab = tabId.replace('gap-', '') as 'primitives' | 'semantic' | 'export';
        setActiveGapTab(tab);
      }
    });
  });
  
  // Export buttons
  const exportPrimBtn = document.getElementById('export-gap-primitives');
  if (exportPrimBtn) {
    exportPrimBtn.addEventListener('click', () => exportGapPrimitivesToFigma());
  }
  
  const exportSemanticBtn = document.getElementById('export-gap-semantic');
  if (exportSemanticBtn) {
    exportSemanticBtn.addEventListener('click', () => exportGapSemanticToFigma());
  }
  
  const exportAllBtn = document.getElementById('export-gap-all');
  if (exportAllBtn) {
    exportAllBtn.addEventListener('click', () => {
      exportGapPrimitivesToFigma();
      setTimeout(() => exportGapSemanticToFigma(), 500);
    });
  }
  
  // Generate primitives button
  const generatePrimBtn = document.getElementById('btn-generate-gap-primitives');
  if (generatePrimBtn) {
    generatePrimBtn.addEventListener('click', () => exportGapPrimitivesToFigma());
  }
}

// ============================================
// TAB MANAGEMENT
// ============================================

function setActiveGapTab(tab: 'primitives' | 'semantic' | 'export'): void {
  activeGapTab = tab;
  
  // Get the Gap container to scope our selectors
  const container = document.getElementById('prim-gap');
  if (!container) return;
  
  // Update tab buttons (only within Gap container)
  const tabs = container.querySelectorAll('.typo-tab[data-gap-tab]');
  tabs.forEach(t => {
    const tabId = t.getAttribute('data-gap-tab');
    t.classList.toggle('active', tabId === `gap-${tab}`);
  });
  
  // Update content panels (only within Gap container)
  const contents = container.querySelectorAll('.typo-tab-content');
  contents.forEach(c => c.classList.remove('active'));
  
  const activePanel = document.getElementById(`gap-${tab}`);
  if (activePanel) activePanel.classList.add('active');
}

// ============================================
// STATE MANAGEMENT
// ============================================

function loadGapState(): void {
  const saved = localStorage.getItem('gapState');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Validate that primitives exist
      if (parsed.primitives && parsed.primitives.length > 0) {
        gapState = parsed;
      } else {
        gapState = createDefaultGapState();
      }
    } catch (e) {
      console.error('Failed to load gap state:', e);
      gapState = createDefaultGapState();
    }
  } else {
    // No saved state, use defaults
    gapState = createDefaultGapState();
  }
}

function saveGapState(): void {
  localStorage.setItem('gapState', JSON.stringify(gapState));
}

// ============================================
// RENDER PRIMITIVES
// ============================================

function renderGapPrimitives(): void {
  const grid = document.getElementById('gap-primitives-grid');
  if (!grid) return;
  
  grid.innerHTML = gapState.primitives.map(prim => `
    <div class="spacing-primitive-item ${prim.enabled ? 'active' : ''}" 
         data-gap-primitive="${prim.name}"
         title="gap.${prim.name} = ${prim.value}px">
      <span class="spacing-primitive-value">${prim.value}</span>
    </div>
  `).join('');
  
  // Click handlers
  grid.querySelectorAll('.spacing-primitive-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.getAttribute('data-gap-primitive');
      if (name) {
        toggleGapPrimitive(name);
      }
    });
  });
  
  updateGapPrimitivesCount();
}

function toggleGapPrimitive(name: string): void {
  const prim = gapState.primitives.find(p => p.name === name);
  if (prim) {
    prim.enabled = !prim.enabled;
    saveGapState();
    renderGapPrimitives();
    // Update dropdowns in semantic section
    renderGapSemanticTokens();
  }
}

function updateGapPrimitivesCount(): void {
  const countEl = document.getElementById('gap-primitives-count');
  if (countEl) {
    const enabled = gapState.primitives.filter(p => p.enabled).length;
    const total = gapState.primitives.length;
    countEl.textContent = `${enabled}/${total}`;
  }
}

// ============================================
// RENDER CATEGORY TABS
// ============================================

function renderGapCategoryTabs(): void {
  const container = document.getElementById('gap-category-tabs');
  if (!container) return;
  
  container.innerHTML = GAP_CATEGORIES.map(cat => `
    <button class="spacing-category-tab ${cat.id === activeGapCategory ? 'active' : ''}"
            data-gap-category="${cat.id}">
      ${cat.icon} ${cat.label}
    </button>
  `).join('');
  
  // Click handlers
  container.querySelectorAll('.spacing-category-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.getAttribute('data-gap-category') as GapCategory;
      if (catId) {
        activeGapCategory = catId;
        renderGapCategoryTabs();
        renderGapSemanticTokens();
      }
    });
  });
}

// ============================================
// RENDER SEMANTIC TOKENS
// ============================================

function renderGapSemanticTokens(): void {
  const container = document.getElementById('gap-semantic-list');
  if (!container) return;
  
  const tokens = getGapTokensByCategory(gapState.semanticTokens, activeGapCategory);
  const enabledPrimitives = getEnabledGapPrimitives(gapState.primitives);
  
  if (tokens.length === 0) {
    container.innerHTML = '<div class="empty-state">Нет токенов в этой категории</div>';
    return;
  }
  
  // Build options for dropdown
  const options = enabledPrimitives.map(p => 
    `<option value="gap.${p.name}">gap.${p.name} (${p.value}px)</option>`
  ).join('');
  
  container.innerHTML = `
    <table class="semantic-table">
      <thead>
        <tr>
          <th>Токен</th>
          <th>Значение</th>
        </tr>
      </thead>
      <tbody>
        ${tokens.map(token => `
          <tr>
            <td class="token-name">${token.id}</td>
            <td>
              <select class="gap-alias-select" data-gap-token-id="${token.id}">
                ${options}
              </select>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  // Set current values and add change handlers
  container.querySelectorAll('.gap-alias-select').forEach(select => {
    const tokenId = select.getAttribute('data-gap-token-id');
    const token = gapState.semanticTokens.find(t => t.id === tokenId);
    if (token) {
      (select as HTMLSelectElement).value = token.aliasTo;
    }
    
    select.addEventListener('change', (e) => {
      const newValue = (e.target as HTMLSelectElement).value;
      updateGapTokenAlias(tokenId!, newValue);
    });
  });
  
  updateGapSemanticCount();
}

function updateGapTokenAlias(tokenId: string, newAlias: string): void {
  const token = gapState.semanticTokens.find(t => t.id === tokenId);
  if (token) {
    token.aliasTo = newAlias;
    saveGapState();
  }
}

function updateGapSemanticCount(): void {
  const countEl = document.getElementById('gap-semantic-count');
  if (countEl) {
    countEl.textContent = String(gapState.semanticTokens.length);
  }
}

// ============================================
// EXPORT TO FIGMA
// ============================================

function exportGapPrimitivesToFigma(): void {
  const enabledPrimitives = getEnabledGapPrimitives(gapState.primitives);
  
  parent.postMessage({
    pluginMessage: {
      type: 'create-gap-primitives',
      primitives: enabledPrimitives.map(p => ({
        name: p.name,
        value: p.value,
      })),
    }
  }, '*');
  
  showGapExportStatus('Примитивы gap отправлены в Figma...', 'info');
}

function exportGapSemanticToFigma(): void {
  parent.postMessage({
    pluginMessage: {
      type: 'create-gap-semantic',
      tokens: gapState.semanticTokens.map(t => ({
        id: t.id,
        aliasTo: t.aliasTo,
      })),
    }
  }, '*');
  
  showGapExportStatus('Семантические токены gap отправлены в Figma...', 'info');
}

function showGapExportStatus(message: string, type: 'info' | 'success' | 'error'): void {
  const statusEl = document.getElementById('gap-export-status');
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
  
  if (msg.type === 'gap-primitives-created') {
    showGapExportStatus(`✅ Создано ${msg.count} примитивов gap`, 'success');
  } else if (msg.type === 'gap-semantic-created') {
    showGapExportStatus(`✅ Создано ${msg.count} семантических токенов gap`, 'success');
  } else if (msg.type === 'gap-error') {
    showGapExportStatus(`❌ Ошибка: ${msg.error}`, 'error');
  }
});
