/**
 * Primitives Generator UI
 * Handles generation of all primitive tokens: colors, typography, spacing, etc.
 */

import { createToken, getTokens } from '../types/token-manager-state';
import { TMCollectionType, TMTokenType } from '../types/token-manager';

// ============================================
// TYPES
// ============================================

interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface ColorPaletteData {
  name: string;
  baseHex: string;
  shades: Record<number, { hex: string; rgba: RGBAColor }>;
}

interface TypographyConfig {
  fontBody: string;
  fontHeading: string;
  fontMono: string;
  baseSize: number;
  scaleRatio: number;
}

interface SpacingConfig {
  baseUnit: number;
  scale: 'linear' | 'fibonacci' | 'golden';
}

interface GeneratedPrimitives {
  colors: ColorPaletteData[];
  typography: Record<string, any>;
  spacing: Record<string, number>;
  radius: Record<string, number>;
  shadows: Record<string, string>;
  borders: Record<string, number>;
}

// ============================================
// PRODUCT MANAGEMENT
// ============================================

interface Product {
  id: string;
  name: string;
  brandColors: Map<string, string>;  // color name -> hex
  additionalColors: Map<string, string>;
}

interface ProductState {
  currentProductId: string;
  products: Map<string, Product>;
}

export const productState: ProductState = {
  currentProductId: 'feroom',
  products: new Map([
    ['feroom', { 
      id: 'feroom', 
      name: 'FEroom', 
      brandColors: new Map([['brand', '#3B82F6'], ['accent', '#8B5CF6']]),
      additionalColors: new Map()
    }],
    ['majordom', { 
      id: 'majordom', 
      name: 'MajorDom', 
      brandColors: new Map([['brand', '#10B981'], ['accent', '#F59E0B']]),
      additionalColors: new Map()
    }],
  ])
};

// Shared system colors (for all products)
const sharedSystemColors: Map<string, string> = new Map([
  ['neutral', '#6B7280'],
  ['success', '#22C55E'],
  ['warning', '#F59E0B'],
  ['error', '#EF4444'],
  ['info', '#0EA5E9'],
]);

export function getCurrentProduct(): Product | undefined {
  return productState.products.get(productState.currentProductId);
}

export function setCurrentProduct(productId: string): void {
  if (productState.products.has(productId) || productId === '__shared__') {
    productState.currentProductId = productId;
    updateProductUI();
    
    // Dispatch event for Token Manager to refresh
    window.dispatchEvent(new CustomEvent('product-changed', { detail: { productId } }));
  }
}

export function addProduct(name: string): Product {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const product: Product = {
    id,
    name,
    brandColors: new Map([['brand', '#6366F1']]),
    additionalColors: new Map()
  };
  productState.products.set(id, product);
  updateProductSelector();
  return product;
}

function updateProductSelector(): void {
  const select = document.getElementById('product-select') as HTMLSelectElement;
  if (!select) return;
  
  // Keep shared option
  select.innerHTML = '<option value="__shared__">🌐 Общие (все продукты)</option>';
  
  // Add all products
  productState.products.forEach((product, id) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = product.name;
    if (id === productState.currentProductId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function updateProductUI(): void {
  const product = getCurrentProduct();
  const productName = product?.name || 'Общие';
  
  // Update brand scope indicator
  const indicator = document.getElementById('current-product-name');
  if (indicator) {
    indicator.textContent = productName;
  }
  
  // Update brand colors grid
  if (product) {
    updateBrandColorsGrid(product);
    updateAdditionalColorsGrid(product);
  }
  
  // Show/hide product-specific sections
  const productSections = document.querySelectorAll('[data-scope="product"]');
  productSections.forEach(section => {
    (section as HTMLElement).style.display = productState.currentProductId === '__shared__' ? 'none' : 'block';
  });
}

function updateBrandColorsGrid(product: Product): void {
  const grid = document.getElementById('brand-colors-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  product.brandColors.forEach((hex, name) => {
    const card = createColorCardElement(name, hex, 'brand');
    grid.appendChild(card);
  });
}

function updateAdditionalColorsGrid(product: Product): void {
  const grid = document.getElementById('additional-colors-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  product.additionalColors.forEach((hex, name) => {
    const card = createColorCardElement(name, hex, 'additional');
    grid.appendChild(card);
  });
}

function createColorCardElement(name: string, hex: string, category: ColorCategory): HTMLElement {
  const card = document.createElement('div');
  card.className = 'color-card';
  card.setAttribute('data-color-name', name);
  card.setAttribute('data-category', category);
  
  const displayName = name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' ');
  
  card.innerHTML = `
    <div class="color-card-header">
      <label class="form-label">${displayName}</label>
      <button class="btn-icon btn-remove-color" data-color="${name}" title="Удалить">✕</button>
    </div>
    <div class="color-input-group">
      <input type="color" class="color-picker" data-color="${name}" value="${hex}">
      <input type="text" class="form-input color-hex" data-color="${name}" value="${hex}">
    </div>
  `;
  
  // Setup input sync
  const colorPicker = card.querySelector('.color-picker') as HTMLInputElement;
  const hexInput = card.querySelector('.color-hex') as HTMLInputElement;
  if (colorPicker && hexInput) {
    colorPicker.addEventListener('input', () => {
      hexInput.value = colorPicker.value.toUpperCase();
      saveColorToProduct(name, colorPicker.value, category);
    });
    hexInput.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
        colorPicker.value = hexInput.value;
        saveColorToProduct(name, hexInput.value, category);
      }
    });
  }
  
  // Setup remove button
  const removeBtn = card.querySelector('.btn-remove-color');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      removeColorFromProduct(name, category);
      card.remove();
    });
  }
  
  return card;
}

