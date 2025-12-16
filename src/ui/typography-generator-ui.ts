/**
 * Typography Generator UI
 * Handles primitives, semantic tokens, and Figma sync
 */

import {
  TypographyState,
  TypographySemanticToken,
  TypographyCategory,
  FontSizePrimitive,
  LineHeightPrimitive,
  LetterSpacingPrimitive,
  createDefaultTypographyState,
  DEFAULT_FONT_SIZES,
  DEFAULT_LINE_HEIGHTS,
  DEFAULT_LETTER_SPACINGS,
  lineHeightToPercent,
  letterSpacingToPercent,
  generateTokenId,
} from '../types/typography-tokens';

import { createToken } from '../types/token-manager-state';
import { TMTokenType, TMCollectionType } from '../types/token-manager';

// ============================================
// STATE
// ============================================

let typographyState: TypographyState = createDefaultTypographyState();

// ============================================
// CATEGORY → SUBCATEGORY MAPPING
// ============================================

const CATEGORY_SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
  page: [
    { value: 'hero', label: 'Hero' },
    { value: 'title', label: 'Title' },
    { value: 'subtitle', label: 'Subtitle' },
    { value: 'description', label: 'Description' },
  ],
  section: [
    { value: 'heading', label: 'Heading' },
    { value: 'subheading', label: 'Subheading' },
    { value: 'description', label: 'Description' },
  ],
  card: [
    { value: 'title', label: 'Title' },
    { value: 'subtitle', label: 'Subtitle' },
    { value: 'body', label: 'Body' },
    { value: 'meta', label: 'Meta' },
    { value: 'caption', label: 'Caption' },
  ],
  modal: [
    { value: 'title', label: 'Title' },
    { value: 'body', label: 'Body' },
    { value: 'action', label: 'Action' },
  ],
  sidebar: [
    { value: 'title', label: 'Title' },
    { value: 'item', label: 'Item' },
    { value: 'caption', label: 'Caption' },
  ],
  paragraph: [
    { value: 'lead', label: 'Lead' },
    { value: 'default', label: 'Default' },
    { value: 'compact', label: 'Compact' },
    { value: 'small', label: 'Small' },
  ],
  helper: [
    { value: 'hint', label: 'Hint' },
    { value: 'caption', label: 'Caption' },
    { value: 'label', label: 'Label' },
    { value: 'error', label: 'Error' },
  ],
  action: [
    { value: 'button.primary', label: 'Button Primary' },
    { value: 'button.secondary', label: 'Button Secondary' },
    { value: 'button.compact', label: 'Button Compact' },
    { value: 'link', label: 'Link' },
  ],
  form: [
    { value: 'label', label: 'Label' },
    { value: 'input', label: 'Input Value' },
    { value: 'placeholder', label: 'Placeholder' },
    { value: 'validation', label: 'Validation' },
    { value: 'help', label: 'Help Text' },
  ],
  data: [
    { value: 'table.header', label: 'Table Header' },
    { value: 'table.cell', label: 'Table Cell' },
    { value: 'metric.value', label: 'Metric Value' },
    { value: 'metric.label', label: 'Metric Label' },
    { value: 'metric.delta', label: 'Metric Delta' },
    { value: 'chart.title', label: 'Chart Title' },
    { value: 'chart.label', label: 'Chart Label' },
  ],
  status: [
    { value: 'badge', label: 'Badge' },
    { value: 'tag', label: 'Tag' },
    { value: 'indicator', label: 'Indicator' },
  ],
  notification: [
    { value: 'toast.title', label: 'Toast Title' },
    { value: 'toast.message', label: 'Toast Message' },
    { value: 'alert.title', label: 'Alert Title' },
    { value: 'alert.message', label: 'Alert Message' },
  ],
  navigation: [
    { value: 'menu.item', label: 'Menu Item' },
    { value: 'menu.title', label: 'Menu Title' },
    { value: 'tab.label', label: 'Tab Label' },
    { value: 'breadcrumb', label: 'Breadcrumb' },
  ],
  code: [
    { value: 'inline', label: 'Inline' },
    { value: 'block', label: 'Block' },
  ],
};

// ============================================
// UI INITIALIZATION
// ============================================

export function initTypographyUI(): void {
  // Initialize typography tabs
  initTypographyTabs();
  
  // Render primitives
  renderFontFamilies();
  renderFontSizes();
  renderLineHeights();
  renderLetterSpacings();
  
  // Setup event listeners
  setupTypographyEvents();
  
  // Setup modal events
  setupModalEvents();
  
  // Load default semantic tokens
  loadDefaultSemanticTokens();
}

function initTypographyTabs(): void {
  const tabs = document.querySelectorAll('.typo-tab');
  const contents = document.querySelectorAll('.typo-tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-typo-tab');
      
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');
      }
    });
  });
}

// ============================================
// RENDER PRIMITIVES
// ============================================

