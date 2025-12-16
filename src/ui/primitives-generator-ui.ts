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
// SINGLE PRODUCT CONFIGURATION
// ============================================

interface ProductConfig {
  id: string;
  name: string;
  brandColors: Map<string, string>;  // color name -> hex
  additionalColors: Map<string, string>;
}

// Single product config - edit this for your product
export const productConfig: ProductConfig = {
  id: 'product',
  name: 'Design System',
  brandColors: new Map([
    ['brand', '#3B82F6'],
    ['accent', '#8B5CF6']
  ]),
  additionalColors: new Map()
};

// System colors (always included)
const systemColors: Map<string, string> = new Map([
  ['neutral', '#6B7280'],
  ['success', '#22C55E'],
  ['warning', '#F59E0B'],
  ['error', '#EF4444'],
  ['info', '#0EA5E9'],
]);

// For backwards compatibility - always returns product config
export function getCurrentProduct(): ProductConfig {
  return productConfig;
}

// Simplified UI update for single product
function updateProductUI(): void {
  const product = productConfig;
  
  // Update brand colors grid
  updateBrandColorsGrid(product);
  updateAdditionalColorsGrid(product);
}

function updateBrandColorsGrid(product: ProductConfig): void {
  const grid = document.getElementById('brand-colors-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  product.brandColors.forEach((hex, name) => {
    const card = createColorCardElement(name, hex, 'brand');
    grid.appendChild(card);
  });
}

function updateAdditionalColorsGrid(product: ProductConfig): void {
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
  if (category === 'brand') {
    productConfig.brandColors.set(name, hex);
  } else if (category === 'additional') {
    productConfig.additionalColors.set(name, hex);
  }
}

