/**
 * Token Manager - Type Definitions
 * Централизованная система управления дизайн-токенами
 */

// ============================================
// BASIC TYPES
// ============================================

// Figma Variable Types (for Token Manager)
export type TMTokenType = 'COLOR' | 'NUMBER' | 'STRING' | 'BOOLEAN';
export type TMCollectionType = 
  | 'Primitives' 
  | 'Tokens' 
  | 'Components'
  | 'Typography'
  | 'Spacing'
  | 'Gap'
  | 'Icon Size'
  | 'Radius';
export type TMSeparator = '/' | '.' | '-';
export type TMCaseStyle = 'kebab' | 'camel' | 'snake' | 'pascal';

export interface TMRGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface TMColorValue {
  hex: string;
  rgba: TMRGBAColor;
}

// ============================================
// TOKEN DEFINITION
// ============================================

export interface TokenSemantic {
  category: string;           // 'bg', 'text', 'border', 'action'
  subcategory: string;        // 'primary', 'secondary', 'brand'
  variant?: string;           // 'default', 'subtle', 'strong'
  state?: string;             // 'default', 'hover', 'active', 'disabled'
}

export interface TokenReference {
  light: string;              // Path to primitive for light mode
  dark?: string;              // Path to primitive for dark mode (optional)
}

export interface TokenDefinition {
  // Identity
  id: string;                 // Unique ID (UUID)
  name: string;               // Token name without path (e.g., 'brand-500')
  path: string[];             // Path segments ['colors', 'brand']
  fullPath: string;           // Full path with separator (e.g., 'colors/brand/brand-500')
  
  // Type & Value
  type: TMTokenType;
  value: TMColorValue | number | string | boolean;
  
  // Semantic mapping (for Tokens & Components)
  semantic?: TokenSemantic;
  
  // References (for Tokens & Components)
  references?: TokenReference;
  
  // Meta
  enabled: boolean;           // Is token active
  description?: string;       // Token description
  tags?: string[];            // Search tags
  
  // Figma integration
  figmaId?: string;           // Figma Variable ID
  collection: TMCollectionType; // Which collection it belongs to
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}

// ============================================
// COLLECTION CONFIGURATION
// ============================================

export interface CollectionMode {
  id: string;
  name: string;               // 'light', 'dark', 'green-light', 'green-dark'
  isDefault: boolean;
}

// ============================================
// THEME CONFIGURATION
// ============================================

export interface ThemeConfig {
  id: string;                 // 'default', 'green', 'purple'
  name: string;               // 'Default', 'Green Theme', 'Purple Theme'
  brandColor: string;         // Base brand color hex for this theme
  accentColor?: string;       // Optional accent color
  neutralTint?: 'none' | 'warm' | 'cool' | 'custom';  // Tint for neutral colors
  customNeutralHex?: string;  // Custom neutral tint color
  hasLightMode: boolean;      // Whether to create light variant
  hasDarkMode: boolean;       // Whether to create dark variant
  isSystem: boolean;          // System themes (default) cannot be deleted
  createdAt: number;
}

export interface CollectionConfig {
  name: TMCollectionType;
  modes: CollectionMode[];
  figmaId?: string;           // Figma Collection ID
  tokenCount: number;
}

// ============================================
// CATEGORIES & PRESETS
// ============================================

export interface CategoryDefinition {
  id: string;
  name: string;               // 'bg', 'text', 'border'
  label: string;              // 'Backgrounds', 'Text', 'Borders'
  subcategories: SubcategoryDefinition[];
}

export interface SubcategoryDefinition {
  id: string;
  name: string;               // 'primary', 'secondary'
  label: string;              // 'Primary', 'Secondary'
  variants?: string[];        // ['default', 'subtle', 'strong']
  states: string[];           // ['default', 'hover', 'active', 'disabled']
}

// ============================================
// STATE MANAGEMENT
// ============================================

export interface TokenManagerSettings {
  separator: TMSeparator;
  caseStyle: TMCaseStyle;
  exportFormat: 'figma' | 'json' | 'css' | 'scss' | 'tailwind' | 'frontend' | 'tokens-by-theme';
  autoSync: boolean;
  darkModeEnabled: boolean;
}

export interface TokenManagerState {
  // Data
  tokens: TokenDefinition[];
  collections: CollectionConfig[];
  categories: CategoryDefinition[];
  
  // Settings
  settings: TokenManagerSettings;
  
  // UI State
  selectedTokenId: string | null;
  expandedPaths: string[];
  searchQuery: string;
  filterCollection: TMCollectionType | 'all';
  filterEnabled: 'all' | 'enabled' | 'disabled';
  
  // Sync status
  lastSyncedAt: number | null;
  hasUnsavedChanges: boolean;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

// ============================================
// EXPORT FORMATS
// ============================================

export interface ExportOptions {
  format: 'json' | 'css' | 'scss' | 'tailwind' | 'figma';
  collections: TMCollectionType[];
  includeDisabled: boolean;
  separator: TMSeparator;
  flattenPaths: boolean;
}

export interface JSONExportToken {
  $type: string;
  $value: any;
  $description?: string;
}

export interface JSONExportFormat {
  $version: string;
  $name: string;
  $timestamp: string;
  primitives?: Record<string, any>;
  tokens?: Record<string, any>;
  components?: Record<string, any>;
}

// ============================================
// FIGMA COMMUNICATION
// ============================================

export interface TMFigmaMessage {
  type: string;
  payload?: any;
}

export interface TMFigmaVariable {
  id: string;
  name: string;
  value: any;
  collectionId: string;
  modeValues?: Record<string, any>;
}

// ============================================
// PROJECT SYNC TYPES
// ============================================

/** Known collections managed by the plugin */
export const MANAGED_COLLECTIONS = [
  'Primitives',
  'Tokens', 
  'Components',
  'Spacing',
  'Gap',
  'Icon Size',
  'Radius',
  'Typography',
  'Stroke',
  'Effects',
] as const;

export type ManagedCollectionName = typeof MANAGED_COLLECTIONS[number];

/** Known style prefixes managed by the plugin */
export const MANAGED_STYLE_PREFIXES = {
  paint: ['color/'],
  text: ['typography/'],
} as const;

/** Variable info from Figma */
export interface ProjectVariable {
  id: string;
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  value: any;
  description?: string;
}

/** Collection info from Figma */
export interface ProjectCollection {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  variableCount: number;
  variables: ProjectVariable[];
  isManaged: boolean; // true if it's one of our collections
}

/** Style info from Figma */
export interface ProjectStyle {
  id: string;
  name: string;
  type: 'PAINT' | 'TEXT';
  description?: string;
  // For PAINT styles
  color?: { r: number; g: number; b: number; a: number };
  // For TEXT styles  
  fontSize?: number;
  fontFamily?: string;
  isManaged: boolean; // true if name starts with managed prefix
}

/** Full project state from Figma */
export interface ProjectSyncData {
  collections: {
    managed: ProjectCollection[];
    other: ProjectCollection[];
  };
  styles: {
    paint: {
      managed: ProjectStyle[];
      other: ProjectStyle[];
    };
    text: {
      managed: ProjectStyle[];
      other: ProjectStyle[];
    };
  };
  summary: {
    totalCollections: number;
    totalVariables: number;
    totalPaintStyles: number;
    totalTextStyles: number;
    managedCollections: number;
    managedVariables: number;
    managedPaintStyles: number;
    managedTextStyles: number;
  };
  syncedAt: number;
}