function renderFontSizes(): void {
  const container = document.getElementById('font-sizes-grid');
  if (!container) return;
  
  container.innerHTML = typographyState.fontSizes.map(size => `
    <div class="typo-scale-item active" data-size="${size.name}" title="${size.value}px">
      ${size.value}
    </div>
  `).join('');
  
  // Add click handlers
  container.querySelectorAll('.typo-scale-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
}

function renderLineHeights(): void {
  const container = document.getElementById('line-heights-grid');
  if (!container) return;
  
  container.innerHTML = typographyState.lineHeights.map(lh => `
    <div class="typo-scale-item active" data-line-height="${lh.name}" title="×${lh.value}">
      ${lh.value}
    </div>
  `).join('');
  
  container.querySelectorAll('.typo-scale-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
}

function renderLetterSpacings(): void {
  const container = document.getElementById('letter-spacings-grid');
  if (!container) return;
  
  container.innerHTML = typographyState.letterSpacings.map(ls => {
    const isNegative = ls.value < 0;
    const displayValue = ls.value === 0 ? '0' : (ls.value > 0 ? `+${ls.value}` : ls.value);
    return `
      <div class="typo-spacing-item active ${isNegative ? 'negative' : ''}" 
           data-spacing="${ls.name}" 
           title="${ls.value}em = ${letterSpacingToPercent(ls.value)}%">
        ${displayValue}em
      </div>
    `;
  }).join('');
  
  container.querySelectorAll('.typo-spacing-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
}

// ============================================
// SEMANTIC TOKENS
// ============================================

function loadDefaultSemanticTokens(): void {
  // Pre-defined semantic tokens based on the spec
  const defaultTokens: TypographySemanticToken[] = [
    // Page headings
    {
      id: 'typography.page.hero',
      path: ['typography', 'page', 'hero'],
      name: 'hero',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.56}',
      fontWeight: '{font.weight.700}',
      lineHeight: '{font.lineHeight.110}',
      letterSpacing: '{font.letterSpacing.n025}',
      category: 'page',
      description: 'Hero page heading',
    },
    {
      id: 'typography.page.title',
      path: ['typography', 'page', 'title'],
      name: 'title',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.40}',
      fontWeight: '{font.weight.700}',
      lineHeight: '{font.lineHeight.120}',
      letterSpacing: '{font.letterSpacing.n020}',
      category: 'page',
      description: 'Page title',
    },
    {
      id: 'typography.page.subtitle',
      path: ['typography', 'page', 'subtitle'],
      name: 'subtitle',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.24}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.n015}',
      category: 'page',
      description: 'Page subtitle',
    },
    
    // Section headings
    {
      id: 'typography.section.heading',
      path: ['typography', 'section', 'heading'],
      name: 'heading',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.32}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.125}',
      letterSpacing: '{font.letterSpacing.n015}',
      category: 'section',
      description: 'Section heading',
    },
    {
      id: 'typography.section.subheading',
      path: ['typography', 'section', 'subheading'],
      name: 'subheading',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.20}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'section',
      description: 'Section subheading',
    },
    
    // Card typography
    {
      id: 'typography.card.title',
      path: ['typography', 'card', 'title'],
      name: 'title',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.18}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'card',
      description: 'Card title',
    },
    {
      id: 'typography.card.subtitle',
      path: ['typography', 'card', 'subtitle'],
      name: 'subtitle',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'card',
      description: 'Card subtitle',
    },
    
    // Paragraph text
    {
      id: 'typography.paragraph.lead',
      path: ['typography', 'paragraph', 'lead'],
      name: 'lead',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.20}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.160}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'paragraph',
      description: 'Lead paragraph',
    },
    {
      id: 'typography.paragraph.default',
      path: ['typography', 'paragraph', 'default'],
      name: 'default',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.16}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.160}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'paragraph',
      description: 'Default paragraph',
    },
    {
      id: 'typography.paragraph.compact',
      path: ['typography', 'paragraph', 'compact'],
      name: 'compact',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.150}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'paragraph',
      description: 'Compact paragraph',
    },
    
    // Helper text
    {
      id: 'typography.helper.hint',
      path: ['typography', 'helper', 'hint'],
      name: 'hint',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'helper',
      description: 'Hint text',
    },
    {
      id: 'typography.helper.caption',
      path: ['typography', 'helper', 'caption'],
      name: 'caption',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.11}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.015}',
      category: 'helper',
      description: 'Caption text',
    },
    
    // Form elements
    {
      id: 'typography.form.label.default',
      path: ['typography', 'form', 'label', 'default'],
      name: 'default',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'form',
      subcategory: 'label',
      description: 'Form label',
    },
    {
      id: 'typography.form.input.value',
      path: ['typography', 'form', 'input', 'value'],
      name: 'value',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'form',
      subcategory: 'input',
      description: 'Input value text',
    },
    {
      id: 'typography.form.validation.error',
      path: ['typography', 'form', 'validation', 'error'],
      name: 'error',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.130}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'form',
      subcategory: 'validation',
      description: 'Validation error message',
    },
    
    // Button text
    {
      id: 'typography.action.button.primary',
      path: ['typography', 'action', 'button', 'primary'],
      name: 'primary',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.010}',
      category: 'action',
      subcategory: 'button',
      description: 'Primary button text',
    },
    {
      id: 'typography.action.button.compact',
      path: ['typography', 'action', 'button', 'compact'],
      name: 'compact',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.015}',
      category: 'action',
      subcategory: 'button',
      description: 'Compact button text',
    },
    
    // Data/Table
    {
      id: 'typography.data.table.header',
      path: ['typography', 'data', 'table', 'header'],
      name: 'header',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.120}',
      letterSpacing: '{font.letterSpacing.025}',
      textTransform: '{font.transform.uppercase}',
      category: 'data',
      subcategory: 'table',
      description: 'Table header',
    },
    {
      id: 'typography.data.table.cell',
      path: ['typography', 'data', 'table', 'cell'],
      name: 'cell',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'data',
      subcategory: 'table',
      description: 'Table cell',
    },
    
    // Metric/KPI
    {
      id: 'typography.data.metric.value',
      path: ['typography', 'data', 'metric', 'value'],
      name: 'value',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.36}',
      fontWeight: '{font.weight.700}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.n020}',
      category: 'data',
      subcategory: 'metric',
      description: 'Metric value',
    },
    {
      id: 'typography.data.metric.label',
      path: ['typography', 'data', 'metric', 'label'],
      name: 'label',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.12}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.120}',
      letterSpacing: '{font.letterSpacing.025}',
      textTransform: '{font.transform.uppercase}',
      category: 'data',
      subcategory: 'metric',
      description: 'Metric label',
    },
    
    // Badge/Status
    {
      id: 'typography.status.badge.default',
      path: ['typography', 'status', 'badge', 'default'],
      name: 'default',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.11}',
      fontWeight: '{font.weight.600}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.020}',
      category: 'status',
      subcategory: 'badge',
      description: 'Badge text',
    },
    
    // Navigation
    {
      id: 'typography.navigation.menu.item',
      path: ['typography', 'navigation', 'menu', 'item'],
      name: 'item',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'navigation',
      subcategory: 'menu',
      description: 'Menu item',
    },
    {
      id: 'typography.navigation.tab.label',
      path: ['typography', 'navigation', 'tab', 'label'],
      name: 'label',
      fontFamily: '{font.family.roboto}',
      fontSize: '{font.size.14}',
      fontWeight: '{font.weight.500}',
      lineHeight: '{font.lineHeight.100}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'navigation',
      subcategory: 'tab',
      description: 'Tab label',
    },
    
    // Code
    {
      id: 'typography.code.inline',
      path: ['typography', 'code', 'inline'],
      name: 'inline',
      fontFamily: '{font.family.roboto-mono}',
      fontSize: '{font.size.13}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.140}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'code',
      description: 'Inline code',
    },
    {
      id: 'typography.code.block',
      path: ['typography', 'code', 'block'],
      name: 'block',
      fontFamily: '{font.family.roboto-mono}',
      fontSize: '{font.size.13}',
      fontWeight: '{font.weight.400}',
      lineHeight: '{font.lineHeight.160}',
      letterSpacing: '{font.letterSpacing.000}',
      category: 'code',
      description: 'Code block',
    },
  ];
  
  typographyState.semanticTokens = defaultTokens;
  renderSemanticTokens();
}