function removeColorFromProduct(name: string, category: ColorCategory): void {
  if (category === 'brand') {
    productConfig.brandColors.delete(name);
  } else if (category === 'additional') {
    productConfig.additionalColors.delete(name);
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

// ============================================
// THEME MANAGEMENT
// ============================================

export interface ThemeConfig {
  id: string;
  name: string;
  brandColor: string;
  accentColor?: string;
  neutralTint: 'none' | 'warm' | 'cool' | 'custom';
  customNeutralHex?: string;
  hasLightMode: boolean;
  hasDarkMode: boolean;
  isSystem: boolean;
  createdAt: number;
}

interface ThemeState {
  activeTheme: string;
  themes: ThemeConfig[];
}

// Color state management
interface ColorState {
  colors: Map<string, ColorConfig>;
  themes: ThemeState;
}

// Default themes
const DEFAULT_THEMES: ThemeConfig[] = [
  {
    id: 'default',
    name: 'Default',
    brandColor: '#3B82F6',
    accentColor: '#8B5CF6',
    neutralTint: 'none',
    hasLightMode: true,
    hasDarkMode: true,
    isSystem: true,
    createdAt: Date.now()
  }
];

const colorState: ColorState = {
  colors: new Map(),
  themes: {
    activeTheme: 'light',
    themes: [...DEFAULT_THEMES]
  }
};

// ============================================
// THEME GETTERS & SETTERS
// ============================================

export function getThemes(): ThemeConfig[] {
  return colorState.themes.themes;
}

export function getThemeById(id: string): ThemeConfig | undefined {
  return colorState.themes.themes.find(t => t.id === id);
}

export function addTheme(config: Omit<ThemeConfig, 'id' | 'createdAt' | 'isSystem'>): ThemeConfig {
  const id = config.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const theme: ThemeConfig = {
    ...config,
    id,
    isSystem: false,
    createdAt: Date.now()
  };
  colorState.themes.themes.push(theme);
  
  // Notify about theme change
  window.dispatchEvent(new CustomEvent('themes-updated', { detail: { themes: colorState.themes.themes } }));
  
  return theme;
}

export function updateTheme(id: string, updates: Partial<ThemeConfig>): ThemeConfig | undefined {
  const index = colorState.themes.themes.findIndex(t => t.id === id);
  if (index === -1) return undefined;
  
  // Don't allow changing system theme's id or isSystem flag
  if (colorState.themes.themes[index].isSystem) {
    delete updates.id;
    delete updates.isSystem;
  }
  
  colorState.themes.themes[index] = { ...colorState.themes.themes[index], ...updates };
  
  // Notify about theme change
  window.dispatchEvent(new CustomEvent('themes-updated', { detail: { themes: colorState.themes.themes } }));
  
  return colorState.themes.themes[index];
}

export function deleteTheme(id: string): boolean {
  const theme = getThemeById(id);
  if (!theme || theme.isSystem) return false;
  
  const index = colorState.themes.themes.findIndex(t => t.id === id);
  if (index !== -1) {
    colorState.themes.themes.splice(index, 1);
    
    // Notify about theme change
    window.dispatchEvent(new CustomEvent('themes-updated', { detail: { themes: colorState.themes.themes } }));
    return true;
  }
  return false;
}

// Get all theme modes for Figma Variables
export function getAllThemeModes(): Array<{ themeId: string; themeName: string; mode: 'light' | 'dark'; modeName: string }> {
  const modes: Array<{ themeId: string; themeName: string; mode: 'light' | 'dark'; modeName: string }> = [];
  
  for (const theme of colorState.themes.themes) {
    if (theme.hasLightMode) {
      const modeName = theme.id === 'default' ? 'light' : `${theme.id}-light`;
      modes.push({ themeId: theme.id, themeName: theme.name, mode: 'light', modeName });
    }
    if (theme.hasDarkMode) {
      const modeName = theme.id === 'default' ? 'dark' : `${theme.id}-dark`;
      modes.push({ themeId: theme.id, themeName: theme.name, mode: 'dark', modeName });
    }
  }
  
  return modes;
}

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
  
  // Initialize UI for single product
  updateProductUI();
  
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
  const product = productConfig;
  
  // Collect system colors
  const systemColorsArr: Array<{name: string, hex: string, category: ColorCategory}> = [];
  document.querySelectorAll('#system-colors-grid .color-card').forEach(card => {
    const name = card.getAttribute('data-color-name');
    const hexInput = card.querySelector('.color-hex') as HTMLInputElement;
    if (name && hexInput?.value) {
      systemColorsArr.push({ name, hex: hexInput.value, category: 'system' });
      systemColors.set(name, hexInput.value);
    }
  });
  
  // Collect product colors
  const productColors: Array<{name: string, hex: string, category: ColorCategory}> = [];
  
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
  
  generatedPalettes = [];
  
  // Generate system color palettes
  const systemPalettes: ColorPaletteData[] = [];
  for (const color of systemColorsArr) {
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
  
  // Add all palettes to Token Manager
  addColorPalettesToTokenManager([...systemPalettes, ...productPalettes], 'product');
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
  
  // Add theme button - opens modal
  const btnAddTheme = document.getElementById('btn-add-theme');
  if (btnAddTheme) {
    btnAddTheme.addEventListener('click', () => {
      openThemeModal();
    });
  }
  
  // Sync themes button - syncs all themes to Figma Variables
  const btnSyncThemes = document.getElementById('btn-sync-themes');
  if (btnSyncThemes) {
    btnSyncThemes.addEventListener('click', () => {
      syncThemesToFigma();
    });
  }
  
  // Render initial custom themes list
  renderCustomThemes();
}

// ============================================
// THEME MODAL
// ============================================

function openThemeModal(editThemeId?: string): void {
  const existingModal = document.getElementById('theme-modal');
  if (existingModal) existingModal.remove();
  
  const editTheme = editThemeId ? getThemeById(editThemeId) : undefined;
  const isEditing = !!editTheme;
  
  const modal = document.createElement('div');
  modal.id = 'theme-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content theme-modal-content">
      <div class="modal-header">
        <h3>${isEditing ? '✏️ Редактировать тему' : '🎨 Добавить новую тему'}</h3>
        <button class="btn-icon btn-modal-close" id="btn-theme-modal-close">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Название темы</label>
          <input type="text" class="form-input" id="theme-name-input" 
                 value="${editTheme?.name || ''}" 
                 placeholder="Например: Green Theme"
                 ${editTheme?.isSystem ? 'disabled' : ''}>
        </div>
        
        <div class="form-group">
          <label class="form-label">🎨 Основной цвет бренда</label>
          <div class="color-input-group">
            <input type="color" class="color-picker" id="theme-brand-color" 
                   value="${editTheme?.brandColor || '#22C55E'}">
            <input type="text" class="form-input color-hex" id="theme-brand-hex" 
                   value="${editTheme?.brandColor || '#22C55E'}">
          </div>
          <p class="form-hint">Этот цвет заменит brand-палитру для данной темы</p>
        </div>
        
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" id="theme-accent-enabled" 
                   ${editTheme?.accentColor ? 'checked' : ''}>
            💜 Акцентный цвет (опционально)
          </label>
          <div class="color-input-group" id="accent-color-group" 
               style="display: ${editTheme?.accentColor ? 'flex' : 'none'}; margin-top: 8px;">
            <input type="color" class="color-picker" id="theme-accent-color" 
                   value="${editTheme?.accentColor || '#8B5CF6'}">
            <input type="text" class="form-input color-hex" id="theme-accent-hex" 
                   value="${editTheme?.accentColor || '#8B5CF6'}">
          </div>
          <p class="form-hint">Если включен, создаст отдельную палитру accent для темы</p>
        </div>
        
        <div class="form-group">
          <label class="form-label">🎛️ Оттенок нейтральных цветов</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" name="neutral-tint" value="none" 
                     ${(!editTheme || editTheme.neutralTint === 'none') ? 'checked' : ''}>
              Нет оттенка
            </label>
            <label class="radio-label">
              <input type="radio" name="neutral-tint" value="warm" 
                     ${editTheme?.neutralTint === 'warm' ? 'checked' : ''}>
              Тёплый
            </label>
            <label class="radio-label">
              <input type="radio" name="neutral-tint" value="cool" 
                     ${editTheme?.neutralTint === 'cool' ? 'checked' : ''}>
              Холодный
            </label>
            <label class="radio-label">
              <input type="radio" name="neutral-tint" value="custom" 
                     ${editTheme?.neutralTint === 'custom' ? 'checked' : ''}>
              Кастомный
            </label>
          </div>
          <div class="color-input-group custom-tint-input" id="custom-tint-group" 
               style="display: ${editTheme?.neutralTint === 'custom' ? 'flex' : 'none'}; margin-top: 8px;">
            <input type="color" class="color-picker" id="theme-custom-tint-color" 
                   value="${editTheme?.customNeutralHex || '#6B7280'}">
            <input type="text" class="form-input color-hex" id="theme-custom-tint-hex" 
                   value="${editTheme?.customNeutralHex || '#6B7280'}">
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">🌓 Варианты темы</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="theme-has-light" 
                     ${(!editTheme || editTheme.hasLightMode) ? 'checked' : ''}>
              Light (светлый вариант)
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="theme-has-dark" 
                     ${(!editTheme || editTheme.hasDarkMode) ? 'checked' : ''}>
              Dark (тёмный вариант)
            </label>
          </div>
          <p class="form-hint">Каждый вариант создаст отдельную колонку в Figma Variables</p>
        </div>
      </div>
      <div class="modal-footer">
        ${isEditing && !editTheme?.isSystem ? `
          <button class="btn btn-danger" id="btn-delete-theme">🗑️ Удалить</button>
        ` : ''}
        <div class="modal-footer-right">
          <button class="btn btn-secondary" id="btn-theme-cancel">Отмена</button>
          <button class="btn btn-primary" id="btn-theme-save">
            ${isEditing ? '💾 Сохранить' : '✨ Создать тему'}
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Setup event listeners
  setupThemeModalListeners(modal, editThemeId);
}

function setupThemeModalListeners(modal: HTMLElement, editThemeId?: string): void {
  // Close modal
  const closeModal = () => modal.remove();
  
  modal.querySelector('#btn-theme-modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('#btn-theme-cancel')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Sync color pickers with hex inputs
  const syncColorInputs = (pickerId: string, hexId: string) => {
    const picker = modal.querySelector(`#${pickerId}`) as HTMLInputElement;
    const hex = modal.querySelector(`#${hexId}`) as HTMLInputElement;
    if (picker && hex) {
      picker.addEventListener('input', () => hex.value = picker.value.toUpperCase());
      hex.addEventListener('input', () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(hex.value)) {
          picker.value = hex.value;
        }
      });
    }
  };
  
  syncColorInputs('theme-brand-color', 'theme-brand-hex');
  syncColorInputs('theme-accent-color', 'theme-accent-hex');
  syncColorInputs('theme-custom-tint-color', 'theme-custom-tint-hex');
  
  // Show/hide accent color input
  const accentEnabledCheckbox = modal.querySelector('#theme-accent-enabled') as HTMLInputElement;
  const accentColorGroup = modal.querySelector('#accent-color-group') as HTMLElement;
  if (accentEnabledCheckbox && accentColorGroup) {
    accentEnabledCheckbox.addEventListener('change', () => {
      accentColorGroup.style.display = accentEnabledCheckbox.checked ? 'flex' : 'none';
    });
  }
  
  // Show/hide custom tint input
  modal.querySelectorAll('input[name="neutral-tint"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const customGroup = modal.querySelector('#custom-tint-group') as HTMLElement;
      if (customGroup) {
        customGroup.style.display = (radio as HTMLInputElement).value === 'custom' ? 'flex' : 'none';
      }
    });
  });
  
  // Delete theme
  modal.querySelector('#btn-delete-theme')?.addEventListener('click', () => {
    if (editThemeId && confirm('Удалить эту тему? Это действие нельзя отменить.')) {
      if (deleteTheme(editThemeId)) {
        showNotification('🗑️ Тема удалена');
        renderThemeTabs();
        closeModal();
      }
    }
  });
  
  // Save theme
  modal.querySelector('#btn-theme-save')?.addEventListener('click', () => {
    const nameInput = modal.querySelector('#theme-name-input') as HTMLInputElement;
    const brandColorInput = modal.querySelector('#theme-brand-hex') as HTMLInputElement;
    const accentEnabledCheck = modal.querySelector('#theme-accent-enabled') as HTMLInputElement;
    const accentColorInput = modal.querySelector('#theme-accent-hex') as HTMLInputElement;
    const neutralTintRadio = modal.querySelector('input[name="neutral-tint"]:checked') as HTMLInputElement;
    const customTintInput = modal.querySelector('#theme-custom-tint-hex') as HTMLInputElement;
    const hasLightCheckbox = modal.querySelector('#theme-has-light') as HTMLInputElement;
    const hasDarkCheckbox = modal.querySelector('#theme-has-dark') as HTMLInputElement;
    
    const name = nameInput?.value.trim();
    if (!name) {
      showNotification('⚠️ Введите название темы', true);
      return;
    }
    
    if (!hasLightCheckbox?.checked && !hasDarkCheckbox?.checked) {
      showNotification('⚠️ Выберите хотя бы один вариант (Light или Dark)', true);
      return;
    }
    
    const themeConfig = {
      name,
      brandColor: brandColorInput?.value || '#22C55E',
      accentColor: accentEnabledCheck?.checked ? (accentColorInput?.value || undefined) : undefined,
      neutralTint: (neutralTintRadio?.value as 'none' | 'warm' | 'cool' | 'custom') || 'none',
      customNeutralHex: neutralTintRadio?.value === 'custom' ? customTintInput?.value : undefined,
      hasLightMode: hasLightCheckbox?.checked ?? true,
      hasDarkMode: hasDarkCheckbox?.checked ?? true,
    };
    
    if (editThemeId) {
      updateTheme(editThemeId, themeConfig);
      showNotification(`✅ Тема "${name}" обновлена`);
    } else {
      // Check if theme with this name already exists
      const existingId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (getThemeById(existingId)) {
        showNotification(`⚠️ Тема с таким именем уже существует`, true);
        return;
      }
      addTheme(themeConfig);
      showNotification(`✅ Тема "${name}" создана`);
    }
    
    renderCustomThemes();
    closeModal();
  });
}