function saveColorToProduct(name: string, hex: string, category: ColorCategory): void {
  const product = getCurrentProduct();
  if (!product) return;
  
  if (category === 'brand') {
    product.brandColors.set(name, hex);
  } else if (category === 'additional') {
    product.additionalColors.set(name, hex);
  }
}

function removeColorFromProduct(name: string, category: ColorCategory): void {
  const product = getCurrentProduct();
  if (!product) return;
  
  if (category === 'brand') {
    product.brandColors.delete(name);
  } else if (category === 'additional') {
    product.additionalColors.delete(name);
  }
}

function setupProductSelector(): void {
  // Product select dropdown
  const productSelect = document.getElementById('product-select') as HTMLSelectElement;
  if (productSelect) {
    productSelect.addEventListener('change', () => {
      setCurrentProduct(productSelect.value);
    });
  }
  
  // Product settings button - opens modal
  const btnProductSettings = document.getElementById('btn-product-settings');
  if (btnProductSettings) {
    btnProductSettings.addEventListener('click', () => {
      openProductModal();
    });
  }
  
  // Modal close button
  const btnModalClose = document.getElementById('btn-modal-close');
  if (btnModalClose) {
    btnModalClose.addEventListener('click', () => {
      closeProductModal();
    });
  }
  
  // Click overlay to close
  const modalOverlay = document.getElementById('product-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeProductModal();
      }
    });
  }
  
  // Add product button in modal
  const btnAddProductModal = document.getElementById('btn-add-product-modal');
  if (btnAddProductModal) {
    btnAddProductModal.addEventListener('click', () => {
      const productName = prompt('Введите название продукта:');
      if (productName && productName.trim()) {
        const product = addProduct(productName.trim());
        setCurrentProduct(product.id);
        renderProductList();
        showNotification(`✅ Продукт "${productName}" добавлен`);
      }
    });
  }
  
  // Initialize selector with current products
  updateProductSelector();
  
  // Initialize UI for current product
  updateProductUI();
}

function openProductModal(): void {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.style.display = 'flex';
    renderProductList();
  }
}

