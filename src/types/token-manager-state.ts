/**
 * Token Manager - State Management
 * Управление состоянием токенов
 */

import {
  TokenDefinition,
  TokenManagerState,
  TokenManagerSettings,
  TMCollectionType,
  TMColorValue,
  TMRGBAColor,
  TMSeparator,
  TMTokenType,
} from './token-manager';

import {
  INITIAL_STATE,
  STORAGE_KEYS,
  COLOR_SCALE,
  DEFAULT_PALETTES,
  ColorStep,
} from './token-manager-constants';

// ============================================
// STATE INSTANCE
// ============================================

let state: TokenManagerState = { ...INITIAL_STATE };

// ============================================
// STATE GETTERS
// ============================================

export function getState(): TokenManagerState {
  return state;
}

export function getTokens(): TokenDefinition[] {
  return state.tokens;
}

export function getTokenById(id: string): TokenDefinition | undefined {
  return state.tokens.find(t => t.id === id);
}

export function getTokenByPath(fullPath: string): TokenDefinition | undefined {
  return state.tokens.find(t => t.fullPath === fullPath);
}

export function getTokensByCollection(collection: TMCollectionType): TokenDefinition[] {
  return state.tokens.filter(t => t.collection === collection);
}

export function getEnabledTokens(): TokenDefinition[] {
  return state.tokens.filter(t => t.enabled);
}

export function getSettings(): TokenManagerSettings {
  return state.settings;
}

// ============================================
// STATE SETTERS
// ============================================

export function setState(newState: Partial<TokenManagerState>): void {
  state = { ...state, ...newState, hasUnsavedChanges: true };
}

export function setSettings(newSettings: Partial<TokenManagerSettings>): void {
  state.settings = { ...state.settings, ...newSettings };
  state.hasUnsavedChanges = true;
}

export function setSelectedToken(tokenId: string | null): void {
  state.selectedTokenId = tokenId;
}

export function setSearchQuery(query: string): void {
  state.searchQuery = query;
}

export function setFilterCollection(collection: TMCollectionType | 'all'): void {
  state.filterCollection = collection;
}

export function togglePathExpanded(path: string): void {
  const index = state.expandedPaths.indexOf(path);
  if (index === -1) {
    state.expandedPaths.push(path);
  } else {
    state.expandedPaths.splice(index, 1);
  }
}

// ============================================
// TOKEN CRUD OPERATIONS
// ============================================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createToken(tokenData: Partial<TokenDefinition>): TokenDefinition {
  const now = Date.now();
  const separator = state.settings.separator;
  
  const fullPath = tokenData.fullPath || buildFullPath(tokenData.path || [], tokenData.name || 'new-token', separator);
  
  // Check for existing token with same fullPath - update instead of creating duplicate
  const existingToken = state.tokens.find(t => t.fullPath === fullPath);
  if (existingToken) {
    // Update existing token
    const updatedToken: TokenDefinition = {
      ...existingToken,
      value: tokenData.value ?? existingToken.value,
      description: tokenData.description ?? existingToken.description,
      tags: tokenData.tags ?? existingToken.tags,
      updatedAt: now,
    };
    const index = state.tokens.findIndex(t => t.id === existingToken.id);
    state.tokens[index] = updatedToken;
    state.hasUnsavedChanges = true;
    return updatedToken;
  }
  
  const token: TokenDefinition = {
    id: generateId(),
    name: tokenData.name || 'new-token',
    path: tokenData.path || [],
    fullPath: fullPath,
    type: tokenData.type || 'COLOR',
    value: tokenData.value || { hex: '#000000', rgba: { r: 0, g: 0, b: 0, a: 1 } },
    enabled: tokenData.enabled ?? true,
    description: tokenData.description,
    tags: tokenData.tags || [],
    collection: tokenData.collection || 'Primitives',
    semantic: tokenData.semantic,
    references: tokenData.references,
    createdAt: now,
    updatedAt: now,
  };
  
  state.tokens.push(token);
  state.hasUnsavedChanges = true;
  updateCollectionCounts();
  
  return token;
}

export function updateToken(id: string, updates: Partial<TokenDefinition>): TokenDefinition | undefined {
  const index = state.tokens.findIndex(t => t.id === id);
  if (index === -1) return undefined;
  
  const token = state.tokens[index];
  const updatedToken: TokenDefinition = {
    ...token,
    ...updates,
    updatedAt: Date.now(),
  };
  
  // Rebuild fullPath if path or name changed
  if (updates.path || updates.name) {
    updatedToken.fullPath = buildFullPath(
      updatedToken.path,
      updatedToken.name,
      state.settings.separator
    );
  }
  
  state.tokens[index] = updatedToken;
  state.hasUnsavedChanges = true;
  
  return updatedToken;
}

export function deleteToken(id: string): boolean {
  const index = state.tokens.findIndex(t => t.id === id);
  if (index === -1) return false;
  
  state.tokens.splice(index, 1);
  state.hasUnsavedChanges = true;
  updateCollectionCounts();
  
  if (state.selectedTokenId === id) {
    state.selectedTokenId = null;
  }
  
  return true;
}