// ============================================
// CUSTOM THEMES RENDERING (for Primitives tab)
// ============================================

export function renderCustomThemes(): void {
  const container = document.getElementById('custom-themes-container');
  if (!container) return;
  
  const customThemes = colorState.themes.themes.filter(t => !t.isSystem);
  
  if (customThemes.length === 0) {
    container.innerHTML = `
      <div class="empty-themes-hint">
        Нет дополнительных тем. Добавьте тему для создания цветовых вариаций.
      </div>
    `;
    return;
  }
  
  container.innerHTML = customThemes.map(theme => `
    <div class="custom-theme-card" data-theme-id="${theme.id}">
      <div class="theme-card-color" style="background: ${theme.brandColor}"></div>
      <div class="theme-card-info">
        <div class="theme-card-name">${theme.name}</div>
        <div class="theme-card-details">
          <span class="theme-card-hex">${theme.brandColor}</span>
          <span class="theme-card-modes">
            ${theme.hasLightMode ? '☀️' : ''}${theme.hasDarkMode ? '🌙' : ''}
          </span>
        </div>
      </div>
      <div class="theme-card-actions">
        <button class="btn-icon btn-edit-theme" data-theme-id="${theme.id}" title="Редактировать">✏️</button>
        <button class="btn-icon btn-delete-theme" data-theme-id="${theme.id}" title="Удалить">🗑</button>
      </div>
    </div>
  `).join('');
  
  // Setup edit buttons
  container.querySelectorAll('.btn-edit-theme').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.getAttribute('data-theme-id');
      if (themeId) openThemeModal(themeId);
    });
  });
  
  // Setup delete buttons
  container.querySelectorAll('.btn-delete-theme').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.getAttribute('data-theme-id');
      if (themeId) {
        const theme = getThemeById(themeId);
        if (theme && confirm(`Удалить тему "${theme.name}"?`)) {
          deleteTheme(themeId);
          renderCustomThemes();
          showNotification(`🗑 Тема "${theme.name}" удалена`);
        }
      }
    });
  });
}

