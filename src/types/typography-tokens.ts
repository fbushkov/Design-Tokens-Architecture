/**
 * Typography Token System
 * 3-level architecture: Primitives → Semantic → Components
 */

// ============================================
// PRIMITIVE TYPES
// ============================================

export interface FontFamilyPrimitive {
  name: string;
  value: string;
  fallback?: string;
  category: 'sans' | 'serif' | 'mono' | 'display' | 'custom';
}

export interface FontSizePrimitive {
  name: string;  // e.g., "10", "11", "12"
  value: number; // in px
}

export interface LineHeightPrimitive {
  name: string;  // e.g., "100", "110", "120" (multiplied by 100)
  value: number; // multiplier, e.g., 1.0, 1.1, 1.2
}

export interface FontWeightPrimitive {
  name: string;  // e.g., "100", "400", "700"
  value: number; // CSS weight value
  label: string; // "thin", "regular", "bold"
}

export interface LetterSpacingPrimitive {
  name: string;  // e.g., "n050" for -0.05, "025" for 0.025
  value: number; // in em
}

export interface TextDecorationPrimitive {
  name: string;
  value: 'none' | 'underline' | 'line-through' | 'overline';
}

export interface TextTransformPrimitive {
  name: string;
  value: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface FontStylePrimitive {
  name: string;
  value: 'normal' | 'italic';
}

// ============================================
// SEMANTIC TYPOGRAPHY TOKEN
// ============================================

// Значения для конкретного устройства/breakpoint
export interface TypographyDeviceValues {
  fontSize?: string;        // e.g., '{font.size.56}' или '56'
  lineHeight?: string;      // e.g., '{font.lineHeight.110}' или '110'
  letterSpacing?: string;   // e.g., '{font.letterSpacing.n025}'
}

export interface TypographySemanticToken {
  id: string;
  path: string[]; // e.g., ['typography', 'page', 'hero']
  name: string;   // e.g., 'hero'
  
  // References to primitives (using token reference syntax)
  // Эти значения используются как BASE (Desktop) и как fallback
  fontFamily: string;      // e.g., '{font.family.inter}'
  fontSize: string;        // e.g., '{font.size.56}'
  fontWeight: string;      // e.g., '{font.weight.700}'
  lineHeight: string;      // e.g., '{font.lineHeight.110}'
  letterSpacing: string;   // e.g., '{font.letterSpacing.n025}'
  
  // Per-device overrides (если не указано - используется базовое значение)
  // Ключ - имя breakpoint (desktop, tablet, mobile)
  deviceOverrides?: Record<string, TypographyDeviceValues>;
  
  // Флаг: автоматически масштабировать по устройствам?
  // true = применять scale factor из breakpoint config
  // false = использовать одинаковое значение везде (или deviceOverrides)
  responsive?: boolean;
  
  // Optional properties
  textDecoration?: string; // e.g., '{font.decoration.underline}'
  textTransform?: string;  // e.g., '{font.transform.uppercase}'
  fontStyle?: string;      // e.g., '{font.style.italic}'
  
  // Metadata
  description?: string;
  category: TypographyCategory;
  subcategory?: string;
  variant?: string;
}

export type TypographyCategory = 
  | 'page'        // Page-level headings
  | 'section'     // Section headings
  | 'card'        // Card headings
  | 'modal'       // Modal/dialog headings
  | 'sidebar'     // Sidebar/navigation
  | 'paragraph'   // Body text
  | 'helper'      // Helper/caption text
  | 'action'      // Buttons, links
  | 'form'        // Form elements
  | 'data'        // Tables, metrics
  | 'status'      // Badges, tags
  | 'notification'// Toasts, alerts
  | 'navigation'  // Menu, tabs, breadcrumbs
  | 'code'        // Code blocks
  | 'content'     // Blockquotes, lists
  | 'empty'       // Empty states
  | 'loading';    // Loading states

// ============================================
// COMPONENT TYPOGRAPHY TOKEN
// ============================================

export interface TypographyComponentToken {
  id: string;
  component: string;  // e.g., 'button', 'input', 'card'
  element: string;    // e.g., 'label', 'value', 'title'
  variant?: string;   // e.g., 'primary', 'compact', 'large'
  