function closeProductModal(): void {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function renderProductList(): void {
  const container = document.getElementById('product-list');
  if (!container) return;
  
  let html = '';
  productState.products.forEach((product, id) => {
    html += `
      <div class="product-item" data-product-id="${id}">
        <div style="flex: 1;">
          <div class="product-item-name">${product.name}</div>
          <div class="product-item-id">${id}</div>
        </div>
        <div class="product-item-actions">
          <button class="btn-edit" data-product-id="${id}" title="Переименовать">✏️</button>
          <button class="btn-delete" data-product-id="${id}" title="Удалить">🗑</button>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Setup edit buttons
  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.getAttribute('data-product-id');
      if (productId) {
        renameProduct(productId);
      }
    });
  });
  
  // Setup delete buttons
  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.getAttribute('data-product-id');
      if (productId) {
        deleteProduct(productId);
      }
    });
  });
}

function renameProduct(productId: string): void {
  const product = productState.products.get(productId);
  if (!product) return;
  
  const newName = prompt('Новое название продукта:', product.name);
  if (newName && newName.trim() && newName !== product.name) {
    product.name = newName.trim();
    updateProductSelector();
    renderProductList();
    showNotification(`✅ Продукт переименован в "${newName}"`);
  }
}

function deleteProduct(productId: string): void {
  if (productState.products.size <= 1) {
    showNotification('❌ Нельзя удалить последний продукт', true);
    return;
  }
  
  const product = productState.products.get(productId);
  if (!product) return;
  
  if (confirm(`Удалить продукт "${product.name}"?`)) {
    productState.products.delete(productId);
    
    // Switch to another product if current was deleted
    if (productState.currentProductId === productId) {
      const firstProductId = productState.products.keys().next().value;
      if (firstProductId) {
        setCurrentProduct(firstProductId);
      }
    }
    
    updateProductSelector();
    renderProductList();
    showNotification(`🗑 Продукт "${product.name}" удален`);
  }
}

// ============================================
// COLOR GENERATION
// ============================================

// Exact color scale: 31 steps (25-975 with specific intervals)
const OPACITY_SCALE = [
  25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300,
  350, 400, 450, 500, 550, 600, 650, 700,
  725, 750, 775, 800, 825, 850, 875, 900, 925, 950, 975
] as const;

// System colors (base for all products)
const SYSTEM_COLORS = ['neutral', 'success', 'warning', 'error', 'info'] as const;

// Color categories
type ColorCategory = 'system' | 'brand' | 'additional';

interface ColorConfig {
  name: string;
  hex: string;
  category: ColorCategory;
  enabledShades: Set<number>;
}

// Theme state
interface ThemeState {
  activeTheme: string;
  themes: string[];
}

// Color state management
interface ColorState {
  colors: Map<string, ColorConfig>;
  themes: ThemeState;
}

const colorState: ColorState = {
  colors: new Map(),
  themes: {
    activeTheme: 'light',
    themes: ['light', 'dark']
  }
};

function parseHexToRgba(hex: string): RGBAColor {
  const cleanHex = hex.replace('#', '');
  const fullHex = cleanHex.length === 3 
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;
  
  return {
    r: parseInt(fullHex.substring(0, 2), 16) / 255,
    g: parseInt(fullHex.substring(2, 4), 16) / 255,
    b: parseInt(fullHex.substring(4, 6), 16) / 255,
    a: 1
  };
}

function formatRgbaToHex(rgba: RGBAColor): string {
  const toHex = (n: number): string => {
    const hex = Math.round(Math.min(1, Math.max(0, n)) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  const hex = `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
  return rgba.a < 1 ? hex + toHex(rgba.a) : hex;
}

function blendColors(background: RGBAColor, foreground: RGBAColor, alpha: number): RGBAColor {
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1
  };
}

export function generateColorPalette(name: string, hex: string): ColorPaletteData {
  const baseRgba = parseHexToRgba(hex);
  const white: RGBAColor = { r: 1, g: 1, b: 1, a: 1 };
  const black: RGBAColor = { r: 0, g: 0, b: 0, a: 1 };
  
  const palette: ColorPaletteData = {
    name: name.toLowerCase(),
    baseHex: hex,
    shades: {}
  };
  
  for (const step of OPACITY_SCALE) {
    let rgba: RGBAColor;
    
    if (step < 500) {
      // Lighter shades (25-475): blend with white
      const alpha = step / 500;
      rgba = blendColors(white, baseRgba, alpha);
    } else if (step === 500) {
      // Base color
      rgba = { ...baseRgba };
    } else {
      // Darker shades (525-975): blend with black
      const alpha = (1000 - step) / 500;
      rgba = blendColors(black, baseRgba, alpha);
    }
    
    palette.shades[step] = {
      hex: formatRgbaToHex(rgba),
      rgba
    };
  }
  
  return palette;
}

// ============================================
// TYPOGRAPHY GENERATION
// ============================================

const TYPOGRAPHY_SCALE = {
  'display-2xl': 4.5,    // 72px
  'display-xl': 3.75,    // 60px
  'display-lg': 3,       // 48px
  'display-md': 2.25,    // 36px
  'display-sm': 1.875,   // 30px
  'display-xs': 1.5,     // 24px
  'text-xl': 1.25,       // 20px
  'text-lg': 1.125,      // 18px
  'text-md': 1,          // 16px (base)
  'text-sm': 0.875,      // 14px
  'text-xs': 0.75,       // 12px
};

export function generateTypography(config: TypographyConfig): Record<string, any> {
  const { baseSize, scaleRatio } = config;
  const typography: Record<string, any> = {};
  
  // Font families
  typography['font-family-body'] = config.fontBody;
  typography['font-family-heading'] = config.fontHeading;
  typography['font-family-mono'] = config.fontMono;
  
  // Font sizes using scale
  let currentSize = baseSize;
  const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
  
  for (let i = 0; i < sizes.length; i++) {
    if (i === 2) {
      typography[`font-size-${sizes[i]}`] = baseSize;
    } else if (i < 2) {
      typography[`font-size-${sizes[i]}`] = Math.round(baseSize / Math.pow(scaleRatio, 2 - i));
    } else {
      typography[`font-size-${sizes[i]}`] = Math.round(baseSize * Math.pow(scaleRatio, i - 2));
    }
  }
  
  // Line heights
  typography['line-height-tight'] = 1.25;
  typography['line-height-normal'] = 1.5;
  typography['line-height-relaxed'] = 1.75;
  
  // Font weights
  typography['font-weight-regular'] = 400;
  typography['font-weight-medium'] = 500;
  typography['font-weight-semibold'] = 600;
  typography['font-weight-bold'] = 700;
  
  // Letter spacing
  typography['letter-spacing-tight'] = '-0.025em';
  typography['letter-spacing-normal'] = '0';
  typography['letter-spacing-wide'] = '0.025em';
  
  return typography;
}

// ============================================
// SPACING GENERATION
// ============================================

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55];
const SPACING_NAMES = ['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];

export function generateSpacing(config: SpacingConfig): Record<string, number> {
  const { baseUnit, scale } = config;
  const spacing: Record<string, number> = {};
  
  spacing['none'] = 0;
  
  if (scale === 'fibonacci') {
    for (let i = 0; i < FIBONACCI.length; i++) {
      const name = SPACING_NAMES[i + 1] || `${i + 1}`;
      spacing[name] = baseUnit * FIBONACCI[i];
    }
  } else if (scale === 'golden') {
    const golden = 1.618;
    for (let i = 0; i < 10; i++) {
      const name = SPACING_NAMES[i + 1] || `${i + 1}`;
      spacing[name] = Math.round(baseUnit * Math.pow(golden, i));
    }
  } else {
    // Linear
    for (let i = 0; i < 12; i++) {
      const name = SPACING_NAMES[i + 1] || `${i + 1}`;
      spacing[name] = baseUnit * (i + 1);
    }
  }
  
  return spacing;
}

// ============================================
// RADIUS GENERATION
// ============================================

export function generateRadius(baseRadius: number): Record<string, number> {
  return {
    'none': 0,
    'sm': Math.round(baseRadius * 0.5),
    'md': baseRadius,
    'lg': baseRadius * 2,
    'xl': baseRadius * 3,
    '2xl': baseRadius * 4,
    'full': 9999
  };
}

// ============================================
// SHADOWS GENERATION
// ============================================

export function generateShadows(colorHex: string, baseOpacity: number): Record<string, string> {
  const color = parseHexToRgba(colorHex);
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  
  const opacity = baseOpacity / 100;
  
  return {
    'xs': `0 1px 2px rgba(${r}, ${g}, ${b}, ${opacity * 0.5})`,
    'sm': `0 1px 3px rgba(${r}, ${g}, ${b}, ${opacity}), 0 1px 2px rgba(${r}, ${g}, ${b}, ${opacity * 0.6})`,
    'md': `0 4px 6px rgba(${r}, ${g}, ${b}, ${opacity}), 0 2px 4px rgba(${r}, ${g}, ${b}, ${opacity * 0.6})`,
    'lg': `0 10px 15px rgba(${r}, ${g}, ${b}, ${opacity}), 0 4px 6px rgba(${r}, ${g}, ${b}, ${opacity * 0.5})`,
    'xl': `0 20px 25px rgba(${r}, ${g}, ${b}, ${opacity * 1.5}), 0 8px 10px rgba(${r}, ${g}, ${b}, ${opacity * 0.4})`,
    '2xl': `0 25px 50px rgba(${r}, ${g}, ${b}, ${opacity * 2.5})`,
    'inner': `inset 0 2px 4px rgba(${r}, ${g}, ${b}, ${opacity * 0.6})`,
    'none': 'none'
  };
}

// ============================================
// BORDERS GENERATION
// ============================================

export function generateBorders(): Record<string, number> {
  return {
    'none': 0,
    'thin': 1,
    'medium': 2,
    'thick': 4
  };
}

// ============================================
// ADD TO TOKEN MANAGER
// ============================================

export function addColorPalettesToTokenManager(palettes: ColorPaletteData[], scope: 'shared' | 'product' = 'shared'): void {
  for (const palette of palettes) {
    // Get enabled shades for this color
    const colorConfig = colorState.colors.get(palette.name);
    const enabledShades = colorConfig?.enabledShades || new Set(OPACITY_SCALE);
    
    // Simple flat structure: colors/{colorName}
    // No nested shared/products folders
    const basePath = ['colors', palette.name];
    
    for (const step of OPACITY_SCALE) {
      // Skip disabled shades
      if (!enabledShades.has(step)) continue;
      
      const shade = palette.shades[step];
      createToken({
        name: `${palette.name}-${step}`,
        path: basePath,
        type: 'COLOR' as TMTokenType,
        value: {
          hex: shade.hex,
          rgba: shade.rgba
        },
        collection: 'Primitives' as TMCollectionType,
        description: step < 500 
          ? `${palette.name} lightened ${Math.round((500 - step) / 5)}%`
          : step === 500 
            ? `${palette.name} base color`
            : `${palette.name} darkened ${Math.round((step - 500) / 5)}%`,
      });
    }
  }
}

export function addTypographyToTokenManager(typography: Record<string, any>): void {
  for (const [key, value] of Object.entries(typography)) {
    // Map typography properties to supported Figma types
    const type: TMTokenType = key.startsWith('font-weight') || key.startsWith('line-height') || key.startsWith('font-size')
      ? 'NUMBER'
      : 'STRING';
    
    createToken({
      name: key,
      path: ['typography'],
      type,
      value: typeof value === 'number' ? value : String(value),
      collection: 'Primitives' as TMCollectionType,
      description: `Typography ${key}`,
    });
  }
}

export function addSpacingToTokenManager(spacing: Record<string, number>): void {
  for (const [key, value] of Object.entries(spacing)) {
    createToken({
      name: key,
      path: ['spacing'],
      type: 'NUMBER' as TMTokenType,
      value: value,
      collection: 'Primitives' as TMCollectionType,
      description: `Spacing ${key}: ${value}px`,
    });
  }
}

export function addRadiusToTokenManager(radius: Record<string, number>): void {
  for (const [key, value] of Object.entries(radius)) {
    createToken({
      name: key,
      path: ['radius'],
      type: 'NUMBER' as TMTokenType,
      value: value,
      collection: 'Primitives' as TMCollectionType,
      description: `Border radius ${key}: ${value}px`,
    });
  }
}

export function addShadowsToTokenManager(shadows: Record<string, string>): void {
  for (const [key, value] of Object.entries(shadows)) {
    createToken({
      name: key,
      path: ['shadows'],
      type: 'STRING' as TMTokenType,
      value: value,
      collection: 'Primitives' as TMCollectionType,
      description: `Shadow ${key}`,
    });
  }
}

export function addBordersToTokenManager(borders: Record<string, number>): void {
  for (const [key, value] of Object.entries(borders)) {
    createToken({
      name: key,
      path: ['borders'],
      type: 'NUMBER' as TMTokenType,
      value: value,
      collection: 'Primitives' as TMCollectionType,
      description: `Border width ${key}: ${value}px`,
    });
  }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

export function renderColorPalette(palette: ColorPaletteData): string {
  const samples = [25, 100, 200, 300, 400, 500, 600, 700, 800, 900, 975];
  
  let html = `
    <div class="palette">
      <div class="palette-name">${palette.name}</div>
      <div class="palette-shades">
  `;
  
  for (const step of samples) {
    const shade = palette.shades[step];
    html += `
      <div class="shade" style="background-color: ${shade.hex};" title="${palette.name}-${step}: ${shade.hex}">
        <span class="shade-step">${step}</span>
      </div>
    `;
  }
  
  html += `</div></div>`;
  return html;
}

export function renderAllPalettes(container: HTMLElement, palettes: ColorPaletteData[]): void {
  if (palettes.length === 0) {
    container.innerHTML = '<p class="empty-state">Добавьте цвета и нажмите "Сгенерировать"</p>';
    return;
  }
  
  container.innerHTML = palettes.map(renderColorPalette).join('');
}

// ============================================
// UI INITIALIZATION
// ============================================

let generatedPalettes: ColorPaletteData[] = [];

export function initPrimitivesGenerator(): void {
  // Sub-tabs navigation
  const subTabs = document.querySelectorAll('.sub-tab');
  const subTabContents = document.querySelectorAll('.sub-tab-content');
  
  subTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-subtab');
      
      subTabs.forEach(t => t.classList.remove('active'));
      subTabContents.forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');
      }
    });
  });
  
  // Category cards click
  document.querySelectorAll('.prim-category-card').forEach(card => {
    card.addEventListener('click', () => {
      const targetId = card.getAttribute('data-goto');
      if (targetId) {
        const targetTab = document.querySelector(`.sub-tab[data-subtab="${targetId}"]`);
        if (targetTab) (targetTab as HTMLElement).click();
      }
    });
  });
  
  // Color input sync - using new class-based structure
  setupColorInputSync();
  
  // Setup color add/remove buttons
  setupColorButtons();
  
  // Setup theme management
  setupThemeManagement();
  
  // Setup product selector
  setupProductSelector();
  
  // Shadow opacity display
  const shadowOpacity = document.getElementById('shadow-opacity') as HTMLInputElement;
  const shadowOpacityValue = document.getElementById('shadow-opacity-value');
  if (shadowOpacity && shadowOpacityValue) {
    shadowOpacity.addEventListener('input', () => {
      shadowOpacityValue.textContent = `${shadowOpacity.value}%`;
    });
  }
  
  // Generate buttons
  setupGenerateButtons();
}