// ============================================
// SYNC THEMES TO FIGMA
// ============================================

function collectColorsForSync(): Array<{name: string, value: {r: number, g: number, b: number, a: number}, description: string}> {
  const colors: Array<{name: string, value: {r: number, g: number, b: number, a: number}, description: string}> = [];
  
  // Collect from generated palettes
  for (const palette of generatedPalettes) {
    for (const [stepStr, shade] of Object.entries(palette.shades)) {
      const step = parseInt(stepStr);
      const colorInfo = colorState.colors.get(palette.name);
      
      // Check if shade is enabled
      if (colorInfo?.enabledShades && !colorInfo.enabledShades.has(step)) {
        continue;
      }
      
      const variableName = `colors/${palette.name}/${palette.name}-${step}`;
      colors.push({
        name: variableName,
        value: {
          r: shade.rgba.r,
          g: shade.rgba.g,
          b: shade.rgba.b,
          a: shade.rgba.a
        },
        description: `${palette.name} ${step}`
      });
    }
  }
  
  return colors;
}

function syncThemesToFigma(): void {
  const customThemes = colorState.themes.themes.filter(t => !t.isSystem);
  
  if (customThemes.length === 0) {
    showNotification('⚠️ Нет тем для синхронизации. Сначала добавьте тему.', true);
    return;
  }
  
  // Generate colors first if not yet generated
  if (generatedPalettes.length === 0) {
    generateColors();
  }
  
  // Get all colors for sync
  const allColors = collectColorsForSync();
  
  if (allColors.length === 0) {
    showNotification('⚠️ Сначала сгенерируйте цвета.', true);
    return;
  }
  
  // Add theme info to message
  const themes = colorState.themes.themes.map(t => ({
    id: t.id,
    name: t.name,
    brandColor: t.brandColor,
    accentColor: t.accentColor,
    neutralTint: t.neutralTint,
    hasLightMode: t.hasLightMode,
    hasDarkMode: t.hasDarkMode,
    isSystem: t.isSystem
  }));
  
  showNotification('🔄 Синхронизация тем в Figma Variables...');
  
  parent.postMessage({
    pluginMessage: {
      type: 'sync-to-figma',
      variables: allColors,
      themes: themes
    }
  }, '*');
}

// Legacy function - kept for backwards compatibility
function renderThemeTabs(): void {
  renderCustomThemes();
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

// Legacy function - now using modal-based theme creation
function addThemeTab(themeName: string): void {
  // Open theme modal with pre-filled name
  openThemeModal();
  
  // Set the name input value after modal is created
  setTimeout(() => {
    const nameInput = document.getElementById('theme-name-input') as HTMLInputElement;
    if (nameInput) {
      nameInput.value = themeName;
    }
  }, 100);
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