function renderSemanticTokens(): void {
  const container = document.getElementById('semantic-tokens-list');
  if (!container) return;
  
  // Group tokens by category
  const grouped = typographyState.semanticTokens.reduce((acc, token) => {
    if (!acc[token.category]) acc[token.category] = [];
    acc[token.category].push(token);
    return acc;
  }, {} as Record<string, TypographySemanticToken[]>);
  
  const categoryIcons: Record<string, string> = {
    page: '📄',
    section: '📑',
    card: '🃏',
    modal: '🪟',
    sidebar: '📌',
    paragraph: '📝',
    helper: '💡',
    action: '🔘',
    form: '📋',
    data: '📊',
    status: '🏷️',
    notification: '🔔',
    navigation: '🧭',
    code: '💻',
    content: '📖',
    empty: '📭',
    loading: '⏳',
  };
  
  container.innerHTML = Object.entries(grouped).map(([category, tokens]) => `
    <div class="semantic-token-group" data-category="${category}">
      <div class="semantic-group-header">
        <span class="group-icon">${categoryIcons[category] || '📎'}</span>
        <span class="group-name">${category.charAt(0).toUpperCase() + category.slice(1)}</span>
        <span class="group-count">${tokens.length} токен${tokens.length > 1 ? (tokens.length < 5 ? 'а' : 'ов') : ''}</span>
      </div>
      <div class="semantic-group-items">
        ${tokens.map(token => renderSemanticTokenItem(token)).join('')}
      </div>
    </div>
  `).join('');
  
  // Setup edit handlers
  container.querySelectorAll('.btn-edit-token').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = (e.target as HTMLElement).closest('.semantic-token-item');
      const tokenId = item?.getAttribute('data-token');
      if (tokenId) openTokenEditor(tokenId);
    });
  });
}

function renderSemanticTokenItem(token: TypographySemanticToken): string {
  // Parse token references to get display values
  const fontSize = token.fontSize.match(/\{font\.size\.(\d+)\}/)?.[1] || '?';
  const fontWeight = token.fontWeight.match(/\{font\.weight\.(\d+)\}/)?.[1] || '?';
  const lineHeight = token.lineHeight.match(/\{font\.lineHeight\.(\d+)\}/)?.[1] || '?';
  const letterSpacing = token.letterSpacing.match(/\{font\.letterSpacing\.(n?\d+)\}/)?.[1] || '0';
  
  const lhValue = typographyState.lineHeights.find(lh => lh.name === lineHeight)?.value || 1.4;
  const lsValue = typographyState.letterSpacings.find(ls => ls.name === letterSpacing)?.value || 0;
  const lsDisplay = lsValue === 0 ? '0' : `${lsValue}em`;
  
  const displayName = token.path.slice(1).join('.');
  
  return `
    <div class="semantic-token-item" data-token="${token.id}">
      <div class="token-name">${displayName}</div>
      <div class="token-preview" style="font-size: ${Math.min(parseInt(fontSize), 20)}px; font-weight: ${fontWeight};">
        ${token.description || token.name}
      </div>
      <div class="token-props">${fontSize}px · ${getWeightLabel(parseInt(fontWeight))} · ${lhValue} · ${lsDisplay}</div>
      <button class="btn-icon btn-edit-token" title="Редактировать">✏️</button>
    </div>
  `;
}

function getWeightLabel(weight: number): string {
  const labels: Record<number, string> = {
    100: 'Thin',
    200: 'ExtraLight',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semibold',
    700: 'Bold',
    800: 'ExtraBold',
    900: 'Black',
  };
  return labels[weight] || String(weight);
}

// ============================================
// TOKEN EDITOR MODAL
// ============================================

let currentEditingTokenId: string | null = null;
let isNewToken = false;