  // References to semantic tokens
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing?: string;
  textDecoration?: string;
  textTransform?: string;
  fontStyle?: string;
}

// ============================================
// PRIMITIVES CONFIGURATION
// ============================================

export const DEFAULT_FONT_FAMILIES: FontFamilyPrimitive[] = [
  { name: 'roboto', value: 'Roboto', fallback: 'Arial, sans-serif', category: 'sans' },
  { name: 'roboto-mono', value: 'Roboto Mono', fallback: 'Consolas, monospace', category: 'mono' },
];

export const DEFAULT_FONT_SIZES: FontSizePrimitive[] = [
  { name: '10', value: 10 },
  { name: '11', value: 11 },
  { name: '12', value: 12 },
  { name: '13', value: 13 },
  { name: '14', value: 14 },
  { name: '15', value: 15 },
  { name: '16', value: 16 },
  { name: '18', value: 18 },
  { name: '20', value: 20 },
  { name: '24', value: 24 },
  { name: '28', value: 28 },
  { name: '32', value: 32 },
  { name: '36', value: 36 },
  { name: '40', value: 40 },
  { name: '48', value: 48 },
  { name: '56', value: 56 },
  { name: '64', value: 64 },
  { name: '72', value: 72 },
  { name: '96', value: 96 },
];

export const DEFAULT_LINE_HEIGHTS: LineHeightPrimitive[] = [
  { name: '100', value: 1.0 },
  { name: '110', value: 1.1 },
  { name: '115', value: 1.15 },
  { name: '120', value: 1.2 },
  { name: '125', value: 1.25 },
  { name: '130', value: 1.3 },
  { name: '140', value: 1.4 },
  { name: '150', value: 1.5 },
  { name: '160', value: 1.6 },
  { name: '170', value: 1.7 },
  { name: '180', value: 1.8 },
  { name: '200', value: 2.0 },
];

export const DEFAULT_FONT_WEIGHTS: FontWeightPrimitive[] = [
  { name: '100', value: 100, label: 'thin' },
  { name: '200', value: 200, label: 'extralight' },
  { name: '300', value: 300, label: 'light' },
  { name: '400', value: 400, label: 'regular' },
  { name: '500', value: 500, label: 'medium' },
  { name: '600', value: 600, label: 'semibold' },
  { name: '700', value: 700, label: 'bold' },
  { name: '800', value: 800, label: 'extrabold' },
  { name: '900', value: 900, label: 'black' },
];

export const DEFAULT_LETTER_SPACINGS: LetterSpacingPrimitive[] = [
  { name: 'n050', value: -0.05 },
  { name: 'n025', value: -0.025 },
  { name: 'n020', value: -0.02 },
  { name: 'n015', value: -0.015 },
  { name: 'n010', value: -0.01 },
  { name: '000', value: 0 },
  { name: '010', value: 0.01 },
  { name: '015', value: 0.015 },
  { name: '020', value: 0.02 },
  { name: '025', value: 0.025 },
  { name: '050', value: 0.05 },
  { name: '075', value: 0.075 },
  { name: '100', value: 0.1 },
  { name: '150', value: 0.15 },
];

export const DEFAULT_TEXT_DECORATIONS: TextDecorationPrimitive[] = [
  { name: 'none', value: 'none' },
  { name: 'underline', value: 'underline' },
  { name: 'line-through', value: 'line-through' },
  { name: 'overline', value: 'overline' },
];

export const DEFAULT_TEXT_TRANSFORMS: TextTransformPrimitive[] = [
  { name: 'none', value: 'none' },
  { name: 'uppercase', value: 'uppercase' },
  { name: 'lowercase', value: 'lowercase' },
  { name: 'capitalize', value: 'capitalize' },
];

export const DEFAULT_FONT_STYLES: FontStylePrimitive[] = [
  { name: 'normal', value: 'normal' },
  { name: 'italic', value: 'italic' },
];

// ============================================
// TYPOGRAPHY STATE
// ============================================

export interface TypographyState {
  // Primitives (editable)
  fontFamilies: FontFamilyPrimitive[];
  fontSizes: FontSizePrimitive[];
  lineHeights: LineHeightPrimitive[];
  fontWeights: FontWeightPrimitive[];
  letterSpacings: LetterSpacingPrimitive[];
  textDecorations: TextDecorationPrimitive[];
  textTransforms: TextTransformPrimitive[];
  fontStyles: FontStylePrimitive[];
  
  // Semantic tokens
  semanticTokens: TypographySemanticToken[];
  
  // Component tokens
  componentTokens: TypographyComponentToken[];
  
  // Custom categories (user-defined)
  customCategories?: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  
  // Settings
  settings: {
    baseFontFamily: string;
    monoFontFamily: string;
    baseFontSize: number;
    scaleRatio: number;
  };
}

// Default state factory
export function createDefaultTypographyState(): TypographyState {
  return {
    fontFamilies: [...DEFAULT_FONT_FAMILIES],
    fontSizes: [...DEFAULT_FONT_SIZES],
    lineHeights: [...DEFAULT_LINE_HEIGHTS],
    fontWeights: [...DEFAULT_FONT_WEIGHTS],
    letterSpacings: [...DEFAULT_LETTER_SPACINGS],
    textDecorations: [...DEFAULT_TEXT_DECORATIONS],
    textTransforms: [...DEFAULT_TEXT_TRANSFORMS],
    fontStyles: [...DEFAULT_FONT_STYLES],
    semanticTokens: [],
    componentTokens: [],
    settings: {
      baseFontFamily: 'inter',
      monoFontFamily: 'roboto-mono',
      baseFontSize: 16,
      scaleRatio: 1.25, // Major Third
    },
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert line height multiplier to percentage for Figma
 */
export function lineHeightToPercent(multiplier: number): number {
  return Math.round(multiplier * 100);
}

/**
 * Convert letter spacing em to percentage for Figma
 */
export function letterSpacingToPercent(em: number): number {
  return Math.round(em * 100 * 100) / 100; // -0.025em → -2.5%
}

/**
 * Create token reference string
 */
export function createTokenRef(category: string, name: string): string {
  return `{font.${category}.${name}}`;
}

/**
 * Parse token reference string
 */
export function parseTokenRef(ref: string): { category: string; name: string } | null {
  const match = ref.match(/\{font\.(\w+)\.([^}]+)\}/);
  if (!match) return null;
  return { category: match[1], name: match[2] };
}

/**
 * Generate unique ID for token
 */
export function generateTokenId(path: string[]): string {
  return path.join('.').toLowerCase().replace(/\s+/g, '-');
}