function setupGenerateButtons(): void {
  // Generate All
  const btnGenerateAll = document.getElementById('btn-generate-all');
  if (btnGenerateAll) {
    btnGenerateAll.addEventListener('click', () => {
      generateAllPrimitives();
      showNotification('✨ Все примитивы сгенерированы!');
      notifyPrimitivesUpdated();
      // После генерации всех примитивов переходим на вкладку Tokens
      setTimeout(() => switchToTokensTab(), 100);
    });
  }
  
  // Generate Colors
  const btnGenerateColors = document.getElementById('btn-generate-colors');
  if (btnGenerateColors) {
    btnGenerateColors.addEventListener('click', () => {
      generateColors();
      showNotification('🎨 Цвета сгенерированы!');
      notifyPrimitivesUpdated();
    });
  }
  
  // Generate Typography
  const btnGenerateTypography = document.getElementById('btn-generate-typography');
  if (btnGenerateTypography) {
    btnGenerateTypography.addEventListener('click', () => {
      generateTypographyTokens();
      showNotification('📝 Типографика сгенерирована!');
      notifyPrimitivesUpdated();
    });
  }
  
  // Generate Spacing
  const btnGenerateSpacing = document.getElementById('btn-generate-spacing');
  if (btnGenerateSpacing) {
    btnGenerateSpacing.addEventListener('click', () => {
      generateSpacingTokens();
      showNotification('📏 Отступы сгенерированы!');
      notifyPrimitivesUpdated();
    });
  }
  
  // Generate Radius
  const btnGenerateRadius = document.getElementById('btn-generate-radius');
  if (btnGenerateRadius) {
    btnGenerateRadius.addEventListener('click', () => {
      generateRadiusTokens();
      showNotification('⬜ Радиусы сгенерированы!');
      notifyPrimitivesUpdated();
    });
  }
  
  // Generate Shadows
  const btnGenerateShadows = document.getElementById('btn-generate-shadows');
  if (btnGenerateShadows) {
    btnGenerateShadows.addEventListener('click', () => {
      generateShadowTokens();
      showNotification('🌑 Тени сгенерированы!');
      notifyPrimitivesUpdated();
    });
  }
  
  // Generate Borders
  const btnGenerateBorders = document.getElementById('btn-generate-borders');
  if (btnGenerateBorders) {
    btnGenerateBorders.addEventListener('click', () => {
      generateBorderTokens();
      showNotification('🔲 Границы сгенерированы!');
      notifyPrimitivesUpdated();
    });
  }
}