function openTokenEditor(tokenId: string): void {
  const token = typographyState.semanticTokens.find(t => t.id === tokenId);
  if (!token) return;
  
  currentEditingTokenId = tokenId;
  isNewToken = false;
  
  // Populate form fields
  const modal = document.getElementById('typography-modal');
  if (!modal) return;
  
  (document.getElementById('typography-modal-title') as HTMLElement).textContent = 'Редактировать токен';
  (document.getElementById('typo-token-path') as HTMLInputElement).value = token.id;
  (document.getElementById('typo-token-name') as HTMLInputElement).value = token.name;
  (document.getElementById('typo-font-family') as HTMLSelectElement).value = token.fontFamily;
  (document.getElementById('typo-font-size') as HTMLSelectElement).value = token.fontSize;
  (document.getElementById('typo-font-weight') as HTMLSelectElement).value = token.fontWeight;
  (document.getElementById('typo-line-height') as HTMLSelectElement).value = token.lineHeight;
  (document.getElementById('typo-letter-spacing') as HTMLSelectElement).value = token.letterSpacing;
  (document.getElementById('typo-text-decoration') as HTMLSelectElement).value = token.textDecoration || '';
  (document.getElementById('typo-text-transform') as HTMLSelectElement).value = token.textTransform || '';
  (document.getElementById('typo-category') as HTMLSelectElement).value = token.category;
  
  // Update subcategory options based on category, then set value
  updateSubcategoryOptions(token.category);
  (document.getElementById('typo-subcategory') as HTMLSelectElement).value = token.subcategory || '';
  
  (document.getElementById('typo-description') as HTMLTextAreaElement).value = token.description || '';
  
  // Show delete button for existing tokens
  const deleteBtn = document.getElementById('typography-modal-delete');
  if (deleteBtn) deleteBtn.style.display = 'block';
  
  // Update preview
  updateTokenPreview();
  
  // Show modal
  modal.style.display = 'flex';
}

function openNewTokenEditor(): void {
  currentEditingTokenId = null;
  isNewToken = true;
  
  const modal = document.getElementById('typography-modal');
  if (!modal) return;
  
  const defaultCategory = 'paragraph';
  
  (document.getElementById('typography-modal-title') as HTMLElement).textContent = 'Новый токен';
  (document.getElementById('typo-token-path') as HTMLInputElement).value = 'typography.custom.';
  (document.getElementById('typo-token-name') as HTMLInputElement).value = '';
  (document.getElementById('typo-font-family') as HTMLSelectElement).value = '{font.family.roboto}';
  (document.getElementById('typo-font-size') as HTMLSelectElement).value = '{font.size.16}';
  (document.getElementById('typo-font-weight') as HTMLSelectElement).value = '{font.weight.400}';
  (document.getElementById('typo-line-height') as HTMLSelectElement).value = '{font.lineHeight.140}';
  (document.getElementById('typo-letter-spacing') as HTMLSelectElement).value = '{font.letterSpacing.000}';
  (document.getElementById('typo-text-decoration') as HTMLSelectElement).value = '';
  (document.getElementById('typo-text-transform') as HTMLSelectElement).value = '';
  (document.getElementById('typo-category') as HTMLSelectElement).value = defaultCategory;
  
  // Update subcategory options based on default category
  updateSubcategoryOptions(defaultCategory);
  
  (document.getElementById('typo-description') as HTMLTextAreaElement).value = '';
  
  // Hide delete button for new tokens
  const deleteBtn = document.getElementById('typography-modal-delete');
  if (deleteBtn) deleteBtn.style.display = 'none';
  
  // Update preview
  updateTokenPreview();
  
  // Show modal
  modal.style.display = 'flex';
}

function closeTokenEditor(): void {
  const modal = document.getElementById('typography-modal');
  if (modal) modal.style.display = 'none';
  currentEditingTokenId = null;
  isNewToken = false;
}

function saveToken(): void {
  const category = (document.getElementById('typo-category') as HTMLSelectElement).value as TypographyCategory;
  const subcategory = (document.getElementById('typo-subcategory') as HTMLSelectElement).value;
  const name = (document.getElementById('typo-token-name') as HTMLInputElement).value.trim();
  
  if (!name) {
    showNotification('⚠️ Введите название токена');
    return;
  }
  
  // Build path from subcategory (which may contain dots like "table.header")
  const path = ['typography', category];
  if (subcategory) {
    // Split subcategory by dots and add each part to path
    subcategory.split('.').forEach(part => path.push(part));
  }
  path.push(name);
  
  const tokenId = path.join('.');
  
  const tokenData: TypographySemanticToken = {
    id: tokenId,
    path: path,
    name: name,
    fontFamily: (document.getElementById('typo-font-family') as HTMLSelectElement).value,
    fontSize: (document.getElementById('typo-font-size') as HTMLSelectElement).value,
    fontWeight: (document.getElementById('typo-font-weight') as HTMLSelectElement).value,
    lineHeight: (document.getElementById('typo-line-height') as HTMLSelectElement).value,
    letterSpacing: (document.getElementById('typo-letter-spacing') as HTMLSelectElement).value,
    textDecoration: (document.getElementById('typo-text-decoration') as HTMLSelectElement).value || undefined,
    textTransform: (document.getElementById('typo-text-transform') as HTMLSelectElement).value || undefined,
    category: category,
    subcategory: subcategory || undefined,
    description: (document.getElementById('typo-description') as HTMLTextAreaElement).value.trim() || undefined,
  };
  
  if (isNewToken) {
    // Check for duplicate
    const exists = typographyState.semanticTokens.some(t => t.id === tokenId);
    if (exists) {
      showNotification('⚠️ Токен с таким путём уже существует');
      return;
    }
    typographyState.semanticTokens.push(tokenData);
    showNotification('✨ Токен создан');
  } else {
    // Update existing token
    const index = typographyState.semanticTokens.findIndex(t => t.id === currentEditingTokenId);
    if (index !== -1) {
      typographyState.semanticTokens[index] = tokenData;
      showNotification('✅ Токен обновлён');
    }
  }
  
  renderSemanticTokens();
  closeTokenEditor();
}

function deleteToken(): void {
  if (!currentEditingTokenId) return;
  
  const index = typographyState.semanticTokens.findIndex(t => t.id === currentEditingTokenId);
  if (index !== -1) {
    typographyState.semanticTokens.splice(index, 1);
    renderSemanticTokens();
    showNotification('🗑️ Токен удалён');
  }
  
  closeTokenEditor();
}

