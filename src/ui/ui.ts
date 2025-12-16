/**
 * Plugin UI Script
 * Main entry point for the Design Tokens Manager UI
 */

import {
  renderTokenManager,
  initTokenManagerEvents,
  initTokenManager,
} from './token-manager-ui';

import {
  renderTokenEditor,
  initTokenEditorEvents,
} from './token-editor-ui';

import {
  initPrimitivesGenerator,
  getGeneratedPalettes,
  getThemes,
} from './primitives-generator-ui';

import {
  initTokensTab,
} from './tokens-generator-ui';

import {
  initComponentsTab,
} from './components-generator-ui';

import {
  getState,
  getTokens,
  saveState,
} from '../types/token-manager-state';

import { TMColorValue } from '../types/token-manager';

import {
  exportTokens,
  exportToFigmaVariables,
  ExportFormat,
} from '../utils/export-utils';

// ============================================
// STATE
// ============================================

let exportOutput = '';

// ============================================
// DOM ELEMENTS
// ============================================

const $ = (id: string) => document.getElementById(id);

const elements = {
  tabs: document.querySelectorAll('.tab') as NodeListOf<HTMLButtonElement>,
  tabContents: document.querySelectorAll('.tab-content') as NodeListOf<HTMLDivElement>,
  
  // Buttons
  btnExport: $('btn-export') as HTMLButtonElement,
  btnCopy: $('btn-copy') as HTMLButtonElement,
  btnDownload: $('btn-download') as HTMLButtonElement,
  btnImport: $('btn-import') as HTMLButtonElement,
  btnValidate: $('btn-validate') as HTMLButtonElement,
  
  // Other
  exportFormat: $('export-format') as HTMLSelectElement,
  exportOutput: $('export-output') as HTMLDivElement,
  importInput: $('import-input') as HTMLTextAreaElement,
  notification: $('notification') as HTMLDivElement,
  tokenManagerContainer: $('token-manager-container') as HTMLDivElement,
};

// ============================================
// UTILITIES
// ============================================

function showNotification(message: string, isError = false): void {
  elements.notification.textContent = message;
  elements.notification.classList.toggle('error', isError);
  elements.notification.classList.add('show');
  setTimeout(() => elements.notification.classList.remove('show'), 3000);
}

function postMessage(type: string, payload?: unknown): void {
  parent.postMessage({ pluginMessage: { type, payload } }, '*');
}

// Helper function to switch tabs programmatically
function switchToTab(tabId: string): void {
  const tab = document.querySelector(`[data-tab="${tabId}"]`) as HTMLElement;
  if (tab && !tab.classList.contains('disabled')) {
    tab.click();
  }
}

// ============================================
// EVENT HANDLERS
// ============================================

// Main Tabs
elements.tabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    // Prevent click if disabled
    if (tab.classList.contains('disabled')) {
      e.preventDefault();
      return;
    }
    
    const targetId = tab.dataset.tab;
    elements.tabs.forEach(t => t.classList.remove('active'));
    elements.tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    if (targetId) {
      const target = $(targetId);
      if (target) target.classList.add('active');
    }
    
    // Refresh Token Manager when switching to it
    if (targetId === 'token-manager') {
      refreshTokenManager();
    }
  });
});

// Export
if (elements.btnExport) {
  elements.btnExport.addEventListener('click', () => {
    const tokens = getTokens();
    if (tokens.length === 0) {
      showNotification('Сначала сгенерируйте токены', true);
      return;
    }
    
    const format = elements.exportFormat.value as ExportFormat;
    
    if (format === 'figma') {
      const figmaVars = exportToFigmaVariables();
      exportOutput = JSON.stringify(figmaVars, null, 2);
    } else {
      const result = exportTokens(format);
      if (typeof result === 'string') {
        exportOutput = result;
      }
    }
    
    elements.exportOutput.textContent = exportOutput;
    showNotification('📦 Экспорт готов!');
  });
}

// Copy
if (elements.btnCopy) {
  elements.btnCopy.addEventListener('click', async () => {
    if (!exportOutput) {
      showNotification('Сначала экспортируйте', true);
      return;
    }
    
    try {
      await navigator.clipboard.writeText(exportOutput);
      showNotification('📋 Скопировано!');
    } catch {
      showNotification('Ошибка копирования', true);
    }
  });
}