function generateColors(): void {
  const product = getCurrentProduct();
  const isSharedMode = productState.currentProductId === '__shared__';
  
  // Collect system colors (always from shared)
  const systemColors: Array<{name: string, hex: string, category: ColorCategory}> = [];
  document.querySelectorAll('#system-colors-grid .color-card').forEach(card => {
    const name = card.getAttribute('data-color-name');
    const hexInput = card.querySelector('.color-hex') as HTMLInputElement;
    if (name && hexInput?.value) {
      systemColors.push({ name, hex: hexInput.value, category: 'system' });
      // Update shared system colors
      sharedSystemColors.set(name, hexInput.value);
    }
  });
  
  // Collect product-specific colors (only if product selected)
  const productColors: Array<{name: string, hex: string, category: ColorCategory}> = [];
  if (!isSharedMode && product) {
    // Brand colors
    document.querySelectorAll('#brand-colors-grid .color-card').forEach(card => {
      const name = card.getAttribute('data-color-name');
      const hexInput = card.querySelector('.color-hex') as HTMLInputElement;
      if (name && hexInput?.value) {
        productColors.push({ name, hex: hexInput.value, category: 'brand' });
        product.brandColors.set(name, hexInput.value);
      }
    });
    
    // Additional colors
    document.querySelectorAll('#additional-colors-grid .color-card').forEach(card => {
      const name = card.getAttribute('data-color-name');
      const hexInput = card.querySelector('.color-hex') as HTMLInputElement;
      if (name && hexInput?.value) {
        productColors.push({ name, hex: hexInput.value, category: 'additional' });
        product.additionalColors.set(name, hexInput.value);
      }
    });
  }
  
  generatedPalettes = [];
  
  // Generate system color palettes (shared)
  const systemPalettes: ColorPaletteData[] = [];
  for (const color of systemColors) {
    const palette = generateColorPalette(color.name, color.hex);
    systemPalettes.push(palette);
    generatedPalettes.push(palette);
    
    colorState.colors.set(color.name, {
      name: color.name,
      hex: color.hex,
      category: color.category,
      enabledShades: new Set(OPACITY_SCALE)
    });
  }
  
  // Generate product color palettes
  const productPalettes: ColorPaletteData[] = [];
  for (const color of productColors) {
    const palette = generateColorPalette(color.name, color.hex);
    productPalettes.push(palette);
    generatedPalettes.push(palette);
    
    colorState.colors.set(color.name, {
      name: color.name,
      hex: color.hex,
      category: color.category,
      enabledShades: new Set(OPACITY_SCALE)
    });
  }
  
  // Render preview with toggle support
  const container = document.getElementById('palette-container');
  const preview = document.getElementById('color-preview');
  if (container && preview) {
    renderPalettesWithToggles(container, generatedPalettes);
    preview.style.display = 'block';
  }
  
  // Add to Token Manager with proper scope
  addColorPalettesToTokenManager(systemPalettes, 'shared');
  if (productPalettes.length > 0) {
    addColorPalettesToTokenManager(productPalettes, 'product');
  }
}