function updateTokenPreview(): void {
  const preview = document.getElementById('typo-edit-preview');
  if (!preview) return;
  
  const fontSize = (document.getElementById('typo-font-size') as HTMLSelectElement).value;
  const fontWeight = (document.getElementById('typo-font-weight') as HTMLSelectElement).value;
  const lineHeight = (document.getElementById('typo-line-height') as HTMLSelectElement).value;
  const letterSpacing = (document.getElementById('typo-letter-spacing') as HTMLSelectElement).value;
  const textDecoration = (document.getElementById('typo-text-decoration') as HTMLSelectElement).value;
  const textTransform = (document.getElementById('typo-text-transform') as HTMLSelectElement).value;
  
  // Parse values
  const sizeValue = fontSize.match(/\{font\.size\.(\d+)\}/)?.[1] || '16';
  const weightValue = fontWeight.match(/\{font\.weight\.(\d+)\}/)?.[1] || '400';
  const lhValue = lineHeight.match(/\{font\.lineHeight\.(\d+)\}/)?.[1] || '140';
  const lsValue = letterSpacing.match(/\{font\.letterSpacing\.(n?\d+)\}/)?.[1] || '000';
  
  // Convert letter spacing
  let lsEm = 0;
  if (lsValue.startsWith('n')) {
    lsEm = -parseInt(lsValue.slice(1)) / 1000;
  } else {
    lsEm = parseInt(lsValue) / 1000;
  }
  
  const previewSize = Math.min(parseInt(sizeValue), 32);
  
  let styles = `font-size: ${previewSize}px; font-weight: ${weightValue}; line-height: ${parseInt(lhValue) / 100}; letter-spacing: ${lsEm}em;`;
  
  if (textDecoration) {
    const decValue = textDecoration.match(/\{font\.decoration\.([^}]+)\}/)?.[1] || '';
    if (decValue) styles += ` text-decoration: ${decValue};`;
  }
  
  if (textTransform) {
    const transValue = textTransform.match(/\{font\.transform\.([^}]+)\}/)?.[1] || '';
    if (transValue) styles += ` text-transform: ${transValue};`;
  }
  
  preview.innerHTML = `<span style="${styles}">Sample Text Preview</span>`;
}

function setupModalEvents(): void {
  // Close modal
  const closeBtn = document.getElementById('typography-modal-close');
  const cancelBtn = document.getElementById('typography-modal-cancel');
  
  if (closeBtn) closeBtn.addEventListener('click', closeTokenEditor);
  if (cancelBtn) cancelBtn.addEventListener('click', closeTokenEditor);
  
  // Save
  const saveBtn = document.getElementById('typography-modal-save');
  if (saveBtn) saveBtn.addEventListener('click', saveToken);
  
  // Delete
  const deleteBtn = document.getElementById('typography-modal-delete');
  if (deleteBtn) deleteBtn.addEventListener('click', deleteToken);
  
  // Preview update on form change
  const formSelects = document.querySelectorAll('#typography-token-form select');
  formSelects.forEach(select => {
    select.addEventListener('change', updateTokenPreview);
  });
  
  // Category change → update subcategories
  const categorySelect = document.getElementById('typo-category') as HTMLSelectElement;
  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      updateSubcategoryOptions(categorySelect.value);
    });
  }
  
  // Add new token button
  const addTokenBtn = document.getElementById('btn-add-semantic-token');
  if (addTokenBtn) {
    addTokenBtn.addEventListener('click', openNewTokenEditor);
  }
  
  // Close on overlay click
  const modal = document.getElementById('typography-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeTokenEditor();
    });
  }
}

// Update subcategory select based on category
function updateSubcategoryOptions(category: string): void {
  const subcategorySelect = document.getElementById('typo-subcategory') as HTMLSelectElement;
  if (!subcategorySelect) return;
  
  const subcategories = CATEGORY_SUBCATEGORIES[category] || [];
  
  subcategorySelect.innerHTML = subcategories.map(sub => 
    `<option value="${sub.value}">${sub.label}</option>`
  ).join('');
}

// ============================================
// EVENT HANDLERS
// ============================================

function setupTypographyEvents(): void {
  // Generate Primitives button
  const btnGeneratePrimitives = document.getElementById('btn-generate-typography-primitives');
  if (btnGeneratePrimitives) {
    btnGeneratePrimitives.addEventListener('click', generateTypographyPrimitives);
  }
  
  // Generate Semantic button
  const btnGenerateSemantic = document.getElementById('btn-generate-semantic-typography');
  if (btnGenerateSemantic) {
    btnGenerateSemantic.addEventListener('click', generateSemanticTypography);
  }
  
  // Import defaults button
  const btnImportDefaults = document.getElementById('btn-import-semantic-defaults');
  if (btnImportDefaults) {
    btnImportDefaults.addEventListener('click', () => {
      loadDefaultSemanticTokens();
      showNotification('📥 Стандартные токены загружены');
    });
  }
  
  // Sync with Figma button
  const btnSyncFigma = document.getElementById('btn-sync-typography-figma');
  if (btnSyncFigma) {
    btnSyncFigma.addEventListener('click', syncTypographyToFigma);
  }
  
  // Create Text Styles button
  const btnCreateTextStyles = document.getElementById('btn-create-text-styles');
  if (btnCreateTextStyles) {
    btnCreateTextStyles.addEventListener('click', createTextStylesInFigma);
  }
  
  // Category filter
  document.querySelectorAll('.typo-category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      
      document.querySelectorAll('.typo-category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      filterSemanticTokens(category || 'all');
    });
  });
  
  // Font weight toggle
  document.querySelectorAll('.typo-weight-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
    });
  });
  
  // Text options toggle
  document.querySelectorAll('.typo-option').forEach(option => {
    option.addEventListener('click', () => {
      option.classList.toggle('active');
      const checkbox = option.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (checkbox) checkbox.checked = option.classList.contains('active');
    });
  });
  
  // Setup primitive add buttons
  setupPrimitiveModals();
}