// Download
if (elements.btnDownload) {
  elements.btnDownload.addEventListener('click', () => {
    if (!exportOutput) {
      showNotification('Сначала экспортируйте', true);
      return;
    }
    
    const format = elements.exportFormat.value;
    const ext: Record<string, string> = { json: 'json', css: 'css', scss: 'scss', figma: 'json', storybook: 'json', tailwind: 'js' };
    const filename = `design-tokens.${ext[format] || 'json'}`;
    
    const blob = new Blob([exportOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('💾 Файл скачан!');
  });
}

// Import
if (elements.btnValidate) {
  elements.btnValidate.addEventListener('click', () => {
    try {
      JSON.parse(elements.importInput.value);
      showNotification('✓ JSON валиден');
    } catch (e) {
      showNotification('✗ Невалидный JSON', true);
    }
  });
}

if (elements.btnImport) {
  elements.btnImport.addEventListener('click', () => {
    try {
      const data = JSON.parse(elements.importInput.value);
      postMessage('import-tokens', { tokens: data });
      showNotification('📤 Импортирую...');
    } catch {
      showNotification('✗ Невалидный JSON', true);
    }
  });
}

// ============================================
// PLUGIN MESSAGES
// ============================================

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  switch (msg.type) {
    case 'variables-created':
      showNotification('✅ Variables созданы в Figma!');
      break;
    case 'tokens-imported':
      showNotification('✅ Токены импортированы!');
      refreshTokenManager();
      break;
    case 'error':
      showNotification('❌ ' + msg.payload.error, true);
      break;
  }
};

// ============================================
// TOKEN MANAGER INITIALIZATION
// ============================================

function refreshTokenManager(): void {
  if (elements.tokenManagerContainer) {
    elements.tokenManagerContainer.innerHTML = renderTokenManager();
  }
}

function refreshTokenEditor(): void {
  const editorContainer = document.getElementById('token-editor-container');
  if (editorContainer) {
    editorContainer.innerHTML = renderTokenEditor();
  }
}

// Initialize Token Manager
initTokenManager();
refreshTokenManager();

// Setup Token Manager events
if (elements.tokenManagerContainer) {
  initTokenManagerEvents(elements.tokenManagerContainer, refreshTokenManager);
  
  // Custom events from Token Manager
  elements.tokenManagerContainer.addEventListener('sync-figma', () => {
    const figmaVariables = exportToFigmaVariables();
    
    // Filter only COLOR variables from Primitives collection
    // Tokens and Components are auto-generated from mappings in code.ts
    const primitiveColorVariables = figmaVariables.filter(v => 
      v.collection === 'Primitives' &&
      v.value && typeof v.value === 'object' && 'r' in v.value
    );
    
    // Get current themes configuration
    const themes = getThemes().map(t => ({
      id: t.id,
      name: t.name,
      brandColor: t.brandColor,
      hasLightMode: t.hasLightMode,
      hasDarkMode: t.hasDarkMode,
    }));
    
    // Send only Primitives to Figma - Tokens and Components are auto-generated
    postMessage('create-color-variables', { 
      collection: 'Primitives', 
      variables: primitiveColorVariables.map(v => ({
        name: v.name,
        value: v.value,
        description: v.description,
      })),
      themes: themes,
    });
    
    showNotification(`📤 Синхронизирую ${primitiveColorVariables.length} примитивов с Figma... (${themes.length} тем)`);
  });
  
  elements.tokenManagerContainer.addEventListener('export-json', () => {
    const state = getState();
    const format = state.settings.exportFormat || 'json';
    
    // For figma format, handle specially
    if (format === 'figma') {
      const figmaVars = exportToFigmaVariables();
      const exportResult = JSON.stringify(figmaVars, null, 2);
      elements.exportOutput.textContent = exportResult;
      exportOutput = exportResult;
    } else {
      const exportResult = exportTokens(format as ExportFormat);
      if (typeof exportResult === 'string') {
        elements.exportOutput.textContent = exportResult;
        exportOutput = exportResult;
      }
    }
    
    // Switch to export tab
    elements.tabs.forEach(t => t.classList.remove('active'));
    elements.tabContents.forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="export"]')?.classList.add('active');
    $('export')?.classList.add('active');
    
    const formatName = format.toUpperCase();
    showNotification(`📦 ${formatName} сгенерирован!`);
  });
  
  elements.tokenManagerContainer.addEventListener('add-token', () => {
    // Trigger new token dialog via editor
    const editorContainer = document.getElementById('token-editor-container');
    if (editorContainer) {
      editorContainer.dispatchEvent(new CustomEvent('create-new-token'));
    }
  });
  
  elements.tokenManagerContainer.addEventListener('token-selected', (() => {
    // Refresh editor when token is selected
    refreshTokenEditor();
    
    // Also refresh manager to update selection state
    refreshTokenManager();
  }) as EventListener);
}

// Initialize Token Editor
const tokenEditorContainer = document.getElementById('token-editor-container');
if (tokenEditorContainer) {
  tokenEditorContainer.innerHTML = renderTokenEditor();
  initTokenEditorEvents(tokenEditorContainer, () => {
    refreshTokenManager();
    refreshTokenEditor();
  });
}

// ============================================
// PRIMITIVES GENERATOR INITIALIZATION
// ============================================

// Initialize primitives generator (handles sub-tabs and generation)
initPrimitivesGenerator();

// Initialize Tokens tab (semantic tokens with themes)
initTokensTab();

// Initialize Components tab (component tokens)
initComponentsTab();

// Listen for token-generated event to refresh Token Manager
document.addEventListener('tokens-generated', () => {
  refreshTokenManager();
});

// Listen for tokens-updated event (from Tokens and Components generators)
window.addEventListener('tokens-updated', () => {
  refreshTokenManager();
});

// Handle goto-tab links (navigation from warning boxes)
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('goto-tab') || target.closest('.goto-tab')) {
    e.preventDefault();
    const link = target.classList.contains('goto-tab') ? target : target.closest('.goto-tab') as HTMLElement;
    const tabId = link?.getAttribute('data-target');
    if (tabId) {
      switchToTab(tabId);
    }
  }
});

console.log('🎨 Design Tokens Manager initialized');