export function duplicateToken(id: string): TokenDefinition | undefined {
  const original = getTokenById(id);
  if (!original) return undefined;
  
  return createToken({
    ...original,
    name: `${original.name}-copy`,
    id: undefined,
  });
}

export function toggleTokenEnabled(id: string): boolean {
  const token = getTokenById(id);
  if (!token) return false;
  
  updateToken(id, { enabled: !token.enabled });
  return true;
}

export function bulkToggleEnabled(ids: string[], enabled: boolean): void {
  ids.forEach(id => updateToken(id, { enabled }));
}

export function bulkDelete(ids: string[]): void {
  ids.forEach(id => deleteToken(id));
}

// ============================================
// PATH UTILITIES
// ============================================

export function buildFullPath(path: string[], name: string, separator: TMSeparator): string {
  return [...path, name].join(separator);
}

export function parseFullPath(fullPath: string, separator: TMSeparator): { path: string[]; name: string } {
  const parts = fullPath.split(separator);
  const name = parts.pop() || '';
  return { path: parts, name };
}

export function getTokenTree(): Map<string, TokenDefinition[]> {
  const tree = new Map<string, TokenDefinition[]>();
  
  for (const token of state.tokens) {
    const pathKey = token.path.join('/');
    if (!tree.has(pathKey)) {
      tree.set(pathKey, []);
    }
    tree.get(pathKey)!.push(token);
  }
  
  return tree;
}

// ============================================
// COLLECTION UTILITIES
// ============================================

function updateCollectionCounts(): void {
  for (const collection of state.collections) {
    collection.tokenCount = state.tokens.filter(t => t.collection === collection.name).length;
  }
}

// ============================================
// COLOR UTILITIES
// ============================================

export function parseHexToRgba(hex: string): TMRGBAColor {
  const cleanHex = hex.replace('#', '');
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;
  
  return {
    r: parseInt(fullHex.substring(0, 2), 16) / 255,
    g: parseInt(fullHex.substring(2, 4), 16) / 255,
    b: parseInt(fullHex.substring(4, 6), 16) / 255,
    a: 1,
  };
}