// ============================================
// FONT FAMILIES RENDERING & MANAGEMENT
// ============================================

function renderFontFamilies(): void {
  const container = document.getElementById('font-families-grid');
  if (!container) return;
  
  container.innerHTML = typographyState.fontFamilies.map(family => `
    <div class="typo-card active" data-font="${family.name}">
      <div class="typo-card-header">
        <span class="typo-card-name">${family.name}</span>
        <span class="typo-card-badge">${family.category}</span>
      </div>
      <div class="typo-card-value">${family.value}</div>
      <div class="typo-card-fallback">${family.fallback || ''}</div>
    </div>
  `).join('');
  
  // Add click handlers for toggle
  container.querySelectorAll('.typo-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('active');
    });
  });
}

function setupPrimitiveModals(): void {
  // Font Family Modal
  const btnAddFontFamily = document.getElementById('btn-add-font-family');
  const fontFamilyModal = document.getElementById('font-family-modal');
  
  if (btnAddFontFamily && fontFamilyModal) {
    btnAddFontFamily.addEventListener('click', () => {
      fontFamilyModal.style.display = 'flex';
    });
    
    // Close handlers
    document.getElementById('font-family-modal-close')?.addEventListener('click', () => {
      fontFamilyModal.style.display = 'none';
    });
    document.getElementById('font-family-modal-cancel')?.addEventListener('click', () => {
      fontFamilyModal.style.display = 'none';
    });
    fontFamilyModal.addEventListener('click', (e) => {
      if (e.target === fontFamilyModal) fontFamilyModal.style.display = 'none';
    });
    
    // Save handler
    document.getElementById('font-family-modal-save')?.addEventListener('click', () => {
      const name = (document.getElementById('new-font-name') as HTMLInputElement).value.trim().toLowerCase().replace(/\s+/g, '-');
      const value = (document.getElementById('new-font-value') as HTMLInputElement).value.trim();
      const fallback = (document.getElementById('new-font-fallback') as HTMLInputElement).value.trim();
      const category = (document.getElementById('new-font-category') as HTMLSelectElement).value as 'sans' | 'serif' | 'mono' | 'display' | 'custom';
      
      if (!name || !value) {
        showNotification('⚠️ Заполните название и font-family');
        return;
      }
      
      // Check for duplicate
      if (typographyState.fontFamilies.some(f => f.name === name)) {
        showNotification('⚠️ Шрифт с таким именем уже существует');
        return;
      }
      
      typographyState.fontFamilies.push({ name, value, fallback, category });
      renderFontFamilies();
      updateFontFamilySelect();
      
      // Clear form
      (document.getElementById('new-font-name') as HTMLInputElement).value = '';
      (document.getElementById('new-font-value') as HTMLInputElement).value = '';
      (document.getElementById('new-font-fallback') as HTMLInputElement).value = '';
      
      fontFamilyModal.style.display = 'none';
      showNotification('✅ Шрифт добавлен');
    });
  }
  
  // Font Size Modal
  const btnAddFontSize = document.getElementById('btn-add-font-size');
  const fontSizeModal = document.getElementById('font-size-modal');
  
  if (btnAddFontSize && fontSizeModal) {
    btnAddFontSize.addEventListener('click', () => {
      fontSizeModal.style.display = 'flex';
    });
    
    document.getElementById('font-size-modal-close')?.addEventListener('click', () => {
      fontSizeModal.style.display = 'none';
    });
    document.getElementById('font-size-modal-cancel')?.addEventListener('click', () => {
      fontSizeModal.style.display = 'none';
    });
    fontSizeModal.addEventListener('click', (e) => {
      if (e.target === fontSizeModal) fontSizeModal.style.display = 'none';
    });
    
    document.getElementById('font-size-modal-save')?.addEventListener('click', () => {
      const size = parseInt((document.getElementById('new-font-size') as HTMLInputElement).value);
      
      if (!size || size < 1) {
        showNotification('⚠️ Введите корректный размер');
        return;
      }
      
      const name = String(size);
      if (typographyState.fontSizes.some(s => s.name === name)) {
        showNotification('⚠️ Такой размер уже существует');
        return;
      }
      
      typographyState.fontSizes.push({ name, value: size });
      typographyState.fontSizes.sort((a, b) => a.value - b.value);
      renderFontSizes();
      updateFontSizeSelect();
      
      (document.getElementById('new-font-size') as HTMLInputElement).value = '';
      fontSizeModal.style.display = 'none';
      showNotification('✅ Размер добавлен');
    });
  }
  
  // Line Height Modal
  const btnAddLineHeight = document.getElementById('btn-add-line-height');
  const lineHeightModal = document.getElementById('line-height-modal');
  
  if (btnAddLineHeight && lineHeightModal) {
    btnAddLineHeight.addEventListener('click', () => {
      lineHeightModal.style.display = 'flex';
    });
    
    document.getElementById('line-height-modal-close')?.addEventListener('click', () => {
      lineHeightModal.style.display = 'none';
    });
    document.getElementById('line-height-modal-cancel')?.addEventListener('click', () => {
      lineHeightModal.style.display = 'none';
    });
    lineHeightModal.addEventListener('click', (e) => {
      if (e.target === lineHeightModal) lineHeightModal.style.display = 'none';
    });
    
    document.getElementById('line-height-modal-save')?.addEventListener('click', () => {
      const value = parseFloat((document.getElementById('new-line-height') as HTMLInputElement).value);
      
      if (!value || value < 0.5) {
        showNotification('⚠️ Введите корректное значение');
        return;
      }
      
      const name = String(Math.round(value * 100));
      if (typographyState.lineHeights.some(lh => lh.name === name)) {
        showNotification('⚠️ Такой интервал уже существует');
        return;
      }
      
      typographyState.lineHeights.push({ name, value });
      typographyState.lineHeights.sort((a, b) => a.value - b.value);
      renderLineHeights();
      updateLineHeightSelect();
      
      (document.getElementById('new-line-height') as HTMLInputElement).value = '';
      lineHeightModal.style.display = 'none';
      showNotification('✅ Интервал добавлен');
    });
  }
}