function generateTypographyTokens(): void {
  const fontBody = (document.getElementById('font-body') as HTMLInputElement)?.value || 'Inter';
  const fontHeading = (document.getElementById('font-heading') as HTMLInputElement)?.value || 'Inter';
  const fontMono = (document.getElementById('font-mono') as HTMLInputElement)?.value || 'JetBrains Mono';
  const baseSize = parseInt((document.getElementById('font-base-size') as HTMLInputElement)?.value || '16');
  const scaleRatio = parseFloat((document.getElementById('font-scale') as HTMLSelectElement)?.value || '1.25');
  
  const typography = generateTypography({
    fontBody,
    fontHeading,
    fontMono,
    baseSize,
    scaleRatio
  });
  
  addTypographyToTokenManager(typography);
}

function generateSpacingTokens(): void {
  const baseUnit = parseInt((document.getElementById('spacing-base') as HTMLInputElement)?.value || '4');
  const scale = (document.getElementById('spacing-scale') as HTMLSelectElement)?.value as 'linear' | 'fibonacci' | 'golden' || 'fibonacci';
  
  const spacing = generateSpacing({ baseUnit, scale });
  addSpacingToTokenManager(spacing);
}

function generateRadiusTokens(): void {
  const baseRadius = parseInt((document.getElementById('radius-base') as HTMLInputElement)?.value || '4');
  const radius = generateRadius(baseRadius);
  addRadiusToTokenManager(radius);
}

function generateShadowTokens(): void {
  const colorHex = (document.getElementById('shadow-color-hex') as HTMLInputElement)?.value || '#000000';
  const baseOpacity = parseInt((document.getElementById('shadow-opacity') as HTMLInputElement)?.value || '10');
  
  const shadows = generateShadows(colorHex, baseOpacity);
  addShadowsToTokenManager(shadows);
}

function generateBorderTokens(): void {
  const borders = generateBorders();
  addBordersToTokenManager(borders);
}