export function formatRgbaToHex(rgba: TMRGBAColor): string {
  const toHex = (n: number): string => {
    const hex = Math.round(Math.min(1, Math.max(0, n)) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`.toUpperCase();
}

export function blendColors(base: TMRGBAColor, blend: TMRGBAColor, amount: number): TMRGBAColor {
  return {
    r: base.r * (1 - amount) + blend.r * amount,
    g: base.g * (1 - amount) + blend.g * amount,
    b: base.b * (1 - amount) + blend.b * amount,
    a: 1,
  };
}

export function generateColorShade(baseHex: string, step: ColorStep): TMColorValue {
  const baseRgba = parseHexToRgba(baseHex);
  const white: TMRGBAColor = { r: 1, g: 1, b: 1, a: 1 };
  const black: TMRGBAColor = { r: 0, g: 0, b: 0, a: 1 };
  
  let rgba: TMRGBAColor;
  
  if (step < 500) {
    const whiteAmount = (500 - step) / 500;
    rgba = blendColors(baseRgba, white, whiteAmount);
  } else if (step === 500) {
    rgba = { ...baseRgba };
  } else {
    const blackAmount = (step - 500) / 500;
    rgba = blendColors(baseRgba, black, blackAmount);
  }
  
  return {
    hex: formatRgbaToHex(rgba),
    rgba,
  };
}

// ============================================
// PRIMITIVE GENERATION
// ============================================

export function generateColorPrimitives(palettes: Array<{ name: string; hex: string }>): TokenDefinition[] {
  const tokens: TokenDefinition[] = [];
  const separator = state.settings.separator;
  
  for (const palette of palettes) {
    for (const step of COLOR_SCALE) {
      const colorValue = generateColorShade(palette.hex, step);
      const name = `${palette.name}-${step}`;
      const path = ['colors', palette.name];
      
      tokens.push({
        id: generateId(),
        name,
        path,
        fullPath: buildFullPath(path, name, separator),
        type: 'COLOR',
        value: colorValue,
        enabled: true,
        description: step === 500 
          ? `${palette.name} base color` 
          : step < 500 
            ? `${palette.name} lightened ${Math.round((500 - step) / 5)}%`
            : `${palette.name} darkened ${Math.round((step - 500) / 5)}%`,
        tags: ['color', 'primitive', palette.name],
        collection: 'Primitives',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }
  
  return tokens;
}

export function initializePrimitives(): void {
  const colorTokens = generateColorPrimitives(DEFAULT_PALETTES);
  state.tokens = [...state.tokens.filter(t => t.collection !== 'Primitives'), ...colorTokens];
  state.hasUnsavedChanges = true;
  updateCollectionCounts();
}

// ============================================
// PERSISTENCE
// ============================================

export function saveState(): void {
  // localStorage is disabled in Figma plugin iframes
  // State changes are kept in memory only during current session
  state.hasUnsavedChanges = false;
}

export function loadState(): boolean {
  // localStorage is disabled in Figma plugin iframes
  // State is initialized with defaults, no persistence available
  return false;
}

export function resetState(): void {
  state = { ...INITIAL_STATE };
  // localStorage is disabled in Figma plugin iframes
}

// ============================================
// IMPORT FROM PROJECT SYNC
// ============================================

import { ProjectSyncData, ProjectVariable, ProjectCollection, MANAGED_COLLECTIONS } from './token-manager';

/**
 * Map Figma collection name to TMCollectionType
 */
function mapCollectionToType(collectionName: string): TMCollectionType {
  if (collectionName === 'Primitives') return 'Primitives';
  if (collectionName === 'Tokens') return 'Tokens';
  if (collectionName === 'Components') return 'Components';
  // Numeric collections go to Primitives for now
  return 'Primitives';
}

/**
 * Convert Figma RGBA (0-1) to hex
 */
function rgbaToHex(color: { r: number; g: number; b: number; a?: number }): string {
  const toHex = (n: number): string => {
    const hex = Math.round(Math.min(1, Math.max(0, n)) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase();
}

/**
 * Import tokens from Project Sync data into Token Map
 */
export function importFromProjectSync(syncData: ProjectSyncData): { imported: number; skipped: number } {
  const separator = state.settings.separator;
  let imported = 0;
  let skipped = 0;
  
  // Process only managed collections
  for (const collection of syncData.collections.managed) {
    const collectionType = mapCollectionToType(collection.name);
    
    for (const variable of collection.variables) {
      // Parse path from variable name (e.g., "colors/brand/brand-500")
      const pathParts = variable.name.split('/');
      const name = pathParts.pop() || variable.name;
      const path = pathParts;
      const fullPath = variable.name; // Keep original path from Figma
      
      // Check if token already exists
      const existingToken = state.tokens.find(t => 
        t.fullPath === fullPath && t.collection === collectionType
      );
      
      if (existingToken) {
        skipped++;
        continue;
      }
      
      // Create token based on type
      let tokenValue: TMColorValue | number | string | boolean;
      let tokenType: TMTokenType = 'STRING';
      
      if (variable.resolvedType === 'COLOR' && variable.value) {
        // Color variable
        const rgba = variable.value as { r: number; g: number; b: number; a: number };
        tokenValue = {
          hex: rgbaToHex(rgba),
          rgba: { r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a ?? 1 },
        };
        tokenType = 'COLOR';
      } else if (variable.resolvedType === 'FLOAT') {
        // Number variable
        tokenValue = variable.value as number;
        tokenType = 'NUMBER';
      } else if (variable.resolvedType === 'BOOLEAN') {
        tokenValue = variable.value as boolean;
        tokenType = 'BOOLEAN';
      } else {
        tokenValue = String(variable.value || '');
        tokenType = 'STRING';
      }
      
      // Create token
      const token: TokenDefinition = {
        id: generateId(),
        name,
        path,
        fullPath,
        type: tokenType,
        value: tokenValue,
        enabled: true,
        description: variable.description,
        tags: [collection.name.toLowerCase(), tokenType.toLowerCase()],
        collection: collectionType,
        figmaId: variable.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      state.tokens.push(token);
      imported++;
    }
  }
  
  if (imported > 0) {
    state.hasUnsavedChanges = true;
    updateCollectionCounts();
  }
  
  return { imported, skipped };
}

/**
 * Clear all tokens from Token Map
 */
export function clearAllTokens(): void {
  state.tokens = [];
  state.selectedTokenId = null;
  state.hasUnsavedChanges = true;
  updateCollectionCounts();
}

// ============================================
// SEARCH & FILTER
// ============================================

export function searchTokens(query: string): TokenDefinition[] {
  if (!query.trim()) return state.tokens;
  
  const lowerQuery = query.toLowerCase();
  
  return state.tokens.filter(token => {
    return (
      token.name.toLowerCase().includes(lowerQuery) ||
      token.fullPath.toLowerCase().includes(lowerQuery) ||
      token.description?.toLowerCase().includes(lowerQuery) ||
      token.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  });
}

export function filterTokens(): TokenDefinition[] {
  let filtered = state.tokens;
  
  // Filter by collection
  if (state.filterCollection !== 'all') {
    filtered = filtered.filter(t => t.collection === state.filterCollection);
  }
  
  // Filter by enabled status
  if (state.filterEnabled === 'enabled') {
    filtered = filtered.filter(t => t.enabled);
  } else if (state.filterEnabled === 'disabled') {
    filtered = filtered.filter(t => !t.enabled);
  }
  
  // Filter by search query
  if (state.searchQuery.trim()) {
    const lowerQuery = state.searchQuery.toLowerCase();
    filtered = filtered.filter(token => {
      return (
        token.name.toLowerCase().includes(lowerQuery) ||
        token.fullPath.toLowerCase().includes(lowerQuery) ||
        token.description?.toLowerCase().includes(lowerQuery) ||
        token.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    });
  }
  
  return filtered;
}

// ============================================
// EXPORT
// ============================================

export { state };
export type { TokenDefinition, TokenManagerState };
export { COLOR_SCALE, DEFAULT_PALETTES };