// Update select options in typography token editor
function updateFontFamilySelect(): void {
  const select = document.getElementById('typo-font-family') as HTMLSelectElement;
  if (!select) return;
  
  select.innerHTML = typographyState.fontFamilies.map(f => 
    `<option value="{font.family.${f.name}}">${f.value}</option>`
  ).join('');
}

function updateFontSizeSelect(): void {
  const select = document.getElementById('typo-font-size') as HTMLSelectElement;
  if (!select) return;
  
  select.innerHTML = typographyState.fontSizes.map(s => 
    `<option value="{font.size.${s.name}}">${s.value}px</option>`
  ).join('');
}

function updateLineHeightSelect(): void {
  const select = document.getElementById('typo-line-height') as HTMLSelectElement;
  if (!select) return;
  
  select.innerHTML = typographyState.lineHeights.map(lh => 
    `<option value="{font.lineHeight.${lh.name}}">${lh.value} (${Math.round(lh.value * 100)}%)</option>`
  ).join('');
}

function filterSemanticTokens(category: string): void {
  const groups = document.querySelectorAll('.semantic-token-group');
  
  groups.forEach(group => {
    if (category === 'all' || group.getAttribute('data-category') === category) {
      (group as HTMLElement).style.display = 'block';
    } else {
      (group as HTMLElement).style.display = 'none';
    }
  });
}

// ============================================
// TOKEN GENERATION
// ============================================

function generateTypographyPrimitives(): void {
  // Collect enabled font sizes
  const enabledSizes = getEnabledPrimitives('font-sizes-grid', 'data-size');
  const enabledLineHeights = getEnabledPrimitives('line-heights-grid', 'data-line-height');
  const enabledLetterSpacings = getEnabledPrimitives('letter-spacings-grid', 'data-spacing');
  const enabledWeights = getEnabledPrimitives('font-weights-grid', 'data-weight');
  
  // Generate font family tokens
  typographyState.fontFamilies.forEach(family => {
    createToken({
      name: family.name,
      path: ['font', 'family'],
      type: 'STRING' as TMTokenType,
      value: family.value,
      collection: 'Primitives' as TMCollectionType,
      description: `Font family: ${family.value}`,
    });
  });
  
  // Generate font size tokens
  enabledSizes.forEach(sizeName => {
    const size = typographyState.fontSizes.find(s => s.name === sizeName);
    if (size) {
      createToken({
        name: size.name,
        path: ['font', 'size'],
        type: 'NUMBER' as TMTokenType,
        value: size.value,
        collection: 'Primitives' as TMCollectionType,
        description: `Font size: ${size.value}px`,
      });
    }
  });
  
  // Generate line height tokens
  enabledLineHeights.forEach(lhName => {
    const lh = typographyState.lineHeights.find(l => l.name === lhName);
    if (lh) {
      createToken({
        name: lh.name,
        path: ['font', 'lineHeight'],
        type: 'NUMBER' as TMTokenType,
        value: lh.value,
        collection: 'Primitives' as TMCollectionType,
        description: `Line height: ${lh.value} (${lineHeightToPercent(lh.value)}%)`,
      });
    }
  });
  
  // Generate font weight tokens
  enabledWeights.forEach(weightName => {
    const weight = typographyState.fontWeights.find(w => w.name === weightName);
    if (weight) {
      createToken({
        name: weight.name,
        path: ['font', 'weight'],
        type: 'NUMBER' as TMTokenType,
        value: weight.value,
        collection: 'Primitives' as TMCollectionType,
        description: `Font weight: ${weight.label} (${weight.value})`,
      });
    }
  });
  
  // Generate letter spacing tokens
  enabledLetterSpacings.forEach(lsName => {
    const ls = typographyState.letterSpacings.find(l => l.name === lsName);
    if (ls) {
      createToken({
        name: ls.name,
        path: ['font', 'letterSpacing'],
        type: 'NUMBER' as TMTokenType,
        value: ls.value,
        collection: 'Primitives' as TMCollectionType,
        description: `Letter spacing: ${ls.value}em (${letterSpacingToPercent(ls.value)}%)`,
      });
    }
  });
  
  // Generate text decoration tokens
  const enabledDecorations = getEnabledTextOptions('text-decorations-group');
  enabledDecorations.forEach(dec => {
    createToken({
      name: dec,
      path: ['font', 'decoration'],
      type: 'STRING' as TMTokenType,
      value: dec,
      collection: 'Primitives' as TMCollectionType,
      description: `Text decoration: ${dec}`,
    });
  });
  
  // Generate text transform tokens
  const enabledTransforms = getEnabledTextOptions('text-transforms-group');
  enabledTransforms.forEach(transform => {
    createToken({
      name: transform,
      path: ['font', 'transform'],
      type: 'STRING' as TMTokenType,
      value: transform,
      collection: 'Primitives' as TMCollectionType,
      description: `Text transform: ${transform}`,
    });
  });
  
  // Font style tokens
  createToken({
    name: 'normal',
    path: ['font', 'style'],
    type: 'STRING' as TMTokenType,
    value: 'normal',
    collection: 'Primitives' as TMCollectionType,
    description: 'Font style: normal',
  });
  
  createToken({
    name: 'italic',
    path: ['font', 'style'],
    type: 'STRING' as TMTokenType,
    value: 'italic',
    collection: 'Primitives' as TMCollectionType,
    description: 'Font style: italic',
  });
  
  showNotification('✨ Примитивы типографики сгенерированы!');
  notifyTokensUpdated();
}