function generateAllPrimitives(): void {
  generateColors();
  generateTypographyTokens();
  generateSpacingTokens();
  generateRadiusTokens();
  generateShadowTokens();
  generateBorderTokens();
}

function switchToTokenManager(): void {
  const tokenManagerTab = document.querySelector('[data-tab="token-manager"]');
  if (tokenManagerTab) {
    (tokenManagerTab as HTMLElement).click();
  }
}

function switchToTokensTab(): void {
  const tokensTab = document.querySelector('[data-tab="tokens"]');
  if (tokensTab) {
    (tokensTab as HTMLElement).click();
  }
}

// Уведомляем об обновлении примитивов (для разблокировки табов)
function notifyPrimitivesUpdated(): void {
  document.dispatchEvent(new CustomEvent('tokens-generated'));
  window.dispatchEvent(new CustomEvent('tokens-updated'));
}

// ============================================
// COLOR MANAGEMENT FUNCTIONS
// ============================================

function setupColorInputSync(): void {
  // Sync color picker with hex input for all color cards
  document.querySelectorAll('.color-card').forEach(card => {
    const colorPicker = card.querySelector('.color-picker') as HTMLInputElement;
    const hexInput = card.querySelector('.color-hex') as HTMLInputElement;
    
    if (colorPicker && hexInput) {
      colorPicker.addEventListener('input', () => {
        hexInput.value = colorPicker.value.toUpperCase();
      });
      
      hexInput.addEventListener('input', () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
          colorPicker.value = hexInput.value;
        }
      });
    }
  });
  
  // Shadow color sync
  const shadowColor = document.getElementById('shadow-color') as HTMLInputElement;
  const shadowColorHex = document.getElementById('shadow-color-hex') as HTMLInputElement;
  if (shadowColor && shadowColorHex) {
    shadowColor.addEventListener('input', () => {
      shadowColorHex.value = shadowColor.value.toUpperCase();
    });
    shadowColorHex.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(shadowColorHex.value)) {
        shadowColor.value = shadowColorHex.value;
      }
    });
  }
}

function setupColorButtons(): void {
  // Add brand color
  const btnAddBrand = document.getElementById('btn-add-brand-color');
  if (btnAddBrand) {
    btnAddBrand.addEventListener('click', () => {
      addColorCard('brand-colors-grid', 'brand', generateColorName('brand'));
    });
  }
  
  // Add additional color
  const btnAddAdditional = document.getElementById('btn-add-additional-color');
  if (btnAddAdditional) {
    btnAddAdditional.addEventListener('click', () => {
      addColorCard('additional-colors-grid', 'additional', generateColorName('custom'));
    });
  }
  
  // Toggle preview button
  const btnTogglePreview = document.getElementById('btn-toggle-preview');
  if (btnTogglePreview) {
    btnTogglePreview.addEventListener('click', () => {
      const preview = document.getElementById('color-preview');
      if (preview) {
        const isVisible = preview.style.display !== 'none';
        if (isVisible) {
          // Hide preview
          preview.style.display = 'none';
          btnTogglePreview.innerHTML = '👁 Открыть превью';
        } else {
          // Show preview (generate colors first)
          generateColors();
          btnTogglePreview.innerHTML = '👁 Скрыть превью';
        }
      }
    });
  }
  
  // Setup remove buttons for existing cards
  document.querySelectorAll('.btn-remove-color').forEach(btn => {
    const colorName = btn.getAttribute('data-color');
    if (colorName) {
      btn.addEventListener('click', () => removeColorCard(colorName));
    }
  });
}

function setupThemeManagement(): void {
  // Theme tab switching
  document.querySelectorAll('.theme-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const theme = tab.getAttribute('data-theme');
      if (!theme) return;
      
      document.querySelectorAll('.theme-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      colorState.themes.activeTheme = theme;
      showNotification(`🎨 Тема "${theme}" выбрана`);
    });
  });
  
  // Add theme button
  const btnAddTheme = document.getElementById('btn-add-theme');
  if (btnAddTheme) {
    btnAddTheme.addEventListener('click', () => {
      const themeName = prompt('Введите название темы:');
      if (themeName && themeName.trim()) {
        addThemeTab(themeName.trim());
      }
    });
  }
}

function generateColorName(prefix: string): string {
  const existingNames = Array.from(document.querySelectorAll('.color-card'))
    .map(card => card.getAttribute('data-color-name'))
    .filter(Boolean);
  
  let counter = 1;
  let name = prefix;
  while (existingNames.includes(name)) {
    name = `${prefix}-${counter}`;
    counter++;
  }
  return name;
}

