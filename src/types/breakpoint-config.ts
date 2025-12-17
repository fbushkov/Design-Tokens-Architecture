/**
 * Breakpoints & Device Modes Configuration
 * 
 * Система управления breakpoints и устройствами для адаптивных токенов.
 * 
 * Архитектура:
 * - Breakpoints: именованные точки с px-значениями
 * - Devices: группировка breakpoints по типам устройств
 * - Figma Modes: маппинг на режимы Figma Variable Collections
 */

// ============================================
// TYPES
// ============================================

export interface Breakpoint {
  id: string;              // 'desktop', 'tablet', 'mobile'
  name: string;            // 'Desktop', 'Tablet', 'Mobile'
  value: number;           // 1440, 768, 375
  unit: 'px';              // пока только px
  icon: string;            // '🖥️', '📱'
  order: number;           // порядок в Figma (0 = первая колонка)
  description?: string;    // 'Large screens 1440px+'
}

export interface BreakpointConfig {
  // Показывать px в названии режима Figma
  showValueInModeName: boolean;  // true → "Desktop (1440px)"
  
  // Список breakpoints
  breakpoints: Breakpoint[];
  
  // Какой breakpoint используется по умолчанию
  defaultBreakpoint: string;  // 'desktop'
}

// ============================================
// PRESETS
// ============================================

export const BREAKPOINT_PRESETS = {
  /** Стандартный набор для веб-проектов */
  web: {
    name: 'Web Standard',
    description: '3 breakpoints: Desktop, Tablet, Mobile',
    breakpoints: [
      { id: 'desktop', name: 'Desktop', value: 1440, unit: 'px' as const, icon: '🖥️', order: 0, description: 'Large screens 1440px+' },
      { id: 'tablet',  name: 'Tablet',  value: 768,  unit: 'px' as const, icon: '📱', order: 1, description: 'Tablets 768px - 1439px' },
      { id: 'mobile',  name: 'Mobile',  value: 375,  unit: 'px' as const, icon: '📱', order: 2, description: 'Phones up to 767px' },
    ],
  },
  
  /** Расширенный набор с дополнительными точками */
  webExtended: {
    name: 'Web Extended',
    description: '5 breakpoints: Desktop Wide, Desktop, Tablet, Mobile, Mobile Small',
    breakpoints: [
      { id: 'desktop-wide', name: 'Desktop Wide', value: 1920, unit: 'px' as const, icon: '🖥️', order: 0, description: 'Wide screens 1920px+' },
      { id: 'desktop',      name: 'Desktop',      value: 1440, unit: 'px' as const, icon: '🖥️', order: 1, description: 'Standard desktop 1440px+' },
      { id: 'tablet',       name: 'Tablet',       value: 768,  unit: 'px' as const, icon: '📱', order: 2, description: 'Tablets 768px - 1439px' },
      { id: 'mobile',       name: 'Mobile',       value: 375,  unit: 'px' as const, icon: '📱', order: 3, description: 'Standard phones 375px+' },
      { id: 'mobile-small', name: 'Mobile Small', value: 320,  unit: 'px' as const, icon: '📱', order: 4, description: 'Small phones 320px+' },
    ],
  },
  
  /** iOS устройства */
  ios: {
    name: 'iOS Devices',
    description: 'Common iOS device widths',
    breakpoints: [
      { id: 'ipad-pro-12',  name: 'iPad Pro 12.9"', value: 1024, unit: 'px' as const, icon: '📱', order: 0, description: 'iPad Pro 12.9 inch' },
      { id: 'ipad-pro-11',  name: 'iPad Pro 11"',   value: 834,  unit: 'px' as const, icon: '📱', order: 1, description: 'iPad Pro 11 inch' },
      { id: 'ipad-mini',    name: 'iPad Mini',      value: 744,  unit: 'px' as const, icon: '📱', order: 2, description: 'iPad Mini' },
      { id: 'iphone-max',   name: 'iPhone Pro Max', value: 430,  unit: 'px' as const, icon: '📱', order: 3, description: 'iPhone Pro Max' },
      { id: 'iphone',       name: 'iPhone',         value: 390,  unit: 'px' as const, icon: '📱', order: 4, description: 'iPhone 14/15' },
      { id: 'iphone-se',    name: 'iPhone SE',      value: 375,  unit: 'px' as const, icon: '📱', order: 5, description: 'iPhone SE / Mini' },
    ],
  },
  
  /** Android устройства */
  android: {
    name: 'Android Devices',
    description: 'Common Android device widths',
    breakpoints: [
      { id: 'tablet-10',   name: 'Tablet 10"',   value: 800, unit: 'px' as const, icon: '📱', order: 0, description: 'Android tablets 10 inch' },
      { id: 'tablet-7',    name: 'Tablet 7"',    value: 600, unit: 'px' as const, icon: '📱', order: 1, description: 'Android tablets 7 inch' },
      { id: 'phone-large', name: 'Phone Large',  value: 480, unit: 'px' as const, icon: '📱', order: 2, description: 'Large Android phones' },
      { id: 'phone',       name: 'Phone Medium', value: 400, unit: 'px' as const, icon: '📱', order: 3, description: 'Medium Android phones' },
      { id: 'phone-small', name: 'Phone Small',  value: 360, unit: 'px' as const, icon: '📱', order: 4, description: 'Small Android phones' },
    ],
  },
} as const;