function generateSemanticTypography(): void {
  // Generate semantic tokens from state
  typographyState.semanticTokens.forEach(token => {
    // Create separate tokens for each typography property
    const properties = [
      { suffix: 'fontFamily', value: token.fontFamily, type: 'STRING' as TMTokenType },
      { suffix: 'fontSize', value: token.fontSize, type: 'STRING' as TMTokenType },
      { suffix: 'fontWeight', value: token.fontWeight, type: 'STRING' as TMTokenType },
      { suffix: 'lineHeight', value: token.lineHeight, type: 'STRING' as TMTokenType },
      { suffix: 'letterSpacing', value: token.letterSpacing, type: 'STRING' as TMTokenType },
    ];
    
    if (token.textDecoration) {
      properties.push({ suffix: 'textDecoration', value: token.textDecoration, type: 'STRING' as TMTokenType });
    }
    if (token.textTransform) {
      properties.push({ suffix: 'textTransform', value: token.textTransform, type: 'STRING' as TMTokenType });
    }
    if (token.fontStyle) {
      properties.push({ suffix: 'fontStyle', value: token.fontStyle, type: 'STRING' as TMTokenType });
    }
    
    properties.forEach(prop => {
      createToken({
        name: prop.suffix,
        path: token.path,
        type: prop.type,
        value: prop.value,
        collection: 'Tokens' as TMCollectionType,
        description: `${token.description || token.name} - ${prop.suffix}`,
      });
    });
  });
  
  showNotification('✨ Семантические токены типографики сгенерированы!');
  notifyTokensUpdated();
}

function syncTypographyToFigma(): void {
  // Prepare typography variables for Figma
  const variables: any[] = [];
  
  // Collect primitives
  typographyState.fontSizes.forEach(size => {
    variables.push({
      name: `font/size/${size.name}`,
      value: size.value,
      type: 'NUMBER',
      collection: 'Primitives',
    });
  });
  
  typographyState.lineHeights.forEach(lh => {
    variables.push({
      name: `font/lineHeight/${lh.name}`,
      value: lineHeightToPercent(lh.value), // Convert to % for Figma
      type: 'NUMBER',
      collection: 'Primitives',
    });
  });
  
  typographyState.fontWeights.forEach(weight => {
    variables.push({
      name: `font/weight/${weight.name}`,
      value: weight.value,
      type: 'NUMBER',
      collection: 'Primitives',
    });
  });
  
  // Send to Figma
  parent.postMessage({
    pluginMessage: {
      type: 'create-typography-variables',
      payload: { variables },
    },
  }, '*');
  
  showNotification('🔄 Синхронизация с Figma...');
}

function createTextStylesInFigma(): void {
  // Подготавливаем данные для создания Text Styles
  const semanticTokens = typographyState.semanticTokens.map(token => ({
    id: token.id,
    name: token.name,
    path: token.path,
    fontFamily: token.fontFamily,
    fontSize: token.fontSize,
    fontWeight: token.fontWeight,
    lineHeight: token.lineHeight,
    letterSpacing: token.letterSpacing,
    textDecoration: token.textDecoration,
    textTransform: token.textTransform,
    fontStyle: token.fontStyle,
    description: token.description,
    category: token.category,
    subcategory: token.subcategory,
  }));
  
  const primitives = {
    fontFamilies: typographyState.fontFamilies.map(f => ({
      name: f.name,
      value: f.value,
      isEnabled: true, // All fonts in state are considered enabled
    })),
    fontSizes: typographyState.fontSizes.map(s => ({
      name: s.name,
      value: s.value,
    })),
    lineHeights: typographyState.lineHeights.map(lh => ({
      name: lh.name,
      value: lh.value,
    })),
    letterSpacings: typographyState.letterSpacings.map(ls => ({
      name: ls.name,
      value: ls.value,
    })),
    fontWeights: typographyState.fontWeights.map(fw => ({
      name: fw.name,
      value: fw.value,
      label: fw.label,
    })),
  };
  
  if (semanticTokens.length === 0) {
    showNotification('⚠️ Нет семантических токенов для создания Text Styles');
    return;
  }
  
  // Отправляем в Figma
  parent.postMessage({
    pluginMessage: {
      type: 'create-text-styles',
      payload: { semanticTokens, primitives },
    },
  }, '*');
  
  showNotification('🎨 Создание Text Styles в Figma...');
}

// ============================================
// HELPERS
// ============================================

function getEnabledPrimitives(containerId: string, dataAttr: string): string[] {
  const container = document.getElementById(containerId);
  if (!container) return [];
  
  const enabled: string[] = [];
  container.querySelectorAll('.active').forEach(item => {
    const value = item.getAttribute(dataAttr);
    if (value) enabled.push(value);
  });
  
  return enabled;
}

function getEnabledTextOptions(groupId: string): string[] {
  const group = document.getElementById(groupId);
  if (!group) return [];
  
  const enabled: string[] = [];
  group.querySelectorAll('.typo-option.active input').forEach(input => {
    const checkbox = input as HTMLInputElement;
    if (checkbox.value) enabled.push(checkbox.value);
  });
  
  return enabled;
}

function showNotification(message: string): void {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
  }
}

function notifyTokensUpdated(): void {
  window.dispatchEvent(new CustomEvent('tokens-updated'));
}

// ============================================
// EXPORTS
// ============================================

export function getTypographyState(): TypographyState {
  return typographyState;
}

export function setTypographyState(state: TypographyState): void {
  typographyState = state;
  renderFontSizes();
  renderLineHeights();
  renderLetterSpacings();
  renderSemanticTokens();
}