function addColorCard(gridId: string, category: ColorCategory, name: string): void {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  
  const defaultColor = '#7C3AED';
  
  const card = document.createElement('div');
  card.className = 'color-card';
  card.setAttribute('data-color-name', name);
  card.setAttribute('data-category', category);
  
  card.innerHTML = `
    <div class="color-card-header">
      <label class="form-label">${capitalizeFirst(name)}</label>
      <button class="btn-icon btn-remove-color" data-color="${name}" title="Удалить">✕</button>
    </div>
    <div class="color-input-group">
      <input type="color" class="color-picker" data-color="${name}" value="${defaultColor}">
      <input type="text" class="form-input color-hex" data-color="${name}" value="${defaultColor}">
    </div>
  `;
  
  grid.appendChild(card);
  
  // Setup input sync for new card
  const colorPicker = card.querySelector('.color-picker') as HTMLInputElement;
  const hexInput = card.querySelector('.color-hex') as HTMLInputElement;
  if (colorPicker && hexInput) {
    colorPicker.addEventListener('input', () => {
      hexInput.value = colorPicker.value.toUpperCase();
    });
    hexInput.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(hexInput.value)) {
        colorPicker.value = hexInput.value;
      }
    });
  }
  
  // Setup remove button
  const removeBtn = card.querySelector('.btn-remove-color');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => removeColorCard(name));
  }
  
  showNotification(`✅ Цвет "${name}" добавлен`);
}

function removeColorCard(colorName: string): void {
  const card = document.querySelector(`.color-card[data-color-name="${colorName}"]`);
  const category = card?.getAttribute('data-category');
  
  // Don't allow removing system colors
  if (category === 'system') {
    showNotification('🔒 Системные цвета нельзя удалить', true);
    return;
  }
  
  if (card) {
    card.remove();
    colorState.colors.delete(colorName);
    showNotification(`🗑 Цвет "${colorName}" удален`);
  }
}

function addThemeTab(themeName: string): void {
  const themeTabs = document.querySelector('.theme-tabs');
  const addButton = document.getElementById('btn-add-theme');
  
  if (!themeTabs || !addButton) return;
  
  // Check if theme already exists
  if (colorState.themes.themes.includes(themeName.toLowerCase())) {
    showNotification(`Тема "${themeName}" уже существует`, true);
    return;
  }
  
  const tab = document.createElement('button');
  tab.className = 'theme-tab';
  tab.setAttribute('data-theme', themeName.toLowerCase());
  tab.textContent = `🎨 ${themeName}`;
  
  tab.addEventListener('click', () => {
    document.querySelectorAll('.theme-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    colorState.themes.activeTheme = themeName.toLowerCase();
    showNotification(`🎨 Тема "${themeName}" выбрана`);
  });
  
  // Insert before add button
  themeTabs.insertBefore(tab, addButton);
  colorState.themes.themes.push(themeName.toLowerCase());
  
  showNotification(`✅ Тема "${themeName}" добавлена`);
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

// ============================================
// PALETTE RENDERING WITH TOGGLES
// ============================================

function renderPalettesWithToggles(container: HTMLElement, palettes: ColorPaletteData[]): void {
  if (palettes.length === 0) {
    container.innerHTML = '<p class="empty-state">Добавьте цвета и нажмите "Сгенерировать"</p>';
    return;
  }
  
  container.innerHTML = palettes.map(palette => renderPaletteWithToggles(palette)).join('');
  
  // Setup click handlers for shade toggles
  container.querySelectorAll('.shade').forEach(shade => {
    shade.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const colorName = target.getAttribute('data-color');
      const step = parseInt(target.getAttribute('data-step') || '0');
      
      if (colorName && step) {
        toggleShade(colorName, step, target);
      }
    });
  });
}

function renderPaletteWithToggles(palette: ColorPaletteData): string {
  const colorConfig = colorState.colors.get(palette.name);
  const enabledShades = colorConfig?.enabledShades || new Set(OPACITY_SCALE);
  
  // Show all shades but highlight key ones
  const displayShades = OPACITY_SCALE;
  
  let html = `
    <div class="palette" data-palette="${palette.name}">
      <div class="palette-name">${palette.name}</div>
      <div class="palette-shades">
  `;
  
  for (const step of displayShades) {
    const shade = palette.shades[step];
    const isEnabled = enabledShades.has(step);
    const isKey = [100, 200, 300, 400, 500, 600, 700, 800, 900].includes(step);
    
    html += `
      <div class="shade ${isEnabled ? '' : 'disabled'} ${isKey ? 'shade-key' : ''}" 
           style="background-color: ${shade.hex};" 
           data-color="${palette.name}"
           data-step="${step}"
           title="${palette.name}-${step}: ${shade.hex}${isEnabled ? '' : ' (выключен)'}">
        <span class="shade-step">${step}</span>
        ${!isEnabled ? '<span class="shade-disabled-icon">✕</span>' : ''}
      </div>
    `;
  }
  
  html += `</div></div>`;
  return html;
}

function toggleShade(colorName: string, step: number, element: HTMLElement): void {
  const colorConfig = colorState.colors.get(colorName);
  if (!colorConfig) return;
  
  if (colorConfig.enabledShades.has(step)) {
    colorConfig.enabledShades.delete(step);
    element.classList.add('disabled');
    element.innerHTML = `<span class="shade-step">${step}</span><span class="shade-disabled-icon">✕</span>`;
  } else {
    colorConfig.enabledShades.add(step);
    element.classList.remove('disabled');
    element.innerHTML = `<span class="shade-step">${step}</span>`;
  }
}

function showNotification(message: string, isError = false): void {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.textContent = message;
    notification.classList.add('show');
    notification.style.background = isError ? 'var(--color-error)' : 'var(--color-success)';
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }
}

// Export for external use
export function getGeneratedPalettes(): ColorPaletteData[] {
  return generatedPalettes;
}