// ============================================
// DEFAULT CONFIG
// ============================================

export const DEFAULT_BREAKPOINT_CONFIG: BreakpointConfig = {
  showValueInModeName: true,
  defaultBreakpoint: 'desktop',
  breakpoints: [...BREAKPOINT_PRESETS.web.breakpoints],
};

// ============================================
// STATE
// ============================================

let breakpointConfig: BreakpointConfig = { ...DEFAULT_BREAKPOINT_CONFIG };

// ============================================
// GETTERS
// ============================================

export function getBreakpointConfig(): BreakpointConfig {
  return breakpointConfig;
}

export function getBreakpoints(): Breakpoint[] {
  return breakpointConfig.breakpoints;
}

export function getBreakpointById(id: string): Breakpoint | undefined {
  return breakpointConfig.breakpoints.find(b => b.id === id);
}

export function getDefaultBreakpoint(): Breakpoint | undefined {
  return getBreakpointById(breakpointConfig.defaultBreakpoint);
}

export function getSortedBreakpoints(): Breakpoint[] {
  return [...breakpointConfig.breakpoints].sort((a, b) => a.order - b.order);
}

// ============================================
// SETTERS
// ============================================

export function setBreakpointConfig(config: Partial<BreakpointConfig>): void {
  breakpointConfig = { ...breakpointConfig, ...config };
}

export function setBreakpoints(breakpoints: Breakpoint[]): void {
  breakpointConfig.breakpoints = breakpoints;
}

export function addBreakpoint(breakpoint: Omit<Breakpoint, 'order'>): Breakpoint {
  const order = breakpointConfig.breakpoints.length;
  const newBreakpoint: Breakpoint = { ...breakpoint, order };
  breakpointConfig.breakpoints.push(newBreakpoint);
  return newBreakpoint;
}

export function updateBreakpoint(id: string, updates: Partial<Breakpoint>): Breakpoint | undefined {
  const index = breakpointConfig.breakpoints.findIndex(b => b.id === id);
  if (index === -1) return undefined;
  
  breakpointConfig.breakpoints[index] = {
    ...breakpointConfig.breakpoints[index],
    ...updates,
  };
  return breakpointConfig.breakpoints[index];
}

export function removeBreakpoint(id: string): boolean {
  const index = breakpointConfig.breakpoints.findIndex(b => b.id === id);
  if (index === -1) return false;
  
  breakpointConfig.breakpoints.splice(index, 1);
  // Reorder remaining breakpoints
  breakpointConfig.breakpoints.forEach((b, i) => b.order = i);
  return true;
}

export function reorderBreakpoints(orderedIds: string[]): void {
  const newBreakpoints: Breakpoint[] = [];
  orderedIds.forEach((id, index) => {
    const bp = breakpointConfig.breakpoints.find(b => b.id === id);
    if (bp) {
      newBreakpoints.push({ ...bp, order: index });
    }
  });
  breakpointConfig.breakpoints = newBreakpoints;
}

export function applyPreset(presetKey: keyof typeof BREAKPOINT_PRESETS): void {
  const preset = BREAKPOINT_PRESETS[presetKey];
  breakpointConfig.breakpoints = preset.breakpoints.map((b, i) => ({ ...b, order: i }));
}

// ============================================
// FIGMA MODE HELPERS
// ============================================

/**
 * Генерирует имя режима для Figma
 * @example getModeName({ name: 'Desktop', value: 1440 }, true) → "Desktop (1440px)"
 */
export function getModeName(breakpoint: Breakpoint, showValue?: boolean): string {
  const show = showValue ?? breakpointConfig.showValueInModeName;
  return show 
    ? `${breakpoint.name} (${breakpoint.value}${breakpoint.unit})`
    : breakpoint.name;
}

/**
 * Генерирует массив имён режимов для Figma в правильном порядке
 */
export function getModeNames(): string[] {
  return getSortedBreakpoints().map(b => getModeName(b));
}

/**
 * Парсит имя режима обратно в breakpoint id
 * @example parseModeNameToBreakpointId("Desktop (1440px)") → "desktop"
 */
export function parseModeNameToBreakpointId(modeName: string): string | undefined {
  // Try exact match first
  let bp = breakpointConfig.breakpoints.find(b => b.name === modeName);
  if (bp) return bp.id;
  
  // Try match with value
  bp = breakpointConfig.breakpoints.find(b => getModeName(b, true) === modeName);
  if (bp) return bp.id;
  
  // Try match without value
  bp = breakpointConfig.breakpoints.find(b => getModeName(b, false) === modeName);
  if (bp) return bp.id;
  
  return undefined;
}

// ============================================
// STORAGE
// ============================================

const STORAGE_KEY = 'breakpoint-config';

export function saveBreakpointConfig(): string {
  return JSON.stringify(breakpointConfig);
}

export function loadBreakpointConfig(json: string): void {
  try {
    const config = JSON.parse(json) as BreakpointConfig;
    breakpointConfig = config;
  } catch (e) {
    console.error('Failed to load breakpoint config:', e);
  }
}

export function resetBreakpointConfig(): void {
  breakpointConfig = { ...DEFAULT_BREAKPOINT_CONFIG };
}
