/**
 * Figma Plugin Main Code
 * Handles communication with Figma API and Variables
 */

// Types are defined inline to avoid import issues in Figma sandbox
interface ColorValue {
  hex: string;
  rgba: { r: number; g: number; b: number; a: number };
}

interface DimensionValue {
  value: number;
  unit: 'px' | 'rem' | 'em' | '%' | 'vw' | 'vh';
}

interface ShadowValue {
  offsetX: DimensionValue;
  offsetY: DimensionValue;
  blur: DimensionValue;
  spread: DimensionValue;
  color: ColorValue;
  type: 'dropShadow' | 'innerShadow';
}

interface PrimitiveColorToken {
  $type: 'color';
  $value: ColorValue;
  $description?: string;
}

interface PrimitiveDimensionToken {
  $type: 'dimension';
  $value: DimensionValue;
  $description?: string;
}

interface PrimitiveFontToken {
  $type: 'fontFamily';
  $value: string;
  $description?: string;
}

interface PrimitiveShadowToken {
  $type: 'shadow';
  $value: ShadowValue | ShadowValue[];
  $description?: string;
}

interface PrimitiveTokens {
  colors: Record<string, Record<string, PrimitiveColorToken>>;
  dimensions: Record<string, PrimitiveDimensionToken>;
  fonts: Record<string, PrimitiveFontToken>;
  shadows: Record<string, PrimitiveShadowToken>;
  gradients: Record<string, unknown>;
}

interface DesignTokens {
  $version: string;
  $name: string;
  $description?: string;
  primitives: PrimitiveTokens;
  semantic: Record<string, unknown>;
  composite: Record<string, unknown>;
}

interface PluginMessage {
  type: string;
  payload?: unknown;
  data?: unknown;
  primitives?: Array<{ name: string; value: number }>;
  tokens?: Array<{ 
    id: string; 
    path: string;
    desktop: string; 
    tablet: string; 
    mobile: string; 
  }>;
}

// Show the plugin UI with resize support
figma.showUI(__html__, { 
  width: 560, 
  height: 680,
  themeColors: true
});

// Enable window resizing
figma.ui.resize(560, 680);

// ============================================
// UTILITY FUNCTIONS
// ============================================

function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${a < 1 ? toHex(a) : ''}`;
}

function rgbToHex(color: RGB | RGBA): string {
  const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
  const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
  const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
    a: result[4] ? parseInt(result[4], 16) / 255 : 1
  };
}

function figmaColorToColorValue(color: RGB | RGBA): ColorValue {
  const a = 'a' in color ? color.a : 1;
  return {
    hex: rgbaToHex(color.r, color.g, color.b, a),
    rgba: { r: color.r, g: color.g, b: color.b, a }
  };
}

function colorValueToFigmaColor(color: ColorValue): RGBA {
  return {
    r: color.rgba.r,
    g: color.rgba.g,
    b: color.rgba.b,
    a: color.rgba.a
  };
}

// Opacity scale for color generation (25 to 975, step 25)
const OPACITY_SCALE = [25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500, 525, 550, 575, 600, 625, 650, 675, 700, 725, 750, 775, 800, 825, 850, 875, 900, 925, 950, 975] as const;

/**
 * Generate full color scale from base HEX color
 * Returns object with steps 25-975 and their RGB values (0-255 range)
 */
function generateColorScale(hex: string): Record<number, { r: number; g: number; b: number }> {
  const baseRgba = hexToRgba(hex);
  const white = { r: 1, g: 1, b: 1 };
  const black = { r: 0, g: 0, b: 0 };
  
  const blendColors = (bg: { r: number; g: number; b: number }, fg: { r: number; g: number; b: number }, alpha: number) => ({
    r: Math.round((fg.r * alpha + bg.r * (1 - alpha)) * 255),
    g: Math.round((fg.g * alpha + bg.g * (1 - alpha)) * 255),
    b: Math.round((fg.b * alpha + bg.b * (1 - alpha)) * 255)
  });
  
  const result: Record<number, { r: number; g: number; b: number }> = {};
  
  for (const step of OPACITY_SCALE) {
    if (step < 500) {
      // Lighter shades: blend with white
      const alpha = step / 500;
      result[step] = blendColors(white, baseRgba, alpha);
    } else if (step === 500) {
      // Base color
      result[step] = {
        r: Math.round(baseRgba.r * 255),
        g: Math.round(baseRgba.g * 255),
        b: Math.round(baseRgba.b * 255)
      };
    } else {
      // Darker shades: blend with black
      const alpha = (1000 - step) / 500;
      result[step] = blendColors(black, baseRgba, alpha);
    }
  }
  
  return result;
}

// ============================================
// FIGMA VARIABLES MANAGEMENT
// ============================================

async function getLocalVariableCollections(): Promise<VariableCollection[]> {
  return figma.variables.getLocalVariableCollectionsAsync();
}

async function getLocalVariables(): Promise<Variable[]> {
  return figma.variables.getLocalVariablesAsync();
}

async function createVariableCollection(name: string): Promise<VariableCollection> {
  return figma.variables.createVariableCollection(name);
}

// Cache for existing variables to avoid repeated API calls
let existingVariablesCache: Variable[] | null = null;

// Invalidate cache - call this at start of sync operations
function invalidateVariablesCache(): void {
  existingVariablesCache = null;
}

// Get cached variables or fetch fresh
async function getCachedVariables(): Promise<Variable[]> {
  if (existingVariablesCache === null) {
    existingVariablesCache = await figma.variables.getLocalVariablesAsync();
  }
  return existingVariablesCache;
}

// Safe variable creation - uses cache to check existence
async function createVariable(
  name: string, 
  collection: VariableCollection, 
  type: VariableResolvedDataType
): Promise<Variable> {
  // Use cached variables for lookup
  const cachedVars = await getCachedVariables();
  const existing = cachedVars.find(v => 
    v.name === name && v.variableCollectionId === collection.id
  );
  
  if (existing) {
    return existing;
  }
  
  const newVar = figma.variables.createVariable(name, collection, type);
  // Add to cache
  existingVariablesCache?.push(newVar);
  return newVar;
}

// ============================================
// EXTRACT TOKENS FROM FIGMA
// ============================================

async function extractColorsFromVariables(): Promise<Record<string, ColorValue>> {
  const variables = await getLocalVariables();
  const colors: Record<string, ColorValue> = {};

  for (const variable of variables) {
    if (variable.resolvedType === 'COLOR') {
      const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
      if (collection) {
        const modeId = collection.defaultModeId;
        const value = variable.valuesByMode[modeId];
        
        if (typeof value === 'object' && 'r' in value) {
          colors[variable.name] = figmaColorToColorValue(value as RGBA);
        }
      }
    }
  }

  return colors;
}

async function extractNumbersFromVariables(): Promise<Record<string, number>> {
  const variables = await getLocalVariables();
  const numbers: Record<string, number> = {};

  for (const variable of variables) {
    if (variable.resolvedType === 'FLOAT') {
      const collection = figma.variables.getVariableCollectionById(variable.variableCollectionId);
      if (collection) {
        const modeId = collection.defaultModeId;
        const value = variable.valuesByMode[modeId];
        
        if (typeof value === 'number') {
          numbers[variable.name] = value;
        }
      }
    }
  }

  return numbers;
}

async function extractLocalStyles(): Promise<{
  colors: PaintStyle[];
  effects: EffectStyle[];
  texts: TextStyle[];
}> {
  return {
    colors: figma.getLocalPaintStyles(),
    effects: figma.getLocalEffectStyles(),
    texts: figma.getLocalTextStyles()
  };
}

// ============================================
// PROJECT SYNC - Read current project state
// ============================================

/** Collections managed by the plugin */
const MANAGED_COLLECTIONS = [
  'Primitives',
  'Tokens', 
  'Components',
  'Spacing',
  'Gap',
  'Icon Size',
  'Radius',
  'Typography',
];

/** Style prefixes managed by the plugin */
// Paint Styles are created from Components collection, so they have component-style names
const MANAGED_PAINT_PREFIXES = [
  'button/', 'input/', 'card/', 'badge/', 'alert/', 'navigation/',  // Component prefixes
  'bg/', 'text/', 'border/', 'action/', 'stroke/', 'fill/',         // Semantic prefixes  
  'color/', 'colors/',                                               // Legacy/general
];
const MANAGED_TEXT_PREFIXES = ['typography/'];

interface ProjectVariable {
  id: string;
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  value: any;
  description?: string;
}

interface ProjectCollection {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  variableCount: number;
  variables: ProjectVariable[];
  isManaged: boolean;
}

interface ProjectStyle {
  id: string;
  name: string;
  type: 'PAINT' | 'TEXT';
  description?: string;
  color?: { r: number; g: number; b: number; a: number };
  fontSize?: number;
  fontFamily?: string;
  isManaged: boolean;
}

interface ProjectSyncData {
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

/**
 * Resolve variable alias to final RGBA value
 */
async function resolveVariableAlias(value: VariableValue, resolvedType: string): Promise<VariableValue> {
  // If it's already a direct value, return it
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  
  // Check if it's a VariableAlias (has 'type' and 'id' properties)
  if ('type' in value && (value as any).type === 'VARIABLE_ALIAS' && 'id' in value) {
    const aliasId = (value as VariableAlias).id;
    try {
      const aliasedVar = await figma.variables.getVariableByIdAsync(aliasId);
      if (aliasedVar) {
        // Get value from the aliased variable's default mode
        const aliasedCollection = await figma.variables.getVariableCollectionByIdAsync(aliasedVar.variableCollectionId);
        if (aliasedCollection) {
          const aliasedValue = aliasedVar.valuesByMode[aliasedCollection.defaultModeId];
          // Recursively resolve if it's another alias
          return await resolveVariableAlias(aliasedValue, aliasedVar.resolvedType);
        }
      }
    } catch (e) {
      // If we can't resolve, return null
      return null as any;
    }
  }
  
  return value;
}

/**
 * Sync from project - get all collections, variables, and styles
 */
async function syncFromProject(): Promise<ProjectSyncData> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const paintStyles = await figma.getLocalPaintStylesAsync();
  const textStyles = await figma.getLocalTextStylesAsync();
  
  const managedCollections: ProjectCollection[] = [];
  const otherCollections: ProjectCollection[] = [];
  
  // Process collections
  for (const collection of collections) {
    const isManaged = MANAGED_COLLECTIONS.includes(collection.name);
    const variables: ProjectVariable[] = [];
    
    // Get variables for this collection
    for (const varId of collection.variableIds) {
      try {
        const variable = await figma.variables.getVariableByIdAsync(varId);
        if (variable) {
          // Get value from default mode
          const defaultModeId = collection.defaultModeId;
          const rawValue = variable.valuesByMode[defaultModeId];
          
          // Resolve aliases to final values
          let resolvedValue = await resolveVariableAlias(rawValue, variable.resolvedType);
          
          // Format COLOR values
          if (variable.resolvedType === 'COLOR' && typeof resolvedValue === 'object' && resolvedValue !== null) {
            if ('r' in resolvedValue) {
              resolvedValue = {
                r: (resolvedValue as RGBA).r,
                g: (resolvedValue as RGBA).g,
                b: (resolvedValue as RGBA).b,
                a: (resolvedValue as RGBA).a ?? 1,
              };
            }
          }
          
          variables.push({
            id: variable.id,
            name: variable.name,
            resolvedType: variable.resolvedType,
            value: resolvedValue,
            description: variable.description || undefined,
          });
        }
      } catch (e) {
        // Skip variables that can't be accessed
      }
    }
    
    const collectionData: ProjectCollection = {
      id: collection.id,
      name: collection.name,
      modes: collection.modes.map(m => ({ modeId: m.modeId, name: m.name })),
      variableCount: variables.length,
      variables,
      isManaged,
    };
    
    if (isManaged) {
      managedCollections.push(collectionData);
    } else {
      otherCollections.push(collectionData);
    }
  }
  
  // Process paint styles
  const managedPaintStyles: ProjectStyle[] = [];
  const otherPaintStyles: ProjectStyle[] = [];
  
  for (const style of paintStyles) {
    const isManaged = MANAGED_PAINT_PREFIXES.some(prefix => style.name.startsWith(prefix));
    
    let color: { r: number; g: number; b: number; a: number } | undefined;
    if (style.paints.length > 0 && style.paints[0].type === 'SOLID') {
      const paint = style.paints[0] as SolidPaint;
      color = {
        r: paint.color.r,
        g: paint.color.g,
        b: paint.color.b,
        a: paint.opacity ?? 1,
      };
    }
    
    const styleData: ProjectStyle = {
      id: style.id,
      name: style.name,
      type: 'PAINT',
      description: style.description || undefined,
      color,
      isManaged,
    };
    
    if (isManaged) {
      managedPaintStyles.push(styleData);
    } else {
      otherPaintStyles.push(styleData);
    }
  }
  
  // Process text styles
  const managedTextStyles: ProjectStyle[] = [];
  const otherTextStyles: ProjectStyle[] = [];
  
  for (const style of textStyles) {
    const isManaged = MANAGED_TEXT_PREFIXES.some(prefix => style.name.startsWith(prefix));
    
    const styleData: ProjectStyle = {
      id: style.id,
      name: style.name,
      type: 'TEXT',
      description: style.description || undefined,
      fontSize: style.fontSize as number,
      fontFamily: style.fontName.family,
      isManaged,
    };
    
    if (isManaged) {
      managedTextStyles.push(styleData);
    } else {
      otherTextStyles.push(styleData);
    }
  }
  
  // Calculate summary
  const managedVarsCount = managedCollections.reduce((sum, c) => sum + c.variableCount, 0);
  const totalVarsCount = managedVarsCount + otherCollections.reduce((sum, c) => sum + c.variableCount, 0);
  
  return {
    collections: {
      managed: managedCollections,
      other: otherCollections,
    },
    styles: {
      paint: {
        managed: managedPaintStyles,
        other: otherPaintStyles,
      },
      text: {
        managed: managedTextStyles,
        other: otherTextStyles,
      },
    },
    summary: {
      totalCollections: collections.length,
      totalVariables: totalVarsCount,
      totalPaintStyles: paintStyles.length,
      totalTextStyles: textStyles.length,
      managedCollections: managedCollections.length,
      managedVariables: managedVarsCount,
      managedPaintStyles: managedPaintStyles.length,
      managedTextStyles: managedTextStyles.length,
    },
    syncedAt: Date.now(),
  };
}

async function extractTokensFromFigma(): Promise<DesignTokens> {
  const colors = await extractColorsFromVariables();
  const numbers = await extractNumbersFromVariables();
  const styles = await extractLocalStyles();

  const primitives: PrimitiveTokens = {
    colors: {
      palette: {}
    },
    dimensions: {},
    fonts: {},
    shadows: {},
    gradients: {}
  };

  // Convert colors to primitive tokens
  for (const [name, color] of Object.entries(colors)) {
    primitives.colors.palette[name] = {
      $type: 'color',
      $value: color
    };
  }

  // Convert numbers to dimension tokens
  for (const [name, value] of Object.entries(numbers)) {
    primitives.dimensions[name] = {
      $type: 'dimension',
      $value: { value, unit: 'px' }
    };
  }

  // Extract text styles as font tokens
  for (const textStyle of styles.texts) {
    primitives.fonts[textStyle.name] = {
      $type: 'fontFamily',
      $value: textStyle.fontName.family
    };
  }

  // Extract effect styles as shadow tokens
  for (const effectStyle of styles.effects) {
    const dropShadows = effectStyle.effects.filter(e => e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW');
    if (dropShadows.length > 0) {
      const shadows = dropShadows.map(shadow => {
        if (shadow.type === 'DROP_SHADOW' || shadow.type === 'INNER_SHADOW') {
          return {
            offsetX: { value: shadow.offset.x, unit: 'px' as const },
            offsetY: { value: shadow.offset.y, unit: 'px' as const },
            blur: { value: shadow.radius, unit: 'px' as const },
            spread: { value: shadow.spread || 0, unit: 'px' as const },
            color: figmaColorToColorValue(shadow.color),
            type: shadow.type === 'DROP_SHADOW' ? 'dropShadow' as const : 'innerShadow' as const
          };
        }
        return null;
      }).filter(Boolean);

      if (shadows.length > 0) {
        primitives.shadows[effectStyle.name] = {
          $type: 'shadow',
          $value: shadows.length === 1 ? shadows[0]! : shadows as any
        };
      }
    }
  }

  return {
    $version: '1.0.0',
    $name: 'Design Tokens',
    primitives,
    semantic: {},
    composite: {}
  };
}

// ============================================
// EXPORT FRONTEND TOKENS FROM FIGMA VARIABLES
// Exports only semantic level (Components + semantic collections)
// ============================================

interface FrontendExportResult {
  $schema: string;
  $version: string;
  $description: string;
  $timestamp: string;
  colors?: Record<string, any>;
  typography?: Record<string, any>;
  spacing?: Record<string, any>;
  gap?: Record<string, any>;
  radius?: Record<string, any>;
  iconSize?: Record<string, any>;
  effects?: Record<string, any>;
  grid?: Record<string, any>;
}

// Helper: Deep resolve variable alias to final value
async function resolveVariableToFinalValue(
  variable: Variable,
  modeId: string,
  maxDepth: number = 10
): Promise<{ type: 'COLOR' | 'FLOAT' | 'STRING'; value: any } | null> {
  let currentValue = variable.valuesByMode[modeId];
  let currentType = variable.resolvedType;
  let depth = 0;
  
  while (depth < maxDepth) {
    // Check if it's a direct value
    if (currentType === 'COLOR') {
      if (typeof currentValue === 'object' && 'r' in currentValue) {
        return { type: 'COLOR', value: currentValue as RGBA };
      }
    } else if (currentType === 'FLOAT') {
      if (typeof currentValue === 'number') {
        return { type: 'FLOAT', value: currentValue };
      }
    } else if (currentType === 'STRING') {
      if (typeof currentValue === 'string') {
        return { type: 'STRING', value: currentValue };
      }
    }
    
    // Check if it's an alias
    if (typeof currentValue === 'object' && currentValue !== null && 'id' in currentValue) {
      const aliasVar = await figma.variables.getVariableByIdAsync((currentValue as VariableAlias).id);
      if (!aliasVar) return null;
      
      const aliasCollection = await figma.variables.getVariableCollectionByIdAsync(aliasVar.variableCollectionId);
      if (!aliasCollection) return null;
      
      // Use the same mode name if exists, otherwise default mode
      let targetModeId = aliasCollection.defaultModeId;
      
      // Try to find matching mode by name (e.g., "light" -> "light")
      const currentCollection = await figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
      if (currentCollection) {
        const currentMode = currentCollection.modes.find(m => m.modeId === modeId);
        if (currentMode) {
          const matchingMode = aliasCollection.modes.find(m => m.name === currentMode.name);
          if (matchingMode) {
            targetModeId = matchingMode.modeId;
          }
        }
      }
      
      currentValue = aliasVar.valuesByMode[targetModeId];
      currentType = aliasVar.resolvedType;
      depth++;
    } else {
      // Unknown value type
      return null;
    }
  }
  
  return null; // Max depth reached
}

async function exportFrontendTokensFromFigma(): Promise<FrontendExportResult> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const allVariables = await figma.variables.getLocalVariablesAsync();
  
  // Collections that represent the "final" semantic level
  const semanticCollections = [
    'Components',    // Colors - most specific level
    'Typography',    // Typography semantics
    'Spacing',       // Spacing semantics
    'Gap',           // Gap semantics
    'Icon Size',     // Icon size semantics
    'Radius',        // Radius semantics
    'Effects',       // Effects semantics
    'Grid',          // Grid semantics
  ];
  
  const result: FrontendExportResult = {
    $schema: 'frontend-tokens',
    $version: '1.0.0',
    $description: 'Frontend tokens - final semantic level from Figma Variables',
    $timestamp: new Date().toISOString(),
  };
  
  for (const collection of collections) {
    if (!semanticCollections.includes(collection.name)) {
      continue;
    }
    
    const collectionVars = allVariables.filter(v => v.variableCollectionId === collection.id);
    
    if (collectionVars.length === 0) continue;
    
    // Get default mode for values
    const defaultModeId = collection.defaultModeId;
    
    // Build nested structure for this collection
    const categoryData: Record<string, any> = {};
    
    for (const variable of collectionVars) {
      // Use deep resolve to get final value through alias chains
      const resolved = await resolveVariableToFinalValue(variable, defaultModeId);
      
      if (!resolved) continue;
      
      let resolvedValue: any;
      
      if (resolved.type === 'COLOR') {
        const rgba = resolved.value as RGBA;
        resolvedValue = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
      } else if (resolved.type === 'FLOAT') {
        resolvedValue = resolved.value;
      } else if (resolved.type === 'STRING') {
        resolvedValue = resolved.value;
      }
      
      if (resolvedValue === undefined) continue;
      
      // Parse variable name into nested path
      // e.g., "button/primary/primary-bg" -> { button: { primary: { primaryBg: "#..." } } }
      let parts = variable.name.split('/');
      
      // Remove redundant first segment if it matches collection category
      // e.g., "typography/page/hero" in Typography collection -> "page/hero"
      // e.g., "spacing/button/default" in Spacing collection -> "button/default"
      const categoryPrefixes: Record<string, string[]> = {
        'Typography': ['typography'],
        'Spacing': ['spacing'],
        'Gap': ['gap'],
        'Radius': ['radius'],
        'Icon Size': ['iconSize', 'icon-size', 'iconsize'],
        'Effects': ['effect', 'effects'],
        'Grid': ['grid', 'layout'],
      };
      
      const prefixesToRemove = categoryPrefixes[collection.name];
      if (prefixesToRemove && parts.length > 1) {
        const firstPart = parts[0].toLowerCase().replace(/-/g, '');
        if (prefixesToRemove.some(p => p.toLowerCase().replace(/-/g, '') === firstPart)) {
          parts = parts.slice(1);
        }
      }
      
      let current = categoryData;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = toCamelCase(parts[i]);
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      
      const lastPart = toCamelCase(parts[parts.length - 1]);
      current[lastPart] = resolvedValue;
    }
    
    // Map collection to result key
    if (Object.keys(categoryData).length > 0) {
      switch (collection.name) {
        case 'Components':
          result.colors = categoryData;
          break;
        case 'Typography':
          result.typography = categoryData;
          break;
        case 'Spacing':
          result.spacing = categoryData;
          break;
        case 'Gap':
          result.gap = categoryData;
          break;
        case 'Icon Size':
          result.iconSize = categoryData;
          break;
        case 'Radius':
          result.radius = categoryData;
          break;
        case 'Effects':
          result.effects = categoryData;
          break;
        case 'Grid':
          result.grid = categoryData;
          break;
      }
    }
  }
  
  return result;
}

// Helper: convert kebab-case or slash-separated to camelCase
function toCamelCase(str: string): string {
  return str.replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase());
}

// Helper: camelCase to kebab-case
function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
}

// Helper: Frontend tokens to CSS variables
function frontendTokensToCss(tokens: FrontendExportResult): string {
  const lines: string[] = [
    '/**',
    ' * Frontend Tokens - CSS Variables',
    ` * Generated: ${tokens.$timestamp}`,
    ' * Only semantic level tokens (Components + semantic collections)',
    ' */',
    '',
    ':root {'
  ];
  
  function flattenObject(obj: Record<string, any>, prefix: string = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const cssKey = prefix ? `${prefix}-${toKebabCase(key)}` : toKebabCase(key);
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, cssKey);
      } else {
        const cssValue = typeof value === 'number' ? `${value}px` : value;
        lines.push(`  --${cssKey}: ${cssValue};`);
      }
    }
  }
  
  // Process each category
  if (tokens.colors) flattenObject(tokens.colors, 'color');
  if (tokens.typography) flattenObject(tokens.typography, 'typography');
  if (tokens.spacing) flattenObject(tokens.spacing, 'spacing');
  if (tokens.gap) flattenObject(tokens.gap, 'gap');
  if (tokens.radius) flattenObject(tokens.radius, 'radius');
  if (tokens.iconSize) flattenObject(tokens.iconSize, 'icon-size');
  if (tokens.effects) flattenObject(tokens.effects, 'effect');
  if (tokens.grid) flattenObject(tokens.grid, 'grid');
  
  lines.push('}');
  return lines.join('\n');
}

// Helper: Frontend tokens to SCSS variables
function frontendTokensToScss(tokens: FrontendExportResult): string {
  const lines: string[] = [
    '// Frontend Tokens - SCSS Variables',
    `// Generated: ${tokens.$timestamp}`,
    '// Only semantic level tokens (Components + semantic collections)',
    ''
  ];
  
  function flattenObject(obj: Record<string, any>, prefix: string = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const scssKey = prefix ? `${prefix}-${toKebabCase(key)}` : toKebabCase(key);
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        flattenObject(value, scssKey);
      } else {
        const scssValue = typeof value === 'number' ? `${value}px` : value;
        lines.push(`$${scssKey}: ${scssValue};`);
      }
    }
  }
  
  // Process each category
  if (tokens.colors) {
    lines.push('// Colors');
    flattenObject(tokens.colors, 'color');
    lines.push('');
  }
  if (tokens.typography) {
    lines.push('// Typography');
    flattenObject(tokens.typography, 'typography');
    lines.push('');
  }
  if (tokens.spacing) {
    lines.push('// Spacing');
    flattenObject(tokens.spacing, 'spacing');
    lines.push('');
  }
  if (tokens.gap) {
    lines.push('// Gap');
    flattenObject(tokens.gap, 'gap');
    lines.push('');
  }
  if (tokens.radius) {
    lines.push('// Radius');
    flattenObject(tokens.radius, 'radius');
    lines.push('');
  }
  if (tokens.iconSize) {
    lines.push('// Icon Size');
    flattenObject(tokens.iconSize, 'icon-size');
    lines.push('');
  }
  if (tokens.effects) {
    lines.push('// Effects');
    flattenObject(tokens.effects, 'effect');
    lines.push('');
  }
  if (tokens.grid) {
    lines.push('// Grid');
    flattenObject(tokens.grid, 'grid');
    lines.push('');
  }
  
  return lines.join('\n');
}

// ============================================
// EXPORT TOKENS BY THEME (Flat structure for frontend)
// Exports Tokens collection with all modes (themes)
// ============================================

interface TokensByThemeResult {
  $schema: string;
  $version: string;
  $description: string;
  $timestamp: string;
  $modes: string[];
  [themeName: string]: Record<string, string | number> | string | string[];
}

async function exportTokensByTheme(): Promise<TokensByThemeResult> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const allVariables = await figma.variables.getLocalVariablesAsync();
  
  // Find the Tokens collection (semantic level with modes)
  const tokensCollection = collections.find(c => c.name === 'Tokens');
  
  if (!tokensCollection) {
    throw new Error('Коллекция "Tokens" не найдена. Сначала создайте семантические токены.');
  }
  
  const tokensVars = allVariables.filter(v => v.variableCollectionId === tokensCollection.id);
  
  if (tokensVars.length === 0) {
    throw new Error('В коллекции "Tokens" нет переменных.');
  }
  
  // Get all modes (themes)
  const modes = tokensCollection.modes;
  const modeNames = modes.map(m => m.name);
  
  const result: TokensByThemeResult = {
    $schema: 'tokens-by-theme',
    $version: '1.0.0',
    $description: 'Semantic tokens by theme - flat structure for frontend',
    $timestamp: new Date().toISOString(),
    $modes: modeNames,
  };
  
  // Initialize theme objects
  for (const mode of modes) {
    result[mode.name] = {};
  }
  
  // Process each variable for each mode
  for (const variable of tokensVars) {
    // Convert variable name to flat kebab-case key
    // e.g., "action/primary/primary" -> "action-primary"
    // e.g., "bg/surface/surface" -> "bg-surface"
    // e.g., "text/primary/primary" -> "text-primary"
    const tokenKey = variableNameToFlatKey(variable.name);
    
    for (const mode of modes) {
      const resolved = await resolveVariableToFinalValue(variable, mode.modeId);
      
      if (!resolved) continue;
      
      let value: string | number;
      
      if (resolved.type === 'COLOR') {
        const rgba = resolved.value as RGBA;
        value = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
      } else if (resolved.type === 'FLOAT') {
        value = resolved.value;
      } else if (resolved.type === 'STRING') {
        value = resolved.value;
      } else {
        continue;
      }
      
      (result[mode.name] as Record<string, string | number>)[tokenKey] = value;
    }
  }
  
  return result;
}

// Helper: Convert variable path to flat kebab-case key
// "action/primary/primary" -> "action-primary"
// "action/primary/primary-hover" -> "action-primary-hover"
// "bg/surface/surface" -> "bg-surface"
// "text/primary/primary" -> "text-primary"
// "stroke/default/default" -> "stroke-default"
function variableNameToFlatKey(name: string): string {
  const parts = name.split('/');
  
  // Remove duplicate parts (e.g., primary/primary -> primary)
  const uniqueParts: string[] = [];
  let prevPart = '';
  
  for (const part of parts) {
    // Normalize: remove hyphens and lowercase for comparison
    const normalizedPart = part.toLowerCase().replace(/-/g, '');
    const normalizedPrev = prevPart.toLowerCase().replace(/-/g, '');
    
    // Skip if same as previous (e.g., "primary" after "primary")
    if (normalizedPart === normalizedPrev) {
      continue;
    }
    
    // For state suffixes like "primary-hover", keep them
    if (part.includes('-') && normalizedPart.startsWith(normalizedPrev)) {
      // Replace previous with this more specific one
      uniqueParts[uniqueParts.length - 1] = part;
      prevPart = part;
      continue;
    }
    
    uniqueParts.push(part);
    prevPart = part;
  }
  
  return uniqueParts.join('-').toLowerCase();
}

// ============================================
// IMPORT TOKENS TO FIGMA
// ============================================

async function importTokensToFigma(tokens: DesignTokens): Promise<void> {
  // Create or get collections
  const collections = await getLocalVariableCollections();
  
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  let semanticCollection = collections.find(c => c.name === 'Semantic');
  let compositeCollection = collections.find(c => c.name === 'Composite');

  if (!primitivesCollection) {
    primitivesCollection = await createVariableCollection('Primitives');
  }
  if (!semanticCollection) {
    semanticCollection = await createVariableCollection('Semantic');
  }
  if (!compositeCollection) {
    compositeCollection = await createVariableCollection('Composite');
  }

  // Import primitive colors
  if (tokens.primitives.colors) {
    for (const [group, colors] of Object.entries(tokens.primitives.colors)) {
      for (const [name, token] of Object.entries(colors)) {
        const variableName = `${group}/${name}`;
        const existingVariables = await getLocalVariables();
        let variable = existingVariables.find(v => 
          v.name === variableName && 
          v.variableCollectionId === primitivesCollection!.id
        );

        if (!variable) {
          variable = await createVariable(variableName, primitivesCollection, 'COLOR');
        }

        const color = colorValueToFigmaColor(token.$value);
        variable.setValueForMode(primitivesCollection.defaultModeId, color);
        
        if (token.$description) {
          variable.description = token.$description;
        }
      }
    }
  }

  // Import primitive dimensions
  if (tokens.primitives.dimensions) {
    for (const [name, token] of Object.entries(tokens.primitives.dimensions)) {
      const existingVariables = await getLocalVariables();
      let variable = existingVariables.find(v => 
        v.name === name && 
        v.variableCollectionId === primitivesCollection!.id
      );

      if (!variable) {
        variable = await createVariable(name, primitivesCollection, 'FLOAT');
      }

      variable.setValueForMode(primitivesCollection.defaultModeId, token.$value.value);
      
      if (token.$description) {
        variable.description = token.$description;
      }
    }
  }

  figma.notify('✅ Tokens imported successfully!');
}

// ============================================
// EXPORT TOKENS FOR STORYBOOK
// ============================================

function generateStorybookTokens(tokens: DesignTokens): object {
  const storybookTokens: Record<string, unknown> = {
    colors: {},
    spacing: {},
    typography: {},
    shadows: {},
    borderRadius: {},
    animation: {}
  };

  // Convert primitive colors
  if (tokens.primitives.colors) {
    for (const [group, colors] of Object.entries(tokens.primitives.colors)) {
      (storybookTokens.colors as Record<string, unknown>)[group] = {};
      for (const [name, token] of Object.entries(colors)) {
        ((storybookTokens.colors as Record<string, unknown>)[group] as Record<string, string>)[name] = token.$value.hex;
      }
    }
  }

  // Convert dimensions to spacing
  if (tokens.primitives.dimensions) {
    for (const [name, token] of Object.entries(tokens.primitives.dimensions)) {
      (storybookTokens.spacing as Record<string, string>)[name] = 
        `${token.$value.value}${token.$value.unit}`;
    }
  }

  // Convert shadows
  if (tokens.primitives.shadows) {
    for (const [name, token] of Object.entries(tokens.primitives.shadows)) {
      const shadowValue = Array.isArray(token.$value) ? token.$value : [token.$value];
      (storybookTokens.shadows as Record<string, string>)[name] = shadowValue
        .map(s => `${s.offsetX.value}${s.offsetX.unit} ${s.offsetY.value}${s.offsetY.unit} ${s.blur.value}${s.blur.unit} ${s.spread.value}${s.spread.unit} ${s.color.hex}`)
        .join(', ');
    }
  }

  return storybookTokens;
}

function generateCSSVariables(tokens: DesignTokens): string {
  const lines: string[] = [':root {'];

  // Colors
  if (tokens.primitives.colors) {
    lines.push('  /* Colors */');
    for (const [group, colors] of Object.entries(tokens.primitives.colors)) {
      for (const [name, token] of Object.entries(colors)) {
        lines.push(`  --color-${group}-${name}: ${token.$value.hex};`);
      }
    }
  }

  // Dimensions
  if (tokens.primitives.dimensions) {
    lines.push('');
    lines.push('  /* Dimensions */');
    for (const [name, token] of Object.entries(tokens.primitives.dimensions)) {
      lines.push(`  --${name}: ${token.$value.value}${token.$value.unit};`);
    }
  }

  // Shadows
  if (tokens.primitives.shadows) {
    lines.push('');
    lines.push('  /* Shadows */');
    for (const [name, token] of Object.entries(tokens.primitives.shadows)) {
      const shadowValue = Array.isArray(token.$value) ? token.$value : [token.$value];
      const cssValue = shadowValue
        .map(s => `${s.offsetX.value}${s.offsetX.unit} ${s.offsetY.value}${s.offsetY.unit} ${s.blur.value}${s.blur.unit} ${s.spread.value}${s.spread.unit} ${s.color.hex}`)
        .join(', ');
      lines.push(`  --shadow-${name}: ${cssValue};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

// ============================================
// CREATE COLOR VARIABLES WITH STRUCTURE
// Primitives → Tokens → Components
// ============================================

// Semantic token categories mapping
// Unified scale: 25-975, where 500 = base color
// Lower values (25-475) = lighter shades (white overlay)
// Higher values (525-975) = darker shades (black overlay)
interface SemanticColorMapping {
  category: string;
  subcategory: string;
  variant?: string;
  states: string[];
  sourceColor: string;
  sourceStep: number; // 25-975, где 500 = base
  useBaseColor?: 'white' | 'black' | 'transparent-light' | 'transparent-dark'; // Direct reference to base color
}

// ============================================
// SEMANTIC TOKEN STRUCTURE (LIGHT THEME)
// Comprehensive SaaS/CRM categories
// ============================================
const SEMANTIC_COLOR_MAPPINGS: SemanticColorMapping[] = [
  // ============================================
  // BG (BACKGROUND) - All background colors
  // ============================================
  // Page backgrounds - primary uses base white for true white background
  { category: 'bg', subcategory: 'page', variant: 'primary', states: ['default'], sourceColor: 'neutral', sourceStep: 25, useBaseColor: 'white' },
  { category: 'bg', subcategory: 'page', variant: 'secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'bg', subcategory: 'page', variant: 'tertiary', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  // Container/Card backgrounds - primary uses base white
  { category: 'bg', subcategory: 'card', variant: 'primary', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 25, useBaseColor: 'white' },
  { category: 'bg', subcategory: 'card', variant: 'secondary', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'bg', subcategory: 'card', variant: 'elevated', states: ['default'], sourceColor: 'neutral', sourceStep: 25, useBaseColor: 'white' },
  // Interactive backgrounds
  { category: 'bg', subcategory: 'interactive', variant: 'primary', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'bg', subcategory: 'interactive', variant: 'secondary', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 100 },
  // Overlay/Modal backgrounds - overlays use transparent colors
  { category: 'bg', subcategory: 'overlay', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 900, useBaseColor: 'transparent-dark' },
  { category: 'bg', subcategory: 'overlay', variant: 'light', states: ['default'], sourceColor: 'neutral', sourceStep: 700, useBaseColor: 'transparent-light' },
  { category: 'bg', subcategory: 'modal', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 25, useBaseColor: 'white' },
  { category: 'bg', subcategory: 'drawer', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 25, useBaseColor: 'white' },
  { category: 'bg', subcategory: 'popover', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 25, useBaseColor: 'white' },
  { category: 'bg', subcategory: 'tooltip', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  // Semantic backgrounds
  { category: 'bg', subcategory: 'brand', variant: 'subtle', states: ['default', 'hover'], sourceColor: 'brand', sourceStep: 50 },
  { category: 'bg', subcategory: 'brand', variant: 'default', states: ['default', 'hover'], sourceColor: 'brand', sourceStep: 100 },
  { category: 'bg', subcategory: 'success', variant: 'subtle', states: ['default'], sourceColor: 'success', sourceStep: 50 },
  { category: 'bg', subcategory: 'success', variant: 'default', states: ['default'], sourceColor: 'success', sourceStep: 100 },
  { category: 'bg', subcategory: 'warning', variant: 'subtle', states: ['default'], sourceColor: 'warning', sourceStep: 50 },
  { category: 'bg', subcategory: 'warning', variant: 'default', states: ['default'], sourceColor: 'warning', sourceStep: 100 },
  { category: 'bg', subcategory: 'error', variant: 'subtle', states: ['default'], sourceColor: 'error', sourceStep: 50 },
  { category: 'bg', subcategory: 'error', variant: 'default', states: ['default'], sourceColor: 'error', sourceStep: 100 },
  { category: 'bg', subcategory: 'info', variant: 'subtle', states: ['default'], sourceColor: 'brand', sourceStep: 50 },
  { category: 'bg', subcategory: 'info', variant: 'default', states: ['default'], sourceColor: 'brand', sourceStep: 100 },
  // Inverse backgrounds
  { category: 'bg', subcategory: 'inverse', variant: 'primary', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'inverse', variant: 'secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  // Table backgrounds
  { category: 'bg', subcategory: 'table', variant: 'header', states: ['default'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'bg', subcategory: 'table', variant: 'row-odd', states: ['default', 'hover', 'selected'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'bg', subcategory: 'table', variant: 'row-even', states: ['default', 'hover', 'selected'], sourceColor: 'neutral', sourceStep: 50 },
  // Input/Form backgrounds
  { category: 'bg', subcategory: 'input', variant: 'default', states: ['default', 'hover', 'focus', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'bg', subcategory: 'input', variant: 'filled', states: ['default', 'hover', 'focus', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 50 },
  // Sidebar/Navigation backgrounds
  { category: 'bg', subcategory: 'sidebar', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'bg', subcategory: 'sidebar', variant: 'dark', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'header', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'bg', subcategory: 'header', variant: 'dark', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'nav', variant: 'item', states: ['default', 'hover', 'active', 'selected'], sourceColor: 'neutral', sourceStep: 25 },
  // Skeleton/Loading backgrounds
  { category: 'bg', subcategory: 'skeleton', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'bg', subcategory: 'skeleton', variant: 'shimmer', states: ['default'], sourceColor: 'neutral', sourceStep: 200 },
  
  // ============================================
  // TEXT - All text colors
  // ============================================
  // Primary text hierarchy - primary uses base black for true dark text
  { category: 'text', subcategory: 'primary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 900, useBaseColor: 'black' },
  { category: 'text', subcategory: 'secondary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'text', subcategory: 'tertiary', states: ['default', 'disabled'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'text', subcategory: 'placeholder', states: ['default'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'text', subcategory: 'disabled', states: ['default'], sourceColor: 'neutral', sourceStep: 300 },
  // Semantic text
  { category: 'text', subcategory: 'brand', states: ['default', 'hover'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'text', subcategory: 'success', states: ['default'], sourceColor: 'success', sourceStep: 600 },
  { category: 'text', subcategory: 'warning', states: ['default'], sourceColor: 'warning', sourceStep: 600 },
  { category: 'text', subcategory: 'error', states: ['default'], sourceColor: 'error', sourceStep: 600 },
  { category: 'text', subcategory: 'info', states: ['default'], sourceColor: 'brand', sourceStep: 600 },
  // Link text
  { category: 'text', subcategory: 'link', variant: 'default', states: ['default', 'hover', 'active', 'visited', 'disabled'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'text', subcategory: 'link', variant: 'subtle', states: ['default', 'hover', 'active', 'visited', 'disabled'], sourceColor: 'neutral', sourceStep: 600 },
  // Inverse text - uses base white for light text on dark bg
  { category: 'text', subcategory: 'inverse', variant: 'primary', states: ['default'], sourceColor: 'neutral', sourceStep: 25, useBaseColor: 'white' },
  { category: 'text', subcategory: 'inverse', variant: 'secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 200 },
  // On-color text (for colored backgrounds) - uses base white
  { category: 'text', subcategory: 'on-brand', states: ['default'], sourceColor: 'neutral', sourceStep: 25, useBaseColor: 'white' },
  { category: 'text', subcategory: 'on-success', states: ['default'], sourceColor: 'neutral', sourceStep: 25, useBaseColor: 'white' },
  { category: 'text', subcategory: 'on-warning', states: ['default'], sourceColor: 'neutral', sourceStep: 900, useBaseColor: 'black' },
  { category: 'text', subcategory: 'on-error', states: ['default'], sourceColor: 'neutral', sourceStep: 25, useBaseColor: 'white' },
  { category: 'text', subcategory: 'on-info', states: ['default'], sourceColor: 'neutral', sourceStep: 25, useBaseColor: 'white' },
  // Label text
  { category: 'text', subcategory: 'label', variant: 'default', states: ['default', 'disabled'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'text', subcategory: 'label', variant: 'required', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  // Caption/Helper text
  { category: 'text', subcategory: 'caption', states: ['default'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'text', subcategory: 'helper', states: ['default', 'error'], sourceColor: 'neutral', sourceStep: 500 },
  
  // ============================================
  // BORDER - All border/stroke colors
  // ============================================
  // Base borders
  { category: 'border', subcategory: 'default', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'border', subcategory: 'subtle', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'border', subcategory: 'strong', states: ['default'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'border', subcategory: 'disabled', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  // Semantic borders
  { category: 'border', subcategory: 'brand', states: ['default', 'hover'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'border', subcategory: 'success', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'border', subcategory: 'warning', states: ['default'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'border', subcategory: 'error', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'border', subcategory: 'info', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  // Focus borders
  { category: 'border', subcategory: 'focus', variant: 'default', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'border', subcategory: 'focus', variant: 'error', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  // Input borders
  { category: 'border', subcategory: 'input', states: ['default', 'hover', 'focus', 'error', 'disabled'], sourceColor: 'neutral', sourceStep: 300 },
  // Card borders
  { category: 'border', subcategory: 'card', states: ['default', 'hover', 'selected'], sourceColor: 'neutral', sourceStep: 200 },
  // Table borders
  { category: 'border', subcategory: 'table', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'border', subcategory: 'table', variant: 'header', states: ['default'], sourceColor: 'neutral', sourceStep: 300 },
  // Inverse borders
  { category: 'border', subcategory: 'inverse', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  
  // ============================================
  // ICON - All icon colors
  // ============================================
  // Base icons
  { category: 'icon', subcategory: 'primary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'icon', subcategory: 'secondary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'icon', subcategory: 'tertiary', states: ['default', 'disabled'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'icon', subcategory: 'disabled', states: ['default'], sourceColor: 'neutral', sourceStep: 300 },
  // Semantic icons
  { category: 'icon', subcategory: 'brand', states: ['default', 'hover'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'icon', subcategory: 'success', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'icon', subcategory: 'warning', states: ['default'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'icon', subcategory: 'error', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'icon', subcategory: 'info', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  // Inverse icons
  { category: 'icon', subcategory: 'inverse', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  // On-color icons
  { category: 'icon', subcategory: 'on-brand', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'icon', subcategory: 'on-success', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'icon', subcategory: 'on-warning', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'icon', subcategory: 'on-error', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  
  // ============================================
  // DIVIDER - Separator lines
  // ============================================
  { category: 'divider', subcategory: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'divider', subcategory: 'subtle', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'divider', subcategory: 'strong', states: ['default'], sourceColor: 'neutral', sourceStep: 300 },
  { category: 'divider', subcategory: 'inverse', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  
  // ============================================
  // ACTION - Interactive elements (buttons, links)
  // ============================================
  { category: 'action', subcategory: 'primary', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'action', subcategory: 'secondary', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'action', subcategory: 'tertiary', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'action', subcategory: 'ghost', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'action', subcategory: 'danger', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'error', sourceStep: 500 },
  { category: 'action', subcategory: 'success', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'success', sourceStep: 500 },
  { category: 'action', subcategory: 'warning', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'warning', sourceStep: 500 },
  
  // ============================================
  // SURFACE - Container backgrounds (legacy support)
  // ============================================
  { category: 'surface', subcategory: 'page', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'surface', subcategory: 'card', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'surface', subcategory: 'elevated', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'surface', subcategory: 'overlay', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'surface', subcategory: 'inverse', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  
  // ============================================
  // CONTENT - Text/icons (legacy support)
  // ============================================
  { category: 'content', subcategory: 'primary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'content', subcategory: 'secondary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'content', subcategory: 'tertiary', states: ['default', 'disabled'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'content', subcategory: 'disabled', states: ['default'], sourceColor: 'neutral', sourceStep: 300 },
  { category: 'content', subcategory: 'inverse', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'content', subcategory: 'brand', states: ['default', 'hover'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'content', subcategory: 'on-action-primary', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'content', subcategory: 'on-action-secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  
  // ============================================
  // STROKE - Borders (legacy support)
  // ============================================
  { category: 'stroke', subcategory: 'default', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'stroke', subcategory: 'subtle', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'stroke', subcategory: 'strong', states: ['default'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'stroke', subcategory: 'focus', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'stroke', subcategory: 'error', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'stroke', subcategory: 'disabled', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  
  // ============================================
  // FEEDBACK - Status indicators
  // ============================================
  { category: 'feedback', subcategory: 'success-surface', states: ['default'], sourceColor: 'success', sourceStep: 50 },
  { category: 'feedback', subcategory: 'success-content', states: ['default'], sourceColor: 'success', sourceStep: 700 },
  { category: 'feedback', subcategory: 'success-stroke', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'feedback', subcategory: 'warning-surface', states: ['default'], sourceColor: 'warning', sourceStep: 50 },
  { category: 'feedback', subcategory: 'warning-content', states: ['default'], sourceColor: 'warning', sourceStep: 700 },
  { category: 'feedback', subcategory: 'warning-stroke', states: ['default'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'feedback', subcategory: 'error-surface', states: ['default'], sourceColor: 'error', sourceStep: 50 },
  { category: 'feedback', subcategory: 'error-content', states: ['default'], sourceColor: 'error', sourceStep: 700 },
  { category: 'feedback', subcategory: 'error-stroke', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'feedback', subcategory: 'info-surface', states: ['default'], sourceColor: 'brand', sourceStep: 50 },
  { category: 'feedback', subcategory: 'info-content', states: ['default'], sourceColor: 'brand', sourceStep: 700 },
  { category: 'feedback', subcategory: 'info-stroke', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  
  // ============================================
  // FOCUS - Focus ring colors
  // ============================================
  { category: 'focus', subcategory: 'ring', variant: 'default', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'focus', subcategory: 'ring', variant: 'error', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'focus', subcategory: 'ring', variant: 'success', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'focus', subcategory: 'outline', variant: 'default', states: ['default'], sourceColor: 'brand', sourceStep: 300 },
  
  // ============================================
  // STATUS - Status indicator colors
  // ============================================
  { category: 'status', subcategory: 'online', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'status', subcategory: 'offline', states: ['default'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'status', subcategory: 'away', states: ['default'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'status', subcategory: 'busy', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'status', subcategory: 'active', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'status', subcategory: 'inactive', states: ['default'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'status', subcategory: 'pending', states: ['default'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'status', subcategory: 'completed', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'status', subcategory: 'failed', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'status', subcategory: 'draft', states: ['default'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'status', subcategory: 'published', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'status', subcategory: 'archived', states: ['default'], sourceColor: 'neutral', sourceStep: 500 },
  
  // ============================================
  // BADGE - Badge/Tag colors
  // ============================================
  { category: 'badge', subcategory: 'neutral', variant: 'surface', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'badge', subcategory: 'neutral', variant: 'content', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'badge', subcategory: 'brand', variant: 'surface', states: ['default'], sourceColor: 'brand', sourceStep: 100 },
  { category: 'badge', subcategory: 'brand', variant: 'content', states: ['default'], sourceColor: 'brand', sourceStep: 700 },
  { category: 'badge', subcategory: 'success', variant: 'surface', states: ['default'], sourceColor: 'success', sourceStep: 100 },
  { category: 'badge', subcategory: 'success', variant: 'content', states: ['default'], sourceColor: 'success', sourceStep: 700 },
  { category: 'badge', subcategory: 'warning', variant: 'surface', states: ['default'], sourceColor: 'warning', sourceStep: 100 },
  { category: 'badge', subcategory: 'warning', variant: 'content', states: ['default'], sourceColor: 'warning', sourceStep: 700 },
  { category: 'badge', subcategory: 'error', variant: 'surface', states: ['default'], sourceColor: 'error', sourceStep: 100 },
  { category: 'badge', subcategory: 'error', variant: 'content', states: ['default'], sourceColor: 'error', sourceStep: 700 },
  { category: 'badge', subcategory: 'info', variant: 'surface', states: ['default'], sourceColor: 'brand', sourceStep: 100 },
  { category: 'badge', subcategory: 'info', variant: 'content', states: ['default'], sourceColor: 'brand', sourceStep: 700 },
  
  // ============================================
  // DATA-VIZ - Data visualization colors
  // ============================================
  { category: 'data-viz', subcategory: 'categorical', variant: '1', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'data-viz', subcategory: 'categorical', variant: '2', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'data-viz', subcategory: 'categorical', variant: '3', states: ['default'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'data-viz', subcategory: 'categorical', variant: '4', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'data-viz', subcategory: 'categorical', variant: '5', states: ['default'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'data-viz', subcategory: 'sequential', variant: 'start', states: ['default'], sourceColor: 'brand', sourceStep: 100 },
  { category: 'data-viz', subcategory: 'sequential', variant: 'end', states: ['default'], sourceColor: 'brand', sourceStep: 700 },
  { category: 'data-viz', subcategory: 'positive', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'data-viz', subcategory: 'negative', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'data-viz', subcategory: 'neutral', states: ['default'], sourceColor: 'neutral', sourceStep: 500 },
  
  // ============================================
  // NAV (NAVIGATION) - Navigation specific colors
  // ============================================
  { category: 'nav', subcategory: 'item', variant: 'bg', states: ['default', 'hover', 'active', 'selected'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'nav', subcategory: 'item', variant: 'text', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'nav', subcategory: 'item', variant: 'icon', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'nav', subcategory: 'indicator', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'nav', subcategory: 'breadcrumb', variant: 'text', states: ['default', 'hover', 'current'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'nav', subcategory: 'breadcrumb', variant: 'separator', states: ['default'], sourceColor: 'neutral', sourceStep: 300 },
  { category: 'nav', subcategory: 'tab', variant: 'bg', states: ['default', 'hover', 'active', 'selected'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'nav', subcategory: 'tab', variant: 'text', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'nav', subcategory: 'tab', variant: 'indicator', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  
  // ============================================
  // FORM - Form-specific colors
  // ============================================
  { category: 'form', subcategory: 'label', states: ['default', 'disabled'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'form', subcategory: 'required', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'form', subcategory: 'helper', states: ['default', 'error'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'form', subcategory: 'counter', states: ['default', 'error'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'form', subcategory: 'input-bg', states: ['default', 'hover', 'focus', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'form', subcategory: 'input-border', states: ['default', 'hover', 'focus', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 300 },
  { category: 'form', subcategory: 'input-text', states: ['default', 'placeholder', 'disabled'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'form', subcategory: 'checkbox-bg', states: ['default', 'hover', 'checked', 'disabled'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'form', subcategory: 'checkbox-border', states: ['default', 'hover', 'checked', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 300 },
  { category: 'form', subcategory: 'checkbox-check', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'form', subcategory: 'radio-bg', states: ['default', 'hover', 'checked', 'disabled'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'form', subcategory: 'radio-border', states: ['default', 'hover', 'checked', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 300 },
  { category: 'form', subcategory: 'radio-dot', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'form', subcategory: 'switch-bg', states: ['off', 'on', 'disabled'], sourceColor: 'neutral', sourceStep: 300 },
  { category: 'form', subcategory: 'switch-thumb', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'form', subcategory: 'select-bg', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'form', subcategory: 'select-border', states: ['default', 'hover', 'focus', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 300 },
  
  // ============================================
  // AVATAR - Avatar colors
  // ============================================
  { category: 'avatar', subcategory: 'bg', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'avatar', subcategory: 'bg', variant: 'brand', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'avatar', subcategory: 'text', states: ['default'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'avatar', subcategory: 'border', states: ['default'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'avatar', subcategory: 'presence', variant: 'online', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'avatar', subcategory: 'presence', variant: 'offline', states: ['default'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'avatar', subcategory: 'presence', variant: 'away', states: ['default'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'avatar', subcategory: 'presence', variant: 'busy', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  
  // ============================================
  // PROGRESS - Progress indicators
  // ============================================
  { category: 'progress', subcategory: 'track', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'progress', subcategory: 'fill', variant: 'default', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'progress', subcategory: 'fill', variant: 'success', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'progress', subcategory: 'fill', variant: 'warning', states: ['default'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'progress', subcategory: 'fill', variant: 'error', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  
  // ============================================
  // SCROLLBAR - Scrollbar colors
  // ============================================
  { category: 'scrollbar', subcategory: 'track', states: ['default'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'scrollbar', subcategory: 'thumb', states: ['default', 'hover', 'active'], sourceColor: 'neutral', sourceStep: 300 },
  
  // ============================================
  // SELECTION - Selection/highlight colors
  // ============================================
  { category: 'selection', subcategory: 'bg', states: ['default'], sourceColor: 'brand', sourceStep: 100 },
  { category: 'selection', subcategory: 'text', states: ['default'], sourceColor: 'brand', sourceStep: 900 },
  { category: 'selection', subcategory: 'highlight', states: ['default'], sourceColor: 'warning', sourceStep: 200 },
  
  // ============================================
  // OVERLAY - Overlay and scrim colors (opacity-based)
  // For modal backdrops, loading states, selections
  // ============================================
  // Scrim (dark overlay for modals)
  { category: 'overlay', subcategory: 'scrim', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'overlay', subcategory: 'scrim', variant: 'light', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'overlay', subcategory: 'scrim', variant: 'heavy', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  // Backdrop (blur-ready backgrounds)
  { category: 'overlay', subcategory: 'backdrop', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'overlay', subcategory: 'backdrop', variant: 'light', states: ['default'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'overlay', subcategory: 'backdrop', variant: 'blur', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  // Tint overlays (colored)
  { category: 'overlay', subcategory: 'tint', variant: 'brand', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'overlay', subcategory: 'tint', variant: 'success', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'overlay', subcategory: 'tint', variant: 'warning', states: ['default'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'overlay', subcategory: 'tint', variant: 'error', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'overlay', subcategory: 'tint', variant: 'info', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  // Gradient overlays
  { category: 'overlay', subcategory: 'gradient', variant: 'top', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'overlay', subcategory: 'gradient', variant: 'bottom', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'overlay', subcategory: 'gradient', variant: 'left', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'overlay', subcategory: 'gradient', variant: 'right', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  // Skeleton loading
  { category: 'overlay', subcategory: 'skeleton', variant: 'base', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'overlay', subcategory: 'skeleton', variant: 'shimmer', states: ['default'], sourceColor: 'neutral', sourceStep: 200 },
  // Selection overlay
  { category: 'overlay', subcategory: 'selection', variant: 'default', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'overlay', subcategory: 'selection', variant: 'subtle', states: ['default'], sourceColor: 'brand', sourceStep: 100 },
  // Drag & Drop overlays
  { category: 'overlay', subcategory: 'drop-zone', variant: 'default', states: ['default', 'active', 'valid', 'invalid'], sourceColor: 'brand', sourceStep: 100 },
  { category: 'overlay', subcategory: 'drag-preview', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 50 },
  // Image/media overlays
  { category: 'overlay', subcategory: 'image', variant: 'darken', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'overlay', subcategory: 'image', variant: 'lighten', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  // Disabled overlay
  { category: 'overlay', subcategory: 'disabled', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
];

// ============================================
// SEMANTIC TOKEN STRUCTURE (DARK THEME)
// Comprehensive SaaS/CRM categories
// ============================================
const SEMANTIC_COLOR_MAPPINGS_DARK: SemanticColorMapping[] = [
  // ============================================
  // BG (BACKGROUND) - All background colors (dark theme)
  // ============================================
  // Page backgrounds - use base black for dark theme
  { category: 'bg', subcategory: 'page', variant: 'primary', states: ['default'], sourceColor: 'neutral', sourceStep: 950, useBaseColor: 'black' },
  { category: 'bg', subcategory: 'page', variant: 'secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'page', variant: 'tertiary', states: ['default'], sourceColor: 'neutral', sourceStep: 850 },
  // Container/Card backgrounds
  { category: 'bg', subcategory: 'card', variant: 'primary', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'card', variant: 'secondary', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 850 },
  { category: 'bg', subcategory: 'card', variant: 'elevated', states: ['default'], sourceColor: 'neutral', sourceStep: 850 },
  // Interactive backgrounds
  { category: 'bg', subcategory: 'interactive', variant: 'primary', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 850 },
  { category: 'bg', subcategory: 'interactive', variant: 'secondary', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 800 },
  // Overlay/Modal backgrounds - overlays use transparent colors
  { category: 'bg', subcategory: 'overlay', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 950, useBaseColor: 'transparent-dark' },
  { category: 'bg', subcategory: 'overlay', variant: 'light', states: ['default'], sourceColor: 'neutral', sourceStep: 900, useBaseColor: 'transparent-light' },
  { category: 'bg', subcategory: 'modal', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'drawer', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'popover', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 850 },
  { category: 'bg', subcategory: 'tooltip', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  // Semantic backgrounds
  { category: 'bg', subcategory: 'brand', variant: 'subtle', states: ['default', 'hover'], sourceColor: 'brand', sourceStep: 900 },
  { category: 'bg', subcategory: 'brand', variant: 'default', states: ['default', 'hover'], sourceColor: 'brand', sourceStep: 800 },
  { category: 'bg', subcategory: 'success', variant: 'subtle', states: ['default'], sourceColor: 'success', sourceStep: 900 },
  { category: 'bg', subcategory: 'success', variant: 'default', states: ['default'], sourceColor: 'success', sourceStep: 800 },
  { category: 'bg', subcategory: 'warning', variant: 'subtle', states: ['default'], sourceColor: 'warning', sourceStep: 900 },
  { category: 'bg', subcategory: 'warning', variant: 'default', states: ['default'], sourceColor: 'warning', sourceStep: 800 },
  { category: 'bg', subcategory: 'error', variant: 'subtle', states: ['default'], sourceColor: 'error', sourceStep: 900 },
  { category: 'bg', subcategory: 'error', variant: 'default', states: ['default'], sourceColor: 'error', sourceStep: 800 },
  { category: 'bg', subcategory: 'info', variant: 'subtle', states: ['default'], sourceColor: 'brand', sourceStep: 900 },
  { category: 'bg', subcategory: 'info', variant: 'default', states: ['default'], sourceColor: 'brand', sourceStep: 800 },
  // Inverse backgrounds
  { category: 'bg', subcategory: 'inverse', variant: 'primary', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'bg', subcategory: 'inverse', variant: 'secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 200 },
  // Table backgrounds
  { category: 'bg', subcategory: 'table', variant: 'header', states: ['default'], sourceColor: 'neutral', sourceStep: 850 },
  { category: 'bg', subcategory: 'table', variant: 'row-odd', states: ['default', 'hover', 'selected'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'table', variant: 'row-even', states: ['default', 'hover', 'selected'], sourceColor: 'neutral', sourceStep: 850 },
  // Input/Form backgrounds
  { category: 'bg', subcategory: 'input', variant: 'default', states: ['default', 'hover', 'focus', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'input', variant: 'filled', states: ['default', 'hover', 'focus', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 850 },
  // Sidebar/Navigation backgrounds
  { category: 'bg', subcategory: 'sidebar', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  { category: 'bg', subcategory: 'sidebar', variant: 'dark', states: ['default'], sourceColor: 'neutral', sourceStep: 975 },
  { category: 'bg', subcategory: 'header', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'header', variant: 'dark', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  { category: 'bg', subcategory: 'nav', variant: 'item', states: ['default', 'hover', 'active', 'selected'], sourceColor: 'neutral', sourceStep: 900 },
  // Skeleton/Loading backgrounds
  { category: 'bg', subcategory: 'skeleton', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'bg', subcategory: 'skeleton', variant: 'shimmer', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  
  // ============================================
  // TEXT - All text colors (dark theme)
  // ============================================
  // Primary text hierarchy - primary uses base white for dark theme
  { category: 'text', subcategory: 'primary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 50, useBaseColor: 'white' },
  { category: 'text', subcategory: 'secondary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 300 },
  { category: 'text', subcategory: 'tertiary', states: ['default', 'disabled'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'text', subcategory: 'placeholder', states: ['default'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'text', subcategory: 'disabled', states: ['default'], sourceColor: 'neutral', sourceStep: 600 },
  // Semantic text
  { category: 'text', subcategory: 'brand', states: ['default', 'hover'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'text', subcategory: 'success', states: ['default'], sourceColor: 'success', sourceStep: 400 },
  { category: 'text', subcategory: 'warning', states: ['default'], sourceColor: 'warning', sourceStep: 400 },
  { category: 'text', subcategory: 'error', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  { category: 'text', subcategory: 'info', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  // Link text
  { category: 'text', subcategory: 'link', variant: 'default', states: ['default', 'hover', 'active', 'visited', 'disabled'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'text', subcategory: 'link', variant: 'subtle', states: ['default', 'hover', 'active', 'visited', 'disabled'], sourceColor: 'neutral', sourceStep: 300 },
  // Inverse text - uses base black for inverse text in dark theme
  { category: 'text', subcategory: 'inverse', variant: 'primary', states: ['default'], sourceColor: 'neutral', sourceStep: 900, useBaseColor: 'black' },
  { category: 'text', subcategory: 'inverse', variant: 'secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  // On-color text
  { category: 'text', subcategory: 'on-brand', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'text', subcategory: 'on-success', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'text', subcategory: 'on-warning', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'text', subcategory: 'on-error', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'text', subcategory: 'on-info', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  // Label text
  { category: 'text', subcategory: 'label', variant: 'default', states: ['default', 'disabled'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'text', subcategory: 'label', variant: 'required', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  // Caption/Helper text
  { category: 'text', subcategory: 'caption', states: ['default'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'text', subcategory: 'helper', states: ['default', 'error'], sourceColor: 'neutral', sourceStep: 400 },
  
  // ============================================
  // BORDER - All border/stroke colors (dark theme)
  // ============================================
  // Base borders
  { category: 'border', subcategory: 'default', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'border', subcategory: 'subtle', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'border', subcategory: 'strong', states: ['default'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'border', subcategory: 'disabled', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  // Semantic borders
  { category: 'border', subcategory: 'brand', states: ['default', 'hover'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'border', subcategory: 'success', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'border', subcategory: 'warning', states: ['default'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'border', subcategory: 'error', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'border', subcategory: 'info', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  // Focus borders
  { category: 'border', subcategory: 'focus', variant: 'default', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'border', subcategory: 'focus', variant: 'error', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  // Input borders
  { category: 'border', subcategory: 'input', states: ['default', 'hover', 'focus', 'error', 'disabled'], sourceColor: 'neutral', sourceStep: 600 },
  // Card borders
  { category: 'border', subcategory: 'card', states: ['default', 'hover', 'selected'], sourceColor: 'neutral', sourceStep: 700 },
  // Table borders
  { category: 'border', subcategory: 'table', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'border', subcategory: 'table', variant: 'header', states: ['default'], sourceColor: 'neutral', sourceStep: 600 },
  // Inverse borders
  { category: 'border', subcategory: 'inverse', states: ['default'], sourceColor: 'neutral', sourceStep: 300 },
  
  // ============================================
  // ICON - All icon colors (dark theme)
  // ============================================
  { category: 'icon', subcategory: 'primary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'icon', subcategory: 'secondary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'icon', subcategory: 'tertiary', states: ['default', 'disabled'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'icon', subcategory: 'disabled', states: ['default'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'icon', subcategory: 'brand', states: ['default', 'hover'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'icon', subcategory: 'success', states: ['default'], sourceColor: 'success', sourceStep: 400 },
  { category: 'icon', subcategory: 'warning', states: ['default'], sourceColor: 'warning', sourceStep: 400 },
  { category: 'icon', subcategory: 'error', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  { category: 'icon', subcategory: 'info', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'icon', subcategory: 'inverse', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'icon', subcategory: 'on-brand', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'icon', subcategory: 'on-success', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'icon', subcategory: 'on-warning', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'icon', subcategory: 'on-error', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  
  // ============================================
  // DIVIDER - Separator lines (dark theme)
  // ============================================
  { category: 'divider', subcategory: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'divider', subcategory: 'subtle', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'divider', subcategory: 'strong', states: ['default'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'divider', subcategory: 'inverse', states: ['default'], sourceColor: 'neutral', sourceStep: 300 },
  
  // ============================================
  // ACTION - Interactive elements (dark theme)
  // ============================================
  { category: 'action', subcategory: 'primary', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'action', subcategory: 'secondary', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'action', subcategory: 'tertiary', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'action', subcategory: 'ghost', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'action', subcategory: 'danger', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'error', sourceStep: 500 },
  { category: 'action', subcategory: 'success', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'success', sourceStep: 500 },
  { category: 'action', subcategory: 'warning', states: ['default', 'hover', 'active', 'focus', 'disabled'], sourceColor: 'warning', sourceStep: 500 },
  
  // ============================================
  // SURFACE - Container backgrounds (dark theme, legacy support)
  // ============================================
  { category: 'surface', subcategory: 'page', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  { category: 'surface', subcategory: 'card', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'surface', subcategory: 'elevated', states: ['default'], sourceColor: 'neutral', sourceStep: 850 },
  { category: 'surface', subcategory: 'overlay', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'surface', subcategory: 'inverse', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  
  // ============================================
  // CONTENT - Text/icons (dark theme, legacy support)
  // ============================================
  { category: 'content', subcategory: 'primary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'content', subcategory: 'secondary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 300 },
  { category: 'content', subcategory: 'tertiary', states: ['default', 'disabled'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'content', subcategory: 'disabled', states: ['default'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'content', subcategory: 'inverse', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'content', subcategory: 'brand', states: ['default', 'hover'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'content', subcategory: 'on-action-primary', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'content', subcategory: 'on-action-secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 50 },
  
  // ============================================
  // STROKE - Borders (dark theme, legacy support)
  // ============================================
  { category: 'stroke', subcategory: 'default', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'stroke', subcategory: 'subtle', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'stroke', subcategory: 'strong', states: ['default'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'stroke', subcategory: 'focus', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'stroke', subcategory: 'error', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'stroke', subcategory: 'disabled', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  
  // ============================================
  // FEEDBACK - Status indicators (dark theme)
  // ============================================
  { category: 'feedback', subcategory: 'success-surface', states: ['default'], sourceColor: 'success', sourceStep: 900 },
  { category: 'feedback', subcategory: 'success-content', states: ['default'], sourceColor: 'success', sourceStep: 300 },
  { category: 'feedback', subcategory: 'success-stroke', states: ['default'], sourceColor: 'success', sourceStep: 500 },
  { category: 'feedback', subcategory: 'warning-surface', states: ['default'], sourceColor: 'warning', sourceStep: 900 },
  { category: 'feedback', subcategory: 'warning-content', states: ['default'], sourceColor: 'warning', sourceStep: 300 },
  { category: 'feedback', subcategory: 'warning-stroke', states: ['default'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'feedback', subcategory: 'error-surface', states: ['default'], sourceColor: 'error', sourceStep: 900 },
  { category: 'feedback', subcategory: 'error-content', states: ['default'], sourceColor: 'error', sourceStep: 300 },
  { category: 'feedback', subcategory: 'error-stroke', states: ['default'], sourceColor: 'error', sourceStep: 500 },
  { category: 'feedback', subcategory: 'info-surface', states: ['default'], sourceColor: 'brand', sourceStep: 900 },
  { category: 'feedback', subcategory: 'info-content', states: ['default'], sourceColor: 'brand', sourceStep: 300 },
  { category: 'feedback', subcategory: 'info-stroke', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  
  // ============================================
  // FOCUS - Focus ring colors (dark theme)
  // ============================================
  { category: 'focus', subcategory: 'ring', variant: 'default', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'focus', subcategory: 'ring', variant: 'error', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  { category: 'focus', subcategory: 'ring', variant: 'success', states: ['default'], sourceColor: 'success', sourceStep: 400 },
  { category: 'focus', subcategory: 'outline', variant: 'default', states: ['default'], sourceColor: 'brand', sourceStep: 600 },
  
  // ============================================
  // STATUS - Status indicator colors (dark theme)
  // ============================================
  { category: 'status', subcategory: 'online', states: ['default'], sourceColor: 'success', sourceStep: 400 },
  { category: 'status', subcategory: 'offline', states: ['default'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'status', subcategory: 'away', states: ['default'], sourceColor: 'warning', sourceStep: 400 },
  { category: 'status', subcategory: 'busy', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  { category: 'status', subcategory: 'active', states: ['default'], sourceColor: 'success', sourceStep: 400 },
  { category: 'status', subcategory: 'inactive', states: ['default'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'status', subcategory: 'pending', states: ['default'], sourceColor: 'warning', sourceStep: 400 },
  { category: 'status', subcategory: 'completed', states: ['default'], sourceColor: 'success', sourceStep: 400 },
  { category: 'status', subcategory: 'failed', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  { category: 'status', subcategory: 'draft', states: ['default'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'status', subcategory: 'published', states: ['default'], sourceColor: 'success', sourceStep: 400 },
  { category: 'status', subcategory: 'archived', states: ['default'], sourceColor: 'neutral', sourceStep: 400 },
  
  // ============================================
  // BADGE - Badge/Tag colors (dark theme)
  // ============================================
  { category: 'badge', subcategory: 'neutral', variant: 'surface', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'badge', subcategory: 'neutral', variant: 'content', states: ['default'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'badge', subcategory: 'brand', variant: 'surface', states: ['default'], sourceColor: 'brand', sourceStep: 800 },
  { category: 'badge', subcategory: 'brand', variant: 'content', states: ['default'], sourceColor: 'brand', sourceStep: 200 },
  { category: 'badge', subcategory: 'success', variant: 'surface', states: ['default'], sourceColor: 'success', sourceStep: 800 },
  { category: 'badge', subcategory: 'success', variant: 'content', states: ['default'], sourceColor: 'success', sourceStep: 200 },
  { category: 'badge', subcategory: 'warning', variant: 'surface', states: ['default'], sourceColor: 'warning', sourceStep: 800 },
  { category: 'badge', subcategory: 'warning', variant: 'content', states: ['default'], sourceColor: 'warning', sourceStep: 200 },
  { category: 'badge', subcategory: 'error', variant: 'surface', states: ['default'], sourceColor: 'error', sourceStep: 800 },
  { category: 'badge', subcategory: 'error', variant: 'content', states: ['default'], sourceColor: 'error', sourceStep: 200 },
  { category: 'badge', subcategory: 'info', variant: 'surface', states: ['default'], sourceColor: 'brand', sourceStep: 800 },
  { category: 'badge', subcategory: 'info', variant: 'content', states: ['default'], sourceColor: 'brand', sourceStep: 200 },
  
  // ============================================
  // DATA-VIZ - Data visualization colors (dark theme)
  // ============================================
  { category: 'data-viz', subcategory: 'categorical', variant: '1', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'data-viz', subcategory: 'categorical', variant: '2', states: ['default'], sourceColor: 'success', sourceStep: 400 },
  { category: 'data-viz', subcategory: 'categorical', variant: '3', states: ['default'], sourceColor: 'warning', sourceStep: 400 },
  { category: 'data-viz', subcategory: 'categorical', variant: '4', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  { category: 'data-viz', subcategory: 'categorical', variant: '5', states: ['default'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'data-viz', subcategory: 'sequential', variant: 'start', states: ['default'], sourceColor: 'brand', sourceStep: 800 },
  { category: 'data-viz', subcategory: 'sequential', variant: 'end', states: ['default'], sourceColor: 'brand', sourceStep: 300 },
  { category: 'data-viz', subcategory: 'positive', states: ['default'], sourceColor: 'success', sourceStep: 400 },
  { category: 'data-viz', subcategory: 'negative', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  { category: 'data-viz', subcategory: 'neutral', states: ['default'], sourceColor: 'neutral', sourceStep: 400 },
  
  // ============================================
  // NAV (NAVIGATION) - Navigation colors (dark theme)
  // ============================================
  { category: 'nav', subcategory: 'item', variant: 'bg', states: ['default', 'hover', 'active', 'selected'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'nav', subcategory: 'item', variant: 'text', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 300 },
  { category: 'nav', subcategory: 'item', variant: 'icon', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'nav', subcategory: 'indicator', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'nav', subcategory: 'breadcrumb', variant: 'text', states: ['default', 'hover', 'current'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'nav', subcategory: 'breadcrumb', variant: 'separator', states: ['default'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'nav', subcategory: 'tab', variant: 'bg', states: ['default', 'hover', 'active', 'selected'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'nav', subcategory: 'tab', variant: 'text', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 300 },
  { category: 'nav', subcategory: 'tab', variant: 'indicator', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  
  // ============================================
  // FORM - Form-specific colors (dark theme)
  // ============================================
  { category: 'form', subcategory: 'label', states: ['default', 'disabled'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'form', subcategory: 'required', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  { category: 'form', subcategory: 'helper', states: ['default', 'error'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'form', subcategory: 'counter', states: ['default', 'error'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'form', subcategory: 'input-bg', states: ['default', 'hover', 'focus', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'form', subcategory: 'input-border', states: ['default', 'hover', 'focus', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'form', subcategory: 'input-text', states: ['default', 'placeholder', 'disabled'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'form', subcategory: 'checkbox-bg', states: ['default', 'hover', 'checked', 'disabled'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'form', subcategory: 'checkbox-border', states: ['default', 'hover', 'checked', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'form', subcategory: 'checkbox-check', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'form', subcategory: 'radio-bg', states: ['default', 'hover', 'checked', 'disabled'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'form', subcategory: 'radio-border', states: ['default', 'hover', 'checked', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'form', subcategory: 'radio-dot', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'form', subcategory: 'switch-bg', states: ['off', 'on', 'disabled'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'form', subcategory: 'switch-thumb', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'form', subcategory: 'select-bg', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'form', subcategory: 'select-border', states: ['default', 'hover', 'focus', 'disabled', 'error'], sourceColor: 'neutral', sourceStep: 600 },
  
  // ============================================
  // AVATAR - Avatar colors (dark theme)
  // ============================================
  { category: 'avatar', subcategory: 'bg', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'avatar', subcategory: 'bg', variant: 'brand', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'avatar', subcategory: 'text', states: ['default'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'avatar', subcategory: 'border', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'avatar', subcategory: 'presence', variant: 'online', states: ['default'], sourceColor: 'success', sourceStep: 400 },
  { category: 'avatar', subcategory: 'presence', variant: 'offline', states: ['default'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'avatar', subcategory: 'presence', variant: 'away', states: ['default'], sourceColor: 'warning', sourceStep: 400 },
  { category: 'avatar', subcategory: 'presence', variant: 'busy', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  
  // ============================================
  // PROGRESS - Progress indicators (dark theme)
  // ============================================
  { category: 'progress', subcategory: 'track', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'progress', subcategory: 'fill', variant: 'default', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'progress', subcategory: 'fill', variant: 'success', states: ['default'], sourceColor: 'success', sourceStep: 400 },
  { category: 'progress', subcategory: 'fill', variant: 'warning', states: ['default'], sourceColor: 'warning', sourceStep: 400 },
  { category: 'progress', subcategory: 'fill', variant: 'error', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  
  // ============================================
  // SCROLLBAR - Scrollbar colors (dark theme)
  // ============================================
  { category: 'scrollbar', subcategory: 'track', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'scrollbar', subcategory: 'thumb', states: ['default', 'hover', 'active'], sourceColor: 'neutral', sourceStep: 600 },
  
  // ============================================
  // SELECTION - Selection/highlight colors (dark theme)
  // ============================================
  { category: 'selection', subcategory: 'bg', states: ['default'], sourceColor: 'brand', sourceStep: 800 },
  { category: 'selection', subcategory: 'text', states: ['default'], sourceColor: 'brand', sourceStep: 100 },
  { category: 'selection', subcategory: 'highlight', states: ['default'], sourceColor: 'warning', sourceStep: 700 },
  
  // ============================================
  // OVERLAY - Overlay and scrim colors (dark theme)
  // For modal backdrops, loading states, selections
  // ============================================
  // Scrim (dark overlay for modals)
  { category: 'overlay', subcategory: 'scrim', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  { category: 'overlay', subcategory: 'scrim', variant: 'light', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'overlay', subcategory: 'scrim', variant: 'heavy', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  // Backdrop (blur-ready backgrounds)
  { category: 'overlay', subcategory: 'backdrop', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  { category: 'overlay', subcategory: 'backdrop', variant: 'light', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'overlay', subcategory: 'backdrop', variant: 'blur', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  // Tint overlays (colored)
  { category: 'overlay', subcategory: 'tint', variant: 'brand', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'overlay', subcategory: 'tint', variant: 'success', states: ['default'], sourceColor: 'success', sourceStep: 400 },
  { category: 'overlay', subcategory: 'tint', variant: 'warning', states: ['default'], sourceColor: 'warning', sourceStep: 400 },
  { category: 'overlay', subcategory: 'tint', variant: 'error', states: ['default'], sourceColor: 'error', sourceStep: 400 },
  { category: 'overlay', subcategory: 'tint', variant: 'info', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  // Gradient overlays
  { category: 'overlay', subcategory: 'gradient', variant: 'top', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  { category: 'overlay', subcategory: 'gradient', variant: 'bottom', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  { category: 'overlay', subcategory: 'gradient', variant: 'left', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  { category: 'overlay', subcategory: 'gradient', variant: 'right', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  // Skeleton loading
  { category: 'overlay', subcategory: 'skeleton', variant: 'base', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'overlay', subcategory: 'skeleton', variant: 'shimmer', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  // Selection overlay
  { category: 'overlay', subcategory: 'selection', variant: 'default', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'overlay', subcategory: 'selection', variant: 'subtle', states: ['default'], sourceColor: 'brand', sourceStep: 800 },
  // Drag & Drop overlays
  { category: 'overlay', subcategory: 'drop-zone', variant: 'default', states: ['default', 'active', 'valid', 'invalid'], sourceColor: 'brand', sourceStep: 800 },
  { category: 'overlay', subcategory: 'drag-preview', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  // Image/media overlays
  { category: 'overlay', subcategory: 'image', variant: 'darken', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  { category: 'overlay', subcategory: 'image', variant: 'lighten', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  // Disabled overlay
  { category: 'overlay', subcategory: 'disabled', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
];

// Theme configuration interface
interface ThemeConfig {
  id: string;
  name: string;
  brandColor: string;
  accentColor?: string;
  neutralTint?: string;
  hasLightMode: boolean;
  hasDarkMode: boolean;
  isSystem?: boolean;
}

async function createColorVariablesWithStructure(
  variables: Array<{ name: string; value: { r: number; g: number; b: number; a: number }; description: string }>,
  themes?: ThemeConfig[]
): Promise<void> {
  // Invalidate cache at start of sync to get fresh data
  invalidateVariablesCache();
  
  const collections = await getLocalVariableCollections();
  
  // Default themes if none provided
  const allThemes: ThemeConfig[] = themes && themes.length > 0 ? themes : [{
    id: 'default',
    name: 'Default',
    brandColor: '#3B82F6',
    hasLightMode: true,
    hasDarkMode: true
  }];
  
  // Ensure default theme exists and is first
  const hasDefaultTheme = allThemes.some(t => t.id === 'default' || t.isSystem);
  if (!hasDefaultTheme) {
    // Add default theme at the beginning
    allThemes.unshift({
      id: 'default',
      name: 'Default',
      brandColor: '#3B82F6',
      hasLightMode: true,
      hasDarkMode: true,
      isSystem: true
    });
  }
  
  // Sort themes: default/system first, then custom themes
  allThemes.sort((a, b) => {
    if (a.id === 'default' || a.isSystem) return -1;
    if (b.id === 'default' || b.isSystem) return 1;
    return 0;
  });
  
  // Create or get Primitives collection (default mode only)
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) {
    primitivesCollection = await createVariableCollection('Primitives');
  }
  
  // Create or get Tokens collection with modes for all themes
  let tokensCollection = collections.find(c => c.name === 'Tokens');
  if (!tokensCollection) {
    tokensCollection = await createVariableCollection('Tokens');
  }
  
  // Build mode map for all themes
  const tokenModeIds: Map<string, string> = new Map();
  
  // Check if collection already has custom modes (not just "Mode 1")
  const existingModeNames = tokensCollection.modes.map(m => m.name);
  const hasCustomModes = existingModeNames.some(name => 
    name === 'light' || name === 'dark' || name.includes('-light') || name.includes('-dark')
  );
  
  // Only use rename logic for brand new collection with default "Mode 1"
  let isFirstMode = !hasCustomModes && tokensCollection.modes.length === 1;
  
  // Ensure Tokens collection has modes for all themes
  // Process default theme first to ensure 'light' and 'dark' are created first
  for (const theme of allThemes) {
    if (theme.hasLightMode) {
      const modeName = theme.id === 'default' ? 'light' : `${theme.id}-light`;
      let modeId = tokensCollection.modes.find(m => m.name === modeName)?.modeId;
      
      if (!modeId) {
        if (isFirstMode) {
          // Rename default mode only for brand new collection
          tokensCollection.renameMode(tokensCollection.defaultModeId, modeName);
          modeId = tokensCollection.defaultModeId;
          isFirstMode = false;
        } else {
          // Add new mode
          modeId = tokensCollection.addMode(modeName);
        }
      }
      tokenModeIds.set(modeName, modeId);
    }
    
    if (theme.hasDarkMode) {
      const modeName = theme.id === 'default' ? 'dark' : `${theme.id}-dark`;
      let modeId = tokensCollection.modes.find(m => m.name === modeName)?.modeId;
      
      if (!modeId) {
        if (isFirstMode) {
          tokensCollection.renameMode(tokensCollection.defaultModeId, modeName);
          modeId = tokensCollection.defaultModeId;
          isFirstMode = false;
        } else {
          modeId = tokensCollection.addMode(modeName);
        }
      }
      tokenModeIds.set(modeName, modeId);
    }
  }
  
  // Create or get Components collection - NO MODES (single default mode)
  // Components reference Tokens via aliases, theme switching happens at Tokens level
  let componentsCollection = collections.find(c => c.name === 'Components');
  if (!componentsCollection) {
    componentsCollection = await createVariableCollection('Components');
  }
  
  // Components only use the default mode - no light/dark needed
  // Theme switching is handled by Tokens collection
  const compDefaultModeId = componentsCollection.defaultModeId;
  
  // Use cached variables for performance
  const existingVariables = await getCachedVariables();
  const createdPrimitives: Map<string, Variable> = new Map();
  const processedPrimitiveNames = new Set<string>(); // Track processed names to avoid duplicates
  
  // 1. Create Primitive Variables
  // New structure: {color}/{step} where step is 25-975 (e.g., brand/500, neutral/25)
  // Primitives only have default mode
  for (const varData of variables) {
    const variableName = varData.name;
    
    // Skip if already processed in this session
    if (processedPrimitiveNames.has(variableName)) {
      continue;
    }
    processedPrimitiveNames.add(variableName);
    
    let variable = existingVariables.find(v => 
      v.name === variableName && 
      v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(variableName, primitivesCollection, 'COLOR');
    }
    
    const color: RGBA = {
      r: varData.value.r,
      g: varData.value.g,
      b: varData.value.b,
      a: varData.value.a
    };
    
    variable.setValueForMode(primitivesCollection.defaultModeId, color);
    variable.description = varData.description;
    
    createdPrimitives.set(variableName, variable);
  }
  
  // 1.0.1 Create Base Colors from passed variables (white, black, transparent-light, transparent-dark)
  // These come from UI input, not hardcoded values
  const baseColorNames = ['colors/base/white', 'colors/base/black', 'colors/base/transparent-light', 'colors/base/transparent-dark'];
  
  for (const baseColorName of baseColorNames) {
    // Find the color in passed variables
    const passedColor = variables.find(v => v.name === baseColorName);
    
    console.log(`Base color ${baseColorName}:`, passedColor ? `found with a=${passedColor.value.a}` : 'NOT FOUND in variables');
    
    if (passedColor) {
      let variable = existingVariables.find(v => 
        v.name === baseColorName && 
        v.variableCollectionId === primitivesCollection!.id
      );
      
      if (!variable) {
        variable = await createVariable(baseColorName, primitivesCollection, 'COLOR');
      }
      
      const color: RGBA = {
        r: passedColor.value.r,
        g: passedColor.value.g,
        b: passedColor.value.b,
        a: passedColor.value.a ?? 1
      };
      
      console.log(`Setting ${baseColorName} to RGBA:`, color);
      
      variable.setValueForMode(primitivesCollection.defaultModeId, color);
      variable.description = passedColor.description || `Base color ${baseColorName.split('/').pop()}`;
      
      createdPrimitives.set(baseColorName, variable);
    }
  }
  
  // 1.1 Create Primitive Palettes for Custom Themes
  // For each custom theme, generate a full color palette based on brandColor
  // Naming convention: brand-{themeId}-theme (e.g., brand-green-theme)
  for (const theme of allThemes) {
    if (theme.id === 'default' || theme.isSystem) continue; // Skip default theme, uses 'brand'
    
    // Generate color scale from theme's brandColor
    const themeColorPalette = generateColorScale(theme.brandColor);
    const themePrimitiveName = `brand-${theme.id}-theme`;
    
    for (const [step, colorValue] of Object.entries(themeColorPalette)) {
      const variableName = `colors/${themePrimitiveName}/${themePrimitiveName}-${step}`;
      
      let variable = existingVariables.find(v => 
        v.name === variableName && 
        v.variableCollectionId === primitivesCollection!.id
      );
      
      if (!variable) {
        variable = await createVariable(variableName, primitivesCollection, 'COLOR');
      }
      
      const color: RGBA = {
        r: colorValue.r / 255,
        g: colorValue.g / 255,
        b: colorValue.b / 255,
        a: 1
      };
      
      variable.setValueForMode(primitivesCollection.defaultModeId, color);
      variable.description = `${theme.name} ${step} - custom theme color`;
      
      createdPrimitives.set(variableName, variable);
    }
  }
  
  // Helper function to get primitive reference for a mapping
  // Now uses unified scale: colors/{color}/{step} (e.g., colors/brand/500, colors/neutral/25)
  // For custom themes, 'brand' sourceColor is replaced with theme's color
  // Can also use base colors (white, black, transparent) directly via useBaseColor
  const getPrimitiveForMapping = (
    mapping: SemanticColorMapping, 
    state: string, 
    isDark: boolean,
    themeColorOverride?: string // For custom themes, override 'brand' with theme's color name
  ): Variable | undefined => {
    const mappings = isDark ? SEMANTIC_COLOR_MAPPINGS_DARK : SEMANTIC_COLOR_MAPPINGS;
    // Find mapping considering variant if present
    const actualMapping = mappings.find(m => 
      m.category === mapping.category && 
      m.subcategory === mapping.subcategory &&
      m.variant === mapping.variant
    ) || mapping;
    
    // Check for direct base color reference
    if (actualMapping.useBaseColor && state === 'default') {
      const baseColorName = `colors/base/${actualMapping.useBaseColor}`;
      return createdPrimitives.get(baseColorName);
    }
    
    let step = actualMapping.sourceStep;
    
    // Determine source color - replace 'brand' with theme color for custom themes
    // Theme colors use naming: brand-{themeId}-theme (e.g., brand-green-theme)
    let sourceColor = actualMapping.sourceColor;
    if (themeColorOverride && sourceColor === 'brand') {
      sourceColor = `brand-${themeColorOverride}-theme`;
    }
    
    // Adjust step based on state
    // For light theme: hover = lighter (lower number), active = even lighter
    // For dark theme: hover = lighter (lower number), active = even lighter
    if (state === 'hover') {
      // Hover: slightly different shade
      if (step <= 100) {
        step = Math.min(975, step + 50);
      } else if (step >= 800) {
        step = Math.max(25, step - 50);
      } else {
        step = isDark ? Math.max(25, step - 50) : Math.min(975, step + 50);
      }
    } else if (state === 'active') {
      // Active: more pronounced change
      if (step <= 100) {
        step = Math.min(975, step + 100);
      } else if (step >= 800) {
        step = Math.max(25, step - 100);
      } else {
        step = isDark ? Math.max(25, step - 100) : Math.min(975, step + 100);
      }
    } else if (state === 'disabled') {
      // Disabled: muted colors
      step = isDark ? 700 : 200;
    } else if (state === 'focus') {
      // Focus: slightly different from default
      step = isDark ? Math.max(25, step - 25) : Math.min(975, step + 25);
    } else if (state === 'visited') {
      // Visited: darker version
      step = Math.min(975, step + 100);
    }
    
    // Ensure step is within valid range and matches our scale
    step = Math.max(25, Math.min(975, step));
    // Round to nearest valid step (multiples of 25)
    step = Math.round(step / 25) * 25;
    
    // Path: colors/{color}/{color}-{step} (e.g., colors/brand/brand-500)
    const sourceVarName = `colors/${sourceColor}/${sourceColor}-${step}`;
    
    return createdPrimitives.get(sourceVarName);
  };
  
  // 2. Create Semantic Token Variables with light/dark modes
  // Naming with category folders: bg/page/primary, bg/card/primary-hover, text/primary, etc.
  // Use cached variables instead of fresh fetch for performance
  const refreshedVariables = await getCachedVariables();
  const createdTokenNames = new Set<string>(); // Track created tokens to avoid duplicates
  
  for (const mapping of SEMANTIC_COLOR_MAPPINGS) {
    for (const state of mapping.states) {
      // Token name with consistent naming: category/subcategory/subcategory-variant-state
      // Folder name matches variable prefix for consistency
      // Examples:
      //   text/link/link-default, text/link/link-hover
      //   text/primary/primary, text/primary/primary-hover
      //   bg/page/page-primary, bg/page/page-secondary
      let tokenName: string;
      if (mapping.variant) {
        // With variant: category/subcategory/subcategory-variant-state
        tokenName = state === 'default' 
          ? `${mapping.category}/${mapping.subcategory}/${mapping.subcategory}-${mapping.variant}`
          : `${mapping.category}/${mapping.subcategory}/${mapping.subcategory}-${mapping.variant}-${state}`;
      } else {
        // Without variant: category/subcategory/subcategory-state
        tokenName = state === 'default' 
          ? `${mapping.category}/${mapping.subcategory}/${mapping.subcategory}`
          : `${mapping.category}/${mapping.subcategory}/${mapping.subcategory}-${state}`;
      }
      
      // Skip if already created in this session
      if (createdTokenNames.has(tokenName)) {
        continue;
      }
      
      let tokenVar = refreshedVariables.find(v => 
        v.name === tokenName && 
        v.variableCollectionId === tokensCollection!.id
      );
      
      if (!tokenVar) {
        tokenVar = await createVariable(tokenName, tokensCollection, 'COLOR');
        createdTokenNames.add(tokenName);
      }
      
      // Set values for all theme modes
      // For custom themes, 'brand' is replaced with theme's color (e.g., 'green', 'blue')
      for (const theme of allThemes) {
        // Determine theme color override - for non-default themes, use theme id as color name
        const themeColorOverride = theme.id === 'default' ? undefined : theme.id;
        
        if (theme.hasLightMode) {
          const modeName = theme.id === 'default' ? 'light' : `${theme.id}-light`;
          const modeId = tokenModeIds.get(modeName);
          
          // Get primitive with theme color override for 'brand' references
          const lightPrimitive = getPrimitiveForMapping(mapping, state, false, themeColorOverride);
          
          if (modeId && lightPrimitive) {
            const lightAlias: VariableAlias = {
              type: 'VARIABLE_ALIAS',
              id: lightPrimitive.id
            };
            tokenVar.setValueForMode(modeId, lightAlias);
          }
        }
        
        if (theme.hasDarkMode) {
          const modeName = theme.id === 'default' ? 'dark' : `${theme.id}-dark`;
          const modeId = tokenModeIds.get(modeName);
          
          const darkMapping = SEMANTIC_COLOR_MAPPINGS_DARK.find(m => 
            m.category === mapping.category && 
            m.subcategory === mapping.subcategory &&
            m.variant === mapping.variant
          );
          const darkPrimitive = darkMapping 
            ? getPrimitiveForMapping(darkMapping, state, true, themeColorOverride) 
            : getPrimitiveForMapping(mapping, state, true, themeColorOverride);
          
          if (modeId && darkPrimitive) {
            const darkAlias: VariableAlias = {
              type: 'VARIABLE_ALIAS',
              id: darkPrimitive.id
            };
            tokenVar.setValueForMode(modeId, darkAlias);
          }
        }
      }
      
      tokenVar.description = mapping.variant 
        ? `${mapping.category} ${mapping.subcategory} ${mapping.variant} - ${state} state`
        : `${mapping.category} ${mapping.subcategory} - ${state} state`;
    }
  }
  
  // 3. Create Component Token Variables with all theme modes
  // Structure: component/variant/variant-property-state
  const componentMappings = [
    // ============================================
    // BUTTON COMPONENT
    // ============================================
    // Primary Button
    { name: 'button/primary/primary-bg', source: 'action/primary/primary' },
    { name: 'button/primary/primary-bg-hover', source: 'action/primary/primary-hover' },
    { name: 'button/primary/primary-bg-active', source: 'action/primary/primary-active' },
    { name: 'button/primary/primary-bg-focus', source: 'action/primary/primary-focus' },
    { name: 'button/primary/primary-bg-disabled', source: 'action/primary/primary-disabled' },
    { name: 'button/primary/primary-label', source: 'content/on-action-primary/on-action-primary' },
    { name: 'button/primary/primary-icon', source: 'content/on-action-primary/on-action-primary' },
    
    // Secondary Button
    { name: 'button/secondary/secondary-bg', source: 'action/secondary/secondary' },
    { name: 'button/secondary/secondary-bg-hover', source: 'action/secondary/secondary-hover' },
    { name: 'button/secondary/secondary-bg-active', source: 'action/secondary/secondary-active' },
    { name: 'button/secondary/secondary-stroke', source: 'stroke/default/default' },
    { name: 'button/secondary/secondary-label', source: 'content/on-action-secondary/on-action-secondary' },
    { name: 'button/secondary/secondary-icon', source: 'content/on-action-secondary/on-action-secondary' },
    
    // Ghost Button
    { name: 'button/ghost/ghost-bg', source: 'action/ghost/ghost' },
    { name: 'button/ghost/ghost-bg-hover', source: 'action/ghost/ghost-hover' },
    { name: 'button/ghost/ghost-label', source: 'content/primary/primary' },
    { name: 'button/ghost/ghost-icon', source: 'content/primary/primary' },
    
    // Danger Button
    { name: 'button/danger/danger-bg', source: 'action/danger/danger' },
    { name: 'button/danger/danger-bg-hover', source: 'action/danger/danger-hover' },
    { name: 'button/danger/danger-label', source: 'content/inverse/inverse' },
    { name: 'button/danger/danger-icon', source: 'content/inverse/inverse' },
    
    // ============================================
    // INPUT COMPONENT
    // ============================================
    { name: 'input/container/container-surface', source: 'surface/card/card' },
    { name: 'input/container/container-surface-hover', source: 'surface/card/card-hover' },
    { name: 'input/container/container-stroke', source: 'stroke/default/default' },
    { name: 'input/container/container-stroke-hover', source: 'stroke/default/default-hover' },
    { name: 'input/container/container-stroke-focus', source: 'stroke/focus/focus' },
    { name: 'input/container/container-stroke-error', source: 'stroke/error/error' },
    { name: 'input/container/container-stroke-disabled', source: 'stroke/disabled/disabled' },
    { name: 'input/text/text-value', source: 'content/primary/primary' },
    { name: 'input/text/text-placeholder', source: 'content/tertiary/tertiary' },
    { name: 'input/text/text-label', source: 'content/primary/primary' },
    { name: 'input/text/text-helper', source: 'content/secondary/secondary' },
    { name: 'input/text/text-helper-error', source: 'text/error/error' },
    { name: 'input/icon/icon-default', source: 'content/secondary/secondary' },
    
    // ============================================
    // SELECT COMPONENT
    // ============================================
    { name: 'select/container/container-surface', source: 'surface/card/card' },
    { name: 'select/container/container-stroke', source: 'stroke/default/default' },
    { name: 'select/container/container-stroke-focus', source: 'stroke/focus/focus' },
    { name: 'select/text/text-value', source: 'content/primary/primary' },
    { name: 'select/text/text-placeholder', source: 'content/tertiary/tertiary' },
    { name: 'select/icon/icon-default', source: 'content/secondary/secondary' },
    { name: 'select/option/option-surface', source: 'surface/card/card' },
    { name: 'select/option/option-surface-hover', source: 'surface/card/card-hover' },
    { name: 'select/option/option-content', source: 'content/primary/primary' },
    
    // ============================================
    // CHECKBOX / RADIO COMPONENT
    // ============================================
    { name: 'checkbox/container/container-surface', source: 'surface/card/card' },
    { name: 'checkbox/container/container-surface-checked', source: 'action/primary/primary' },
    { name: 'checkbox/container/container-stroke', source: 'stroke/default/default' },
    { name: 'checkbox/container/container-stroke-focus', source: 'stroke/focus/focus' },
    { name: 'checkbox/icon/icon-check', source: 'content/on-action-primary/on-action-primary' },
    { name: 'checkbox/text/text-label', source: 'content/primary/primary' },
    
    { name: 'radio/container/container-surface', source: 'surface/card/card' },
    { name: 'radio/container/container-surface-checked', source: 'action/primary/primary' },
    { name: 'radio/container/container-stroke', source: 'stroke/default/default' },
    { name: 'radio/indicator/indicator-dot', source: 'content/on-action-primary/on-action-primary' },
    { name: 'radio/text/text-label', source: 'content/primary/primary' },
    
    // ============================================
    // TOGGLE / SWITCH COMPONENT
    // ============================================
    { name: 'toggle/track/track-surface', source: 'surface/card/card' },
    { name: 'toggle/track/track-surface-checked', source: 'action/primary/primary' },
    { name: 'toggle/thumb/thumb-surface', source: 'surface/elevated/elevated' },
    { name: 'toggle/text/text-label', source: 'content/primary/primary' },
    
    // ============================================
    // CARD COMPONENT
    // ============================================
    { name: 'card/container/container-surface', source: 'surface/card/card' },
    { name: 'card/container/container-surface-hover', source: 'surface/card/card-hover' },
    { name: 'card/container/container-stroke', source: 'stroke/subtle/subtle' },
    { name: 'card/header/header-content', source: 'content/primary/primary' },
    { name: 'card/body/body-content', source: 'content/secondary/secondary' },
    { name: 'card/footer/footer-content', source: 'content/tertiary/tertiary' },
    
    // ============================================
    // MODAL / DIALOG COMPONENT
    // ============================================
    { name: 'modal/overlay/overlay-surface', source: 'surface/overlay/overlay' },
    { name: 'modal/container/container-surface', source: 'surface/elevated/elevated' },
    { name: 'modal/header/header-content', source: 'content/primary/primary' },
    { name: 'modal/body/body-content', source: 'content/secondary/secondary' },
    { name: 'modal/close/close-icon', source: 'content/secondary/secondary' },
    
    // ============================================
    // BADGE COMPONENT
    // ============================================
    { name: 'badge/success/success-surface', source: 'feedback/success-surface/success-surface' },
    { name: 'badge/success/success-content', source: 'feedback/success-content/success-content' },
    { name: 'badge/warning/warning-surface', source: 'feedback/warning-surface/warning-surface' },
    { name: 'badge/warning/warning-content', source: 'feedback/warning-content/warning-content' },
    { name: 'badge/error/error-surface', source: 'feedback/error-surface/error-surface' },
    { name: 'badge/error/error-content', source: 'feedback/error-content/error-content' },
    { name: 'badge/info/info-surface', source: 'feedback/info-surface/info-surface' },
    { name: 'badge/info/info-content', source: 'feedback/info-content/info-content' },
    { name: 'badge/neutral/neutral-surface', source: 'bg/interactive/interactive-primary' },
    { name: 'badge/neutral/neutral-content', source: 'content/primary/primary' },
    
    // ============================================
    // ALERT / TOAST COMPONENT
    // ============================================
    { name: 'alert/success/success-surface', source: 'feedback/success-surface/success-surface' },
    { name: 'alert/success/success-content', source: 'feedback/success-content/success-content' },
    { name: 'alert/success/success-stroke', source: 'feedback/success-stroke/success-stroke' },
    { name: 'alert/success/success-icon', source: 'feedback/success-content/success-content' },
    { name: 'alert/warning/warning-surface', source: 'feedback/warning-surface/warning-surface' },
    { name: 'alert/warning/warning-content', source: 'feedback/warning-content/warning-content' },
    { name: 'alert/warning/warning-stroke', source: 'feedback/warning-stroke/warning-stroke' },
    { name: 'alert/warning/warning-icon', source: 'feedback/warning-content/warning-content' },
    { name: 'alert/error/error-surface', source: 'feedback/error-surface/error-surface' },
    { name: 'alert/error/error-content', source: 'feedback/error-content/error-content' },
    { name: 'alert/error/error-stroke', source: 'feedback/error-stroke/error-stroke' },
    { name: 'alert/error/error-icon', source: 'feedback/error-content/error-content' },
    { name: 'alert/info/info-surface', source: 'feedback/info-surface/info-surface' },
    { name: 'alert/info/info-content', source: 'feedback/info-content/info-content' },
    { name: 'alert/info/info-stroke', source: 'feedback/info-stroke/info-stroke' },
    { name: 'alert/info/info-icon', source: 'feedback/info-content/info-content' },
    
    // ============================================
    // TOOLTIP COMPONENT
    // ============================================
    { name: 'tooltip/container/container-surface', source: 'surface/inverse/inverse' },
    { name: 'tooltip/text/text-content', source: 'content/inverse/inverse' },
    
    // ============================================
    // AVATAR COMPONENT
    // ============================================
    { name: 'avatar/container/container-surface', source: 'bg/interactive/interactive-primary' },
    { name: 'avatar/container/container-stroke', source: 'stroke/subtle/subtle' },
    { name: 'avatar/text/text-initials', source: 'content/primary/primary' },
    { name: 'avatar/icon/icon-default', source: 'content/secondary/secondary' },
    
    // ============================================
    // TABS COMPONENT
    // ============================================
    { name: 'tabs/item/item-content', source: 'content/secondary/secondary' },
    { name: 'tabs/item/item-content-hover', source: 'content/primary/primary' },
    { name: 'tabs/item/item-content-active', source: 'content/brand/brand' },
    { name: 'tabs/indicator/indicator-bar', source: 'action/primary/primary' },
    
    // ============================================
    // NAVIGATION COMPONENT
    // ============================================
    { name: 'nav/item/item-surface', source: 'surface/page/page' },
    { name: 'nav/item/item-surface-hover', source: 'bg/interactive/interactive-primary-hover' },
    { name: 'nav/item/item-surface-active', source: 'bg/interactive/interactive-primary-selected' },
    { name: 'nav/item/item-content', source: 'content/secondary/secondary' },
    { name: 'nav/item/item-content-active', source: 'content/brand/brand' },
    { name: 'nav/icon/icon-default', source: 'content/secondary/secondary' },
    { name: 'nav/icon/icon-active', source: 'content/brand/brand' },
    
    // ============================================
    // TABLE COMPONENT
    // ============================================
    { name: 'table/header/header-surface', source: 'bg/interactive/interactive-primary' },
    { name: 'table/header/header-content', source: 'content/primary/primary' },
    { name: 'table/row/row-surface', source: 'surface/card/card' },
    { name: 'table/row/row-surface-hover', source: 'bg/interactive/interactive-primary-hover' },
    { name: 'table/row/row-surface-selected', source: 'bg/interactive/interactive-primary-selected' },
    { name: 'table/cell/cell-content', source: 'content/primary/primary' },
    { name: 'table/divider/divider-line', source: 'stroke/subtle/subtle' },
    
    // ============================================
    // PAGINATION COMPONENT
    // ============================================
    { name: 'pagination/item/item-surface', source: 'bg/interactive/interactive-primary' },
    { name: 'pagination/item/item-surface-hover', source: 'bg/interactive/interactive-primary-hover' },
    { name: 'pagination/item/item-surface-active', source: 'action/primary/primary' },
    { name: 'pagination/item/item-content', source: 'content/primary/primary' },
    { name: 'pagination/item/item-content-active', source: 'content/on-action-primary/on-action-primary' },
    
    // ============================================
    // PROGRESS / LOADER COMPONENT
    // ============================================
    { name: 'progress/track/track-surface', source: 'bg/interactive/interactive-primary' },
    { name: 'progress/indicator/indicator-surface', source: 'action/primary/primary' },
    { name: 'loader/indicator/indicator-spinner', source: 'action/primary/primary' },
    
    // ============================================
    // SKELETON COMPONENT
    // ============================================
    { name: 'skeleton/container/container-surface', source: 'bg/interactive/interactive-primary' },
    
    // ============================================
    // DIVIDER COMPONENT
    // ============================================
    { name: 'divider/line/line-default', source: 'stroke/subtle/subtle' },
    { name: 'divider/line/line-strong', source: 'stroke/default/default' },
    
    // ============================================
    // DROPDOWN / MENU COMPONENT
    // ============================================
    { name: 'dropdown/container/container-surface', source: 'surface/elevated/elevated' },
    { name: 'dropdown/container/container-stroke', source: 'stroke/subtle/subtle' },
    { name: 'dropdown/item/item-surface', source: 'surface/card/card' },
    { name: 'dropdown/item/item-surface-hover', source: 'bg/interactive/interactive-primary-hover' },
    { name: 'dropdown/item/item-surface-selected', source: 'bg/interactive/interactive-primary-selected' },
    { name: 'dropdown/item/item-surface-disabled', source: 'bg/interactive/interactive-primary-disabled' },
    { name: 'dropdown/item/item-content', source: 'content/primary/primary' },
    { name: 'dropdown/item/item-content-hover', source: 'content/primary/primary-hover' },
    { name: 'dropdown/item/item-content-disabled', source: 'content/disabled/disabled' },
    { name: 'dropdown/item/item-icon', source: 'content/secondary/secondary' },
    { name: 'dropdown/divider/divider-line', source: 'stroke/subtle/subtle' },
    { name: 'dropdown/header/header-content', source: 'content/tertiary/tertiary' },
    
    // ============================================
    // BREADCRUMB COMPONENT
    // ============================================
    { name: 'breadcrumb/item/item-content', source: 'nav/breadcrumb/breadcrumb-text' },
    { name: 'breadcrumb/item/item-content-hover', source: 'nav/breadcrumb/breadcrumb-text-hover' },
    { name: 'breadcrumb/item/item-content-current', source: 'nav/breadcrumb/breadcrumb-text-current' },
    { name: 'breadcrumb/separator/separator-icon', source: 'nav/breadcrumb/breadcrumb-separator' },
    { name: 'breadcrumb/icon/icon-home', source: 'content/secondary/secondary' },
    
    // ============================================
    // CHIP / TAG COMPONENT
    // ============================================
    { name: 'chip/neutral/neutral-surface', source: 'badge/neutral/neutral-surface' },
    { name: 'chip/neutral/neutral-content', source: 'badge/neutral/neutral-content' },
    { name: 'chip/neutral/neutral-stroke', source: 'stroke/default/default' },
    { name: 'chip/brand/brand-surface', source: 'badge/brand/brand-surface' },
    { name: 'chip/brand/brand-content', source: 'badge/brand/brand-content' },
    { name: 'chip/brand/brand-stroke', source: 'border/brand/brand' },
    { name: 'chip/success/success-surface', source: 'badge/success/success-surface' },
    { name: 'chip/success/success-content', source: 'badge/success/success-content' },
    { name: 'chip/success/success-stroke', source: 'border/success/success' },
    { name: 'chip/warning/warning-surface', source: 'badge/warning/warning-surface' },
    { name: 'chip/warning/warning-content', source: 'badge/warning/warning-content' },
    { name: 'chip/warning/warning-stroke', source: 'border/warning/warning' },
    { name: 'chip/error/error-surface', source: 'badge/error/error-surface' },
    { name: 'chip/error/error-content', source: 'badge/error/error-content' },
    { name: 'chip/error/error-stroke', source: 'border/error/error' },
    { name: 'chip/close/close-icon', source: 'content/secondary/secondary' },
    { name: 'chip/close/close-icon-hover', source: 'content/primary/primary' },
    
    // ============================================
    // STEPPER COMPONENT
    // ============================================
    { name: 'stepper/step/step-surface-completed', source: 'action/primary/primary' },
    { name: 'stepper/step/step-surface-active', source: 'action/primary/primary' },
    { name: 'stepper/step/step-surface-inactive', source: 'bg/interactive/interactive-primary' },
    { name: 'stepper/step/step-stroke-completed', source: 'action/primary/primary' },
    { name: 'stepper/step/step-stroke-active', source: 'action/primary/primary' },
    { name: 'stepper/step/step-stroke-inactive', source: 'stroke/default/default' },
    { name: 'stepper/step/step-content-completed', source: 'content/on-action-primary/on-action-primary' },
    { name: 'stepper/step/step-content-active', source: 'content/on-action-primary/on-action-primary' },
    { name: 'stepper/step/step-content-inactive', source: 'content/secondary/secondary' },
    { name: 'stepper/connector/connector-completed', source: 'action/primary/primary' },
    { name: 'stepper/connector/connector-incomplete', source: 'stroke/default/default' },
    { name: 'stepper/label/label-completed', source: 'content/primary/primary' },
    { name: 'stepper/label/label-active', source: 'content/brand/brand' },
    { name: 'stepper/label/label-inactive', source: 'content/secondary/secondary' },
    
    // ============================================
    // ACCORDION COMPONENT
    // ============================================
    { name: 'accordion/header/header-surface', source: 'surface/card/card' },
    { name: 'accordion/header/header-surface-hover', source: 'surface/card/card-hover' },
    { name: 'accordion/header/header-surface-expanded', source: 'surface/card/card' },
    { name: 'accordion/header/header-content', source: 'content/primary/primary' },
    { name: 'accordion/header/header-icon', source: 'content/secondary/secondary' },
    { name: 'accordion/body/body-surface', source: 'surface/card/card' },
    { name: 'accordion/body/body-content', source: 'content/secondary/secondary' },
    { name: 'accordion/divider/divider-line', source: 'stroke/subtle/subtle' },
    
    // ============================================
    // SLIDER / RANGE COMPONENT
    // ============================================
    { name: 'slider/track/track-surface', source: 'progress/track/track' },
    { name: 'slider/track/track-fill', source: 'action/primary/primary' },
    { name: 'slider/thumb/thumb-surface', source: 'surface/elevated/elevated' },
    { name: 'slider/thumb/thumb-surface-hover', source: 'surface/elevated/elevated' },
    { name: 'slider/thumb/thumb-surface-active', source: 'action/primary/primary' },
    { name: 'slider/thumb/thumb-stroke', source: 'action/primary/primary' },
    { name: 'slider/mark/mark-surface', source: 'stroke/default/default' },
    { name: 'slider/label/label-content', source: 'content/secondary/secondary' },
    
    // ============================================
    // DATE PICKER COMPONENT
    // ============================================
    { name: 'datepicker/container/container-surface', source: 'surface/elevated/elevated' },
    { name: 'datepicker/container/container-stroke', source: 'stroke/subtle/subtle' },
    { name: 'datepicker/header/header-content', source: 'content/primary/primary' },
    { name: 'datepicker/nav/nav-icon', source: 'content/secondary/secondary' },
    { name: 'datepicker/nav/nav-icon-hover', source: 'content/primary/primary' },
    { name: 'datepicker/day/day-surface', source: 'surface/card/card' },
    { name: 'datepicker/day/day-surface-hover', source: 'bg/interactive/interactive-primary-hover' },
    { name: 'datepicker/day/day-surface-selected', source: 'action/primary/primary' },
    { name: 'datepicker/day/day-surface-today', source: 'bg/brand/brand-subtle' },
    { name: 'datepicker/day/day-surface-range', source: 'bg/brand/brand-subtle' },
    { name: 'datepicker/day/day-surface-disabled', source: 'bg/interactive/interactive-primary-disabled' },
    { name: 'datepicker/day/day-content', source: 'content/primary/primary' },
    { name: 'datepicker/day/day-content-selected', source: 'content/on-action-primary/on-action-primary' },
    { name: 'datepicker/day/day-content-today', source: 'content/brand/brand' },
    { name: 'datepicker/day/day-content-disabled', source: 'content/disabled/disabled' },
    { name: 'datepicker/day/day-content-outside', source: 'content/tertiary/tertiary' },
    { name: 'datepicker/weekday/weekday-content', source: 'content/tertiary/tertiary' },
    
    // ============================================
    // POPOVER COMPONENT
    // ============================================
    { name: 'popover/container/container-surface', source: 'surface/elevated/elevated' },
    { name: 'popover/container/container-stroke', source: 'stroke/subtle/subtle' },
    { name: 'popover/header/header-content', source: 'content/primary/primary' },
    { name: 'popover/body/body-content', source: 'content/secondary/secondary' },
    { name: 'popover/close/close-icon', source: 'content/secondary/secondary' },
    { name: 'popover/arrow/arrow-surface', source: 'surface/elevated/elevated' },
    
    // ============================================
    // SNACKBAR / TOAST COMPONENT
    // ============================================
    { name: 'snackbar/container/container-surface', source: 'surface/inverse/inverse' },
    { name: 'snackbar/container/container-stroke', source: 'stroke/subtle/subtle' },
    { name: 'snackbar/text/text-content', source: 'content/inverse/inverse' },
    { name: 'snackbar/action/action-content', source: 'text/brand/brand' },
    { name: 'snackbar/close/close-icon', source: 'content/inverse/inverse' },
    { name: 'snackbar/success/success-surface', source: 'feedback/success-surface/success-surface' },
    { name: 'snackbar/success/success-content', source: 'feedback/success-content/success-content' },
    { name: 'snackbar/success/success-icon', source: 'feedback/success-content/success-content' },
    { name: 'snackbar/error/error-surface', source: 'feedback/error-surface/error-surface' },
    { name: 'snackbar/error/error-content', source: 'feedback/error-content/error-content' },
    { name: 'snackbar/error/error-icon', source: 'feedback/error-content/error-content' },
    { name: 'snackbar/warning/warning-surface', source: 'feedback/warning-surface/warning-surface' },
    { name: 'snackbar/warning/warning-content', source: 'feedback/warning-content/warning-content' },
    { name: 'snackbar/warning/warning-icon', source: 'feedback/warning-content/warning-content' },
    { name: 'snackbar/info/info-surface', source: 'feedback/info-surface/info-surface' },
    { name: 'snackbar/info/info-content', source: 'feedback/info-content/info-content' },
    { name: 'snackbar/info/info-icon', source: 'feedback/info-content/info-content' },
    
    // ============================================
    // EMPTY STATE COMPONENT
    // ============================================
    { name: 'empty-state/icon/icon-default', source: 'content/tertiary/tertiary' },
    { name: 'empty-state/title/title-content', source: 'content/primary/primary' },
    { name: 'empty-state/description/description-content', source: 'content/secondary/secondary' },
    
    // ============================================
    // FILE UPLOAD COMPONENT
    // ============================================
    { name: 'upload/container/container-surface', source: 'bg/interactive/interactive-primary' },
    { name: 'upload/container/container-surface-hover', source: 'bg/interactive/interactive-primary-hover' },
    { name: 'upload/container/container-surface-active', source: 'bg/brand/brand-subtle' },
    { name: 'upload/container/container-stroke', source: 'stroke/default/default' },
    { name: 'upload/container/container-stroke-hover', source: 'border/brand/brand' },
    { name: 'upload/container/container-stroke-active', source: 'border/brand/brand' },
    { name: 'upload/container/container-stroke-error', source: 'border/error/error' },
    { name: 'upload/icon/icon-default', source: 'content/secondary/secondary' },
    { name: 'upload/icon/icon-active', source: 'content/brand/brand' },
    { name: 'upload/text/text-primary', source: 'content/primary/primary' },
    { name: 'upload/text/text-secondary', source: 'content/secondary/secondary' },
    { name: 'upload/file/file-surface', source: 'surface/card/card' },
    { name: 'upload/file/file-stroke', source: 'stroke/subtle/subtle' },
    { name: 'upload/file/file-icon', source: 'content/secondary/secondary' },
    { name: 'upload/file/file-name', source: 'content/primary/primary' },
    { name: 'upload/file/file-size', source: 'content/tertiary/tertiary' },
    { name: 'upload/file/file-remove', source: 'content/secondary/secondary' },
    { name: 'upload/progress/progress-track', source: 'progress/track/track' },
    { name: 'upload/progress/progress-fill', source: 'progress/fill/fill-default' },
    
    // ============================================
    // SIDEBAR / DRAWER COMPONENT
    // ============================================
    { name: 'sidebar/container/container-surface', source: 'bg/sidebar/sidebar-default' },
    { name: 'sidebar/header/header-surface', source: 'bg/sidebar/sidebar-default' },
    { name: 'sidebar/header/header-content', source: 'content/primary/primary' },
    { name: 'sidebar/section/section-title', source: 'content/tertiary/tertiary' },
    { name: 'sidebar/item/item-surface', source: 'nav/item/item-bg' },
    { name: 'sidebar/item/item-surface-hover', source: 'nav/item/item-bg-hover' },
    { name: 'sidebar/item/item-surface-active', source: 'nav/item/item-bg-active' },
    { name: 'sidebar/item/item-content', source: 'nav/item/item-text' },
    { name: 'sidebar/item/item-content-hover', source: 'nav/item/item-text-hover' },
    { name: 'sidebar/item/item-content-active', source: 'nav/item/item-text-active' },
    { name: 'sidebar/item/item-icon', source: 'nav/item/item-icon' },
    { name: 'sidebar/item/item-icon-active', source: 'nav/item/item-icon-active' },
    { name: 'sidebar/badge/badge-surface', source: 'badge/brand/brand-surface' },
    { name: 'sidebar/badge/badge-content', source: 'badge/brand/brand-content' },
    { name: 'sidebar/divider/divider-line', source: 'divider/subtle/subtle' },
    { name: 'sidebar/footer/footer-surface', source: 'bg/sidebar/sidebar-default' },
    { name: 'sidebar/footer/footer-content', source: 'content/secondary/secondary' },
  ];
  
  const allVariables = await getLocalVariables();
  const createdComponentNames = new Set<string>(); // Track created components to avoid duplicates
  
  for (const comp of componentMappings) {
    // Skip if already created in this session
    if (createdComponentNames.has(comp.name)) {
      continue;
    }
    
    const sourceToken = allVariables.find(v => 
      v.name === comp.source && 
      v.variableCollectionId === tokensCollection!.id
    );
    
    if (!sourceToken) {
      console.log(`Token not found: ${comp.source}`);
      continue;
    }
    
    let compVar = allVariables.find(v => 
      v.name === comp.name && 
      v.variableCollectionId === componentsCollection!.id
    );
    
    if (!compVar) {
      compVar = await createVariable(comp.name, componentsCollection, 'COLOR');
      createdComponentNames.add(comp.name);
    }
    
    const aliasValue: VariableAlias = {
      type: 'VARIABLE_ALIAS',
      id: sourceToken.id
    };
    
    // Components reference tokens - only default mode
    // Theme switching is handled at Tokens level via aliases
    compVar.setValueForMode(compDefaultModeId, aliasValue);
    compVar.description = `Component token for ${comp.name.replace(/\//g, ' ')}`;
  }
}

// ============================================
// CREATE BASE TOKENS (Spacing, Radius, Typography, etc.)
// ============================================

async function createBaseTokens(): Promise<void> {
  const collections = await getLocalVariableCollections();
  
  // Create or get Primitives collection
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) {
    primitivesCollection = await createVariableCollection('Primitives');
  }
  
  const existingVariables = await getLocalVariables();
  
  // NOTE: Spacing tokens are now in a separate "Spacing" collection 
  // with device modes (Desktop/Tablet/Mobile)
  // See scaling-generator-ui.ts and create-scaling-collection handler
  
  // ============================================
  // RADIUS TOKENS
  // ============================================
  const radiusScale: Record<string, number> = {
    'none': 0,
    'xs': 2,
    'sm': 4,
    'md': 6,
    'lg': 8,
    'xl': 12,
    '2xl': 16,
    '3xl': 24,
    'full': 9999,
  };
  
  for (const [name, value] of Object.entries(radiusScale)) {
    const varName = `radius/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `${value}px border radius`;
  }
  
  // ============================================
  // TYPOGRAPHY TOKENS (grouped together)
  // ============================================
  
  // Font Size
  const fontSizeScale: Record<string, number> = {
    'xs': 12,
    'sm': 14,
    'base': 16,
    'lg': 18,
    'xl': 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
    '7xl': 72,
    '8xl': 96,
    '9xl': 128,
  };
  
  for (const [name, value] of Object.entries(fontSizeScale)) {
    const varName = `typography/font-size/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `${value}px font size`;
  }
  
  // Font Weight
  const fontWeightScale: Record<string, number> = {
    'thin': 100,
    'extralight': 200,
    'light': 300,
    'regular': 400,
    'medium': 500,
    'semibold': 600,
    'bold': 700,
    'extrabold': 800,
    'black': 900,
  };
  
  for (const [name, value] of Object.entries(fontWeightScale)) {
    const varName = `typography/font-weight/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `Font weight ${value}`;
  }
  
  // Line Height
  const lineHeightScale: Record<string, number> = {
    'none': 1,
    'tight': 1.25,
    'snug': 1.375,
    'normal': 1.5,
    'relaxed': 1.625,
    'loose': 2,
  };
  
  for (const [name, value] of Object.entries(lineHeightScale)) {
    const varName = `typography/line-height/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `Line height ${value}`;
  }
  
  // Letter Spacing
  const letterSpacingScale: Record<string, number> = {
    'tighter': -0.05,
    'tight': -0.025,
    'normal': 0,
    'wide': 0.025,
    'wider': 0.05,
    'widest': 0.1,
  };
  
  for (const [name, value] of Object.entries(letterSpacingScale)) {
    const varName = `typography/letter-spacing/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `Letter spacing ${value}em`;
  }
  
  // ============================================
  // OPACITY TOKENS
  // ============================================
  const opacityScale: Record<string, number> = {
    '0': 0,
    '5': 0.05,
    '10': 0.1,
    '20': 0.2,
    '25': 0.25,
    '30': 0.3,
    '40': 0.4,
    '50': 0.5,
    '60': 0.6,
    '70': 0.7,
    '75': 0.75,
    '80': 0.8,
    '90': 0.9,
    '95': 0.95,
    '100': 1,
  };
  
  for (const [name, value] of Object.entries(opacityScale)) {
    const varName = `opacity/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `${Math.round(value * 100)}% opacity`;
  }
  
  // ============================================
  // Z-INDEX TOKENS
  // ============================================
  const zIndexScale: Record<string, number> = {
    'hide': -1,
    'base': 0,
    'docked': 10,
    'dropdown': 1000,
    'sticky': 1100,
    'banner': 1200,
    'overlay': 1300,
    'modal': 1400,
    'popover': 1500,
    'toast': 1600,
    'tooltip': 1700,
  };
  
  for (const [name, value] of Object.entries(zIndexScale)) {
    const varName = `z-index/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `Z-index ${value}`;
  }
  
  // ============================================
  // MOTION TOKENS (duration & easing grouped)
  // ============================================
  const durationScale: Record<string, number> = {
    '0': 0,
    '75': 75,
    '100': 100,
    '150': 150,
    '200': 200,
    '300': 300,
    '500': 500,
    '700': 700,
    '1000': 1000,
  };
  
  for (const [name, value] of Object.entries(durationScale)) {
    const varName = `motion/duration/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `${value}ms duration`;
  }
  
  // ============================================
  // BORDER WIDTH TOKENS
  // ============================================
  const borderWidthScale: Record<string, number> = {
    '0': 0,
    '1': 1,
    '2': 2,
    '4': 4,
    '8': 8,
  };
  
  for (const [name, value] of Object.entries(borderWidthScale)) {
    const varName = `border-width/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `${value}px border width`;
  }
  
  // ============================================
  // ELEVATION/SHADOW BLUR TOKENS
  // ============================================
  const elevationScale: Record<string, number> = {
    'none': 0,
    'xs': 2,
    'sm': 4,
    'md': 8,
    'lg': 16,
    'xl': 24,
    '2xl': 32,
    '3xl': 48,
  };
  
  for (const [name, value] of Object.entries(elevationScale)) {
    const varName = `elevation/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `${value}px shadow blur`;
  }
}

// ============================================
// CREATE TYPOGRAPHY VARIABLES (extended)
// ============================================

async function createTypographyVariables(
  variables: Array<{ 
    name: string; 
    value: number | string; 
    type: 'NUMBER' | 'STRING';
    collection: string;
  }>
): Promise<void> {
  const collections = await getLocalVariableCollections();
  
  // Create or get Primitives collection
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) {
    primitivesCollection = await createVariableCollection('Primitives');
  }
  
  const existingVariables = await getLocalVariables();
  
  // Process each typography variable
  for (const varData of variables) {
    // Determine variable type for Figma
    const figmaType: VariableResolvedDataType = varData.type === 'STRING' ? 'STRING' : 'FLOAT';
    
    // Check if variable already exists
    let variable = existingVariables.find(v => 
      v.name === varData.name && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varData.name, primitivesCollection, figmaType);
    }
    
    // Set value
    variable.setValueForMode(primitivesCollection.defaultModeId, varData.value);
  }
  
  // Also create extended typography scale if not already done
  await createExtendedTypographyPrimitives(primitivesCollection);
}

async function createExtendedTypographyPrimitives(
  collection: VariableCollection
): Promise<void> {
  const existingVariables = await getLocalVariables();
  
  // Extended Font Size Scale (px values)
  const fontSizeScale: Record<string, number> = {
    '10': 10, '11': 11, '12': 12, '13': 13, '14': 14, '15': 15,
    '16': 16, '18': 18, '20': 20, '24': 24, '28': 28, '32': 32,
    '36': 36, '40': 40, '48': 48, '56': 56, '64': 64, '72': 72, '96': 96,
  };
  
  for (const [name, value] of Object.entries(fontSizeScale)) {
    const varName = `font/size/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === collection.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, collection, 'FLOAT');
      variable.setValueForMode(collection.defaultModeId, value);
      variable.description = `${value}px font size`;
    }
  }
  
  // Line Height Scale (as percentages for Figma)
  const lineHeightScale: Record<string, number> = {
    '100': 100, '110': 110, '120': 120, '125': 125, '130': 130,
    '140': 140, '150': 150, '160': 160, '170': 170, '180': 180, '200': 200,
  };
  
  for (const [name, value] of Object.entries(lineHeightScale)) {
    const varName = `font/lineHeight/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === collection.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, collection, 'FLOAT');
      variable.setValueForMode(collection.defaultModeId, value);
      variable.description = `${value}% line height`;
    }
  }
  
  // Font Weight Scale
  const fontWeightScale: Record<string, number> = {
    '100': 100, '200': 200, '300': 300, '400': 400, '500': 500,
    '600': 600, '700': 700, '800': 800, '900': 900,
  };
  
  for (const [name, value] of Object.entries(fontWeightScale)) {
    const varName = `font/weight/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === collection.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, collection, 'FLOAT');
      variable.setValueForMode(collection.defaultModeId, value);
      variable.description = `Font weight ${value}`;
    }
  }
  
  // Letter Spacing Scale (as percentages for Figma: -0.05em = -5%)
  const letterSpacingScale: Record<string, number> = {
    'n050': -5, 'n025': -2.5, 'n020': -2, 'n015': -1.5, 'n010': -1,
    '000': 0,
    '010': 1, '015': 1.5, '020': 2, '025': 2.5, '050': 5, '075': 7.5, '100': 10, '150': 15,
  };
  
  for (const [name, value] of Object.entries(letterSpacingScale)) {
    const varName = `font/letterSpacing/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === collection.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, collection, 'FLOAT');
      variable.setValueForMode(collection.defaultModeId, value);
      variable.description = `${value}% letter spacing`;
    }
  }
}

// ============================================
// TEXT STYLES CREATION (для полной типографики)
// ============================================

interface TextStylePayload {
  semanticTokens: Array<{
    id: string;
    name: string;
    path: string[];
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    textDecoration?: string;
    textTransform?: string;
    fontStyle?: string;
    description?: string;
    category: string;
    subcategory?: string;
  }>;
  primitives: {
    fontFamilies: Array<{ name: string; value: string; isEnabled: boolean }>;
    fontSizes: Array<{ name: string; value: number }>;
    lineHeights: Array<{ name: string; value: number }>;
    letterSpacings: Array<{ name: string; value: number }>;
    fontWeights: Array<{ name: string; value: number; label: string }>;
  };
}

// Маппинг font-weight на стиль шрифта
function getFontStyleFromWeight(weight: number, isItalic: boolean): string {
  const weightStyles: Record<number, string> = {
    100: 'Thin',
    200: 'ExtraLight',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'SemiBold',
    700: 'Bold',
    800: 'ExtraBold',
    900: 'Black',
  };
  
  const baseStyle = weightStyles[weight] || 'Regular';
  
  // Для Regular + Italic = Italic
  if (isItalic && baseStyle === 'Regular') {
    return 'Italic';
  }
  // Для других весов + Italic = Weight Italic
  if (isItalic) {
    return `${baseStyle} Italic`;
  }
  
  return baseStyle;
}

// Парсинг токен-референса {font.size.16} → извлечение значения
function parseTokenReference(ref: string): string {
  // Убираем {} и возвращаем последнюю часть пути
  const match = ref.match(/\{font\.(\w+)\.([^}]+)\}/);
  if (match) {
    return match[2];
  }
  return ref;
}

async function createTextStyles(payload: TextStylePayload): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  
  // Получаем существующие Text Styles
  const existingStyles = await figma.getLocalTextStylesAsync();
  
  // Создаем lookup maps для примитивов
  const fontFamilyMap = new Map<string, string>();
  payload.primitives.fontFamilies
    .filter(f => f.isEnabled)
    .forEach(f => fontFamilyMap.set(f.name.toLowerCase(), f.value));
  
  const fontSizeMap = new Map<string, number>();
  payload.primitives.fontSizes.forEach(s => fontSizeMap.set(s.name, s.value));
  
  const lineHeightMap = new Map<string, number>();
  payload.primitives.lineHeights.forEach(lh => lineHeightMap.set(lh.name, lh.value));
  
  const letterSpacingMap = new Map<string, number>();
  payload.primitives.letterSpacings.forEach(ls => letterSpacingMap.set(ls.name, ls.value));
  
  const fontWeightMap = new Map<string, number>();
  payload.primitives.fontWeights.forEach(fw => fontWeightMap.set(fw.name, fw.value));
  
  for (const token of payload.semanticTokens) {
    try {
      // Построение имени стиля: typography/category/subcategory/name
      const stylePath = token.path.join('/');
      const styleName = stylePath;
      
      // Парсим значения из токен-референсов
      const fontFamilyKey = parseTokenReference(token.fontFamily);
      const fontSizeKey = parseTokenReference(token.fontSize);
      const lineHeightKey = parseTokenReference(token.lineHeight);
      const letterSpacingKey = parseTokenReference(token.letterSpacing);
      const fontWeightKey = parseTokenReference(token.fontWeight);
      
      // Получаем фактические значения
      const fontFamily = fontFamilyMap.get(fontFamilyKey.toLowerCase()) || 'Roboto';
      const fontSize = fontSizeMap.get(fontSizeKey) || 16;
      const lineHeightValue = lineHeightMap.get(lineHeightKey) || 1.4;
      const letterSpacingValue = letterSpacingMap.get(letterSpacingKey) || 0;
      const fontWeight = fontWeightMap.get(fontWeightKey) || 400;
      
      // Определяем textDecoration
      let textDecoration: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH' = 'NONE';
      if (token.textDecoration) {
        const decorationKey = parseTokenReference(token.textDecoration);
        if (decorationKey === 'underline') textDecoration = 'UNDERLINE';
        else if (decorationKey === 'line-through' || decorationKey === 'strikethrough') textDecoration = 'STRIKETHROUGH';
      }
      
      // Определяем textCase (textTransform)
      let textCase: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' = 'ORIGINAL';
      if (token.textTransform) {
        const transformKey = parseTokenReference(token.textTransform);
        if (transformKey === 'uppercase') textCase = 'UPPER';
        else if (transformKey === 'lowercase') textCase = 'LOWER';
        else if (transformKey === 'capitalize') textCase = 'TITLE';
      }
      
      // Определяем fontStyle (italic)
      const isItalic = token.fontStyle ? parseTokenReference(token.fontStyle) === 'italic' : false;
      const fontStyle = getFontStyleFromWeight(fontWeight, isItalic);
      
      // Загружаем шрифт
      let fontName: FontName = { family: fontFamily, style: fontStyle };
      try {
        await figma.loadFontAsync(fontName);
      } catch (fontError) {
        // Пробуем fallback варианты
        const fallbackStyles = ['Regular', 'Normal', 'Book'];
        let loaded = false;
        for (const fallbackStyle of fallbackStyles) {
          try {
            const fallbackFont: FontName = { family: fontFamily, style: fallbackStyle };
            await figma.loadFontAsync(fallbackFont);
            fontName = fallbackFont;
            loaded = true;
            break;
          } catch {
            continue;
          }
        }
        if (!loaded) {
          result.errors.push(`Не удалось загрузить шрифт ${fontFamily} ${fontStyle} для "${token.name}"`);
          continue;
        }
      }
      
      // Проверяем существующий стиль
      let textStyle = existingStyles.find(s => s.name === styleName);
      
      if (textStyle) {
        // Обновляем существующий
        textStyle.fontName = fontName;
        textStyle.fontSize = fontSize;
        textStyle.lineHeight = { value: lineHeightValue * 100, unit: 'PERCENT' };
        textStyle.letterSpacing = { value: letterSpacingValue * 100, unit: 'PERCENT' };
        textStyle.textDecoration = textDecoration;
        textStyle.textCase = textCase;
        if (token.description) {
          textStyle.description = token.description;
        }
        result.updated++;
      } else {
        // Создаем новый
        textStyle = figma.createTextStyle();
        textStyle.name = styleName;
        textStyle.fontName = fontName;
        textStyle.fontSize = fontSize;
        textStyle.lineHeight = { value: lineHeightValue * 100, unit: 'PERCENT' };
        textStyle.letterSpacing = { value: letterSpacingValue * 100, unit: 'PERCENT' };
        textStyle.textDecoration = textDecoration;
        textStyle.textCase = textCase;
        if (token.description) {
          textStyle.description = token.description;
        }
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания стиля "${token.name}": ${errorMessage}`);
    }
  }
  
  return result;
}

// ============================================
// COLOR PAINT STYLES
// ============================================

interface ColorPaintStylesPayload {
  colors: Array<{
    name: string;
    hex: string;
    r: number;
    g: number;
    b: number;
    a: number;
    description?: string;
    category: string;
    shade?: string;
  }>;
  includeCategories?: string[];
  structureMode: 'flat' | 'grouped';
}

/**
 * Create Paint Styles for colors
 * Structure: color/category/shade (e.g., color/brand/500, color/neutral/100)
 */
async function createColorPaintStyles(payload: ColorPaintStylesPayload): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  
  // Get existing paint styles
  const existingStyles = await figma.getLocalPaintStylesAsync();
  
  for (const color of payload.colors) {
    try {
      // Build style name based on structure mode
      let styleName: string;
      if (payload.structureMode === 'flat') {
        // Flat: color/brand-500
        styleName = color.name.replace(/\./g, '/');
      } else {
        // Grouped: color/brand/500
        styleName = color.name.replace(/\./g, '/');
      }
      
      // Ensure it starts with color/
      if (!styleName.startsWith('color/')) {
        styleName = `color/${styleName}`;
      }
      
      // Check if style already exists
      let paintStyle = existingStyles.find(s => s.name === styleName);
      
      // Create paint object
      const paint: SolidPaint = {
        type: 'SOLID',
        color: { r: color.r, g: color.g, b: color.b },
        opacity: color.a,
      };
      
      if (paintStyle) {
        // Update existing style
        paintStyle.paints = [paint];
        if (color.description) {
          paintStyle.description = color.description;
        }
        result.updated++;
      } else {
        // Create new style
        paintStyle = figma.createPaintStyle();
        paintStyle.name = styleName;
        paintStyle.paints = [paint];
        if (color.description) {
          paintStyle.description = color.description;
        }
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания стиля "${color.name}": ${errorMessage}`);
    }
  }
  
  return result;
}

// ============================================
// SYNC: APPLY CHANGES
// ============================================

interface SyncChangePayload {
  type: 'add' | 'update' | 'delete';
  variableName: string;
  figmaId?: string;
  pluginVariable?: {
    name: string;
    type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
    description?: string;
    modeValues: Record<string, any>;
    aliasTo?: string;
  };
}

interface SyncResultPayload {
  success: boolean;
  collectionName: string;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
  warnings: string[];
}

async function applySyncChanges(
  collectionName: string,
  changes: SyncChangePayload[],
  modesToAdd: string[]
): Promise<SyncResultPayload> {
  const result: SyncResultPayload = {
    success: true,
    collectionName,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [],
    warnings: [],
  };
  
  try {
    // 1. Получаем или создаём коллекцию
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    let collection = collections.find(c => c.name === collectionName);
    
    if (!collection) {
      collection = figma.variables.createVariableCollection(collectionName);
    }
    
    // 2. Добавляем новые режимы
    const modeMap = new Map<string, string>();
    for (const mode of collection.modes) {
      modeMap.set(mode.name, mode.modeId);
    }
    
    for (const modeName of modesToAdd) {
      if (!modeMap.has(modeName)) {
        try {
          // Первый режим - переименовываем default
          if (collection.modes.length === 1 && collection.modes[0].name === 'Mode 1') {
            collection.renameMode(collection.defaultModeId, modeName);
            modeMap.set(modeName, collection.defaultModeId);
          } else {
            const newModeId = collection.addMode(modeName);
            modeMap.set(modeName, newModeId);
          }
        } catch (error) {
          result.warnings.push(`Не удалось добавить режим "${modeName}": лимит Figma`);
        }
      }
    }
    
    // 3. Получаем существующие переменные
    const allVariables = await figma.variables.getLocalVariablesAsync();
    const collectionVars = allVariables.filter(v => v.variableCollectionId === collection!.id);
    const varMap = new Map<string, Variable>();
    collectionVars.forEach(v => varMap.set(v.name, v));
    
    // Также получаем все переменные для разрешения алиасов
    const allVarsByName = new Map<string, Variable>();
    allVariables.forEach(v => allVarsByName.set(v.name, v));
    
    // 4. Применяем изменения
    for (const change of changes) {
      try {
        if (change.type === 'add' && change.pluginVariable) {
          // Создаём новую переменную
          const pv = change.pluginVariable;
          const figmaType = pv.type as VariableResolvedDataType;
          
          const newVar = figma.variables.createVariable(pv.name, collection!, figmaType);
          if (pv.description) {
            newVar.description = pv.description;
          }
          
          // Устанавливаем значения для режимов
          for (const [modeName, value] of Object.entries(pv.modeValues)) {
            const modeId = modeMap.get(modeName);
            if (!modeId) continue;
            
            // Проверяем, является ли значение ссылкой на алиас
            if (pv.aliasTo) {
              const aliasVar = allVarsByName.get(pv.aliasTo);
              if (aliasVar) {
                const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: aliasVar.id };
                newVar.setValueForMode(modeId, alias);
              }
            } else if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
              // Значение - ссылка на другую переменную
              const refName = value.slice(1, -1).replace(/\./g, '/');
              const refVar = allVarsByName.get(refName);
              if (refVar) {
                const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: refVar.id };
                newVar.setValueForMode(modeId, alias);
              } else {
                // Нет переменной для алиаса - устанавливаем как число если это число
                const numValue = parseFloat(value.replace(/[{}]/g, '').split('/').pop() || '0');
                if (!isNaN(numValue)) {
                  newVar.setValueForMode(modeId, numValue);
                }
              }
            } else {
              // Обычное значение
              newVar.setValueForMode(modeId, value);
            }
          }
          
          result.created++;
          
        } else if (change.type === 'update' && change.figmaId && change.pluginVariable) {
          // Обновляем существующую переменную
          const existingVar = await figma.variables.getVariableByIdAsync(change.figmaId);
          if (!existingVar) {
            result.errors.push(`Переменная не найдена: ${change.variableName}`);
            continue;
          }
          
          const pv = change.pluginVariable;
          
          if (pv.description !== undefined) {
            existingVar.description = pv.description;
          }
          
          // Обновляем значения для режимов
          for (const [modeName, value] of Object.entries(pv.modeValues)) {
            const modeId = modeMap.get(modeName);
            if (!modeId) continue;
            
            if (pv.aliasTo) {
              const aliasVar = allVarsByName.get(pv.aliasTo);
              if (aliasVar) {
                const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: aliasVar.id };
                existingVar.setValueForMode(modeId, alias);
              }
            } else if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
              const refName = value.slice(1, -1).replace(/\./g, '/');
              const refVar = allVarsByName.get(refName);
              if (refVar) {
                const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: refVar.id };
                existingVar.setValueForMode(modeId, alias);
              }
            } else {
              existingVar.setValueForMode(modeId, value);
            }
          }
          
          result.updated++;
          
        } else if (change.type === 'delete' && change.figmaId) {
          // Удаляем переменную
          const existingVar = await figma.variables.getVariableByIdAsync(change.figmaId);
          if (existingVar) {
            existingVar.remove();
            result.deleted++;
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Ошибка для "${change.variableName}": ${errorMsg}`);
      }
    }
    
    result.success = result.errors.length === 0;
    
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }
  
  return result;
}

// ============================================
// SEMANTIC TYPOGRAPHY VARIABLES
// ============================================

interface BreakpointConfig {
  name: string;
  label: string;
  minWidth: number;
  scale: number;
}

interface TypographyDeviceValues {
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

interface SemanticTypographyVariablesPayload {
  semanticTokens: Array<{
    id: string;
    name: string;
    path: string[];
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
    letterSpacing: string;
    textDecoration?: string;
    textTransform?: string;
    fontStyle?: string;
    description?: string;
    category: string;
    subcategory?: string;
    // NEW: per-device overrides
    deviceOverrides?: Record<string, TypographyDeviceValues>;
    // NEW: auto-scale flag (default false = same value everywhere)
    responsive?: boolean;
  }>;
  primitives: {
    fontSizes: Array<{ name: string; value: number }>;
    lineHeights: Array<{ name: string; value: number }>;
    letterSpacings: Array<{ name: string; value: number }>;
    fontWeights: Array<{ name: string; value: number }>;
  };
  breakpoints?: BreakpointConfig[] | null;
}

// Вспомогательная функция для получения масштабированного значения
function getScaledValue(baseValue: number, scale: number, step: number = 2): number {
  const scaled = baseValue * scale;
  return Math.round(scaled / step) * step;
}

// Вспомогательная функция для поиска ближайшего примитива
function findClosestPrimitiveVar(
  targetValue: number, 
  primitiveVarMap: Map<string, Variable>,
  prefix: string
): Variable | null {
  let closest: Variable | null = null;
  let minDiff = Infinity;
  
  primitiveVarMap.forEach((variable, name) => {
    if (name.startsWith(prefix)) {
      // Извлекаем числовое значение из имени (например, "font/size/16" → 16)
      const valuePart = name.replace(prefix, '');
      const value = parseFloat(valuePart);
      if (!isNaN(value)) {
        const diff = Math.abs(targetValue - value);
        if (diff < minDiff) {
          minDiff = diff;
          closest = variable;
        }
      }
    }
  });
  
  return closest;
}

async function createSemanticTypographyVariables(payload: SemanticTypographyVariablesPayload): Promise<{ created: number; aliased: number; modes: number; errors: string[] }> {
  const result = { created: 0, aliased: 0, modes: 0, errors: [] as string[] };
  
  // Получаем или создаём коллекции
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) {
    primitivesCollection = figma.variables.createVariableCollection('Primitives');
  }
  
  // ВАЖНО: Сначала создаём примитивы типографики, если их ещё нет
  await createExtendedTypographyPrimitives(primitivesCollection);
  
  // Typography collection (NOT Tokens!) - for semantic typography with device modes
  let typographyCollection = collections.find(c => c.name === 'Typography');
  if (!typographyCollection) {
    typographyCollection = figma.variables.createVariableCollection('Typography');
  }
  
  // Создаём или обновляем режимы если есть breakpoints
  const modeIds: Map<string, string> = new Map();
  
  if (payload.breakpoints && payload.breakpoints.length > 0) {
    // Получаем существующие режимы
    const existingModes = typographyCollection.modes;
    
    for (let i = 0; i < payload.breakpoints.length; i++) {
      const bp = payload.breakpoints[i];
      
      // Ищем существующий режим или создаём новый
      let existingMode = existingModes.find(m => m.name === bp.label);
      
      if (existingMode) {
        modeIds.set(bp.name, existingMode.modeId);
      } else if (i === 0) {
        // Первый брейкпоинт - переименовываем default mode
        typographyCollection.renameMode(typographyCollection.defaultModeId, bp.label);
        modeIds.set(bp.name, typographyCollection.defaultModeId);
        result.modes++;
      } else {
        // Добавляем новый режим
        try {
          const newModeId = typographyCollection.addMode(bp.label);
          modeIds.set(bp.name, newModeId);
          result.modes++;
        } catch (error) {
          // Figma ограничивает количество режимов (4 для бесплатного плана)
          result.errors.push(`Не удалось создать режим "${bp.label}": лимит режимов Figma`);
        }
      }
    }
  } else {
    // Без брейкпоинтов - используем default mode
    modeIds.set('default', typographyCollection.defaultModeId);
  }
  
  // Получаем все существующие Variables
  const existingVariables = await figma.variables.getLocalVariablesAsync();
  
  // Создаём Maps для быстрого поиска примитивов
  const primitiveVarMap = new Map<string, Variable>();
  existingVariables.forEach(v => {
    if (v.variableCollectionId === primitivesCollection!.id) {
      primitiveVarMap.set(v.name, v);
    }
  });
  
  // Создаём семантические Variables со ссылками на примитивы
  for (const token of payload.semanticTokens) {
    try {
      // Имя семантической переменной: typography/page/hero/fontSize
      const tokenPath = token.path.join('/');
      
      // Извлекаем базовые значения из токена
      const baseFontSize = parseFloat(parseTokenReference(token.fontSize));
      const baseLineHeight = parseFloat(parseTokenReference(token.lineHeight));
      const letterSpacingKey = parseTokenReference(token.letterSpacing); // Ключ, не число! (e.g., 'n025', '000')
      const fontWeightKey = parseTokenReference(token.fontWeight);
      
      // Флаг responsive - если true, масштабируем; если false - одинаковое значение везде
      const isResponsive = token.responsive === true;
      
      // =============== fontSize ===============
      const fontSizeVarName = `${tokenPath}/fontSize`;
      let fontSizeVar = existingVariables.find(v => 
        v.name === fontSizeVarName && v.variableCollectionId === typographyCollection!.id
      );
      
      if (!fontSizeVar) {
        fontSizeVar = figma.variables.createVariable(fontSizeVarName, typographyCollection!, 'FLOAT');
        result.created++;
      }
      fontSizeVar.description = `${token.description || token.name} - Font size`;
      
      // Устанавливаем значения для каждого режима
      if (payload.breakpoints && payload.breakpoints.length > 0) {
        for (const bp of payload.breakpoints) {
          const modeId = modeIds.get(bp.name);
          if (!modeId) continue;
          
          // Определяем значение для этого breakpoint
          let targetFontSize: number;
          
          // 1. Проверяем deviceOverrides
          const deviceOverride = token.deviceOverrides?.[bp.name];
          if (deviceOverride?.fontSize) {
            targetFontSize = parseFloat(parseTokenReference(deviceOverride.fontSize));
          } 
          // 2. Если responsive=true, масштабируем базовое значение
          else if (isResponsive) {
            targetFontSize = getScaledValue(baseFontSize, bp.scale, 2);
          }
          // 3. Иначе используем базовое значение (одинаковое везде)
          else {
            targetFontSize = baseFontSize;
          }
          
          const closestPrimitive = findClosestPrimitiveVar(targetFontSize, primitiveVarMap, 'font/size/');
          
          if (closestPrimitive) {
            const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: closestPrimitive.id };
            fontSizeVar.setValueForMode(modeId, alias);
            result.aliased++;
          }
        }
      } else {
        // Без режимов - ищем точное совпадение примитива
        const fontSizePrimitiveName = `font/size/${baseFontSize}`;
        const fontSizePrimitive = primitiveVarMap.get(fontSizePrimitiveName);
        if (fontSizePrimitive) {
          const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: fontSizePrimitive.id };
          fontSizeVar.setValueForMode(typographyCollection!.defaultModeId, alias);
          result.aliased++;
        }
      }
      
      // =============== lineHeight ===============
      const lineHeightVarName = `${tokenPath}/lineHeight`;
      let lineHeightVar = existingVariables.find(v => 
        v.name === lineHeightVarName && v.variableCollectionId === typographyCollection!.id
      );
      
      if (!lineHeightVar) {
        lineHeightVar = figma.variables.createVariable(lineHeightVarName, typographyCollection!, 'FLOAT');
        result.created++;
      }
      lineHeightVar.description = `${token.description || token.name} - Line height`;
      
      if (payload.breakpoints && payload.breakpoints.length > 0) {
        for (const bp of payload.breakpoints) {
          const modeId = modeIds.get(bp.name);
          if (!modeId) continue;
          
          // Определяем значение для этого breakpoint
          let targetLineHeight: number;
          
          const deviceOverride = token.deviceOverrides?.[bp.name];
          if (deviceOverride?.lineHeight) {
            targetLineHeight = parseFloat(parseTokenReference(deviceOverride.lineHeight));
          } else if (isResponsive) {
            targetLineHeight = getScaledValue(baseLineHeight, bp.scale, 5);
          } else {
            targetLineHeight = baseLineHeight;
          }
          
          const closestPrimitive = findClosestPrimitiveVar(targetLineHeight, primitiveVarMap, 'font/lineHeight/');
          
          if (closestPrimitive) {
            const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: closestPrimitive.id };
            lineHeightVar.setValueForMode(modeId, alias);
            result.aliased++;
          }
        }
      } else {
        const lineHeightPrimitiveName = `font/lineHeight/${baseLineHeight}`;
        const lineHeightPrimitive = primitiveVarMap.get(lineHeightPrimitiveName);
        if (lineHeightPrimitive) {
          const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: lineHeightPrimitive.id };
          lineHeightVar.setValueForMode(typographyCollection!.defaultModeId, alias);
          result.aliased++;
        }
      }
      
      // =============== letterSpacing ===============
      const letterSpacingVarName = `${tokenPath}/letterSpacing`;
      let letterSpacingVar = existingVariables.find(v => 
        v.name === letterSpacingVarName && v.variableCollectionId === typographyCollection!.id
      );
      
      if (!letterSpacingVar) {
        letterSpacingVar = figma.variables.createVariable(letterSpacingVarName, typographyCollection!, 'FLOAT');
        result.created++;
      }
      letterSpacingVar.description = `${token.description || token.name} - Letter spacing`;
      
      // Letter spacing обычно не масштабируется, используем одинаковое значение для всех режимов
      // Ключ типа 'n025', '000', '010' - ищем примитив напрямую по имени
      const letterSpacingPrimitiveName = `font/letterSpacing/${letterSpacingKey}`;
      const letterSpacingPrimitive = primitiveVarMap.get(letterSpacingPrimitiveName);
      
      if (letterSpacingPrimitive) {
        if (payload.breakpoints && payload.breakpoints.length > 0) {
          for (const bp of payload.breakpoints) {
            const modeId = modeIds.get(bp.name);
            if (modeId) {
              const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: letterSpacingPrimitive.id };
              letterSpacingVar.setValueForMode(modeId, alias);
              result.aliased++;
            }
          }
        } else {
          const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: letterSpacingPrimitive.id };
          letterSpacingVar.setValueForMode(typographyCollection!.defaultModeId, alias);
          result.aliased++;
        }
      }
      
      // =============== fontWeight ===============
      const fontWeightPrimitiveName = `font/weight/${fontWeightKey}`;
      const fontWeightPrimitive = primitiveVarMap.get(fontWeightPrimitiveName);
      
      if (fontWeightPrimitive) {
        const fontWeightVarName = `${tokenPath}/fontWeight`;
        let fontWeightVar = existingVariables.find(v => 
          v.name === fontWeightVarName && v.variableCollectionId === typographyCollection!.id
        );
        
        if (!fontWeightVar) {
          fontWeightVar = figma.variables.createVariable(fontWeightVarName, typographyCollection!, 'FLOAT');
          result.created++;
        }
        fontWeightVar.description = `${token.description || token.name} - Font weight`;
        
        // Font weight не масштабируется
        if (payload.breakpoints && payload.breakpoints.length > 0) {
          for (const bp of payload.breakpoints) {
            const modeId = modeIds.get(bp.name);
            if (modeId) {
              const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: fontWeightPrimitive.id };
              fontWeightVar.setValueForMode(modeId, alias);
              result.aliased++;
            }
          }
        } else {
          const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: fontWeightPrimitive.id };
          fontWeightVar.setValueForMode(typographyCollection!.defaultModeId, alias);
          result.aliased++;
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания переменных для "${token.name}": ${errorMessage}`);
    }
  }
  
  return result;
}

// ============================================
// SPACING VARIABLES
// ============================================

// ============================================
// GAP PRIMITIVES & SEMANTIC
// ============================================

async function createGapPrimitives(primitives: Array<{ name: string; value: number }>): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  
  // Get or create Primitives collection
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  
  if (!primitivesCollection) {
    primitivesCollection = figma.variables.createVariableCollection('Primitives');
  }
  
  // Get existing variables
  const existingVariables = await figma.variables.getLocalVariablesAsync();
  
  for (const prim of primitives) {
    try {
      const varName = `gap/${prim.name}`;
      
      // Check if exists
      let existingVar = existingVariables.find(v => 
        v.name === varName && v.variableCollectionId === primitivesCollection!.id
      );
      
      if (existingVar) {
        // Update value
        existingVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        result.updated++;
      } else {
        // Create new
        const newVar = figma.variables.createVariable(varName, primitivesCollection, 'FLOAT');
        newVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        newVar.description = `${prim.value}px`;
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания gap/${prim.name}: ${errorMessage}`);
    }
  }
  
  return result;
}

interface GapSemanticData {
  tokens: Array<{
    id: string;       // "g-1"
    path: string;     // "gap.inline.icon"
    desktop: string;  // "4" (primitive name)
    tablet: string;   // "4"
    mobile: string;   // "4"
  }>;
}

async function createGapSemanticCollection(data: GapSemanticData): Promise<{ created: number; aliased: number; errors: string[] }> {
  const result = { created: 0, aliased: 0, errors: [] as string[] };
  
  // Get all collections
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  // Find Primitives collection
  const primitivesCollection = collections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) {
    result.errors.push('Коллекция Primitives не найдена. Сначала создайте примитивы.');
    return result;
  }
  
  // Find or create Gap collection
  let gapCollection = collections.find(c => c.name === 'Gap');
  if (!gapCollection) {
    gapCollection = figma.variables.createVariableCollection('Gap');
  }
  
  // Setup modes: Desktop, Tablet, Mobile
  const modeNames = ['Desktop', 'Tablet', 'Mobile'];
  const modeIds: { [key: string]: string } = {};
  
  // Get existing modes
  const existingModes = gapCollection.modes;
  
  // Rename first mode to Desktop
  if (existingModes.length > 0) {
    gapCollection.renameMode(existingModes[0].modeId, 'Desktop');
    modeIds['Desktop'] = existingModes[0].modeId;
  }
  
  // Add Tablet and Mobile modes if they don't exist
  for (let i = 1; i < modeNames.length; i++) {
    const modeName = modeNames[i];
    const existingMode = gapCollection.modes.find(m => m.name === modeName);
    
    if (existingMode) {
      modeIds[modeName] = existingMode.modeId;
    } else {
      const newModeId = gapCollection.addMode(modeName);
      modeIds[modeName] = newModeId;
    }
  }
  
  // Get all existing variables
  const allVariables = await figma.variables.getLocalVariablesAsync('FLOAT');
  
  // Create map of primitive variables (gap/0, gap/4, gap/8...)
  const primitiveVarMap = new Map<string, Variable>();
  allVariables.forEach(v => {
    if (v.variableCollectionId === primitivesCollection.id) {
      // v.name is "gap/16", extract "16"
      const match = v.name.match(/gap\/(\d+)/);
      if (match) {
        primitiveVarMap.set(match[1], v);
      }
    }
  });
  
  // Existing semantic variables in Gap collection
  const existingGapVars = allVariables.filter(v => v.variableCollectionId === gapCollection!.id);
  const existingVarMap = new Map<string, Variable>();
  existingGapVars.forEach(v => existingVarMap.set(v.name, v));
  
  // Create/update semantic tokens with device modes
  for (const token of data.tokens) {
    try {
      // Convert path: "gap.inline.icon" -> "gap/inline/icon"
      const varName = token.path.replace(/\./g, '/');
      
      // Get or create variable
      let variable = existingVarMap.get(varName);
      if (!variable) {
        variable = figma.variables.createVariable(varName, gapCollection!, 'FLOAT');
        result.created++;
      }
      
      // Set alias for Desktop mode
      const desktopPrimitive = primitiveVarMap.get(token.desktop);
      if (desktopPrimitive && modeIds['Desktop']) {
        const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: desktopPrimitive.id };
        variable.setValueForMode(modeIds['Desktop'], alias);
        result.aliased++;
      }
      
      // Set alias for Tablet mode
      const tabletPrimitive = primitiveVarMap.get(token.tablet);
      if (tabletPrimitive && modeIds['Tablet']) {
        const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: tabletPrimitive.id };
        variable.setValueForMode(modeIds['Tablet'], alias);
        result.aliased++;
      }
      
      // Set alias for Mobile mode
      const mobilePrimitive = primitiveVarMap.get(token.mobile);
      if (mobilePrimitive && modeIds['Mobile']) {
        const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: mobilePrimitive.id };
        variable.setValueForMode(modeIds['Mobile'], alias);
        result.aliased++;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания ${token.path}: ${errorMessage}`);
    }
  }
  
  return result;
}

// ============================================
// RADIUS PRIMITIVES & SEMANTIC
// ============================================

async function createRadiusPrimitives(primitives: Array<{ name: string; value: number }>): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  
  // Get or create Primitives collection
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  
  if (!primitivesCollection) {
    primitivesCollection = figma.variables.createVariableCollection('Primitives');
  }
  
  // Get existing variables
  const existingVariables = await figma.variables.getLocalVariablesAsync();
  
  for (const prim of primitives) {
    try {
      const varName = `radius/${prim.name}`;
      
      // Check if exists
      let existingVar = existingVariables.find(v => 
        v.name === varName && v.variableCollectionId === primitivesCollection!.id
      );
      
      if (existingVar) {
        // Update value
        existingVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        result.updated++;
      } else {
        // Create new
        const newVar = figma.variables.createVariable(varName, primitivesCollection, 'FLOAT');
        newVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        newVar.description = prim.name === 'full' ? '9999px (full round)' : `${prim.value}px`;
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания radius/${prim.name}: ${errorMessage}`);
    }
  }
  
  return result;
}

interface RadiusSemanticData {
  tokens: Array<{
    id: string;          // "r-1"
    path: string;        // "radius.interactive.button"
    primitiveRef: string; // "6", "full", "0"
  }>;
}

async function createRadiusSemanticCollection(data: RadiusSemanticData): Promise<{ created: number; aliased: number; errors: string[] }> {
  const result = { created: 0, aliased: 0, errors: [] as string[] };
  
  // Get all collections
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  // Find Primitives collection
  const primitivesCollection = collections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) {
    result.errors.push('Коллекция Primitives не найдена. Сначала создайте примитивы.');
    return result;
  }
  
  // Find or create Radius collection
  let radiusCollection = collections.find(c => c.name === 'Radius');
  if (!radiusCollection) {
    radiusCollection = figma.variables.createVariableCollection('Radius');
  }
  
  // Get all existing variables
  const allVariables = await figma.variables.getLocalVariablesAsync('FLOAT');
  
  // Create map of primitive variables (radius/0, radius/4, radius/full...)
  const primitiveVarMap = new Map<string, Variable>();
  allVariables.forEach(v => {
    if (v.variableCollectionId === primitivesCollection.id) {
      // v.name is "radius/16" or "radius/full", extract "16" or "full"
      const match = v.name.match(/radius\/(.+)/);
      if (match) {
        primitiveVarMap.set(match[1], v);
      }
    }
  });
  
  // Existing semantic variables in Radius collection
  const existingRadiusVars = allVariables.filter(v => v.variableCollectionId === radiusCollection!.id);
  const existingVarMap = new Map<string, Variable>();
  existingRadiusVars.forEach(v => existingVarMap.set(v.name, v));
  
  // Create/update semantic tokens
  for (const token of data.tokens) {
    try {
      // Convert path: "radius.interactive.button" -> "radius/interactive/button"
      const varName = token.path.replace(/\./g, '/');
      
      // Get or create variable
      let variable = existingVarMap.get(varName);
      if (!variable) {
        variable = figma.variables.createVariable(varName, radiusCollection!, 'FLOAT');
        result.created++;
      }
      
      // Set alias to primitive
      const primitive = primitiveVarMap.get(token.primitiveRef);
      if (primitive) {
        const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: primitive.id };
        variable.setValueForMode(radiusCollection.defaultModeId, alias);
        result.aliased++;
      } else {
        result.errors.push(`Примитив radius/${token.primitiveRef} не найден для ${token.path}`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания ${token.path}: ${errorMessage}`);
    }
  }
  
  return result;
}

// ============================================
// STROKE (BORDER) PRIMITIVES & SEMANTIC
// ============================================

interface StrokePrimitivesPayload {
  widths: Array<{ name: string; value: number }>;   // stroke.width.0 = 0, stroke.width.1 = 1, etc.
  styles: Array<{ name: string; value: string }>;   // stroke.style.none = "none", stroke.style.solid = "solid"
  dashArrays: Array<{ name: string; value: string }>; // stroke.dashArray.default = "4, 4"
}

async function createStrokePrimitives(payload: StrokePrimitivesPayload): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  
  // Get or create Primitives collection
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  
  if (!primitivesCollection) {
    primitivesCollection = figma.variables.createVariableCollection('Primitives');
  }
  
  // Get existing variables
  const existingVariables = await figma.variables.getLocalVariablesAsync();
  const existingFloats = existingVariables.filter(v => v.resolvedType === 'FLOAT');
  const existingStrings = existingVariables.filter(v => v.resolvedType === 'STRING');
  
  // Create WIDTH primitives (NUMBER/FLOAT)
  for (const prim of payload.widths || []) {
    try {
      const varName = `stroke/width/${prim.name}`;
      
      let existingVar = existingFloats.find(v => 
        v.name === varName && v.variableCollectionId === primitivesCollection!.id
      );
      
      if (existingVar) {
        existingVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        result.updated++;
      } else {
        const newVar = figma.variables.createVariable(varName, primitivesCollection, 'FLOAT');
        newVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        newVar.description = `Border width ${prim.value}px`;
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания stroke/width/${prim.name}: ${errorMessage}`);
    }
  }
  
  // Create STYLE primitives (STRING)
  for (const prim of payload.styles || []) {
    try {
      const varName = `stroke/style/${prim.name}`;
      
      let existingVar = existingStrings.find(v => 
        v.name === varName && v.variableCollectionId === primitivesCollection!.id
      );
      
      if (existingVar) {
        existingVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        result.updated++;
      } else {
        const newVar = figma.variables.createVariable(varName, primitivesCollection, 'STRING');
        newVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        newVar.description = `Border style: ${prim.value}`;
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания stroke/style/${prim.name}: ${errorMessage}`);
    }
  }
  
  // Create DASH ARRAY primitives (STRING)
  for (const prim of payload.dashArrays || []) {
    try {
      const varName = `stroke/dashArray/${prim.name}`;
      
      let existingVar = existingStrings.find(v => 
        v.name === varName && v.variableCollectionId === primitivesCollection!.id
      );
      
      if (existingVar) {
        existingVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        result.updated++;
      } else {
        const newVar = figma.variables.createVariable(varName, primitivesCollection, 'STRING');
        newVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        newVar.description = `Dash pattern: ${prim.value}`;
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания stroke/dashArray/${prim.name}: ${errorMessage}`);
    }
  }
  
  // NOTE: Stroke COLOR primitives are NOT created here!
  // Stroke semantic tokens reference colors directly from Tokens collection (border/*, stroke/*)
  // This provides automatic light/dark mode support
  
  return result;
}

// ============================================
// STROKE SEMANTIC COLLECTION
// ============================================

interface StrokeSemanticData {
  tokens: Array<{
    id: string;                          // "st-1"
    path: string;                        // "stroke.button.default.width"
    category: string;                    // "button"
    property: 'width' | 'style' | 'color';
    widthRef?: string;                   // "1" (primitive name)
    styleRef?: string;                   // "solid"
    colorRef?: string;                   // "neutral.300"
  }>;
}

async function createStrokeSemanticCollection(data: StrokeSemanticData): Promise<{ created: number; aliased: number; errors: string[] }> {
  const result = { created: 0, aliased: 0, errors: [] as string[] };
  
  // Get all collections
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  // Find Primitives collection (for width, style)
  const primitivesCollection = collections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) {
    result.errors.push('Коллекция Primitives не найдена. Сначала создайте примитивы.');
    return result;
  }
  
  // Find Tokens collection (for colors) - this has light/dark modes!
  const tokensCollection = collections.find(c => c.name === 'Tokens');
  if (!tokensCollection) {
    result.errors.push('Коллекция Tokens не найдена. Сначала синхронизируйте цвета.');
    return result;
  }
  
  // Find or create Stroke collection
  let strokeCollection = collections.find(c => c.name === 'Stroke');
  if (!strokeCollection) {
    strokeCollection = figma.variables.createVariableCollection('Stroke');
  }
  
  // Get all existing variables
  const allVariables = await figma.variables.getLocalVariablesAsync();
  
  // Create maps of primitive variables (width, style from Primitives)
  const widthPrimitiveMap = new Map<string, Variable>();
  const stylePrimitiveMap = new Map<string, Variable>();
  
  allVariables.forEach(v => {
    if (v.variableCollectionId === primitivesCollection.id) {
      // Width: stroke/width/1 -> "1"
      const widthMatch = v.name.match(/stroke\/width\/(.+)/);
      if (widthMatch && v.resolvedType === 'FLOAT') {
        widthPrimitiveMap.set(widthMatch[1], v);
      }
      
      // Style: stroke/style/solid -> "solid"
      const styleMatch = v.name.match(/stroke\/style\/(.+)/);
      if (styleMatch && v.resolvedType === 'STRING') {
        stylePrimitiveMap.set(styleMatch[1], v);
      }
    }
  });
  
  // Create map of color tokens from Tokens collection
  // These have format: border/default/default, stroke/focus, etc.
  const colorTokenMap = new Map<string, Variable>();
  allVariables.forEach(v => {
    if (v.variableCollectionId === tokensCollection.id && v.resolvedType === 'COLOR') {
      // Store by full name and also by shorthand
      colorTokenMap.set(v.name, v);
      
      // Also map common patterns:
      // "border/default/default" -> "default"
      // "border/subtle/subtle" -> "subtle"
      // "stroke/focus" -> "focus"
      const parts = v.name.split('/');
      if (parts.length >= 2) {
        const lastPart = parts[parts.length - 1];
        // Map by last part for easy lookup
        if (!colorTokenMap.has(lastPart)) {
          colorTokenMap.set(lastPart, v);
        }
      }
    }
  });
  
  // Existing semantic variables in Stroke collection
  const existingStrokeVars = allVariables.filter(v => v.variableCollectionId === strokeCollection!.id);
  const existingVarMap = new Map<string, Variable>();
  existingStrokeVars.forEach(v => existingVarMap.set(v.name, v));
  
  // Create/update semantic tokens
  for (const token of data.tokens) {
    try {
      // Convert path: "stroke.button.default.width" -> "stroke/button/default/width"
      const varName = token.path.replace(/\./g, '/');
      
      // Determine variable type based on property
      let varType: VariableResolvedDataType;
      let primitive: Variable | undefined;
      
      if (token.property === 'width') {
        varType = 'FLOAT';
        if (token.widthRef) {
          primitive = widthPrimitiveMap.get(token.widthRef);
        }
      } else if (token.property === 'style') {
        varType = 'STRING';
        if (token.styleRef) {
          primitive = stylePrimitiveMap.get(token.styleRef);
        }
      } else if (token.property === 'color') {
        varType = 'COLOR';
        if (token.colorRef) {
          // Try to find color in Tokens collection
          // colorRef can be: "border/default/default", "stroke/focus", "default", etc.
          primitive = colorTokenMap.get(token.colorRef);
          
          // If not found, try common patterns
          if (!primitive) {
            // Try with "border/" prefix
            primitive = colorTokenMap.get(`border/${token.colorRef}/${token.colorRef}`);
          }
          if (!primitive) {
            // Try with "stroke/" prefix
            primitive = colorTokenMap.get(`stroke/${token.colorRef}`);
          }
          if (!primitive) {
            // Try stroke/default/default pattern
            primitive = colorTokenMap.get(`stroke/${token.colorRef}/${token.colorRef}`);
          }
        }
      } else {
        result.errors.push(`Неизвестное свойство: ${token.property} для ${token.path}`);
        continue;
      }
      
      // Get or create variable
      let variable = existingVarMap.get(varName);
      if (!variable) {
        variable = figma.variables.createVariable(varName, strokeCollection!, varType);
        result.created++;
      }
      
      // Set alias to primitive/token
      if (primitive) {
        const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: primitive.id };
        variable.setValueForMode(strokeCollection.defaultModeId, alias);
        result.aliased++;
      } else {
        // Set default value if primitive not found
        if (token.property === 'width') {
          const defaultValue = parseFloat(token.widthRef || '1');
          variable.setValueForMode(strokeCollection.defaultModeId, isNaN(defaultValue) ? 1 : defaultValue);
          console.warn(`[Stroke] Примитив stroke/width/${token.widthRef} не найден для ${token.path}, используется значение ${defaultValue}`);
        } else if (token.property === 'style') {
          variable.setValueForMode(strokeCollection.defaultModeId, token.styleRef || 'solid');
          console.warn(`[Stroke] Примитив stroke/style/${token.styleRef} не найден для ${token.path}, используется значение "${token.styleRef || 'solid'}"`);
        } else if (token.property === 'color') {
          // Default gray color - this means the color token wasn't found
          variable.setValueForMode(strokeCollection.defaultModeId, { r: 0.8, g: 0.8, b: 0.8, a: 1 });
          console.warn(`[Stroke] Цвет "${token.colorRef}" не найден в Tokens коллекции для ${token.path}`);
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания ${token.path}: ${errorMessage}`);
      console.error(`[Stroke] Error creating ${token.path}:`, error);
    }
  }
  
  return result;
}

// ============================================
// GRID (LAYOUT GRID) PRIMITIVES & SEMANTIC
// ============================================

interface GridPrimitivesPayload {
  gutters: Array<{ name: string; value: number }>;    // grid/gutter/16 = 16
  margins: Array<{ name: string; value: number }>;    // grid/margin/24 = 24
  containers: Array<{ name: string; value: number }>; // grid/container/1280 = 1280
}

async function createGridPrimitives(payload: GridPrimitivesPayload): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  
  // Get or create Primitives collection
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  
  if (!primitivesCollection) {
    primitivesCollection = figma.variables.createVariableCollection('Primitives');
  }
  
  // Get existing variables
  const existingVariables = await figma.variables.getLocalVariablesAsync();
  const existingFloats = existingVariables.filter(v => v.resolvedType === 'FLOAT');
  
  // Create GUTTER primitives (for Layout Grid gutter property)
  for (const prim of payload.gutters || []) {
    try {
      const varName = `grid/gutter/${prim.name}`;
      
      let existingVar = existingFloats.find(v => 
        v.name === varName && v.variableCollectionId === primitivesCollection!.id
      );
      
      if (existingVar) {
        existingVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        result.updated++;
      } else {
        const newVar = figma.variables.createVariable(varName, primitivesCollection, 'FLOAT');
        newVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        newVar.description = `Grid gutter ${prim.value}px`;
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания grid/gutter/${prim.name}: ${errorMessage}`);
    }
  }
  
  // Create MARGIN primitives (for Layout Grid offset/margin property)
  for (const prim of payload.margins || []) {
    try {
      const varName = `grid/margin/${prim.name}`;
      
      let existingVar = existingFloats.find(v => 
        v.name === varName && v.variableCollectionId === primitivesCollection!.id
      );
      
      if (existingVar) {
        existingVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        result.updated++;
      } else {
        const newVar = figma.variables.createVariable(varName, primitivesCollection, 'FLOAT');
        newVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        newVar.description = `Grid margin ${prim.value}px`;
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания grid/margin/${prim.name}: ${errorMessage}`);
    }
  }
  
  // Create CONTAINER primitives (max width values)
  for (const prim of payload.containers || []) {
    try {
      const varName = `grid/container/${prim.name}`;
      
      let existingVar = existingFloats.find(v => 
        v.name === varName && v.variableCollectionId === primitivesCollection!.id
      );
      
      if (existingVar) {
        existingVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        result.updated++;
      } else {
        const newVar = figma.variables.createVariable(varName, primitivesCollection, 'FLOAT');
        newVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        newVar.description = `Container max-width ${prim.value}px`;
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания grid/container/${prim.name}: ${errorMessage}`);
    }
  }
  
  return result;
}

// ============================================
// GRID SEMANTIC COLLECTION
// ============================================

interface GridSemanticData {
  tokens: Array<{
    id: string;                          // "gr-1"
    path: string;                        // "grid/page/main"
    category?: string;                   // "page"
    desktop: { columns: number; gutter: string; margin: string; alignment: string; maxWidth?: string };
    tablet: { columns: number; gutter: string; margin: string; alignment: string; maxWidth?: string };
    mobile: { columns: number; gutter: string; margin: string; alignment: string; maxWidth?: string };
  }>;
}

async function createGridSemanticCollection(data: GridSemanticData): Promise<{ created: number; aliased: number; errors: string[] }> {
  const result = { created: 0, aliased: 0, errors: [] as string[] };
  
  try {
    // Get all collections
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    
    // Find Primitives collection
    const primitivesCollection = collections.find(c => c.name === 'Primitives');
    if (!primitivesCollection) {
      result.errors.push('Коллекция Primitives не найдена. Сначала создайте примитивы.');
      return result;
    }
    
    // Find or create Grid collection with device modes
    let gridCollection = collections.find(c => c.name === 'Grid');
    if (!gridCollection) {
      gridCollection = figma.variables.createVariableCollection('Grid');
      console.log('[Grid] Created new Grid collection');
    }
    
    // Setup modes: Desktop, Tablet, Mobile
    const modeNames = ['Desktop', 'Tablet', 'Mobile'];
    const modeIds: { [key: string]: string } = {};
    
    // Get existing modes
    const existingModes = gridCollection.modes;
    console.log('[Grid] Existing modes:', existingModes.map(m => m.name));
    
    // Rename first mode to Desktop if it's not already
    if (existingModes.length > 0 && existingModes[0].name !== 'Desktop') {
      gridCollection.renameMode(existingModes[0].modeId, 'Desktop');
    }
    modeIds['Desktop'] = existingModes[0].modeId;
    
    // Add Tablet and Mobile modes if they don't exist
    for (let i = 1; i < modeNames.length; i++) {
      const modeName = modeNames[i];
      const existingMode = gridCollection.modes.find(m => m.name === modeName);
      
      if (existingMode) {
        modeIds[modeName] = existingMode.modeId;
      } else {
        try {
          const newModeId = gridCollection.addMode(modeName);
          modeIds[modeName] = newModeId;
          console.log(`[Grid] Added mode: ${modeName}`);
        } catch (modeError) {
          console.error(`[Grid] Error adding mode ${modeName}:`, modeError);
          result.errors.push(`Не удалось добавить режим ${modeName}: ${modeError instanceof Error ? modeError.message : String(modeError)}`);
        }
      }
    }
    
    console.log('[Grid] Mode IDs:', modeIds);
    
    // Get all existing FLOAT variables
    const allVariables = await figma.variables.getLocalVariablesAsync('FLOAT');
    
    // Create maps of primitive variables
    const gutterMap = new Map<string, Variable>();
    const marginMap = new Map<string, Variable>();
    const containerMap = new Map<string, Variable>();
    
    allVariables.forEach(v => {
      if (v.variableCollectionId === primitivesCollection.id) {
        // Gutter: grid/gutter/16 -> "16"
        const gutterMatch = v.name.match(/grid\/gutter\/(.+)/);
        if (gutterMatch) {
          gutterMap.set(gutterMatch[1], v);
        }
        
        // Margin: grid/margin/24 -> "24"
        const marginMatch = v.name.match(/grid\/margin\/(.+)/);
        if (marginMatch) {
          marginMap.set(marginMatch[1], v);
        }
        
        // Container: grid/container/1280 -> "1280"
        const containerMatch = v.name.match(/grid\/container\/(.+)/);
        if (containerMatch) {
          containerMap.set(containerMatch[1], v);
        }
      }
    });
    
    console.log('[Grid] Primitives found:', {
      gutters: Array.from(gutterMap.keys()),
      margins: Array.from(marginMap.keys()),
      containers: Array.from(containerMap.keys())
    });
    
    // Existing semantic variables in Grid collection
    const existingGridVars = allVariables.filter(v => v.variableCollectionId === gridCollection!.id);
    const existingVarMap = new Map<string, Variable>();
    existingGridVars.forEach(v => existingVarMap.set(v.name, v));
    
    console.log('[Grid] Existing Grid variables:', existingGridVars.length);
    console.log('[Grid] Starting token creation for', data.tokens.length, 'tokens');
    
    // For each semantic token, create 4 variables with 3 modes each:
    // - {path}/columns (Desktop: 12, Tablet: 8, Mobile: 4)
    // - {path}/gutter (alias to primitives per mode)
    // - {path}/margin (alias to primitives per mode)
    // - {path}/maxWidth (alias to primitives per mode, optional)
    
    for (const token of data.tokens) {
      // Convert dots to slashes for valid Figma variable names
      // layout.grid.page.default -> layout/grid/page/default
      const basePath = token.path.replace(/\./g, '/');
      
      console.log(`[Grid] Processing token: ${token.path} -> ${basePath}`, {
        desktop: token.desktop,
        tablet: token.tablet,
        mobile: token.mobile
      });
      
      try {
        // 1. Create columns variable
        const columnsVarName = `${basePath}/columns`;
        console.log(`[Grid] Creating columns var: ${columnsVarName}`);
        let columnsVar = existingVarMap.get(columnsVarName);
        if (!columnsVar) {
          columnsVar = figma.variables.createVariable(columnsVarName, gridCollection!, 'FLOAT');
          result.created++;
          console.log(`[Grid] Created: ${columnsVarName}`);
        }
        
        // Set columns for each mode
        console.log(`[Grid] Setting columns for modes:`, modeIds);
        if (modeIds['Desktop']) columnsVar.setValueForMode(modeIds['Desktop'], token.desktop.columns);
        if (modeIds['Tablet']) columnsVar.setValueForMode(modeIds['Tablet'], token.tablet.columns);
        if (modeIds['Mobile']) columnsVar.setValueForMode(modeIds['Mobile'], token.mobile.columns);
        
        // 2. Create gutter variable with aliases to Primitives
        const gutterVarName = `${basePath}/gutter`;
        console.log(`[Grid] Creating gutter var: ${gutterVarName}`);
        let gutterVar = existingVarMap.get(gutterVarName);
        if (!gutterVar) {
          gutterVar = figma.variables.createVariable(gutterVarName, gridCollection!, 'FLOAT');
          result.created++;
        }
        
        // Set gutter for each mode
        const setGutterForMode = (modeName: string, gutterValue: string) => {
          const modeId = modeIds[modeName];
          if (!modeId) return;
          
          const gutterPrimitive = gutterMap.get(gutterValue);
          if (gutterPrimitive) {
            const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: gutterPrimitive.id };
            gutterVar!.setValueForMode(modeId, alias);
            result.aliased++;
          } else {
            gutterVar!.setValueForMode(modeId, parseFloat(gutterValue) || 16);
          }
        };
        
        setGutterForMode('Desktop', token.desktop.gutter);
        setGutterForMode('Tablet', token.tablet.gutter);
        setGutterForMode('Mobile', token.mobile.gutter);
        
        // 3. Create margin variable with aliases to Primitives
        const marginVarName = `${basePath}/margin`;
        let marginVar = existingVarMap.get(marginVarName);
        if (!marginVar) {
          marginVar = figma.variables.createVariable(marginVarName, gridCollection!, 'FLOAT');
          result.created++;
        }
        
        // Set margin for each mode
        const setMarginForMode = (modeName: string, marginValue: string) => {
          const modeId = modeIds[modeName];
          if (!modeId) return;
          
          const marginPrimitive = marginMap.get(marginValue);
          if (marginPrimitive) {
            const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: marginPrimitive.id };
            marginVar!.setValueForMode(modeId, alias);
            result.aliased++;
          } else {
            marginVar!.setValueForMode(modeId, parseFloat(marginValue) || 24);
          }
        };
        
        setMarginForMode('Desktop', token.desktop.margin);
        setMarginForMode('Tablet', token.tablet.margin);
        setMarginForMode('Mobile', token.mobile.margin);
        
        // 4. Create maxWidth variable if specified in any mode
        if (token.desktop.maxWidth || token.tablet.maxWidth || token.mobile.maxWidth) {
          const maxWidthVarName = `${basePath}/maxWidth`;
          let maxWidthVar = existingVarMap.get(maxWidthVarName);
          if (!maxWidthVar) {
            maxWidthVar = figma.variables.createVariable(maxWidthVarName, gridCollection!, 'FLOAT');
            result.created++;
          }
          
          // Set maxWidth for each mode
          const setMaxWidthForMode = (modeName: string, maxWidthValue?: string) => {
            const modeId = modeIds[modeName];
            if (!modeId || !maxWidthValue) return;
            
            const containerPrimitive = containerMap.get(maxWidthValue);
            if (containerPrimitive) {
              const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: containerPrimitive.id };
              maxWidthVar!.setValueForMode(modeId, alias);
              result.aliased++;
            } else {
              maxWidthVar!.setValueForMode(modeId, parseFloat(maxWidthValue) || 1280);
            }
          };
          
          setMaxWidthForMode('Desktop', token.desktop.maxWidth);
          setMaxWidthForMode('Tablet', token.tablet.maxWidth);
          setMaxWidthForMode('Mobile', token.mobile.maxWidth);
        }
        
      } catch (tokenError) {
        const errorMessage = tokenError instanceof Error 
          ? `${tokenError.message} | Stack: ${tokenError.stack}` 
          : JSON.stringify(tokenError);
        result.errors.push(`${basePath}: ${errorMessage}`);
        console.log(`[Grid] Error creating ${basePath}:`, errorMessage);
      }
    }
    
  } catch (globalError) {
    const errorMessage = globalError instanceof Error 
      ? `${globalError.message} | Stack: ${globalError.stack}` 
      : JSON.stringify(globalError);
    result.errors.push(`Глобальная ошибка: ${errorMessage}`);
    console.log('[Grid] Global error:', errorMessage);
  }
  
  return result;
}

// ============================================
// APPLY GRID TO FRAME
// ============================================

async function applyGridToFrame(
  frame: FrameNode, 
  tokenName: string, 
  breakpoint: 'desktop' | 'tablet' | 'mobile'
): Promise<{ success: boolean }> {
  // Get Grid collection (where Grid semantic tokens are stored with device modes)
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const gridCollection = collections.find(c => c.name === 'Grid');
  
  if (!gridCollection) {
    throw new Error('Коллекция Grid не найдена. Сначала создайте Grid токены.');
  }
  
  // Get mode ID for breakpoint
  const breakpointToMode: { [key: string]: string } = {
    'desktop': 'Desktop',
    'tablet': 'Tablet', 
    'mobile': 'Mobile'
  };
  
  const modeName = breakpointToMode[breakpoint];
  const mode = gridCollection.modes.find(m => m.name === modeName);
  
  if (!mode) {
    throw new Error(`Режим "${modeName}" не найден в коллекции Grid.`);
  }
  
  const modeId = mode.modeId;
  
  // Find variables for this token
  const allVariables = await figma.variables.getLocalVariablesAsync('FLOAT');
  const gridVars = allVariables.filter(v => 
    v.variableCollectionId === gridCollection.id && v.name.startsWith(tokenName)
  );
  
  // Get columns, gutter, margin values
  const columnsVar = gridVars.find(v => v.name === `${tokenName}/columns`);
  const gutterVar = gridVars.find(v => v.name === `${tokenName}/gutter`);
  const marginVar = gridVars.find(v => v.name === `${tokenName}/margin`);
  
  if (!columnsVar || !gutterVar || !marginVar) {
    throw new Error(`Не все переменные найдены для токена "${tokenName}". Необходимы: columns, gutter, margin.`);
  }
  
  // Get resolved values for the breakpoint mode
  const columnsValue = columnsVar.valuesByMode[modeId];
  const gutterValue = gutterVar.valuesByMode[modeId];
  const marginValue = marginVar.valuesByMode[modeId];
  
  // Resolve aliases to get actual numbers
  const resolveValue = async (value: any): Promise<number> => {
    if (typeof value === 'number') {
      return value;
    }
    if (value && value.type === 'VARIABLE_ALIAS') {
      const aliasedVar = await figma.variables.getVariableByIdAsync(value.id);
      if (aliasedVar) {
        // Get value from default mode of primitives collection
        const primitivesCollection = collections.find(c => c.name === 'Primitives');
        if (primitivesCollection) {
          const primValue = aliasedVar.valuesByMode[primitivesCollection.defaultModeId];
          if (typeof primValue === 'number') {
            return primValue;
          }
        }
      }
    }
    return 0;
  };
  
  const columns = await resolveValue(columnsValue);
  const gutter = await resolveValue(gutterValue);
  const margin = await resolveValue(marginValue);
  
  // Create Layout Grid configuration
  const layoutGrid: LayoutGrid = {
    pattern: 'COLUMNS',
    alignment: 'CENTER',
    count: columns,
    gutterSize: gutter,
    offset: margin,
    sectionSize: 1,
    visible: true,
    color: { r: 1, g: 0, b: 0, a: 0.1 }
  };
  
  // Apply to frame
  frame.layoutGrids = [layoutGrid];
  
  // Bind gutter and margin to variables (if Figma API supports it)
  // Note: As of 2024, Layout Grid doesn't fully support variable binding
  // But we're setting up the structure for future compatibility
  
  return { success: true };
}

// ============================================
// CREATE GRID STYLES (Layout Guide Styles)
// ============================================

interface GridStyleData {
  id: string;
  name: string;
  path: string;
  description: string;
  desktop: { columns: number; gutter: number; margin: number; alignment: string };
  tablet: { columns: number; gutter: number; margin: number; alignment: string };
  mobile: { columns: number; gutter: number; margin: number; alignment: string };
}

async function createGridStyles(grids: GridStyleData[]): Promise<{ created: number; updated: number; pageName: string }> {
  const result = { created: 0, updated: 0, pageName: 'Grid Styles' };
  
  console.log('[Grid] createGridStyles called with', grids.length, 'grids');
  console.log('[Grid] First grid data:', grids[0]);
  
  // Get existing grid styles
  const existingStyles = await figma.getLocalGridStylesAsync();
  console.log('[Grid] Existing grid styles:', existingStyles.length);
  
  // Alignment mapping
  const alignmentMap: { [key: string]: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' } = {
    'MIN': 'MIN', 'START': 'MIN',
    'CENTER': 'CENTER',
    'MAX': 'MAX', 'END': 'MAX',
    'STRETCH': 'STRETCH',
  };
  
  for (const grid of grids) {
    // Create 3 styles for each grid token: Desktop, Tablet, Mobile
    const breakpoints = [
      { suffix: 'desktop', config: grid.desktop, emoji: '🖥️' },
      { suffix: 'tablet', config: grid.tablet, emoji: '📱' },
      { suffix: 'mobile', config: grid.mobile, emoji: '📱' },
    ];
    
    for (const bp of breakpoints) {
      try {
        // Style name: grid/page/main/desktop (use slashes, not dots)
        const styleName = grid.path.replace(/\./g, '/') + '/' + bp.suffix;
        
        console.log(`[Grid] Creating style: ${styleName}`, bp.config);
        
        // Check if style already exists
        let gridStyle = existingStyles.find(s => s.name === styleName);
        
        // Create Layout Grid configuration
        // Note: Figma LayoutGrid for COLUMNS pattern requires offset for all alignments
        const alignment = alignmentMap[bp.config.alignment.toUpperCase()] || 'STRETCH';
        
        const layoutGrid: LayoutGrid = {
          pattern: 'COLUMNS',
          alignment: alignment,
          count: bp.config.columns,
          gutterSize: bp.config.gutter,
          offset: bp.config.margin, // Required for all COLUMNS alignments
          visible: true,
          color: { r: 1, g: 0, b: 0, a: 0.1 },
        };
        
        console.log(`[Grid] Layout grid config:`, layoutGrid);
        
        if (gridStyle) {
          // Update existing style
          gridStyle.layoutGrids = [layoutGrid];
          if (grid.description) {
            gridStyle.description = `${grid.description} (${bp.suffix})`;
          }
          result.updated++;
          console.log(`[Grid] Updated style: ${styleName}`);
        } else {
          // Create new grid style
          gridStyle = figma.createGridStyle();
          gridStyle.name = styleName;
          gridStyle.layoutGrids = [layoutGrid];
          gridStyle.description = grid.description 
            ? `${grid.description} (${bp.suffix})`
            : `${bp.config.columns} columns, ${bp.config.gutter}px gutter, ${bp.config.margin}px margin`;
          result.created++;
          console.log(`[Grid] Created style: ${styleName}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? `${error.message} | Stack: ${error.stack}` : String(error);
        console.log(`[Grid] Error creating style for ${grid.path}/${bp.suffix}:`, errorMsg);
      }
    }
  }
  
  return result;
}

// ============================================
// ICON SIZE PRIMITIVES & SEMANTIC
// ============================================

async function createIconSizePrimitives(primitives: Array<{ name: string; value: number }>): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  
  // Get or create Primitives collection
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  
  if (!primitivesCollection) {
    primitivesCollection = figma.variables.createVariableCollection('Primitives');
  }
  
  // Get existing variables
  const existingVariables = await figma.variables.getLocalVariablesAsync();
  
  for (const prim of primitives) {
    try {
      const varName = `iconSize/${prim.name}`;
      
      // Check if exists
      let existingVar = existingVariables.find(v => 
        v.name === varName && v.variableCollectionId === primitivesCollection!.id
      );
      
      if (existingVar) {
        // Update value
        existingVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        result.updated++;
      } else {
        // Create new
        const newVar = figma.variables.createVariable(varName, primitivesCollection, 'FLOAT');
        newVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        newVar.description = `Icon size ${prim.value}px`;
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания iconSize/${prim.name}: ${errorMessage}`);
    }
  }
  
  return result;
}

// ============================================
// ICON SIZE SEMANTIC COLLECTION (with device modes like Spacing/Gap)
// ============================================

interface IconSizeSemanticData {
  tokens: Array<{
    id: string;           // "is-1"
    path: string;         // "iconSize.interactive.button"
    category: string;     // "interactive"
    name: string;         // "button"
    description?: string;
    desktop: string;      // "16" (primitive name)
    tablet: string;       // "16"
    mobile: string;       // "16"
  }>;
}

async function createIconSizeSemanticCollection(data: IconSizeSemanticData): Promise<{ created: number; aliased: number; errors: string[] }> {
  const result = { created: 0, aliased: 0, errors: [] as string[] };
  
  // Get all collections
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  // Find Primitives collection
  const primitivesCollection = collections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) {
    result.errors.push('Коллекция Primitives не найдена. Сначала создайте примитивы.');
    return result;
  }
  
  // Find or create Icon Size collection
  let iconSizeCollection = collections.find(c => c.name === 'Icon Size');
  if (!iconSizeCollection) {
    iconSizeCollection = figma.variables.createVariableCollection('Icon Size');
  }
  
  // Setup modes: Desktop, Tablet, Mobile
  const modeNames = ['Desktop', 'Tablet', 'Mobile'];
  const modeIds: { [key: string]: string } = {};
  
  // Get existing modes
  const existingModes = iconSizeCollection.modes;
  
  // Rename first mode to Desktop
  if (existingModes.length > 0) {
    iconSizeCollection.renameMode(existingModes[0].modeId, 'Desktop');
    modeIds['Desktop'] = existingModes[0].modeId;
  }
  
  // Add Tablet and Mobile modes if they don't exist
  for (let i = 1; i < modeNames.length; i++) {
    const modeName = modeNames[i];
    const existingMode = iconSizeCollection.modes.find(m => m.name === modeName);
    
    if (existingMode) {
      modeIds[modeName] = existingMode.modeId;
    } else {
      const newModeId = iconSizeCollection.addMode(modeName);
      modeIds[modeName] = newModeId;
    }
  }
  
  // Get all existing variables
  const allVariables = await figma.variables.getLocalVariablesAsync('FLOAT');
  
  // Create map of primitive variables (iconSize/16, iconSize/24...)
  const primitiveVarMap = new Map<string, Variable>();
  allVariables.forEach(v => {
    if (v.variableCollectionId === primitivesCollection.id) {
      // v.name is "iconSize/16", extract "16"
      const match = v.name.match(/iconSize\/(.+)/);
      if (match) {
        primitiveVarMap.set(match[1], v);
      }
    }
  });
  
  // Existing semantic variables in Icon Size collection
  const existingVars = allVariables.filter(v => v.variableCollectionId === iconSizeCollection!.id);
  const existingVarMap = new Map<string, Variable>();
  existingVars.forEach(v => existingVarMap.set(v.name, v));
  
  // Create/update semantic tokens
  for (const token of data.tokens) {
    try {
      // Convert path: "iconSize.interactive.button" -> "iconSize/interactive/button"
      const varName = token.path.replace(/\./g, '/');
      
      // Get or create variable
      let variable = existingVarMap.get(varName);
      if (!variable) {
        variable = figma.variables.createVariable(varName, iconSizeCollection!, 'FLOAT');
        result.created++;
      }
      
      // Set description
      if (token.description) {
        variable.description = token.description;
      }
      
      // Set alias for Desktop mode
      const desktopPrimitive = primitiveVarMap.get(token.desktop);
      if (desktopPrimitive && modeIds['Desktop']) {
        const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: desktopPrimitive.id };
        variable.setValueForMode(modeIds['Desktop'], alias);
        result.aliased++;
      } else if (modeIds['Desktop']) {
        // Fallback to direct value if primitive not found
        variable.setValueForMode(modeIds['Desktop'], parseInt(token.desktop) || 16);
        result.errors.push(`Примитив iconSize/${token.desktop} не найден для ${token.path} (Desktop)`);
      }
      
      // Set alias for Tablet mode
      const tabletPrimitive = primitiveVarMap.get(token.tablet);
      if (tabletPrimitive && modeIds['Tablet']) {
        const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: tabletPrimitive.id };
        variable.setValueForMode(modeIds['Tablet'], alias);
        result.aliased++;
      } else if (modeIds['Tablet']) {
        variable.setValueForMode(modeIds['Tablet'], parseInt(token.tablet) || 16);
      }
      
      // Set alias for Mobile mode
      const mobilePrimitive = primitiveVarMap.get(token.mobile);
      if (mobilePrimitive && modeIds['Mobile']) {
        const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: mobilePrimitive.id };
        variable.setValueForMode(modeIds['Mobile'], alias);
        result.aliased++;
      } else if (modeIds['Mobile']) {
        variable.setValueForMode(modeIds['Mobile'], parseInt(token.mobile) || 16);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания ${token.path}: ${errorMessage}`);
    }
  }
  
  return result;
}

async function generateIconSizeDocumentation(): Promise<DocGeneratorResult> {
  await loadDocFonts();
  
  const pageName = '📖 Icon Size Documentation';
  const page = figma.createPage();
  page.name = pageName;
  
  // Get all float variables
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const floatVars = await figma.variables.getLocalVariablesAsync('FLOAT');
  
  // Filter icon size variables
  const iconSizeVars = floatVars.filter(v => 
    v.name.toLowerCase().includes('iconsize')
  );
  
  let xOffset = 0;
  let framesCreated = 0;
  
  // ===== ARCHITECTURE DESCRIPTION FRAME =====
  const archFrame = figma.createFrame();
  archFrame.name = 'Архитектура Icon Size';
  archFrame.x = xOffset;
  archFrame.y = 0;
  archFrame.layoutMode = 'VERTICAL';
  archFrame.itemSpacing = 24;
  archFrame.paddingTop = 40;
  archFrame.paddingBottom = 40;
  archFrame.paddingLeft = 40;
  archFrame.paddingRight = 40;
  archFrame.primaryAxisSizingMode = 'AUTO';
  archFrame.counterAxisSizingMode = 'AUTO';
  archFrame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.98, b: 1 } }];
  archFrame.cornerRadius = 16;
  archFrame.minWidth = 550;
  
  const archTitle = createStyledText('🏗️ Архитектура Icon Size системы', 0, 0, 28, 'Bold');
  archFrame.appendChild(archTitle);
  
  const archIntro = createStyledText(
    `Icon Size — система размеров иконок для UI элементов.\n` +
    `2-уровневая архитектура: Primitives → Semantic (без адаптивности).`,
    0, 0, 13, 'Regular', { r: 0.4, g: 0.4, b: 0.4 }
  );
  archFrame.appendChild(archIntro);
  
  // Primitives section
  const primSection = figma.createFrame();
  primSection.name = 'Primitives section';
  primSection.layoutMode = 'VERTICAL';
  primSection.itemSpacing = 8;
  primSection.fills = [];
  primSection.primaryAxisSizingMode = 'AUTO';
  primSection.counterAxisSizingMode = 'AUTO';
  
  const primTitle = createStyledText('📦 ПРИМИТИВЫ (16 значений)', 0, 0, 16, 'Bold');
  primSection.appendChild(primTitle);
  
  const primDesc = createStyledText(
    `Базовая шкала размеров иконок:\n\n` +
    `iconSize.10  = 10px    iconSize.36 = 36px\n` +
    `iconSize.12  = 12px    iconSize.40 = 40px\n` +
    `iconSize.14  = 14px    iconSize.48 = 48px\n` +
    `iconSize.16  = 16px    iconSize.56 = 56px\n` +
    `iconSize.18  = 18px    iconSize.64 = 64px\n` +
    `iconSize.20  = 20px    iconSize.72 = 72px\n` +
    `iconSize.24  = 24px    iconSize.96 = 96px\n` +
    `iconSize.28  = 28px\n` +
    `iconSize.32  = 32px\n\n` +
    `💡 Размеры согласованы с 4px-grid системой.`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  primSection.appendChild(primDesc);
  archFrame.appendChild(primSection);
  
  // Semantic section
  const semSection = figma.createFrame();
  semSection.name = 'Semantic section';
  semSection.layoutMode = 'VERTICAL';
  semSection.itemSpacing = 8;
  semSection.fills = [];
  semSection.primaryAxisSizingMode = 'AUTO';
  semSection.counterAxisSizingMode = 'AUTO';
  
  const semTitle = createStyledText('🎯 СЕМАНТИЧЕСКИЕ ТОКЕНЫ (14 категорий, 90+ токенов)', 0, 0, 16, 'Bold');
  semSection.appendChild(semTitle);
  
  const semDesc = createStyledText(
    `Токены с контекстом, ссылающиеся на примитивы {iconSize.X}:\n\n` +
    `INTERACTIVE — кнопки, ссылки, меню, табы\n` +
    `  button (16), buttonLarge (20), buttonCompact (14)\n` +
    `  buttonIconOnly (20), link (16), menuItem (16), tab (18)\n\n` +
    `FORM — инпуты, чекбоксы, валидация\n` +
    `  inputPrefix (16), inputSuffix (16), inputAction (18)\n` +
    `  checkbox (16), radio (16), switch (14), validation (14)\n\n` +
    `NAVIGATION — навигация, breadcrumbs\n` +
    `  item (20), breadcrumbSeparator (14), paginationArrow (16)\n` +
    `  back (20), close (20), hamburger (24)\n\n` +
    `STATUS — бейджи, теги, чипы\n` +
    `  badge (12), tag (14), chip (16), indicator (12), dot (10)\n\n` +
    `NOTIFICATION — алерты, тосты, баннеры\n` +
    `  alert (20), toast (20), banner (24)\n\n` +
    `DATA — таблицы, метрики, графики\n` +
    `  tableAction (16), tableSort (14), metricTrend (16)\n\n` +
    `MEDIA — аватары, плееры, placeholder\n` +
    `  avatarBadge (12), placeholder (48), playButton (48)\n\n` +
    `EMPTY — пустые состояния\n` +
    `  illustration (96), icon (48)\n\n` +
    `MODAL — модальные окна\n` +
    `  close (20), headerIcon (24), confirmationIcon (48)\n\n` +
    `CARD — карточки\n` +
    `  headerIcon (24), action (18), meta (14), feature (32)\n\n` +
    `LIST — списки\n` +
    `  itemIcon (20), bullet (10), dragHandle (16)\n\n` +
    `ACTION — FAB, контекстное меню\n` +
    `  primary (20), secondary (18), fab (24), more (20)\n\n` +
    `LOADING — спиннеры\n` +
    `  spinner (20), spinnerCompact (16), spinnerLarge (32)\n\n` +
    `SPECIAL — лого, социальные, рейтинг\n` +
    `  logo (32), social (24), rating (18), step (24)`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  semSection.appendChild(semDesc);
  archFrame.appendChild(semSection);
  
  // Principles section
  const principlesSection = figma.createFrame();
  principlesSection.name = 'Principles section';
  principlesSection.layoutMode = 'VERTICAL';
  principlesSection.itemSpacing = 8;
  principlesSection.fills = [];
  principlesSection.primaryAxisSizingMode = 'AUTO';
  principlesSection.counterAxisSizingMode = 'AUTO';
  
  const principlesTitle = createStyledText('💡 ПРИНЦИПЫ ПРИМЕНЕНИЯ', 0, 0, 14, 'Medium');
  principlesSection.appendChild(principlesTitle);
  
  const principlesDesc = createStyledText(
    `• Маленькие иконки (10-14px): индикаторы, стрелки, мелкие UI\n` +
    `• Стандартные (16-20px): кнопки, инпуты, меню, навигация\n` +
    `• Средние (24-32px): заголовки, карточки, FAB\n` +
    `• Крупные (48-96px): пустые состояния, модалки, иллюстрации\n\n` +
    `⚠️ БЕЗ АДАПТИВНОСТИ\n` +
    `Icon Size не меняется для разных устройств.\n` +
    `Только один режим для всех breakpoints.`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.4, b: 0.5 }
  );
  principlesSection.appendChild(principlesDesc);
  archFrame.appendChild(principlesSection);
  
  page.appendChild(archFrame);
  xOffset += archFrame.width + 48;
  framesCreated++;
  
  // Main frame with visual preview
  const mainFrame = figma.createFrame();
  mainFrame.name = 'Icon Size Overview';
  mainFrame.x = xOffset;
  mainFrame.y = 0;
  mainFrame.layoutMode = 'VERTICAL';
  mainFrame.itemSpacing = 32;
  mainFrame.paddingTop = 32;
  mainFrame.paddingBottom = 32;
  mainFrame.paddingLeft = 32;
  mainFrame.paddingRight = 32;
  mainFrame.primaryAxisSizingMode = 'AUTO';
  mainFrame.counterAxisSizingMode = 'AUTO';
  mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  mainFrame.cornerRadius = 16;
  mainFrame.minWidth = 800;
  
  // Title
  const title = createStyledText('🎯 Система Icon Size', 0, 0, 32, 'Bold');
  mainFrame.appendChild(title);
  
  // Stats
  const stats = createStyledText(
    `Всего переменных: ${iconSizeVars.length}`,
    0, 0, 14, 'Regular', { r: 0.5, g: 0.5, b: 0.5 }
  );
  mainFrame.appendChild(stats);
  
  // Group by collection
  const varsByCollection = new Map<string, Variable[]>();
  for (const v of iconSizeVars) {
    const list = varsByCollection.get(v.variableCollectionId) || [];
    list.push(v);
    varsByCollection.set(v.variableCollectionId, list);
  }
  
  for (const coll of collections) {
    const vars = varsByCollection.get(coll.id);
    if (!vars || vars.length === 0) continue;
    
    // Collection section
    const collSection = figma.createFrame();
    collSection.name = coll.name;
    collSection.layoutMode = 'VERTICAL';
    collSection.itemSpacing = 16;
    collSection.primaryAxisSizingMode = 'AUTO';
    collSection.counterAxisSizingMode = 'AUTO';
    collSection.fills = [];
    
    // Collection title
    const collTitle = createStyledText(`📦 ${coll.name}`, 0, 0, 20, 'Medium');
    collSection.appendChild(collTitle);
    
    // Icon size visualization - group by category
    const iconSizeCategories: { [key: string]: Variable[] } = {};
    for (const variable of vars) {
      const parts = variable.name.split('/');
      const category = parts.length > 2 ? parts[1] : 'primitives';
      if (!iconSizeCategories[category]) iconSizeCategories[category] = [];
      iconSizeCategories[category].push(variable);
    }
    
    for (const [category, catVars] of Object.entries(iconSizeCategories)) {
      // Category header
      const catHeader = createStyledText(
        category.charAt(0).toUpperCase() + category.slice(1),
        0, 0, 14, 'Medium', { r: 0.4, g: 0.4, b: 0.4 }
      );
      collSection.appendChild(catHeader);
      
      // Items grid
      const grid = figma.createFrame();
      grid.name = `${category}-grid`;
      grid.layoutMode = 'HORIZONTAL';
      grid.layoutWrap = 'WRAP';
      grid.itemSpacing = 16;
      grid.counterAxisSpacing = 16;
      grid.primaryAxisSizingMode = 'FIXED';
      grid.resize(760, 10);
      grid.counterAxisSizingMode = 'AUTO';
      grid.fills = [];
      
      for (const variable of catVars.slice(0, 20)) {
        const mode = coll.modes[0];
        const resolved = await resolveVariableValue(variable, mode.modeId);
        const numValue = typeof resolved === 'number' ? resolved : 0;
        
        const item = figma.createFrame();
        item.name = variable.name;
        item.layoutMode = 'VERTICAL';
        item.itemSpacing = 8;
        item.counterAxisAlignItems = 'CENTER';
        item.primaryAxisSizingMode = 'AUTO';
        item.counterAxisSizingMode = 'AUTO';
        item.fills = [];
        item.paddingTop = 8;
        item.paddingBottom = 8;
        
        // Visual icon size preview (circle placeholder)
        const previewSize = Math.min(Math.max(numValue, 10), 48);
        const preview = figma.createEllipse();
        preview.resize(previewSize, previewSize);
        preview.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.5, b: 0.9 } }];
        item.appendChild(preview);
        
        // Token name (short version)
        const shortName = variable.name.split('/').slice(-1)[0];
        const nameText = createStyledText(shortName, 0, 0, 11, 'Medium');
        item.appendChild(nameText);
        
        // Value
        const valueText = createStyledText(`${numValue}px`, 0, 0, 10, 'Regular', { r: 0.5, g: 0.5, b: 0.5 });
        item.appendChild(valueText);
        
        grid.appendChild(item);
      }
      
      collSection.appendChild(grid);
    }
    
    mainFrame.appendChild(collSection);
    framesCreated++;
  }
  
  page.appendChild(mainFrame);
  await figma.setCurrentPageAsync(page);
  
  return { pageName, framesCreated: framesCreated || 1 };
}

// ============================================
// EFFECTS PRIMITIVES & SEMANTIC (Shadows, Blur, Opacity)
// ============================================

interface EffectsPrimitivesPayload {
  shadowOffsetX: Array<{ name: string; value: number }>;
  shadowOffsetY: Array<{ name: string; value: number }>;
  shadowBlur: Array<{ name: string; value: number }>;
  shadowSpread: Array<{ name: string; value: number }>;
  shadowColors: Array<{ name: string; baseColor: string; opacity: number }>;
  blurs: Array<{ name: string; value: number }>;
  opacities: Array<{ name: string; value: number }>;
}

interface EffectsSemanticPayload {
  semanticTokens: Array<{
    id: string;
    path: string;
    category: string;
    name: string;
    // Shadow properties (optional)
    offsetX?: string;
    offsetY?: string;
    blur?: string;
    spread?: string;
    color?: string;
    shadowType?: 'drop' | 'inset';
    // Backdrop blur (optional)
    backdropBlur?: string;
    backdropOpacity?: string;
    // Opacity (optional)
    opacity?: string;
  }>;
}

async function createEffectsPrimitives(payload: EffectsPrimitivesPayload): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  
  // Get or create Primitives collection
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  
  if (!primitivesCollection) {
    primitivesCollection = figma.variables.createVariableCollection('Primitives');
  }
  
  // Get existing variables
  const existingVariables = await figma.variables.getLocalVariablesAsync();
  
  // Helper to create/update FLOAT primitive
  const createFloatPrimitive = async (prefix: string, name: string, value: number, description: string) => {
    try {
      const varName = `${prefix}/${name}`;
      let existingVar = existingVariables.find(v => 
        v.name === varName && v.variableCollectionId === primitivesCollection!.id
      );
      
      if (existingVar) {
        existingVar.setValueForMode(primitivesCollection!.defaultModeId, value);
        result.updated++;
      } else {
        const newVar = figma.variables.createVariable(varName, primitivesCollection!, 'FLOAT');
        newVar.setValueForMode(primitivesCollection!.defaultModeId, value);
        newVar.description = description;
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания ${prefix}/${name}: ${errorMessage}`);
    }
  };
  
  // Helper to create/update COLOR primitive
  const createColorPrimitive = async (prefix: string, name: string, baseColor: string, opacity: number) => {
    try {
      const varName = `${prefix}/${name}`;
      let existingVar = existingVariables.find(v => 
        v.name === varName && v.variableCollectionId === primitivesCollection!.id
      );
      
      // Convert base color to RGBA
      let rgb: { r: number; g: number; b: number };
      switch (baseColor) {
        case 'black':
          rgb = { r: 0, g: 0, b: 0 };
          break;
        case 'white':
          rgb = { r: 1, g: 1, b: 1 };
          break;
        case 'brand':
          rgb = { r: 0.231, g: 0.51, b: 0.965 }; // #3B82F6
          break;
        case 'error':
          rgb = { r: 0.937, g: 0.267, b: 0.267 }; // #EF4444
          break;
        case 'success':
          rgb = { r: 0.133, g: 0.773, b: 0.369 }; // #22C55E
          break;
        case 'warning':
          rgb = { r: 0.965, g: 0.69, b: 0.173 }; // #F6B02C
          break;
        default:
          rgb = { r: 0, g: 0, b: 0 };
      }
      
      const colorValue: RGBA = { ...rgb, a: opacity / 100 };
      
      if (existingVar) {
        existingVar.setValueForMode(primitivesCollection!.defaultModeId, colorValue);
        result.updated++;
      } else {
        const newVar = figma.variables.createVariable(varName, primitivesCollection!, 'COLOR');
        newVar.setValueForMode(primitivesCollection!.defaultModeId, colorValue);
        newVar.description = `${baseColor} @ ${opacity}% opacity`;
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания ${prefix}/${name}: ${errorMessage}`);
    }
  };
  
  // Create Shadow Offset X primitives
  for (const prim of payload.shadowOffsetX) {
    await createFloatPrimitive('shadow/offsetX', prim.name, prim.value, `Shadow offset X: ${prim.value}px`);
  }
  
  // Create Shadow Offset Y primitives
  for (const prim of payload.shadowOffsetY) {
    await createFloatPrimitive('shadow/offsetY', prim.name, prim.value, `Shadow offset Y: ${prim.value}px`);
  }
  
  // Create Shadow Blur primitives
  for (const prim of payload.shadowBlur) {
    await createFloatPrimitive('shadow/blur', prim.name, prim.value, `Shadow blur: ${prim.value}px`);
  }
  
  // Create Shadow Spread primitives
  for (const prim of payload.shadowSpread) {
    await createFloatPrimitive('shadow/spread', prim.name, prim.value, `Shadow spread: ${prim.value}px`);
  }
  
  // Create Shadow Color primitives
  for (const prim of payload.shadowColors) {
    await createColorPrimitive('shadow/color', prim.name, prim.baseColor, prim.opacity);
  }
  
  // Create Backdrop Blur primitives
  for (const prim of payload.blurs) {
    await createFloatPrimitive('blur', prim.name, prim.value, `Backdrop blur: ${prim.value}px`);
  }
  
  // Create Opacity primitives
  for (const prim of payload.opacities) {
    await createFloatPrimitive('opacity', prim.name, prim.value / 100, `Opacity: ${prim.value}%`);
  }
  
  return result;
}

async function createEffectsSemanticCollection(payload: EffectsSemanticPayload): Promise<{ created: number; aliased: number; errors: string[] }> {
  const result = { created: 0, aliased: 0, errors: [] as string[] };
  
  // Get all collections
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  // Find Primitives collection
  const primitivesCollection = collections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) {
    result.errors.push('Коллекция Primitives не найдена. Сначала создайте примитивы.');
    return result;
  }
  
  // Find or create Effects collection
  let effectsCollection = collections.find(c => c.name === 'Effects');
  if (!effectsCollection) {
    effectsCollection = figma.variables.createVariableCollection('Effects');
  }
  
  // Get all existing variables
  const allFloatVariables = await figma.variables.getLocalVariablesAsync('FLOAT');
  const allColorVariables = await figma.variables.getLocalVariablesAsync('COLOR');
  
  // Build primitive variable maps
  const primitiveFloatMap = new Map<string, Variable>();
  const primitiveColorMap = new Map<string, Variable>();
  
  allFloatVariables.forEach(v => {
    if (v.variableCollectionId === primitivesCollection.id) {
      primitiveFloatMap.set(v.name, v);
    }
  });
  
  allColorVariables.forEach(v => {
    if (v.variableCollectionId === primitivesCollection.id) {
      primitiveColorMap.set(v.name, v);
    }
  });
  
  // Existing semantic variables in Effects collection
  const existingEffectsVars = [...allFloatVariables, ...allColorVariables].filter(
    v => v.variableCollectionId === effectsCollection!.id
  );
  const existingVarMap = new Map<string, Variable>();
  existingEffectsVars.forEach(v => existingVarMap.set(v.name, v));
  
  // Create semantic tokens
  for (const token of payload.semanticTokens) {
    try {
      // Convert path: "effect.elevation.100" -> "effect/elevation/100"
      const basePath = token.path.replace(/\./g, '/');
      
      // Create variables for shadow properties
      if (token.offsetX !== undefined) {
        // Shadow token - create multiple variables for each property
        const props = ['offsetX', 'offsetY', 'blur', 'spread'];
        const values = [token.offsetX, token.offsetY, token.blur, token.spread];
        const prefixes = ['shadow/offsetX', 'shadow/offsetY', 'shadow/blur', 'shadow/spread'];
        
        for (let i = 0; i < props.length; i++) {
          const varName = `${basePath}/${props[i]}`;
          const primRef = `${prefixes[i]}/${values[i]}`;
          const primitive = primitiveFloatMap.get(primRef);
          
          let variable = existingVarMap.get(varName);
          if (!variable) {
            variable = figma.variables.createVariable(varName, effectsCollection!, 'FLOAT');
            result.created++;
          }
          
          if (primitive) {
            const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: primitive.id };
            variable.setValueForMode(effectsCollection!.defaultModeId, alias);
            result.aliased++;
          } else {
            // Fallback to direct value
            const numValue = parseFloat(values[i] || '0') || 0;
            variable.setValueForMode(effectsCollection!.defaultModeId, numValue);
          }
        }
        
        // Create color variable
        if (token.color) {
          const colorVarName = `${basePath}/color`;
          const colorPrimRef = `shadow/color/${token.color}`;
          const colorPrimitive = primitiveColorMap.get(colorPrimRef);
          
          let colorVar = existingVarMap.get(colorVarName);
          if (!colorVar) {
            colorVar = figma.variables.createVariable(colorVarName, effectsCollection!, 'COLOR');
            result.created++;
          }
          
          if (colorPrimitive) {
            const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: colorPrimitive.id };
            colorVar.setValueForMode(effectsCollection!.defaultModeId, alias);
            result.aliased++;
          }
        }
      }
      
      // Create backdrop blur variable
      if (token.backdropBlur !== undefined) {
        const blurVarName = `${basePath}/blur`;
        const blurPrimRef = `blur/${token.backdropBlur}`;
        const blurPrimitive = primitiveFloatMap.get(blurPrimRef);
        
        let blurVar = existingVarMap.get(blurVarName);
        if (!blurVar) {
          blurVar = figma.variables.createVariable(blurVarName, effectsCollection!, 'FLOAT');
          result.created++;
        }
        
        if (blurPrimitive) {
          const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: blurPrimitive.id };
          blurVar.setValueForMode(effectsCollection!.defaultModeId, alias);
          result.aliased++;
        } else {
          const numValue = parseFloat(token.backdropBlur) || 0;
          blurVar.setValueForMode(effectsCollection!.defaultModeId, numValue);
        }
        
        // Create backdrop opacity variable
        if (token.backdropOpacity) {
          const opacityVarName = `${basePath}/opacity`;
          const opacityPrimRef = `opacity/${token.backdropOpacity}`;
          const opacityPrimitive = primitiveFloatMap.get(opacityPrimRef);
          
          let opacityVar = existingVarMap.get(opacityVarName);
          if (!opacityVar) {
            opacityVar = figma.variables.createVariable(opacityVarName, effectsCollection!, 'FLOAT');
            result.created++;
          }
          
          if (opacityPrimitive) {
            const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: opacityPrimitive.id };
            opacityVar.setValueForMode(effectsCollection!.defaultModeId, alias);
            result.aliased++;
          } else {
            const numValue = parseFloat(token.backdropOpacity) / 100 || 0;
            opacityVar.setValueForMode(effectsCollection!.defaultModeId, numValue);
          }
        }
      }
      
      // Create standalone opacity variable
      if (token.opacity !== undefined && token.backdropBlur === undefined) {
        const opacityVarName = `${basePath}/value`;
        const opacityPrimRef = `opacity/${token.opacity}`;
        const opacityPrimitive = primitiveFloatMap.get(opacityPrimRef);
        
        let opacityVar = existingVarMap.get(opacityVarName);
        if (!opacityVar) {
          opacityVar = figma.variables.createVariable(opacityVarName, effectsCollection!, 'FLOAT');
          result.created++;
        }
        
        if (opacityPrimitive) {
          const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: opacityPrimitive.id };
          opacityVar.setValueForMode(effectsCollection!.defaultModeId, alias);
          result.aliased++;
        } else {
          const numValue = parseFloat(token.opacity) / 100 || 0;
          opacityVar.setValueForMode(effectsCollection!.defaultModeId, numValue);
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания ${token.path}: ${errorMessage}`);
    }
  }
  
  return result;
}

// ============================================
// EFFECT STYLES (Figma native styles)
// ============================================

interface EffectStyleData {
  name: string;
  type: 'shadow' | 'blur';
  shadowType?: 'drop' | 'inset';
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  spread?: number;
  color?: string;
  opacity?: number;
}

async function createEffectStyles(styles: EffectStyleData[]): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  
  // Get existing effect styles
  const existingStyles = await figma.getLocalEffectStylesAsync();
  const styleMap = new Map<string, EffectStyle>();
  existingStyles.forEach(s => styleMap.set(s.name, s));
  
  // Color mapping
  const colorMap: Record<string, RGB> = {
    'black': { r: 0, g: 0, b: 0 },
    'white': { r: 1, g: 1, b: 1 },
    'brand': { r: 0.231, g: 0.51, b: 0.965 },
    'error': { r: 0.937, g: 0.267, b: 0.267 },
    'success': { r: 0.133, g: 0.773, b: 0.369 },
    'warning': { r: 0.965, g: 0.69, b: 0.173 },
  };
  
  for (const styleData of styles) {
    try {
      let style = styleMap.get(styleData.name);
      
      if (!style) {
        style = figma.createEffectStyle();
        style.name = styleData.name;
        result.created++;
      } else {
        result.updated++;
      }
      
      if (styleData.type === 'shadow') {
        const rgb = colorMap[styleData.color || 'black'] || colorMap['black'];
        const shadowEffect: DropShadowEffect | InnerShadowEffect = {
          type: styleData.shadowType === 'inset' ? 'INNER_SHADOW' : 'DROP_SHADOW',
          color: { ...rgb, a: (styleData.opacity || 10) / 100 },
          offset: { x: styleData.offsetX || 0, y: styleData.offsetY || 0 },
          radius: styleData.blur || 0,
          spread: styleData.spread || 0,
          visible: true,
          blendMode: 'NORMAL',
        };
        style.effects = [shadowEffect];
      } else if (styleData.type === 'blur') {
        const blurEffect: Effect = {
          type: 'BACKGROUND_BLUR',
          radius: styleData.blur || 0,
          visible: true,
        } as Effect;
        style.effects = [blurEffect];
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания стиля ${styleData.name}: ${errorMessage}`);
    }
  }
  
  return result;
}

// ============================================
// SPACING PRIMITIVES & SEMANTIC
// ============================================

interface SpacingSemanticPayload {
  semanticTokens: Array<{
    id: string;
    name: string;
    path: string[];
    reference: string;
    description?: string;
    category: string;
  }>;
  primitives: Array<{ name: string; value: number }>;
}

async function createSpacingPrimitives(primitives: Array<{ name: string; value: number }>): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  
  // Get or create Primitives collection
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  
  if (!primitivesCollection) {
    primitivesCollection = figma.variables.createVariableCollection('Primitives');
  }
  
  // Get existing variables
  const existingVariables = await figma.variables.getLocalVariablesAsync();
  
  for (const prim of primitives) {
    try {
      const varName = `space/${prim.name}`;
      
      // Check if exists
      let existingVar = existingVariables.find(v => 
        v.name === varName && v.variableCollectionId === primitivesCollection!.id
      );
      
      if (existingVar) {
        // Update value
        existingVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        result.updated++;
      } else {
        // Create new
        const newVar = figma.variables.createVariable(varName, primitivesCollection, 'FLOAT');
        newVar.setValueForMode(primitivesCollection.defaultModeId, prim.value);
        newVar.description = `${prim.value}px`;
        result.created++;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания space/${prim.name}: ${errorMessage}`);
    }
  }
  
  return result;
}

async function createSpacingSemanticVariables(payload: SpacingSemanticPayload): Promise<{ created: number; aliased: number; errors: string[] }> {
  const result = { created: 0, aliased: 0, errors: [] as string[] };
  
  // Get collections
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) {
    result.errors.push('Коллекция Primitives не найдена. Сначала создайте примитивы.');
    return result;
  }
  
  let tokensCollection = collections.find(c => c.name === 'Tokens');
  if (!tokensCollection) {
    tokensCollection = figma.variables.createVariableCollection('Tokens');
  }
  
  // Get existing variables
  const existingVariables = await figma.variables.getLocalVariablesAsync();
  
  // Create map of primitives
  const primitiveVarMap = new Map<string, Variable>();
  existingVariables.forEach(v => {
    if (v.variableCollectionId === primitivesCollection!.id) {
      primitiveVarMap.set(v.name, v);
    }
  });
  
  // Helper to parse reference
  function parseSpacingRef(ref: string): string {
    // "{space.16}" → "16"
    const match = ref.match(/\{space\.(\d+)\}/);
    return match ? match[1] : '';
  }
  
  for (const token of payload.semanticTokens) {
    try {
      const tokenPath = token.path.join('/');
      const refValue = parseSpacingRef(token.reference);
      const primitiveName = `space/${refValue}`;
      const primitive = primitiveVarMap.get(primitiveName);
      
      if (!primitive) {
        result.errors.push(`Примитив ${primitiveName} не найден для токена ${tokenPath}`);
        continue;
      }
      
      // Check if variable exists
      let existingVar = existingVariables.find(v => 
        v.name === tokenPath && v.variableCollectionId === tokensCollection!.id
      );
      
      if (!existingVar) {
        existingVar = figma.variables.createVariable(tokenPath, tokensCollection!, 'FLOAT');
        result.created++;
      }
      
      // Create alias
      const alias: VariableAlias = {
        type: 'VARIABLE_ALIAS',
        id: primitive.id
      };
      
      existingVar.setValueForMode(tokensCollection!.defaultModeId, alias);
      existingVar.description = token.description || token.name;
      result.aliased++;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.errors.push(`Ошибка создания ${token.path.join('/')}: ${errorMessage}`);
    }
  }
  
  return result;
}

// ============================================
// SPACING SEMANTIC COLLECTION (with aliases to primitives per device mode)
// ============================================

interface SpacingSemanticData {
  collectionName: string;
  tokens: Array<{
    path: string;  // e.g. "spacing.button.default.paddingX"
    desktop: { ref: string; value: number };  // ref: "16", value: 16
    tablet: { ref: string; value: number };
    mobile: { ref: string; value: number };
  }>;
}

async function createSpacingSemanticCollection(data: SpacingSemanticData): Promise<{ created: number; aliased: number; errors: string[] }> {
  const result = { created: 0, aliased: 0, errors: [] as string[] };
  
  // Get all collections
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  // Find Primitives collection
  const primitivesCollection = collections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) {
    result.errors.push('Коллекция Primitives не найдена. Сначала создайте примитивы.');
    return result;
  }
  
  // Find or create Spacing collection
  let spacingCollection = collections.find(c => c.name === data.collectionName);
  if (!spacingCollection) {
    spacingCollection = figma.variables.createVariableCollection(data.collectionName);
  }
  
  // Setup modes: Desktop, Tablet, Mobile
  const modeNames = ['Desktop', 'Tablet', 'Mobile'];
  const modeIds: { [key: string]: string } = {};
  
  // Get existing modes
  const existingModes = spacingCollection.modes;
  
  // Rename first mode to Desktop
  if (existingModes.length > 0) {
    spacingCollection.renameMode(existingModes[0].modeId, 'Desktop');
    modeIds['Desktop'] = existingModes[0].modeId;
  }
  
  // Add Tablet and Mobile modes if they don't exist
  for (let i = 1; i < modeNames.length; i++) {
    const modeName = modeNames[i];
    const existingMode = spacingCollection.modes.find(m => m.name === modeName);
    
    if (existingMode) {
      modeIds[modeName] = existingMode.modeId;
    } else {
      const newModeId = spacingCollection.addMode(modeName);
      modeIds[modeName] = newModeId;
    }
  }
  
  // Get all existing variables
  const allVariables = await figma.variables.getLocalVariablesAsync('FLOAT');
  
  // Create map of primitive variables
  const primitiveVarMap = new Map<string, Variable>();
  allVariables.forEach(v => {
    if (v.variableCollectionId === primitivesCollection.id) {
      // v.name is "space/16", extract "16"
      const match = v.name.match(/space\/(\d+)/);
      if (match) {
        primitiveVarMap.set(match[1], v);
      }
    }
  });
  
  // Existing semantic variables in this collection
  const existingSemanticVars = allVariables.filter(v => v.variableCollectionId === spacingCollection!.id);
  const existingVarMap = new Map<string, Variable>();
  existingSemanticVars.forEach(v => existingVarMap.set(v.name, v));
  
  // Create/update semantic tokens
  for (const token of data.tokens) {
    try {
      // Convert path: "spacing.button.default.paddingX" -> "spacing/button/default/paddingX"
      const varName = token.path.replace(/\./g, '/');
      
      // Validate varName doesn't have consecutive slashes or empty segments
      if (varName.includes('//') || varName.startsWith('/') || varName.endsWith('/')) {
        result.errors.push(`${token.path}: Некорректный путь (пустые сегменты)`);
        continue;
      }
      
      // Get or create variable
      let variable = existingVarMap.get(varName);
      if (!variable) {
        console.log(`[Spacing] Создаём переменную: ${varName}`);
        variable = figma.variables.createVariable(varName, spacingCollection!, 'FLOAT');
        result.created++;
      }
      
      // Set alias for Desktop mode
      const desktopPrimitive = primitiveVarMap.get(token.desktop.ref);
      if (desktopPrimitive && modeIds['Desktop']) {
        const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: desktopPrimitive.id };
        variable.setValueForMode(modeIds['Desktop'], alias);
        result.aliased++;
      } else if (modeIds['Desktop']) {
        // Fallback to value if primitive not found - log warning
        console.warn(`[Spacing] Примитив space/${token.desktop.ref} не найден для ${varName} (Desktop), используем значение ${token.desktop.value}`);
        variable.setValueForMode(modeIds['Desktop'], token.desktop.value);
      }
      
      // Set alias for Tablet mode
      const tabletPrimitive = primitiveVarMap.get(token.tablet.ref);
      if (tabletPrimitive && modeIds['Tablet']) {
        const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: tabletPrimitive.id };
        variable.setValueForMode(modeIds['Tablet'], alias);
        result.aliased++;
      } else if (modeIds['Tablet']) {
        console.warn(`[Spacing] Примитив space/${token.tablet.ref} не найден для ${varName} (Tablet), используем значение ${token.tablet.value}`);
        variable.setValueForMode(modeIds['Tablet'], token.tablet.value);
      }
      
      // Set alias for Mobile mode
      const mobilePrimitive = primitiveVarMap.get(token.mobile.ref);
      if (mobilePrimitive && modeIds['Mobile']) {
        const alias: VariableAlias = { type: 'VARIABLE_ALIAS', id: mobilePrimitive.id };
        variable.setValueForMode(modeIds['Mobile'], alias);
        result.aliased++;
      } else if (modeIds['Mobile']) {
        console.warn(`[Spacing] Примитив space/${token.mobile.ref} не найден для ${varName} (Mobile), используем значение ${token.mobile.value}`);
        variable.setValueForMode(modeIds['Mobile'], token.mobile.value);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? `${error.message} (${error.name})` 
        : JSON.stringify(error);
      console.error(`[Spacing] Ошибка создания ${token.path}:`, error);
      console.error(`[Spacing] Token data:`, JSON.stringify(token));
      result.errors.push(`${token.path}: ${errorMessage}`);
    }
  }
  
  return result;
}

// ============================================
// SCALING COLLECTION (Desktop/Tablet/Mobile modes)
// ============================================

interface ScalingCollectionData {
  collectionName: string;
  modes: string[];
  tokens: Array<{
    name: string;
    values: { Desktop: number; Tablet: number; Mobile: number };
    description?: string;
  }>;
}

async function createScalingCollection(data: ScalingCollectionData): Promise<{ created: number }> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  
  // Find or create collection
  let collection = collections.find(c => c.name === data.collectionName);
  
  if (!collection) {
    collection = figma.variables.createVariableCollection(data.collectionName);
  }
  
  // Setup modes: Desktop, Tablet, Mobile
  // First mode is default (rename it to Desktop)
  const modeNames = ['Desktop', 'Tablet', 'Mobile'];
  const modeIds: { [key: string]: string } = {};
  
  // Get existing modes
  const existingModes = collection.modes;
  
  // Rename first mode to Desktop
  if (existingModes.length > 0) {
    collection.renameMode(existingModes[0].modeId, 'Desktop');
    modeIds['Desktop'] = existingModes[0].modeId;
  }
  
  // Check if Tablet/Mobile modes exist, if not add them
  for (let i = 1; i < modeNames.length; i++) {
    const modeName = modeNames[i];
    const existingMode = existingModes.find(m => m.name === modeName);
    
    if (existingMode) {
      modeIds[modeName] = existingMode.modeId;
    } else {
      const newModeId = collection.addMode(modeName);
      modeIds[modeName] = newModeId;
    }
  }
  
  // Get existing variables in this collection
  const allVariables = await figma.variables.getLocalVariablesAsync('FLOAT');
  const existingVariables = allVariables.filter(v => v.variableCollectionId === collection!.id);
  
  const existingVarMap = new Map<string, Variable>();
  for (const v of existingVariables) {
    existingVarMap.set(v.name, v);
  }
  
  let created = 0;
  
  // Create/update variables
  for (const token of data.tokens) {
    let variable = existingVarMap.get(token.name);
    
    if (!variable) {
      variable = figma.variables.createVariable(token.name, collection!, 'FLOAT');
      created++;
    }
    
    // Set values for each mode
    if (modeIds['Desktop']) {
      variable.setValueForMode(modeIds['Desktop'], token.values.Desktop);
    }
    if (modeIds['Tablet']) {
      variable.setValueForMode(modeIds['Tablet'], token.values.Tablet);
    }
    if (modeIds['Mobile']) {
      variable.setValueForMode(modeIds['Mobile'], token.values.Mobile);
    }
    
    // Set description
    if (token.description) {
      variable.description = token.description;
    }
  }
  
  return { created };
}

// ============================================
// DOCUMENTATION GENERATOR FUNCTIONS
// ============================================

interface DocGeneratorResult {
  pageName: string;
  framesCreated: number;
}

// Helper to load common fonts
async function loadDocFonts() {
  await Promise.all([
    figma.loadFontAsync({ family: 'Inter', style: 'Bold' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Medium' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' })
  ]);
}

// Helper to create styled text
function createStyledText(
  content: string, 
  x: number, 
  y: number, 
  fontSize: number, 
  style: 'Bold' | 'Medium' | 'Regular' = 'Regular',
  color: RGB = { r: 0, g: 0, b: 0 }
): TextNode {
  const text = figma.createText();
  text.fontName = { family: 'Inter', style };
  text.characters = content;
  text.fontSize = fontSize;
  text.fills = [{ type: 'SOLID', color }];
  text.x = x;
  text.y = y;
  return text;
}

// Helper to resolve variable value (handles aliases)
async function resolveColorValue(
  variable: Variable, 
  modeId: string
): Promise<RGBA | null> {
  const value = variable.valuesByMode[modeId];
  
  if (!value) return null;
  
  // Direct color value
  if (typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
    return value as RGBA;
  }
  
  // Alias to another variable
  if (typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    try {
      const aliasedVar = await figma.variables.getVariableByIdAsync(value.id);
      if (aliasedVar) {
        // Get the collection to find its default mode
        const aliasedCollection = await figma.variables.getVariableCollectionByIdAsync(aliasedVar.variableCollectionId);
        if (aliasedCollection) {
          const aliasedModeId = aliasedCollection.modes[0]?.modeId;
          if (aliasedModeId) {
            return resolveColorValue(aliasedVar, aliasedModeId);
          }
        }
      }
    } catch (e) {
      console.error('Error resolving alias:', e);
    }
  }
  
  return null;
}

// Generate Colors Documentation
async function generateColorsDocumentation(): Promise<DocGeneratorResult> {
  await loadDocFonts();
  
  const pageName = '📖 Colors Documentation';
  const page = figma.createPage();
  page.name = pageName;
  
  // Get all color variables
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const colorVars = await figma.variables.getLocalVariablesAsync('COLOR');
  
  // Group by collection
  const varsByCollection = new Map<string, Variable[]>();
  for (const v of colorVars) {
    const list = varsByCollection.get(v.variableCollectionId) || [];
    list.push(v);
    varsByCollection.set(v.variableCollectionId, list);
  }
  
  let yOffset = 0;
  let framesCreated = 0;
  
  // ===== ARCHITECTURE DESCRIPTION FRAME =====
  const archFrame = figma.createFrame();
  archFrame.name = 'Архитектура цветов';
  archFrame.x = 0;
  archFrame.y = yOffset;
  archFrame.layoutMode = 'VERTICAL';
  archFrame.itemSpacing = 20;
  archFrame.paddingTop = 40;
  archFrame.paddingBottom = 40;
  archFrame.paddingLeft = 40;
  archFrame.paddingRight = 40;
  archFrame.primaryAxisSizingMode = 'AUTO';
  archFrame.counterAxisSizingMode = 'AUTO';
  archFrame.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 1 } }];
  archFrame.cornerRadius = 16;
  archFrame.minWidth = 700;
  
  const archTitle = createStyledText('🏗️ Архитектура цветовой системы', 0, 0, 28, 'Bold');
  archFrame.appendChild(archTitle);
  
  const archDesc = createStyledText(
    `Цветовая система построена по принципу "Примитивы → Токены → Темы".\n\n` +
    `📦 ПРИМИТИВЫ (Primitives)\n` +
    `Базовые цвета с числовой шкалой: blue/500, gray/100, red/600.\n` +
    `Это "сырые" значения без семантики, которые никогда не меняются.\n\n` +
    `🎯 СЕМАНТИЧЕСКИЕ ТОКЕНЫ (Tokens)\n` +
    `Токены ссылаются на примитивы и несут смысл: bg/primary, text/secondary, border/error.\n` +
    `Компоненты используют только семантические токены.\n\n` +
    `🌓 ТЕМЫ (Themes)\n` +
    `Темы переключают значения токенов: в Light теме bg/primary = white,\n` +
    `в Dark теме bg/primary = gray/900. Примитивы при этом остаются неизменными.\n\n` +
    `💡 ПРЕИМУЩЕСТВА\n` +
    `• Централизованное управление цветами\n` +
    `• Мгновенное переключение тем\n` +
    `• Консистентность во всём продукте\n` +
    `• Простота обновления брендовых цветов`,
    0, 0, 13, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  archFrame.appendChild(archDesc);
  
  page.appendChild(archFrame);
  yOffset += archFrame.height + 48;
  framesCreated++;
  
  // ===== COLOR COLLECTIONS =====
  for (const coll of collections) {
    const vars = varsByCollection.get(coll.id);
    if (!vars || vars.length === 0) continue;
    
    // Section frame
    const sectionFrame = figma.createFrame();
    sectionFrame.name = `Colors: ${coll.name}`;
    sectionFrame.x = 0;
    sectionFrame.y = yOffset;
    sectionFrame.layoutMode = 'VERTICAL';
    sectionFrame.itemSpacing = 24;
    sectionFrame.paddingTop = 32;
    sectionFrame.paddingBottom = 32;
    sectionFrame.paddingLeft = 32;
    sectionFrame.paddingRight = 32;
    sectionFrame.primaryAxisSizingMode = 'AUTO';
    sectionFrame.counterAxisSizingMode = 'AUTO';
    sectionFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    sectionFrame.cornerRadius = 16;
    
    // Title
    const title = createStyledText(`🎨 ${coll.name}`, 0, 0, 32, 'Bold');
    sectionFrame.appendChild(title);
    
    // Modes info
    const modesInfo = coll.modes.length > 1 
      ? `Режимы: ${coll.modes.map(m => m.name).join(', ')}`
      : 'Без режимов (примитивы)';
    
    // Description
    const desc = createStyledText(
      `${vars.length} цветовых переменных · ${modesInfo}`, 
      0, 0, 14, 'Regular', { r: 0.5, g: 0.5, b: 0.5 }
    );
    sectionFrame.appendChild(desc);
    
    // Group by path prefix
    const varsByGroup = new Map<string, Variable[]>();
    for (const v of vars) {
      const parts = v.name.split('/');
      const group = parts.length > 1 ? parts[0] : 'Other';
      const list = varsByGroup.get(group) || [];
      list.push(v);
      varsByGroup.set(group, list);
    }
    
    for (const [groupName, groupVars] of varsByGroup) {
      // Group container
      const groupFrame = figma.createFrame();
      groupFrame.name = groupName;
      groupFrame.layoutMode = 'VERTICAL';
      groupFrame.itemSpacing = 12;
      groupFrame.primaryAxisSizingMode = 'AUTO';
      groupFrame.counterAxisSizingMode = 'AUTO';
      groupFrame.fills = [];
      
      // Group title
      const groupTitle = createStyledText(groupName, 0, 0, 18, 'Medium');
      groupFrame.appendChild(groupTitle);
      
      // Colors grid
      const gridFrame = figma.createFrame();
      gridFrame.name = 'Colors Grid';
      gridFrame.layoutMode = 'HORIZONTAL';
      gridFrame.layoutWrap = 'WRAP';
      gridFrame.itemSpacing = 16;
      gridFrame.counterAxisSpacing = 16;
      gridFrame.primaryAxisSizingMode = 'AUTO';
      gridFrame.counterAxisSizingMode = 'AUTO';
      gridFrame.fills = [];
      
      for (const variable of groupVars) {
        // Color card
        const card = figma.createFrame();
        card.name = variable.name;
        card.layoutMode = 'VERTICAL';
        card.itemSpacing = 8;
        card.primaryAxisSizingMode = 'AUTO';
        card.counterAxisSizingMode = 'FIXED';
        card.resize(120, card.height);
        card.fills = [];
        
        // Color swatch
        const swatch = figma.createRectangle();
        swatch.resize(120, 64);
        swatch.cornerRadius = 8;
        
        // Get first mode value (resolve aliases)
        const modeId = coll.modes[0]?.modeId;
        let colorValue: RGBA | null = null;
        
        if (modeId) {
          colorValue = await resolveColorValue(variable, modeId);
        }
        
        if (colorValue) {
          swatch.fills = [{ type: 'SOLID', color: { r: colorValue.r, g: colorValue.g, b: colorValue.b } }];
          if (colorValue.a !== undefined && colorValue.a < 1) {
            const fill = swatch.fills[0] as SolidPaint;
            swatch.fills = [{ ...fill, opacity: colorValue.a }];
          }
        } else {
          swatch.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
        }
        
        swatch.strokes = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
        swatch.strokeWeight = 1;
        card.appendChild(swatch);
        
        // Variable name (short)
        const shortName = variable.name.split('/').pop() || variable.name;
        const nameText = createStyledText(shortName, 0, 0, 11, 'Medium');
        nameText.resize(120, nameText.height);
        nameText.textTruncation = 'ENDING';
        card.appendChild(nameText);
        
        // Variable path
        const pathText = createStyledText(variable.name, 0, 0, 9, 'Regular', { r: 0.6, g: 0.6, b: 0.6 });
        pathText.resize(120, pathText.height);
        pathText.textTruncation = 'ENDING';
        card.appendChild(pathText);
        
        gridFrame.appendChild(card);
      }
      
      groupFrame.appendChild(gridFrame);
      sectionFrame.appendChild(groupFrame);
    }
    
    page.appendChild(sectionFrame);
    yOffset += sectionFrame.height + 48;
    framesCreated++;
  }
  
  // Switch to new page
  await figma.setCurrentPageAsync(page);
  
  return { pageName, framesCreated };
}

// Helper to resolve variable value (handles aliases)
async function resolveVariableValue(variable: Variable, modeId: string): Promise<number | string | RGBA | null> {
  const value = variable.valuesByMode[modeId];
  
  if (value === undefined) return null;
  
  // Check if it's an alias
  if (typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    const aliasedVar = await figma.variables.getVariableByIdAsync(value.id);
    if (aliasedVar) {
      // Get first mode of aliased variable's collection
      const aliasedColl = await figma.variables.getVariableCollectionByIdAsync(aliasedVar.variableCollectionId);
      if (aliasedColl && aliasedColl.modes.length > 0) {
        return resolveVariableValue(aliasedVar, aliasedColl.modes[0].modeId);
      }
    }
    return null;
  }
  
  return value as number | string | RGBA;
}

// Generate Typography Documentation
async function generateTypographyDocumentation(): Promise<DocGeneratorResult> {
  await loadDocFonts();
  
  const pageName = '📖 Typography Documentation';
  const page = figma.createPage();
  page.name = pageName;
  
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const floatVars = await figma.variables.getLocalVariablesAsync('FLOAT');
  const stringVars = await figma.variables.getLocalVariablesAsync('STRING');
  
  let framesCreated = 0;
  let xOffset = 0;
  
  // ===== ARCHITECTURE DESCRIPTION FRAME =====
  const archFrame = figma.createFrame();
  archFrame.name = 'Архитектура типографики';
  archFrame.x = xOffset;
  archFrame.y = 0;
  archFrame.layoutMode = 'VERTICAL';
  archFrame.itemSpacing = 24;
  archFrame.paddingTop = 40;
  archFrame.paddingBottom = 40;
  archFrame.paddingLeft = 40;
  archFrame.paddingRight = 40;
  archFrame.primaryAxisSizingMode = 'AUTO';
  archFrame.counterAxisSizingMode = 'AUTO';
  archFrame.fills = [{ type: 'SOLID', color: { r: 0.98, g: 1, b: 0.98 } }];
  archFrame.cornerRadius = 16;
  archFrame.minWidth = 550;
  
  const archTitle = createStyledText('🏗️ Архитектура типографики', 0, 0, 28, 'Bold');
  archFrame.appendChild(archTitle);
  
  const archDesc = createStyledText(
    `Система следует 2-уровневой архитектуре: Primitives → Semantic.\n` +
    `Семантические токены имеют 3 режима адаптивности.`,
    0, 0, 13, 'Regular', { r: 0.4, g: 0.4, b: 0.4 }
  );
  archFrame.appendChild(archDesc);
  
  // Primitives section
  const primSection = figma.createFrame();
  primSection.name = 'Primitives section';
  primSection.layoutMode = 'VERTICAL';
  primSection.itemSpacing = 8;
  primSection.fills = [];
  primSection.primaryAxisSizingMode = 'AUTO';
  primSection.counterAxisSizingMode = 'AUTO';
  
  const primTitle = createStyledText('📦 ПРИМИТИВЫ (Primitives)', 0, 0, 16, 'Bold');
  primSection.appendChild(primTitle);
  
  const primDesc = createStyledText(
    `Базовые значения без контекста использования.\n\n` +
    `Font Sizes (px):\n` +
    `10 · 11 · 12 · 13 · 14 · 15 · 16 · 18 · 20 · 24 · 28 · 32 · 36 · 40 · 48 · 56 · 64 · 72 · 96\n\n` +
    `Line Heights (множитель → % в Figma):\n` +
    `1.0 (100%) · 1.1 (110%) · 1.2 (120%) · 1.25 (125%) · 1.3 (130%)\n` +
    `1.4 (140%) · 1.5 (150%) · 1.6 (160%) · 1.7 (170%) · 2.0 (200%)\n\n` +
    `Font Weights:\n` +
    `100 Thin · 200 ExtraLight · 300 Light · 400 Regular\n` +
    `500 Medium · 600 Semibold · 700 Bold · 800 ExtraBold · 900 Black\n\n` +
    `Letter Spacing (em → % в Figma):\n` +
    `-0.05em (-5%) · -0.025em (-2.5%) · -0.02em (-2%) · 0 · +0.02em (+2%) · +0.05em (+5%)`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  primSection.appendChild(primDesc);
  archFrame.appendChild(primSection);
  
  // Semantic section
  const semSection = figma.createFrame();
  semSection.name = 'Semantic section';
  semSection.layoutMode = 'VERTICAL';
  semSection.itemSpacing = 8;
  semSection.fills = [];
  semSection.primaryAxisSizingMode = 'AUTO';
  semSection.counterAxisSizingMode = 'AUTO';
  
  const semTitle = createStyledText('🎯 СЕМАНТИЧЕСКИЕ ТОКЕНЫ (17 категорий, 90+ токенов)', 0, 0, 16, 'Bold');
  semSection.appendChild(semTitle);
  
  const semDesc = createStyledText(
    `Контекстное применение примитивов через алиасы {font.size.X}.\n\n` +
    `КАТЕГОРИИ:\n` +
    `• page — hero (56px), title (40px), subtitle (24px)\n` +
    `• section — heading (32px), subheading (20px)\n` +
    `• card — title (18px), subtitle (14px), body (14px), meta (11px)\n` +
    `• modal — title (20px), subtitle (14px)\n` +
    `• sidebar — groupTitle (11px UPPERCASE), itemLabel (14px)\n` +
    `• paragraph — lead (18px), default (15px), compact (14px), dense (13px)\n` +
    `• helper — hint (13px), caption (12px), footnote (11px)\n` +
    `• action — button.primary (14px), button.compact (12px), button.large (16px)\n` +
    `• form — label (14px), input.value (14px), validation (12px)\n` +
    `• data — table.header (12px UPPERCASE), table.cell (13px), metric.value (36px)\n` +
    `• status — badge (11px), tag (12px)\n` +
    `• notification — toast.title (14px), banner.title (16px)\n` +
    `• navigation — menu.item (14px), breadcrumb (13px), tab.label (14px)\n` +
    `• code — inline (13px Mono), block (13px Mono)\n` +
    `• content — blockquote (16px italic), list.item (15px)\n` +
    `• empty — title (20px), description (14px)\n` +
    `• loading — label (13px), percentage (12px Mono)`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  semSection.appendChild(semDesc);
  archFrame.appendChild(semSection);
  
  // Responsive section
  const respSection = figma.createFrame();
  respSection.name = 'Responsive section';
  respSection.layoutMode = 'VERTICAL';
  respSection.itemSpacing = 8;
  respSection.fills = [];
  respSection.primaryAxisSizingMode = 'AUTO';
  respSection.counterAxisSizingMode = 'AUTO';
  
  const respTitle = createStyledText('📱 АДАПТИВНОСТЬ (Breakpoints)', 0, 0, 16, 'Bold');
  respSection.appendChild(respTitle);
  
  const respDesc = createStyledText(
    `Каждый семантический токен имеет 3 режима:\n\n` +
    `Desktop (≥1280px) — Scale 100%\n` +
    `   page/hero: 56px → page/title: 40px → card/title: 18px\n\n` +
    `Tablet (≥768px) — Scale 87.5%\n` +
    `   page/hero: 48px → page/title: 36px → card/title: 16px\n\n` +
    `Mobile (<768px) — Scale 75%\n` +
    `   page/hero: 40px → page/title: 32px → card/title: 14px\n\n` +
    `⚠️ Режимы НЕ переключаются автоматически!\n` +
    `В Figma нужно вручную выбрать режим для фрейма.`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  respSection.appendChild(respDesc);
  archFrame.appendChild(respSection);
  
  // Figma limitations
  const limitSection = figma.createFrame();
  limitSection.name = 'Limitations section';
  limitSection.layoutMode = 'VERTICAL';
  limitSection.itemSpacing = 8;
  limitSection.fills = [];
  limitSection.primaryAxisSizingMode = 'AUTO';
  limitSection.counterAxisSizingMode = 'AUTO';
  
  const limitTitle = createStyledText('⚠️ ОГРАНИЧЕНИЯ FIGMA VARIABLES', 0, 0, 14, 'Medium');
  limitSection.appendChild(limitTitle);
  
  const limitDesc = createStyledText(
    `Variables поддерживают: Font Size ✓, Line Height ✓, Letter Spacing ✓\n` +
    `Variables НЕ поддерживают: Font Family ✗, Font Weight ✗, Text Transform ✗\n\n` +
    `Для полной типографики используйте Text Styles вместо Variables.`,
    0, 0, 11, 'Regular', { r: 0.5, g: 0.3, b: 0.3 }
  );
  limitSection.appendChild(limitDesc);
  archFrame.appendChild(limitSection);
  
  page.appendChild(archFrame);
  xOffset += archFrame.width + 48;
  framesCreated++;
  
  // ===== SECTION 1: Font Scale =====
  const scaleFrame = figma.createFrame();
  scaleFrame.name = 'Font Scale';
  scaleFrame.x = xOffset;
  scaleFrame.y = 0;
  scaleFrame.layoutMode = 'VERTICAL';
  scaleFrame.itemSpacing = 24;
  scaleFrame.paddingTop = 40;
  scaleFrame.paddingBottom = 40;
  scaleFrame.paddingLeft = 40;
  scaleFrame.paddingRight = 40;
  scaleFrame.primaryAxisSizingMode = 'AUTO';
  scaleFrame.counterAxisSizingMode = 'AUTO';
  scaleFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  scaleFrame.cornerRadius = 16;
  scaleFrame.minWidth = 600;
  
  const scaleTitle = createStyledText('📏 Шкала размеров', 0, 0, 28, 'Bold');
  scaleFrame.appendChild(scaleTitle);
  
  // Find font-size variables
  const fontSizeVars = floatVars.filter(v => 
    v.name.toLowerCase().includes('font-size') || 
    v.name.toLowerCase().includes('fontsize') ||
    (v.name.toLowerCase().includes('size') && v.name.toLowerCase().includes('typography'))
  );
  
  if (fontSizeVars.length > 0) {
    // Group by collection and get primitives (raw values)
    for (const coll of collections) {
      const collVars = fontSizeVars.filter(v => v.variableCollectionId === coll.id);
      if (collVars.length === 0) continue;
      
      const collSection = figma.createFrame();
      collSection.name = coll.name;
      collSection.layoutMode = 'VERTICAL';
      collSection.itemSpacing = 12;
      collSection.primaryAxisSizingMode = 'AUTO';
      collSection.counterAxisSizingMode = 'AUTO';
      collSection.fills = [];
      
      const collLabel = createStyledText(`${coll.name}`, 0, 0, 14, 'Medium', { r: 0.5, g: 0.5, b: 0.5 });
      collSection.appendChild(collLabel);
      
      // Sort by value
      const sortedVars: Array<{ variable: Variable; value: number }> = [];
      for (const v of collVars) {
        const modeId = coll.modes[0]?.modeId;
        if (modeId) {
          const resolved = await resolveVariableValue(v, modeId);
          if (typeof resolved === 'number') {
            sortedVars.push({ variable: v, value: resolved });
          }
        }
      }
      sortedVars.sort((a, b) => b.value - a.value);
      
      for (const { variable, value } of sortedVars.slice(0, 12)) {
        const row = figma.createFrame();
        row.name = variable.name;
        row.layoutMode = 'HORIZONTAL';
        row.itemSpacing = 20;
        row.counterAxisAlignItems = 'CENTER';
        row.primaryAxisSizingMode = 'AUTO';
        row.counterAxisSizingMode = 'AUTO';
        row.fills = [];
        
        // Size value badge
        const badge = figma.createFrame();
        badge.layoutMode = 'HORIZONTAL';
        badge.paddingTop = 4;
        badge.paddingBottom = 4;
        badge.paddingLeft = 8;
        badge.paddingRight = 8;
        badge.primaryAxisSizingMode = 'AUTO';
        badge.counterAxisSizingMode = 'AUTO';
        badge.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
        badge.cornerRadius = 4;
        
        const sizeText = createStyledText(`${value}px`, 0, 0, 11, 'Medium');
        badge.appendChild(sizeText);
        row.appendChild(badge);
        
        // Variable name
        const shortName = variable.name.split('/').pop() || variable.name;
        const nameText = createStyledText(shortName, 0, 0, 12, 'Regular', { r: 0.4, g: 0.4, b: 0.4 });
        nameText.resize(150, nameText.height);
        row.appendChild(nameText);
        
        // Sample text at that size (clamped for display)
        const displaySize = Math.min(Math.max(value, 10), 48);
        const sampleText = createStyledText('Aa Bb Cc', 0, 0, displaySize, 'Regular');
        row.appendChild(sampleText);
        
        collSection.appendChild(row);
      }
      
      scaleFrame.appendChild(collSection);
    }
  } else {
    const noData = createStyledText('No font-size variables found', 0, 0, 14, 'Regular', { r: 0.6, g: 0.6, b: 0.6 });
    scaleFrame.appendChild(noData);
  }
  
  page.appendChild(scaleFrame);
  xOffset += scaleFrame.width + 48;
  framesCreated++;
  
  // ===== SECTION 2: Type Styles Preview =====
  const stylesFrame = figma.createFrame();
  stylesFrame.name = 'Type Styles';
  stylesFrame.x = xOffset;
  stylesFrame.y = 0;
  stylesFrame.layoutMode = 'VERTICAL';
  stylesFrame.itemSpacing = 32;
  stylesFrame.paddingTop = 40;
  stylesFrame.paddingBottom = 40;
  stylesFrame.paddingLeft = 40;
  stylesFrame.paddingRight = 40;
  stylesFrame.primaryAxisSizingMode = 'AUTO';
  stylesFrame.counterAxisSizingMode = 'AUTO';
  stylesFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  stylesFrame.cornerRadius = 16;
  stylesFrame.minWidth = 500;
  
  const stylesTitle = createStyledText('✨ Семантические стили', 0, 0, 28, 'Bold');
  stylesFrame.appendChild(stylesTitle);
  
  // Find semantic typography variables (grouped by style name)
  const semanticTypoVars = floatVars.filter(v => 
    v.name.toLowerCase().includes('typography/') && 
    !v.name.toLowerCase().includes('primitives')
  );
  
  // Group by style (e.g., typography/page/hero, typography/page/title)
  const styleGroups = new Map<string, Variable[]>();
  for (const v of semanticTypoVars) {
    const parts = v.name.split('/');
    if (parts.length >= 3) {
      const styleName = parts.slice(0, -1).join('/'); // e.g., typography/page/hero
      const list = styleGroups.get(styleName) || [];
      list.push(v);
      styleGroups.set(styleName, list);
    }
  }
  
  // Show up to 8 type styles
  let styleCount = 0;
  for (const [styleName, vars] of styleGroups) {
    if (styleCount >= 8) break;
    
    // Find fontSize for this style
    const fontSizeVar = vars.find(v => v.name.toLowerCase().includes('fontsize') || v.name.toLowerCase().includes('size'));
    const lineHeightVar = vars.find(v => v.name.toLowerCase().includes('lineheight'));
    const fontWeightVar = vars.find(v => v.name.toLowerCase().includes('fontweight') || v.name.toLowerCase().includes('weight'));
    
    // Get collection for this var
    const coll = collections.find(c => c.id === (fontSizeVar || vars[0]).variableCollectionId);
    const modeId = coll?.modes[0]?.modeId;
    
    let fontSize = 16;
    let lineHeight = 1.5;
    let fontWeight = 400;
    
    if (modeId) {
      if (fontSizeVar) {
        const v = await resolveVariableValue(fontSizeVar, modeId);
        if (typeof v === 'number') fontSize = v;
      }
      if (lineHeightVar) {
        const v = await resolveVariableValue(lineHeightVar, modeId);
        if (typeof v === 'number') lineHeight = v;
      }
      if (fontWeightVar) {
        const v = await resolveVariableValue(fontWeightVar, modeId);
        if (typeof v === 'number') fontWeight = v;
      }
    }
    
    const styleRow = figma.createFrame();
    styleRow.name = styleName;
    styleRow.layoutMode = 'VERTICAL';
    styleRow.itemSpacing = 6;
    styleRow.primaryAxisSizingMode = 'AUTO';
    styleRow.counterAxisSizingMode = 'AUTO';
    styleRow.fills = [];
    styleRow.paddingBottom = 8;
    
    // Header row with name and size badge
    const headerRow = figma.createFrame();
    headerRow.layoutMode = 'HORIZONTAL';
    headerRow.itemSpacing = 8;
    headerRow.counterAxisAlignItems = 'CENTER';
    headerRow.fills = [];
    headerRow.primaryAxisSizingMode = 'AUTO';
    headerRow.counterAxisSizingMode = 'AUTO';
    
    // Size badge
    const sizeBadge = figma.createFrame();
    sizeBadge.layoutMode = 'HORIZONTAL';
    sizeBadge.paddingTop = 2;
    sizeBadge.paddingBottom = 2;
    sizeBadge.paddingLeft = 6;
    sizeBadge.paddingRight = 6;
    sizeBadge.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.97, b: 0.98 } }];
    sizeBadge.cornerRadius = 4;
    sizeBadge.primaryAxisSizingMode = 'AUTO';
    sizeBadge.counterAxisSizingMode = 'AUTO';
    
    const sizeLabel = createStyledText(`${fontSize}px`, 0, 0, 10, 'Medium', { r: 0.3, g: 0.5, b: 0.6 });
    sizeBadge.appendChild(sizeLabel);
    headerRow.appendChild(sizeBadge);
    
    // Style name label
    const shortStyleName = styleName.split('/').slice(1).join(' / ');
    const styleLabel = createStyledText(shortStyleName, 0, 0, 11, 'Regular', { r: 0.5, g: 0.5, b: 0.5 });
    headerRow.appendChild(styleLabel);
    
    styleRow.appendChild(headerRow);
    
    // Sample text at ACTUAL size
    const displaySize = Math.min(Math.max(fontSize, 10), 56);
    const fontStyle = fontWeight >= 600 ? 'Bold' : (fontWeight >= 500 ? 'Medium' : 'Regular');
    const sampleText = createStyledText('The quick brown fox jumps', 0, 0, displaySize, fontStyle);
    styleRow.appendChild(sampleText);
    
    // Properties
    const propsText = createStyledText(
      `${fontSize}px / ${lineHeight} / ${fontWeight}`,
      0, 0, 10, 'Regular', { r: 0.6, g: 0.6, b: 0.6 }
    );
    styleRow.appendChild(propsText);
    
    stylesFrame.appendChild(styleRow);
    styleCount++;
  }
  
  if (styleCount === 0) {
    const noStyles = createStyledText('No semantic typography styles found', 0, 0, 14, 'Regular', { r: 0.6, g: 0.6, b: 0.6 });
    stylesFrame.appendChild(noStyles);
  }
  
  page.appendChild(stylesFrame);
  xOffset += stylesFrame.width + 48;
  framesCreated++;
  
  // ===== SECTION 3: Font Properties =====
  const propsFrame = figma.createFrame();
  propsFrame.name = 'Font Properties';
  propsFrame.x = xOffset;
  propsFrame.y = 0;
  propsFrame.layoutMode = 'VERTICAL';
  propsFrame.itemSpacing = 24;
  propsFrame.paddingTop = 40;
  propsFrame.paddingBottom = 40;
  propsFrame.paddingLeft = 40;
  propsFrame.paddingRight = 40;
  propsFrame.primaryAxisSizingMode = 'AUTO';
  propsFrame.counterAxisSizingMode = 'AUTO';
  propsFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  propsFrame.cornerRadius = 16;
  propsFrame.minWidth = 350;
  
  const propsTitle = createStyledText('⚙️ Свойства шрифта', 0, 0, 28, 'Bold');
  propsFrame.appendChild(propsTitle);
  
  // Font Families
  const fontFamilyVars = stringVars.filter(v => 
    v.name.toLowerCase().includes('font') && v.name.toLowerCase().includes('family')
  );
  
  if (fontFamilyVars.length > 0) {
    const familiesSection = figma.createFrame();
    familiesSection.name = 'Font Families';
    familiesSection.layoutMode = 'VERTICAL';
    familiesSection.itemSpacing = 8;
    familiesSection.primaryAxisSizingMode = 'AUTO';
    familiesSection.counterAxisSizingMode = 'AUTO';
    familiesSection.fills = [];
    
    const familiesLabel = createStyledText('Font Families', 0, 0, 14, 'Medium');
    familiesSection.appendChild(familiesLabel);
    
    for (const v of fontFamilyVars.slice(0, 5)) {
      const coll = collections.find(c => c.id === v.variableCollectionId);
      const modeId = coll?.modes[0]?.modeId;
      const value = modeId ? await resolveVariableValue(v, modeId) : null;
      
      const row = figma.createFrame();
      row.layoutMode = 'HORIZONTAL';
      row.itemSpacing = 12;
      row.primaryAxisSizingMode = 'AUTO';
      row.counterAxisSizingMode = 'AUTO';
      row.fills = [];
      
      const shortName = v.name.split('/').pop() || v.name;
      const nameText = createStyledText(shortName, 0, 0, 12, 'Regular', { r: 0.5, g: 0.5, b: 0.5 });
      row.appendChild(nameText);
      
      const valueText = createStyledText(String(value || '-'), 0, 0, 12, 'Medium');
      row.appendChild(valueText);
      
      familiesSection.appendChild(row);
    }
    
    propsFrame.appendChild(familiesSection);
  }
  
  // Font Weights
  const fontWeightVars = floatVars.filter(v => 
    v.name.toLowerCase().includes('weight') && !v.name.toLowerCase().includes('typography/')
  );
  
  if (fontWeightVars.length > 0) {
    const weightsSection = figma.createFrame();
    weightsSection.name = 'Font Weights';
    weightsSection.layoutMode = 'VERTICAL';
    weightsSection.itemSpacing = 8;
    weightsSection.primaryAxisSizingMode = 'AUTO';
    weightsSection.counterAxisSizingMode = 'AUTO';
    weightsSection.fills = [];
    
    const weightsLabel = createStyledText('Font Weights', 0, 0, 14, 'Medium');
    weightsSection.appendChild(weightsLabel);
    
    for (const v of fontWeightVars.slice(0, 6)) {
      const coll = collections.find(c => c.id === v.variableCollectionId);
      const modeId = coll?.modes[0]?.modeId;
      const value = modeId ? await resolveVariableValue(v, modeId) : null;
      
      const row = figma.createFrame();
      row.layoutMode = 'HORIZONTAL';
      row.itemSpacing = 12;
      row.primaryAxisSizingMode = 'AUTO';
      row.counterAxisSizingMode = 'AUTO';
      row.fills = [];
      
      const shortName = v.name.split('/').pop() || v.name;
      const nameText = createStyledText(shortName, 0, 0, 12, 'Regular', { r: 0.5, g: 0.5, b: 0.5 });
      row.appendChild(nameText);
      
      const valueText = createStyledText(String(value || '-'), 0, 0, 12, 'Medium');
      row.appendChild(valueText);
      
      weightsSection.appendChild(row);
    }
    
    propsFrame.appendChild(weightsSection);
  }
  
  // Line Heights
  const lineHeightVars = floatVars.filter(v => 
    v.name.toLowerCase().includes('line-height') && !v.name.toLowerCase().includes('typography/')
  );
  
  if (lineHeightVars.length > 0) {
    const lhSection = figma.createFrame();
    lhSection.name = 'Line Heights';
    lhSection.layoutMode = 'VERTICAL';
    lhSection.itemSpacing = 8;
    lhSection.primaryAxisSizingMode = 'AUTO';
    lhSection.counterAxisSizingMode = 'AUTO';
    lhSection.fills = [];
    
    const lhLabel = createStyledText('Line Heights', 0, 0, 14, 'Medium');
    lhSection.appendChild(lhLabel);
    
    for (const v of lineHeightVars.slice(0, 6)) {
      const coll = collections.find(c => c.id === v.variableCollectionId);
      const modeId = coll?.modes[0]?.modeId;
      const value = modeId ? await resolveVariableValue(v, modeId) : null;
      
      const row = figma.createFrame();
      row.layoutMode = 'HORIZONTAL';
      row.itemSpacing = 12;
      row.primaryAxisSizingMode = 'AUTO';
      row.counterAxisSizingMode = 'AUTO';
      row.fills = [];
      
      const shortName = v.name.split('/').pop() || v.name;
      const nameText = createStyledText(shortName, 0, 0, 12, 'Regular', { r: 0.5, g: 0.5, b: 0.5 });
      row.appendChild(nameText);
      
      const valueText = createStyledText(String(value || '-'), 0, 0, 12, 'Medium');
      row.appendChild(valueText);
      
      lhSection.appendChild(row);
    }
    
    propsFrame.appendChild(lhSection);
  }
  
  page.appendChild(propsFrame);
  xOffset += propsFrame.width + 48;
  framesCreated++;
  
  // ===== SECTION 4: Categories Overview =====
  const categoriesFrame = figma.createFrame();
  categoriesFrame.name = 'Typography Categories';
  categoriesFrame.x = xOffset;
  categoriesFrame.y = 0;
  categoriesFrame.layoutMode = 'VERTICAL';
  categoriesFrame.itemSpacing = 16;
  categoriesFrame.paddingTop = 40;
  categoriesFrame.paddingBottom = 40;
  categoriesFrame.paddingLeft = 40;
  categoriesFrame.paddingRight = 40;
  categoriesFrame.primaryAxisSizingMode = 'AUTO';
  categoriesFrame.counterAxisSizingMode = 'AUTO';
  categoriesFrame.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 1 } }];
  categoriesFrame.cornerRadius = 16;
  categoriesFrame.minWidth = 480;
  
  const categoriesTitle = createStyledText('📂 Категории токенов', 0, 0, 24, 'Bold');
  categoriesFrame.appendChild(categoriesTitle);
  
  // Define all categories with their tokens and default sizes
  const typographyCategories = [
    { name: 'page', desc: 'Страничные заголовки', tokens: [
      { name: 'hero', size: 56, weight: 'Bold', desc: 'Landing hero, main CTAs' },
      { name: 'title', size: 40, weight: 'Bold', desc: 'Page title H1' },
      { name: 'subtitle', size: 24, weight: 'Semibold', desc: 'Page subtitle' }
    ]},
    { name: 'section', desc: 'Заголовки секций', tokens: [
      { name: 'heading', size: 32, weight: 'Semibold', desc: 'H2 Section heading' },
      { name: 'subheading', size: 20, weight: 'Semibold', desc: 'H3 Subheading' }
    ]},
    { name: 'card', desc: 'Карточки', tokens: [
      { name: 'title', size: 18, weight: 'Semibold', desc: 'Card title' },
      { name: 'subtitle', size: 14, weight: 'Medium', desc: 'Card subtitle' },
      { name: 'body', size: 14, weight: 'Regular', desc: 'Card body text' },
      { name: 'meta', size: 11, weight: 'Regular', desc: 'Date, author info' }
    ]},
    { name: 'paragraph', desc: 'Текстовые блоки', tokens: [
      { name: 'lead', size: 18, weight: 'Regular', desc: 'Intro paragraph' },
      { name: 'default', size: 15, weight: 'Regular', desc: 'Standard text' },
      { name: 'compact', size: 14, weight: 'Regular', desc: 'Compact text' },
      { name: 'dense', size: 13, weight: 'Regular', desc: 'Dense text' }
    ]},
    { name: 'action', desc: 'Кнопки и ссылки', tokens: [
      { name: 'button.primary', size: 14, weight: 'Medium', desc: 'Primary button' },
      { name: 'button.compact', size: 12, weight: 'Medium', desc: 'Small button' },
      { name: 'button.large', size: 16, weight: 'Medium', desc: 'Large button' }
    ]},
    { name: 'form', desc: 'Формы', tokens: [
      { name: 'label', size: 14, weight: 'Medium', desc: 'Form label' },
      { name: 'input.value', size: 14, weight: 'Regular', desc: 'Input text' },
      { name: 'validation', size: 12, weight: 'Regular', desc: 'Error/success' }
    ]},
    { name: 'data', desc: 'Таблицы и метрики', tokens: [
      { name: 'table.header', size: 12, weight: 'Semibold', desc: 'TH (UPPERCASE)' },
      { name: 'table.cell', size: 13, weight: 'Regular', desc: 'TD cell' },
      { name: 'metric.value', size: 36, weight: 'Bold', desc: 'KPI value' }
    ]},
    { name: 'navigation', desc: 'Навигация', tokens: [
      { name: 'menu.item', size: 14, weight: 'Medium', desc: 'Menu item' },
      { name: 'breadcrumb', size: 13, weight: 'Regular', desc: 'Breadcrumb' },
      { name: 'tab.label', size: 14, weight: 'Medium', desc: 'Tab label' }
    ]}
  ];
  
  for (const category of typographyCategories) {
    const catRow = figma.createFrame();
    catRow.name = category.name;
    catRow.layoutMode = 'VERTICAL';
    catRow.itemSpacing = 6;
    catRow.fills = [];
    catRow.primaryAxisSizingMode = 'AUTO';
    catRow.counterAxisSizingMode = 'AUTO';
    catRow.paddingBottom = 12;
    
    const catHeader = createStyledText(`${category.name}/ — ${category.desc}`, 0, 0, 13, 'Bold', { r: 0.2, g: 0.4, b: 0.6 });
    catRow.appendChild(catHeader);
    
    for (const token of category.tokens) {
      const tokenRow = figma.createFrame();
      tokenRow.layoutMode = 'HORIZONTAL';
      tokenRow.itemSpacing = 8;
      tokenRow.counterAxisAlignItems = 'CENTER';
      tokenRow.fills = [];
      tokenRow.primaryAxisSizingMode = 'AUTO';
      tokenRow.counterAxisSizingMode = 'AUTO';
      
      // Size badge
      const sizeBadge = figma.createFrame();
      sizeBadge.layoutMode = 'HORIZONTAL';
      sizeBadge.paddingTop = 2;
      sizeBadge.paddingBottom = 2;
      sizeBadge.paddingLeft = 6;
      sizeBadge.paddingRight = 6;
      sizeBadge.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.95, b: 1 } }];
      sizeBadge.cornerRadius = 4;
      sizeBadge.primaryAxisSizingMode = 'AUTO';
      sizeBadge.counterAxisSizingMode = 'AUTO';
      
      const sizeLabel = createStyledText(`${token.size}px`, 0, 0, 10, 'Medium', { r: 0.2, g: 0.4, b: 0.7 });
      sizeBadge.appendChild(sizeLabel);
      tokenRow.appendChild(sizeBadge);
      
      // Token name
      const tokenName = createStyledText(token.name, 0, 0, 11, 'Medium');
      tokenRow.appendChild(tokenName);
      
      // Description
      const tokenDesc = createStyledText(`— ${token.desc}`, 0, 0, 11, 'Regular', { r: 0.5, g: 0.5, b: 0.5 });
      tokenRow.appendChild(tokenDesc);
      
      catRow.appendChild(tokenRow);
    }
    
    categoriesFrame.appendChild(catRow);
  }
  
  page.appendChild(categoriesFrame);
  framesCreated++;
  
  await figma.setCurrentPageAsync(page);
  
  return { pageName, framesCreated };
}

// ============================================
// GRID DOCUMENTATION GENERATOR
// ============================================

async function generateGridDocumentation(): Promise<DocGeneratorResult> {
  await loadDocFonts();
  
  const pageName = '📖 Grid Documentation';
  const page = figma.createPage();
  page.name = pageName;
  
  let xOffset = 0;
  let framesCreated = 0;
  
  // ===== FRAME 1: АРХИТЕКТУРА GRID =====
  const archFrame = figma.createFrame();
  archFrame.name = 'Архитектура Grid';
  archFrame.x = xOffset;
  archFrame.y = 0;
  archFrame.layoutMode = 'VERTICAL';
  archFrame.itemSpacing = 24;
  archFrame.paddingTop = 40;
  archFrame.paddingBottom = 40;
  archFrame.paddingLeft = 40;
  archFrame.paddingRight = 40;
  archFrame.primaryAxisSizingMode = 'AUTO';
  archFrame.counterAxisSizingMode = 'AUTO';
  archFrame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.97, b: 1 } }];
  archFrame.cornerRadius = 16;
  archFrame.minWidth = 600;
  
  const archTitle = createStyledText('⊞ Архитектура системы Grid', 0, 0, 28, 'Bold');
  archFrame.appendChild(archTitle);
  
  const archIntro = createStyledText(
    `Grid — система Layout Grid для организации контента в колонки.\n` +
    `2-уровневая архитектура: Primitives → Semantic + 3 режима адаптивности.\n` +
    `Компонентный подход: сетки по назначению, а не по устройствам.`,
    0, 0, 13, 'Regular', { r: 0.4, g: 0.4, b: 0.4 }
  );
  archFrame.appendChild(archIntro);
  
  // Primitives section
  const primSection = figma.createFrame();
  primSection.name = 'Primitives';
  primSection.layoutMode = 'VERTICAL';
  primSection.itemSpacing = 8;
  primSection.fills = [];
  primSection.primaryAxisSizingMode = 'AUTO';
  primSection.counterAxisSizingMode = 'AUTO';
  
  const primTitle = createStyledText('📦 ПРИМИТИВЫ (Primitives коллекция)', 0, 0, 16, 'Bold');
  primSection.appendChild(primTitle);
  
  const primDesc = createStyledText(
    `⚠️ НЕЗАВИСИМЫ от Gap и Spacing — своя шкала значений!\n\n` +
    `grid/gutter/* — расстояние между колонками:\n` +
    `   0, 4, 8, 12, 16, 20, 24, 32, 40, 48 px\n\n` +
    `grid/margin/* — отступ от края фрейма до сетки:\n` +
    `   0, 16, 20, 24, 32, 48, 64, 80, 96, 120, 160 px\n\n` +
    `grid/container/* — max-width контейнеров:\n` +
    `   480, 560, 640, 720, 800, 960, 1024, 1200, 1280, 1440, 1600, 1920 px`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  primSection.appendChild(primDesc);
  archFrame.appendChild(primSection);
  
  // Semantic section
  const semSection = figma.createFrame();
  semSection.name = 'Semantic';
  semSection.layoutMode = 'VERTICAL';
  semSection.itemSpacing = 8;
  semSection.fills = [];
  semSection.primaryAxisSizingMode = 'AUTO';
  semSection.counterAxisSizingMode = 'AUTO';
  
  const semTitle = createStyledText('🎯 СЕМАНТИЧЕСКИЕ ТОКЕНЫ (Grid коллекция)', 0, 0, 16, 'Bold');
  semSection.appendChild(semTitle);
  
  const semDesc = createStyledText(
    `Режимы: Desktop / Tablet / Mobile\n\n` +
    `12 категорий:\n` +
    `• page — основные сетки страниц (default, wide, fluid)\n` +
    `• content — контентные области (narrow, prose)\n` +
    `• container — контейнеры с max-width\n` +
    `• cards — сетки карточек\n` +
    `• gallery — галереи, медиа\n` +
    `• dashboard — дашборды, виджеты\n` +
    `• form — формы (single, double, triple)\n` +
    `• list — списки\n` +
    `• navigation — меню, хедер, сайдбар\n` +
    `• data — таблицы данных\n` +
    `• footer — футеры\n` +
    `• custom — пользовательские категории`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  semSection.appendChild(semDesc);
  archFrame.appendChild(semSection);
  
  page.appendChild(archFrame);
  xOffset += archFrame.width + 48;
  framesCreated++;
  
  // ===== FRAME 2: GRID vs CONTAINER =====
  const vsFrame = figma.createFrame();
  vsFrame.name = 'Grid vs Container';
  vsFrame.x = xOffset;
  vsFrame.y = 0;
  vsFrame.layoutMode = 'VERTICAL';
  vsFrame.itemSpacing = 24;
  vsFrame.paddingTop = 40;
  vsFrame.paddingBottom = 40;
  vsFrame.paddingLeft = 40;
  vsFrame.paddingRight = 40;
  vsFrame.primaryAxisSizingMode = 'AUTO';
  vsFrame.counterAxisSizingMode = 'AUTO';
  vsFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 0.98, b: 0.95 } }];
  vsFrame.cornerRadius = 16;
  vsFrame.minWidth = 600;
  
  const vsTitle = createStyledText('⚖️ Grid vs Container — когда что использовать', 0, 0, 22, 'Bold');
  vsFrame.appendChild(vsTitle);
  
  // Grid section
  const gridSection = figma.createFrame();
  gridSection.name = 'Grid explanation';
  gridSection.layoutMode = 'VERTICAL';
  gridSection.itemSpacing = 8;
  gridSection.fills = [];
  gridSection.primaryAxisSizingMode = 'AUTO';
  gridSection.counterAxisSizingMode = 'AUTO';
  
  const gridTitle = createStyledText('📊 layout/grid/* — МНОГОКОЛОНОЧНЫЕ СЕТКИ', 0, 0, 16, 'Bold', { r: 0.2, g: 0.4, b: 0.8 });
  gridSection.appendChild(gridTitle);
  
  const gridDesc = createStyledText(
    `Организация контента внутри контейнера в колонки.\n\n` +
    `Применение:\n` +
    `• layout/grid/page/default — основная 12-колоночная сетка\n` +
    `• layout/grid/cards/default — раскладка карточек (3-4 в ряд)\n` +
    `• layout/grid/form/double — двухколоночная форма\n` +
    `• layout/grid/dashboard/main — сетка виджетов\n` +
    `• layout/grid/gallery/masonry — галерея изображений\n\n` +
    `Накладывается на КОНТЕНТ-ОБЛАСТЬ внутри контейнера.`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  gridSection.appendChild(gridDesc);
  vsFrame.appendChild(gridSection);
  
  // Container section
  const contSection = figma.createFrame();
  contSection.name = 'Container explanation';
  contSection.layoutMode = 'VERTICAL';
  contSection.itemSpacing = 8;
  contSection.fills = [];
  contSection.primaryAxisSizingMode = 'AUTO';
  contSection.counterAxisSizingMode = 'AUTO';
  
  const contTitle = createStyledText('📦 layout/container/* — ОГРАНИЧИТЕЛИ ШИРИНЫ', 0, 0, 16, 'Bold', { r: 0.6, g: 0.4, b: 0.2 });
  contSection.appendChild(contTitle);
  
  const contDesc = createStyledText(
    `Max-width контейнеры с отступами от края.\n\n` +
    `Применение:\n` +
    `• layout/container/default — 1280px, стандартный\n` +
    `• layout/container/narrow — 720px, для статей и форм\n` +
    `• layout/container/medium — 960px, промежуточный\n` +
    `• layout/container/wide — 1440px, для дашбордов\n` +
    `• layout/container/modal/* — 480-960px, модальные окна\n\n` +
    `Накладывается на ФРЕЙМ-ОБЁРТКУ которая центрируется на странице.`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  contSection.appendChild(contDesc);
  vsFrame.appendChild(contSection);
  
  page.appendChild(vsFrame);
  xOffset += vsFrame.width + 48;
  framesCreated++;
  
  // ===== FRAME 3: ИЕРАРХИЯ ПРИМЕНЕНИЯ =====
  const hierFrame = figma.createFrame();
  hierFrame.name = 'Иерархия применения';
  hierFrame.x = xOffset;
  hierFrame.y = 0;
  hierFrame.layoutMode = 'VERTICAL';
  hierFrame.itemSpacing = 24;
  hierFrame.paddingTop = 40;
  hierFrame.paddingBottom = 40;
  hierFrame.paddingLeft = 40;
  hierFrame.paddingRight = 40;
  hierFrame.primaryAxisSizingMode = 'AUTO';
  hierFrame.counterAxisSizingMode = 'AUTO';
  hierFrame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 1, b: 0.95 } }];
  hierFrame.cornerRadius = 16;
  hierFrame.minWidth = 650;
  
  const hierTitle = createStyledText('🏗️ Иерархия применения сеток', 0, 0, 22, 'Bold');
  hierFrame.appendChild(hierTitle);
  
  const hierDiagram = createStyledText(
    `┌─────────────────────────────────────────────────────────┐\n` +
    `│ Page Frame (width: 1920px)                             │\n` +
    `│                                                        │\n` +
    `│  ┌─────────────────────────────────────────────────┐   │\n` +
    `│  │ Container: layout/container/default             │   │\n` +
    `│  │ (max-width: 1280px, alignment: CENTER)          │   │\n` +
    `│  │                                                 │   │\n` +
    `│  │  ┌───────────────────────────────────────────┐  │   │\n` +
    `│  │  │ Grid: layout/grid/cards/default           │  │   │\n` +
    `│  │  │ (12 columns, gutter: 24px)                │  │   │\n` +
    `│  │  │                                           │  │   │\n` +
    `│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │  │   │\n` +
    `│  │  │  │Card │ │Card │ │Card │ │Card │         │  │   │\n` +
    `│  │  │  │ 3col│ │ 3col│ │ 3col│ │ 3col│         │  │   │\n` +
    `│  │  │  └─────┘ └─────┘ └─────┘ └─────┘         │  │   │\n` +
    `│  │  └───────────────────────────────────────────┘  │   │\n` +
    `│  └─────────────────────────────────────────────────┘   │\n` +
    `└─────────────────────────────────────────────────────────┘`,
    0, 0, 10, 'Regular', { r: 0.2, g: 0.2, b: 0.2 }
  );
  hierFrame.appendChild(hierDiagram);
  
  const hierExplanation = createStyledText(
    `ПОРЯДОК ПРИМЕНЕНИЯ:\n\n` +
    `1️⃣ Page Frame — полная ширина экрана (1920px, 1440px и т.д.)\n` +
    `2️⃣ Container — ограничивает max-width и центрирует контент\n` +
    `3️⃣ Grid — разбивает контент на колонки внутри контейнера\n` +
    `4️⃣ Elements — элементы занимают N колонок сетки\n\n` +
    `💡 Container отвечает за "где", Grid — за "как разложить".`,
    0, 0, 12, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  hierFrame.appendChild(hierExplanation);
  
  page.appendChild(hierFrame);
  xOffset += hierFrame.width + 48;
  framesCreated++;
  
  // ===== FRAME 4: ПРАВИЛА ДЛЯ ЗНАЧЕНИЙ =====
  const rulesFrame = figma.createFrame();
  rulesFrame.name = 'Правила для значений';
  rulesFrame.x = xOffset;
  rulesFrame.y = 0;
  rulesFrame.layoutMode = 'VERTICAL';
  rulesFrame.itemSpacing = 20;
  rulesFrame.paddingTop = 40;
  rulesFrame.paddingBottom = 40;
  rulesFrame.paddingLeft = 40;
  rulesFrame.paddingRight = 40;
  rulesFrame.primaryAxisSizingMode = 'AUTO';
  rulesFrame.counterAxisSizingMode = 'AUTO';
  rulesFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  rulesFrame.cornerRadius = 16;
  rulesFrame.minWidth = 700;
  
  const rulesTitle = createStyledText('📐 Правила для значений', 0, 0, 22, 'Bold');
  rulesFrame.appendChild(rulesTitle);
  
  // Columns rules
  const colRules = createStyledText(
    `📊 COLUMNS (количество колонок)\n\n` +
    `Desktop:  12, 8, 6, 4, 3, 2, 1\n` +
    `          └─ 12 делится на 2,3,4,6 — гибкая раскладка\n` +
    `Tablet:   8, 6, 4, 3, 2, 1\n` +
    `          └─ Меньше места — меньше колонок\n` +
    `Mobile:   4, 2, 1\n` +
    `          └─ Обычно 1-2 колонки максимум\n\n` +
    `Формула: tablet ≈ desktop × 0.66, mobile ≈ desktop × 0.33`,
    0, 0, 11, 'Regular', { r: 0.2, g: 0.2, b: 0.2 }
  );
  rulesFrame.appendChild(colRules);
  
  // Gutter rules
  const gutterRules = createStyledText(
    `↔️ GUTTER (расстояние между колонками)\n\n` +
    `Desktop:  24-32px   — просторно, комфортно читать\n` +
    `Tablet:   16-24px   — немного плотнее\n` +
    `Mobile:   12-16px   — компактно, экономия места\n\n` +
    `Формула: gutter = base × multiplier (base = 8px)\n` +
    `• Desktop: 8 × 3 = 24px или 8 × 4 = 32px\n` +
    `• Mobile: 8 × 2 = 16px`,
    0, 0, 11, 'Regular', { r: 0.2, g: 0.2, b: 0.2 }
  );
  rulesFrame.appendChild(gutterRules);
  
  // Margin rules
  const marginRules = createStyledText(
    `📏 MARGIN (отступ от края)\n\n` +
    `Контекст            Desktop    Tablet     Mobile\n` +
    `──────────────────────────────────────────────────\n` +
    `Страница            64px       32px       16px\n` +
    `Контейнер           24-32px    20-24px    16px\n` +
    `Карточки/контент    0px        0px        0px\n\n` +
    `Правило: margin уменьшается в 2 раза на каждом брейкпоинте.`,
    0, 0, 11, 'Regular', { r: 0.2, g: 0.2, b: 0.2 }
  );
  rulesFrame.appendChild(marginRules);
  
  // Alignment rules
  const alignRules = createStyledText(
    `🎯 ALIGNMENT (выравнивание)\n\n` +
    `CENTER   — Контейнеры с max-width (центрируются на странице)\n` +
    `STRETCH  — Полноширинные секции, карточки внутри контейнера\n` +
    `MIN      — Сетки привязанные к левому краю (Start)\n` +
    `MAX      — Редко, привязка к правому краю (End)`,
    0, 0, 11, 'Regular', { r: 0.2, g: 0.2, b: 0.2 }
  );
  rulesFrame.appendChild(alignRules);
  
  page.appendChild(rulesFrame);
  xOffset += rulesFrame.width + 48;
  framesCreated++;
  
  // ===== FRAME 5: КАК ДОБАВЛЯТЬ НОВЫЕ СЕТКИ =====
  const addFrame = figma.createFrame();
  addFrame.name = 'Как добавлять новые сетки';
  addFrame.x = xOffset;
  addFrame.y = 0;
  addFrame.layoutMode = 'VERTICAL';
  addFrame.itemSpacing = 20;
  addFrame.paddingTop = 40;
  addFrame.paddingBottom = 40;
  addFrame.paddingLeft = 40;
  addFrame.paddingRight = 40;
  addFrame.primaryAxisSizingMode = 'AUTO';
  addFrame.counterAxisSizingMode = 'AUTO';
  addFrame.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.95, b: 1 } }];
  addFrame.cornerRadius = 16;
  addFrame.minWidth = 650;
  
  const addTitle = createStyledText('➕ Как добавлять новые сетки', 0, 0, 22, 'Bold');
  addFrame.appendChild(addTitle);
  
  const step1 = createStyledText(
    `ШАГ 1: ОПРЕДЕЛИТЬ ТИП\n\n` +
    `❓ Это контейнер (ограничитель ширины)?  → container\n` +
    `❓ Это раскладка элементов в колонки?   → grid/{category}`,
    0, 0, 12, 'Regular', { r: 0.2, g: 0.2, b: 0.2 }
  );
  addFrame.appendChild(step1);
  
  const step2 = createStyledText(
    `ШАГ 2: ВЫБРАТЬ КАТЕГОРИЮ\n\n` +
    `Существующие категории:\n` +
    `• page — основные сетки страниц\n` +
    `• content — текстовый контент (статьи, prose)\n` +
    `• cards — карточки товаров, постов\n` +
    `• gallery — изображения, медиа\n` +
    `• dashboard — виджеты, метрики\n` +
    `• form — формы\n` +
    `• list — списки\n` +
    `• navigation — меню, табы\n` +
    `• data — таблицы\n` +
    `• footer — футеры\n\n` +
    `Или создайте новую категорию через UI.`,
    0, 0, 11, 'Regular', { r: 0.2, g: 0.2, b: 0.2 }
  );
  addFrame.appendChild(step2);
  
  const step3 = createStyledText(
    `ШАГ 3: ЗАПОЛНИТЬ КОНФИГУРАЦИЮ\n\n` +
    `Путь:    layout.grid.{category}.{name}\n\n` +
    `Desktop: columns — делитель 12 или кастом\n` +
    `         gutter — 16/20/24/32 из примитивов\n` +
    `         margin — 0 если внутри контейнера\n` +
    `         alignment — обычно STRETCH для контента\n` +
    `         maxWidth — опционально для контейнеров\n\n` +
    `Tablet:  columns ≈ desktop × 0.66\n` +
    `         gutter — desktop - 4px\n\n` +
    `Mobile:  columns — обычно 4 или меньше\n` +
    `         gutter — минимум комфортный (16px)`,
    0, 0, 11, 'Regular', { r: 0.2, g: 0.2, b: 0.2 }
  );
  addFrame.appendChild(step3);
  
  page.appendChild(addFrame);
  xOffset += addFrame.width + 48;
  framesCreated++;
  
  // ===== FRAME 6: ШПАРГАЛКА =====
  const cheatFrame = figma.createFrame();
  cheatFrame.name = 'Шпаргалка';
  cheatFrame.x = xOffset;
  cheatFrame.y = 0;
  cheatFrame.layoutMode = 'VERTICAL';
  cheatFrame.itemSpacing = 16;
  cheatFrame.paddingTop = 40;
  cheatFrame.paddingBottom = 40;
  cheatFrame.paddingLeft = 40;
  cheatFrame.paddingRight = 40;
  cheatFrame.primaryAxisSizingMode = 'AUTO';
  cheatFrame.counterAxisSizingMode = 'AUTO';
  cheatFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 0.97, b: 0.88 } }];
  cheatFrame.cornerRadius = 16;
  cheatFrame.minWidth = 750;
  
  const cheatTitle = createStyledText('📋 Шпаргалка по Grid системе', 0, 0, 22, 'Bold');
  cheatFrame.appendChild(cheatTitle);
  
  const cheatQuestions = createStyledText(
    `❓ ВОПРОС — ОТВЕТ\n\n` +
    `Нужен max-width для секции?              → Container\n` +
    `Нужны колонки внутри секции?             → Grid\n` +
    `Отступ от края страницы?                 → Container с margin\n` +
    `Отступ между карточками?                 → Grid с gutter\n` +
    `Центрировать блок на странице?           → alignment: CENTER\n` +
    `Растянуть на всю ширину контейнера?      → alignment: STRETCH\n` +
    `Привязать к левому краю?                 → alignment: MIN\n` +
    `Сетка для статьи/поста?                  → content/narrow или prose\n` +
    `Сетка для карточек товаров?              → cards/default\n` +
    `Сетка для формы регистрации?             → form/single (одна колонка)\n` +
    `Сетка для формы с полями рядом?          → form/double или triple\n` +
    `Сетка для дашборда виджетов?             → dashboard/main\n` +
    `Сетка для модального окна?               → container/modal/*`,
    0, 0, 12, 'Regular', { r: 0.2, g: 0.2, b: 0.2 }
  );
  cheatFrame.appendChild(cheatQuestions);
  
  const cheatDevices = createStyledText(
    `📱 ТИПИЧНЫЕ КОНФИГУРАЦИИ ПО УСТРОЙСТВАМ\n\n` +
    `                  Desktop        Tablet         Mobile\n` +
    `──────────────────────────────────────────────────────────\n` +
    `Колонки           12             8              4\n` +
    `Gutter            24px           20px           16px\n` +
    `Page margin       64px           32px           16px\n` +
    `Container margin  24px           20px           16px\n` +
    `Content margin    0px            0px            0px`,
    0, 0, 11, 'Regular', { r: 0.2, g: 0.2, b: 0.2 }
  );
  cheatFrame.appendChild(cheatDevices);
  
  const cheatMath = createStyledText(
    `🔢 МАТЕМАТИКА СЕТОК\n\n` +
    `• Columns: 12 делится на 2,3,4,6 — универсально\n` +
    `• Gutter: кратно 4px (8px base × множитель)\n` +
    `• Margin: уменьшается в 2× на каждом брейкпоинте\n` +
    `• Container: 1280px — золотой стандарт (1920 - 2×320)\n\n` +
    `Карточка 3-колоночная: span 4 из 12 (12/3=4)\n` +
    `Карточка 4-колоночная: span 3 из 12 (12/4=3)\n` +
    `Сайдбар + контент: 3 + 9 = 12 (25% + 75%)`,
    0, 0, 11, 'Regular', { r: 0.2, g: 0.2, b: 0.2 }
  );
  cheatFrame.appendChild(cheatMath);
  
  const cheatUsage = createStyledText(
    `🎨 ИСПОЛЬЗОВАНИЕ В FIGMA\n\n` +
    `1. Создайте фрейм нужной ширины (например, 1920px)\n` +
    `2. В панели Layout Grid нажмите на иконку стилей (4 квадрата)\n` +
    `3. Выберите нужный стиль из layout/grid/... или layout/container/...\n` +
    `4. Для адаптивности — используйте стили с суффиксом:\n` +
    `   /desktop — для десктопных макетов\n` +
    `   /tablet — для планшетных макетов\n` +
    `   /mobile — для мобильных макетов\n\n` +
    `💡 Один токен = 3 стиля (desktop/tablet/mobile)`,
    0, 0, 11, 'Regular', { r: 0.2, g: 0.2, b: 0.2 }
  );
  cheatFrame.appendChild(cheatUsage);
  
  page.appendChild(cheatFrame);
  framesCreated++;
  
  await figma.setCurrentPageAsync(page);
  
  return { pageName, framesCreated };
}

// Generate Spacing Documentation
async function generateSpacingDocumentation(): Promise<DocGeneratorResult> {
  await loadDocFonts();
  
  const pageName = '📖 Spacing Documentation';
  const page = figma.createPage();
  page.name = pageName;
  
  // Get all float variables
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const floatVars = await figma.variables.getLocalVariablesAsync('FLOAT');
  
  // Filter spacing-related variables
  const spacingKeywords = ['spacing', 'space', 'margin', 'padding', 'inset'];
  const spacingVars = floatVars.filter(v => 
    spacingKeywords.some(kw => v.name.toLowerCase().includes(kw))
  );
  
  let yOffset = 0;
  let xOffset = 0;
  let framesCreated = 0;
  
  // ===== ARCHITECTURE DESCRIPTION FRAME =====
  const archFrame = figma.createFrame();
  archFrame.name = 'Архитектура Spacing';
  archFrame.x = xOffset;
  archFrame.y = 0;
  archFrame.layoutMode = 'VERTICAL';
  archFrame.itemSpacing = 24;
  archFrame.paddingTop = 40;
  archFrame.paddingBottom = 40;
  archFrame.paddingLeft = 40;
  archFrame.paddingRight = 40;
  archFrame.primaryAxisSizingMode = 'AUTO';
  archFrame.counterAxisSizingMode = 'AUTO';
  archFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 0.98, b: 0.95 } }];
  archFrame.cornerRadius = 16;
  archFrame.minWidth = 550;
  
  const archTitle = createStyledText('🏗️ Архитектура системы Spacing', 0, 0, 28, 'Bold');
  archFrame.appendChild(archTitle);
  
  const archIntro = createStyledText(
    `Spacing — внутренние отступы элементов (padding, margin, inset).\n` +
    `2-уровневая архитектура: Primitives → Semantic + 3 режима адаптивности.`,
    0, 0, 13, 'Regular', { r: 0.4, g: 0.4, b: 0.4 }
  );
  archFrame.appendChild(archIntro);
  
  // Primitives section
  const primSection = figma.createFrame();
  primSection.name = 'Primitives section';
  primSection.layoutMode = 'VERTICAL';
  primSection.itemSpacing = 8;
  primSection.fills = [];
  primSection.primaryAxisSizingMode = 'AUTO';
  primSection.counterAxisSizingMode = 'AUTO';
  
  const primTitle = createStyledText('📦 ПРИМИТИВЫ (Primitives)', 0, 0, 16, 'Bold');
  primSection.appendChild(primTitle);
  
  const primDesc = createStyledText(
    `Базовая шкала значений кратная 4px:\n\n` +
    `space.0   = 0px      space.24 = 24px\n` +
    `space.2   = 2px      space.32 = 32px\n` +
    `space.4   = 4px      space.40 = 40px\n` +
    `space.6   = 6px      space.48 = 48px\n` +
    `space.8   = 8px      space.56 = 56px\n` +
    `space.10  = 10px     space.64 = 64px\n` +
    `space.12  = 12px     space.80 = 80px\n` +
    `space.16  = 16px     space.96 = 96px\n` +
    `space.20  = 20px     space.128 = 128px\n\n` +
    `💡 Шаг 4px обеспечивает соблюдение 8px-grid системы.`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  primSection.appendChild(primDesc);
  archFrame.appendChild(primSection);
  
  // Semantic section  
  const semSection = figma.createFrame();
  semSection.name = 'Semantic section';
  semSection.layoutMode = 'VERTICAL';
  semSection.itemSpacing = 8;
  semSection.fills = [];
  semSection.primaryAxisSizingMode = 'AUTO';
  semSection.counterAxisSizingMode = 'AUTO';
  
  const semTitle = createStyledText('🎯 СЕМАНТИЧЕСКИЕ ТОКЕНЫ (11 категорий)', 0, 0, 16, 'Bold');
  semSection.appendChild(semTitle);
  
  const semDesc = createStyledText(
    `Токены с контекстом, ссылающиеся на примитивы через {space.X}:\n\n` +
    `• button/ — paddingX (12), paddingY (8), iconGap (6)\n` +
    `• input/ — paddingX (12), paddingY (10), iconGap (8)\n` +
    `• card/ — padding (16), contentGap (12), headerGap (16)\n` +
    `• modal/ — padding (24), headerGap (16), footerGap (12)\n` +
    `• section/ — padding (24), gap (32), marginY (48)\n` +
    `• list/ — itemPadding (8), itemGap (4), nestedIndent (16)\n` +
    `• table/ — cellPadding (12), headerPadding (16)\n` +
    `• form/ — fieldGap (16), labelGap (6), groupGap (24)\n` +
    `• nav/ — itemPadding (12), itemGap (8), groupGap (24)\n` +
    `• page/ — margin (16/24/32), contentGap (24)\n` +
    `• component/ — базовые отступы для любых компонентов`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  semSection.appendChild(semDesc);
  archFrame.appendChild(semSection);
  
  // Responsive section
  const respSection = figma.createFrame();
  respSection.name = 'Responsive section';
  respSection.layoutMode = 'VERTICAL';
  respSection.itemSpacing = 8;
  respSection.fills = [];
  respSection.primaryAxisSizingMode = 'AUTO';
  respSection.counterAxisSizingMode = 'AUTO';
  
  const respTitle = createStyledText('📱 АДАПТИВНОСТЬ (3 режима)', 0, 0, 16, 'Bold');
  respSection.appendChild(respTitle);
  
  const respDesc = createStyledText(
    `Каждый семантический токен имеет 3 значения:\n\n` +
    `Desktop (≥1280px) — полные значения\n` +
    `   card/padding: 24px → section/padding: 32px\n\n` +
    `Tablet (≥768px) — уменьшенные на ~12%\n` +
    `   card/padding: 20px → section/padding: 28px\n\n` +
    `Mobile (<768px) — компактные на ~25%\n` +
    `   card/padding: 16px → section/padding: 24px\n\n` +
    `💡 ИСПОЛЬЗОВАНИЕ В FIGMA\n` +
    `1. Привяжите padding к семантическим токенам\n` +
    `2. Выберите фрейм и примените режим устройства\n` +
    `3. Все отступы масштабируются автоматически`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  respSection.appendChild(respDesc);
  archFrame.appendChild(respSection);
  
  // Difference from Gap
  const diffSection = figma.createFrame();
  diffSection.name = 'Difference section';
  diffSection.layoutMode = 'VERTICAL';
  diffSection.itemSpacing = 8;
  diffSection.fills = [];
  diffSection.primaryAxisSizingMode = 'AUTO';
  diffSection.counterAxisSizingMode = 'AUTO';
  
  const diffTitle = createStyledText('⚖️ SPACING vs GAP', 0, 0, 14, 'Medium');
  diffSection.appendChild(diffTitle);
  
  const diffDesc = createStyledText(
    `Spacing = внутренние отступы (padding, margin, inset)\n` +
    `Gap = расстояния между элементами (Auto Layout gap)\n\n` +
    `Spacing: card/padding → пространство внутри карточки\n` +
    `Gap: gap/stack/card → расстояние между карточками`,
    0, 0, 11, 'Regular', { r: 0.5, g: 0.4, b: 0.3 }
  );
  diffSection.appendChild(diffDesc);
  archFrame.appendChild(diffSection);
  
  page.appendChild(archFrame);
  xOffset += archFrame.width + 48;
  framesCreated++;
  
  // Main frame
  const mainFrame = figma.createFrame();
  mainFrame.name = 'Spacing Overview';
  mainFrame.x = xOffset;
  mainFrame.y = 0;
  mainFrame.layoutMode = 'VERTICAL';
  mainFrame.itemSpacing = 32;
  mainFrame.paddingTop = 32;
  mainFrame.paddingBottom = 32;
  mainFrame.paddingLeft = 32;
  mainFrame.paddingRight = 32;
  mainFrame.primaryAxisSizingMode = 'AUTO';
  mainFrame.counterAxisSizingMode = 'AUTO';
  mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  mainFrame.cornerRadius = 16;
  mainFrame.minWidth = 800;
  
  // Title
  const title = createStyledText('📐 Система отступов', 0, 0, 32, 'Bold');
  mainFrame.appendChild(title);
  
  // Stats
  const stats = createStyledText(
    `Всего переменных: ${spacingVars.length}`,
    0, 0, 14, 'Regular', { r: 0.5, g: 0.5, b: 0.5 }
  );
  mainFrame.appendChild(stats);
  
  // Group by collection
  const varsByCollection = new Map<string, Variable[]>();
  for (const v of spacingVars) {
    const list = varsByCollection.get(v.variableCollectionId) || [];
    list.push(v);
    varsByCollection.set(v.variableCollectionId, list);
  }
  
  for (const coll of collections) {
    const vars = varsByCollection.get(coll.id);
    if (!vars || vars.length === 0) continue;
    
    // Collection section
    const collSection = figma.createFrame();
    collSection.name = coll.name;
    collSection.layoutMode = 'VERTICAL';
    collSection.itemSpacing = 20;
    collSection.primaryAxisSizingMode = 'AUTO';
    collSection.counterAxisSizingMode = 'AUTO';
    collSection.fills = [];
    
    // Collection title with mode names
    const modeNames = coll.modes.map(m => m.name).join(' / ');
    const collTitle = createStyledText(`📦 ${coll.name} (${modeNames})`, 0, 0, 20, 'Medium');
    collSection.appendChild(collTitle);
    
    // Visual spacing guide
    for (const variable of vars.slice(0, 15)) {
      const row = figma.createFrame();
      row.name = variable.name;
      row.layoutMode = 'HORIZONTAL';
      row.itemSpacing = 16;
      row.counterAxisAlignItems = 'CENTER';
      row.primaryAxisSizingMode = 'AUTO';
      row.counterAxisSizingMode = 'AUTO';
      row.fills = [];
      
      // Name
      const nameText = createStyledText(variable.name, 0, 0, 12, 'Medium');
      nameText.resize(250, nameText.height);
      row.appendChild(nameText);
      
      // Visual bar for each mode
      for (const mode of coll.modes) {
        const resolved = await resolveVariableValue(variable, mode.modeId);
        const numValue = typeof resolved === 'number' ? resolved : 0;
        
        const barContainer = figma.createFrame();
        barContainer.name = mode.name;
        barContainer.layoutMode = 'HORIZONTAL';
        barContainer.itemSpacing = 8;
        barContainer.counterAxisAlignItems = 'CENTER';
        barContainer.primaryAxisSizingMode = 'AUTO';
        barContainer.counterAxisSizingMode = 'AUTO';
        barContainer.fills = [];
        
        // Visual bar
        const bar = figma.createRectangle();
        bar.resize(Math.max(1, Math.min(numValue * 2, 200)), 16);
        bar.cornerRadius = 4;
        bar.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.5, b: 0.9 } }];
        barContainer.appendChild(bar);
        
        // Value label
        const valueText = createStyledText(`${numValue}px`, 0, 0, 11, 'Regular', { r: 0.5, g: 0.5, b: 0.5 });
        barContainer.appendChild(valueText);
        
        row.appendChild(barContainer);
      }
      
      collSection.appendChild(row);
    }
    
    mainFrame.appendChild(collSection);
    framesCreated++;
  }
  
  page.appendChild(mainFrame);
  await figma.setCurrentPageAsync(page);
  
  return { pageName, framesCreated: framesCreated || 1 };
}

// Generate Gap Documentation
async function generateGapDocumentation(): Promise<DocGeneratorResult> {
  await loadDocFonts();
  
  const pageName = '📖 Gap Documentation';
  const page = figma.createPage();
  page.name = pageName;
  
  // Get all float variables
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const floatVars = await figma.variables.getLocalVariablesAsync('FLOAT');
  
  // Filter gap-related variables
  const gapKeywords = ['gap'];
  const gapVars = floatVars.filter(v => 
    gapKeywords.some(kw => v.name.toLowerCase().includes(kw))
  );
  
  let xOffset = 0;
  let framesCreated = 0;
  
  // ===== ARCHITECTURE DESCRIPTION FRAME =====
  const archFrame = figma.createFrame();
  archFrame.name = 'Архитектура Gap';
  archFrame.x = xOffset;
  archFrame.y = 0;
  archFrame.layoutMode = 'VERTICAL';
  archFrame.itemSpacing = 24;
  archFrame.paddingTop = 40;
  archFrame.paddingBottom = 40;
  archFrame.paddingLeft = 40;
  archFrame.paddingRight = 40;
  archFrame.primaryAxisSizingMode = 'AUTO';
  archFrame.counterAxisSizingMode = 'AUTO';
  archFrame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.98, b: 1 } }];
  archFrame.cornerRadius = 16;
  archFrame.minWidth = 550;
  
  const archTitle = createStyledText('🏗️ Архитектура Gap системы', 0, 0, 28, 'Bold');
  archFrame.appendChild(archTitle);
  
  const archIntro = createStyledText(
    `Gap — расстояния между элементами в Auto Layout контейнерах.\n` +
    `2-уровневая архитектура: Primitives → Semantic + 3 режима адаптивности.`,
    0, 0, 13, 'Regular', { r: 0.4, g: 0.4, b: 0.4 }
  );
  archFrame.appendChild(archIntro);
  
  // Primitives section
  const primSection = figma.createFrame();
  primSection.name = 'Primitives section';
  primSection.layoutMode = 'VERTICAL';
  primSection.itemSpacing = 8;
  primSection.fills = [];
  primSection.primaryAxisSizingMode = 'AUTO';
  primSection.counterAxisSizingMode = 'AUTO';
  
  const primTitle = createStyledText('📦 ПРИМИТИВЫ (Primitives)', 0, 0, 16, 'Bold');
  primSection.appendChild(primTitle);
  
  const primDesc = createStyledText(
    `Базовая шкала значений gap кратная 4px:\n\n` +
    `gap.0   = 0px      gap.24 = 24px\n` +
    `gap.2   = 2px      gap.32 = 32px\n` +
    `gap.4   = 4px      gap.40 = 40px\n` +
    `gap.6   = 6px      gap.48 = 48px\n` +
    `gap.8   = 8px      gap.56 = 56px\n` +
    `gap.10  = 10px     gap.64 = 64px\n` +
    `gap.12  = 12px     gap.80 = 80px\n` +
    `gap.16  = 16px     gap.96 = 96px\n` +
    `gap.20  = 20px\n\n` +
    `💡 Используются как источник для семантических токенов.`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  primSection.appendChild(primDesc);
  archFrame.appendChild(primSection);
  
  // Semantic section
  const semSection = figma.createFrame();
  semSection.name = 'Semantic section';
  semSection.layoutMode = 'VERTICAL';
  semSection.itemSpacing = 8;
  semSection.fills = [];
  semSection.primaryAxisSizingMode = 'AUTO';
  semSection.counterAxisSizingMode = 'AUTO';
  
  const semTitle = createStyledText('🎯 СЕМАНТИЧЕСКИЕ ТОКЕНЫ (6 категорий)', 0, 0, 16, 'Bold');
  semSection.appendChild(semTitle);
  
  const semDesc = createStyledText(
    `Токены с контекстом, ссылающиеся на примитивы через {gap.X}:\n\n` +
    `• inline/ — gap между элементами в строке\n` +
    `   icon (6) · badge (4) · tag (4) · avatar (8)\n\n` +
    `• stack/ — вертикальные расстояния\n` +
    `   card (16) · item (8) · section (24) · paragraph (12)\n\n` +
    `• form/ — формы\n` +
    `   fields (16) · radioGroup (8) · checkboxGroup (8)\n\n` +
    `• grid/ — сетки\n` +
    `   column (16) · row (16) · cell (8)\n\n` +
    `• component/ — внутренние gap компонентов\n` +
    `   button (8) · input (8) · card (12) · modal (16)\n\n` +
    `• layout/ — структура страницы\n` +
    `   header (16) · content (24) · sidebar (12) · footer (16)`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  semSection.appendChild(semDesc);
  archFrame.appendChild(semSection);
  
  // Responsive section
  const respSection = figma.createFrame();
  respSection.name = 'Responsive section';
  respSection.layoutMode = 'VERTICAL';
  respSection.itemSpacing = 8;
  respSection.fills = [];
  respSection.primaryAxisSizingMode = 'AUTO';
  respSection.counterAxisSizingMode = 'AUTO';
  
  const respTitle = createStyledText('📱 АДАПТИВНОСТЬ (3 режима)', 0, 0, 16, 'Bold');
  respSection.appendChild(respTitle);
  
  const respDesc = createStyledText(
    `Каждый семантический токен имеет 3 значения:\n\n` +
    `Desktop (≥1280px) — просторная компоновка\n` +
    `   stack/card: 16px → grid/column: 24px\n\n` +
    `Tablet (≥768px) — средняя плотность\n` +
    `   stack/card: 12px → grid/column: 16px\n\n` +
    `Mobile (<768px) — компактная\n` +
    `   stack/card: 8px → grid/column: 12px`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  respSection.appendChild(respDesc);
  archFrame.appendChild(respSection);
  
  // Difference from Spacing
  const diffSection = figma.createFrame();
  diffSection.name = 'Difference section';
  diffSection.layoutMode = 'VERTICAL';
  diffSection.itemSpacing = 8;
  diffSection.fills = [];
  diffSection.primaryAxisSizingMode = 'AUTO';
  diffSection.counterAxisSizingMode = 'AUTO';
  
  const diffTitle = createStyledText('⚖️ GAP vs SPACING', 0, 0, 14, 'Medium');
  diffSection.appendChild(diffTitle);
  
  const diffDesc = createStyledText(
    `Gap = расстояния МЕЖДУ элементами (Auto Layout gap)\n` +
    `Spacing = отступы ВНУТРИ элементов (padding, margin)\n\n` +
    `Gap: gap/stack/card → расстояние между карточками\n` +
    `Spacing: card/padding → пространство внутри карточки\n\n` +
    `💡 Применяется к свойству itemSpacing во фреймах.`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.4, b: 0.5 }
  );
  diffSection.appendChild(diffDesc);
  archFrame.appendChild(diffSection);
  
  page.appendChild(archFrame);
  xOffset += archFrame.width + 48;
  framesCreated++;
  
  // Main frame
  const mainFrame = figma.createFrame();
  mainFrame.name = 'Gap Overview';
  mainFrame.x = xOffset;
  mainFrame.y = 0;
  mainFrame.layoutMode = 'VERTICAL';
  mainFrame.itemSpacing = 32;
  mainFrame.paddingTop = 32;
  mainFrame.paddingBottom = 32;
  mainFrame.paddingLeft = 32;
  mainFrame.paddingRight = 32;
  mainFrame.primaryAxisSizingMode = 'AUTO';
  mainFrame.counterAxisSizingMode = 'AUTO';
  mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  mainFrame.cornerRadius = 16;
  mainFrame.minWidth = 800;
  
  // Title
  const title = createStyledText('📏 Система Gap', 0, 0, 32, 'Bold');
  mainFrame.appendChild(title);
  
  // Stats
  const stats = createStyledText(
    `Всего переменных: ${gapVars.length}`,
    0, 0, 14, 'Regular', { r: 0.5, g: 0.5, b: 0.5 }
  );
  mainFrame.appendChild(stats);
  
  // Group by collection
  const varsByCollection = new Map<string, Variable[]>();
  for (const v of gapVars) {
    const list = varsByCollection.get(v.variableCollectionId) || [];
    list.push(v);
    varsByCollection.set(v.variableCollectionId, list);
  }
  
  for (const coll of collections) {
    const vars = varsByCollection.get(coll.id);
    if (!vars || vars.length === 0) continue;
    
    // Collection section
    const collSection = figma.createFrame();
    collSection.name = coll.name;
    collSection.layoutMode = 'VERTICAL';
    collSection.itemSpacing = 20;
    collSection.primaryAxisSizingMode = 'AUTO';
    collSection.counterAxisSizingMode = 'AUTO';
    collSection.fills = [];
    
    // Collection title with mode names
    const modeNames = coll.modes.map(m => m.name).join(' / ');
    const collTitle = createStyledText(`📦 ${coll.name} (${modeNames})`, 0, 0, 20, 'Medium');
    collSection.appendChild(collTitle);
    
    // Gap visualization
    for (const variable of vars.slice(0, 15)) {
      const row = figma.createFrame();
      row.name = variable.name;
      row.layoutMode = 'HORIZONTAL';
      row.itemSpacing = 16;
      row.counterAxisAlignItems = 'CENTER';
      row.primaryAxisSizingMode = 'AUTO';
      row.counterAxisSizingMode = 'AUTO';
      row.fills = [];
      
      // Name
      const nameText = createStyledText(variable.name, 0, 0, 12, 'Medium');
      nameText.resize(250, nameText.height);
      row.appendChild(nameText);
      
      // Visual representation for each mode
      for (const mode of coll.modes) {
        const resolved = await resolveVariableValue(variable, mode.modeId);
        const numValue = typeof resolved === 'number' ? resolved : 0;
        
        const gapContainer = figma.createFrame();
        gapContainer.name = mode.name;
        gapContainer.layoutMode = 'HORIZONTAL';
        gapContainer.itemSpacing = Math.max(numValue, 2);
        gapContainer.counterAxisAlignItems = 'CENTER';
        gapContainer.primaryAxisSizingMode = 'AUTO';
        gapContainer.counterAxisSizingMode = 'AUTO';
        gapContainer.fills = [];
        gapContainer.paddingLeft = 8;
        gapContainer.paddingRight = 8;
        gapContainer.paddingTop = 4;
        gapContainer.paddingBottom = 4;
        
        // Two boxes with gap between them
        const box1 = figma.createRectangle();
        box1.resize(24, 24);
        box1.cornerRadius = 4;
        box1.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.4, b: 0.3 } }];
        gapContainer.appendChild(box1);
        
        const box2 = figma.createRectangle();
        box2.resize(24, 24);
        box2.cornerRadius = 4;
        box2.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.4, b: 0.3 } }];
        gapContainer.appendChild(box2);
        
        row.appendChild(gapContainer);
        
        // Value label
        const valueText = createStyledText(`${numValue}px`, 0, 0, 11, 'Regular', { r: 0.5, g: 0.5, b: 0.5 });
        row.appendChild(valueText);
      }
      
      collSection.appendChild(row);
    }
    
    mainFrame.appendChild(collSection);
    framesCreated++;
  }
  
  page.appendChild(mainFrame);
  await figma.setCurrentPageAsync(page);
  
  return { pageName, framesCreated: framesCreated || 1 };
}

async function generateRadiusDocumentation(): Promise<DocGeneratorResult> {
  await loadDocFonts();
  
  const pageName = '📖 Radius Documentation';
  const page = figma.createPage();
  page.name = pageName;
  
  // Get all float variables
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const floatVars = await figma.variables.getLocalVariablesAsync('FLOAT');
  
  // Filter radius-related variables
  const radiusVars = floatVars.filter(v => 
    v.name.toLowerCase().includes('radius')
  );
  
  let xOffset = 0;
  let framesCreated = 0;
  
  // ===== ARCHITECTURE DESCRIPTION FRAME =====
  const archFrame = figma.createFrame();
  archFrame.name = 'Архитектура Radius';
  archFrame.x = xOffset;
  archFrame.y = 0;
  archFrame.layoutMode = 'VERTICAL';
  archFrame.itemSpacing = 24;
  archFrame.paddingTop = 40;
  archFrame.paddingBottom = 40;
  archFrame.paddingLeft = 40;
  archFrame.paddingRight = 40;
  archFrame.primaryAxisSizingMode = 'AUTO';
  archFrame.counterAxisSizingMode = 'AUTO';
  archFrame.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.95, b: 1 } }];
  archFrame.cornerRadius = 16;
  archFrame.minWidth = 550;
  
  const archTitle = createStyledText('🏗️ Архитектура Radius системы', 0, 0, 28, 'Bold');
  archFrame.appendChild(archTitle);
  
  const archIntro = createStyledText(
    `Radius — система скругления углов (border-radius) UI элементов.\n` +
    `2-уровневая архитектура: Primitives → Semantic (без адаптивности).`,
    0, 0, 13, 'Regular', { r: 0.4, g: 0.4, b: 0.4 }
  );
  archFrame.appendChild(archIntro);
  
  // Primitives section
  const primSection = figma.createFrame();
  primSection.name = 'Primitives section';
  primSection.layoutMode = 'VERTICAL';
  primSection.itemSpacing = 8;
  primSection.fills = [];
  primSection.primaryAxisSizingMode = 'AUTO';
  primSection.counterAxisSizingMode = 'AUTO';
  
  const primTitle = createStyledText('📦 ПРИМИТИВЫ (12 значений)', 0, 0, 16, 'Bold');
  primSection.appendChild(primTitle);
  
  const primDesc = createStyledText(
    `Базовая шкала border-radius:\n\n` +
    `radius.0    = 0px    (sharp, без скругления)\n` +
    `radius.2    = 2px    (minimal)\n` +
    `radius.4    = 4px    (subtle)\n` +
    `radius.6    = 6px    (soft)\n` +
    `radius.8    = 8px    (medium)\n` +
    `radius.10   = 10px   (rounded)\n` +
    `radius.12   = 12px   (large)\n` +
    `radius.16   = 16px   (extra)\n` +
    `radius.20   = 20px   (heavy)\n` +
    `radius.24   = 24px   (card)\n` +
    `radius.32   = 32px   (modal)\n` +
    `radius.full = 9999px (pill/circle)\n\n` +
    `💡 full (9999px) для идеально круглых элементов.`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  primSection.appendChild(primDesc);
  archFrame.appendChild(primSection);
  
  // Semantic section
  const semSection = figma.createFrame();
  semSection.name = 'Semantic section';
  semSection.layoutMode = 'VERTICAL';
  semSection.itemSpacing = 8;
  semSection.fills = [];
  semSection.primaryAxisSizingMode = 'AUTO';
  semSection.counterAxisSizingMode = 'AUTO';
  
  const semTitle = createStyledText('🎯 СЕМАНТИЧЕСКИЕ ТОКЕНЫ (8 категорий, 58 токенов)', 0, 0, 16, 'Bold');
  semSection.appendChild(semTitle);
  
  const semDesc = createStyledText(
    `Токены с контекстом, ссылающиеся на примитивы {radius.X}:\n\n` +
    `INTERACTIVE — интерактивные элементы\n` +
    `  button (6), buttonSmall (4), buttonPill (full)\n` +
    `  input (6), inputSmall (4), inputLarge (8)\n` +
    `  checkbox (4), switch (full), slider (full)\n\n` +
    `CONTAINER — контейнеры\n` +
    `  card (12), cardSmall (8), cardLarge (16)\n` +
    `  modal (16), panel (8), section (12)\n` +
    `  popover (8), dropdown (8), drawer (0)\n\n` +
    `FEEDBACK — уведомления и статусы\n` +
    `  alert (8), toast (8), banner (0)\n` +
    `  badge (full), tag (4), chip (full)\n\n` +
    `MEDIA — медиа-контент\n` +
    `  avatar (full), avatarSquare (8)\n` +
    `  image (8), video (8), thumbnail (4)\n\n` +
    `FORM — элементы форм\n` +
    `  field (6), select (6), textarea (8)\n` +
    `  colorPicker (4), datePicker (8)\n\n` +
    `DATA — данные и визуализация\n` +
    `  table (0), tableCell (0), chart (8)\n` +
    `  progress (full), meter (4)\n\n` +
    `OVERLAY — оверлеи\n` +
    `  modal (16), dialog (12), sheet (16)\n` +
    `  tooltip (6), menu (8)\n\n` +
    `SPECIAL — специальные\n` +
    `  code (4), blockquote (0), callout (8)`,
    0, 0, 11, 'Regular', { r: 0.3, g: 0.3, b: 0.3 }
  );
  semSection.appendChild(semDesc);
  archFrame.appendChild(semSection);
  
  // Principles section
  const principlesSection = figma.createFrame();
  principlesSection.name = 'Principles section';
  principlesSection.layoutMode = 'VERTICAL';
  principlesSection.itemSpacing = 8;
  principlesSection.fills = [];
  principlesSection.primaryAxisSizingMode = 'AUTO';
  principlesSection.counterAxisSizingMode = 'AUTO';
  
  const principlesTitle = createStyledText('💡 ПРИНЦИПЫ ПРИМЕНЕНИЯ', 0, 0, 14, 'Medium');
  principlesSection.appendChild(principlesTitle);
  
  const principlesDesc = createStyledText(
    `• Интерактивные элементы: 4-6px (subtle focus)\n` +
    `• Контейнеры: 8-16px (мягкие границы)\n` +
    `• Круглые элементы: full (avatar, badge, pill)\n` +
    `• Sharp элементы: 0px (banner, drawer, table cell)\n\n` +
    `⚠️ БЕЗ АДАПТИВНОСТИ\n` +
    `Radius не меняется для разных устройств.\n` +
    `Только один режим для всех breakpoints.`,
    0, 0, 11, 'Regular', { r: 0.4, g: 0.3, b: 0.5 }
  );
  principlesSection.appendChild(principlesDesc);
  archFrame.appendChild(principlesSection);
  
  page.appendChild(archFrame);
  xOffset += archFrame.width + 48;
  framesCreated++;
  
  // Main frame
  const mainFrame = figma.createFrame();
  mainFrame.name = 'Radius Overview';
  mainFrame.x = xOffset;
  mainFrame.y = 0;
  mainFrame.layoutMode = 'VERTICAL';
  mainFrame.itemSpacing = 32;
  mainFrame.paddingTop = 32;
  mainFrame.paddingBottom = 32;
  mainFrame.paddingLeft = 32;
  mainFrame.paddingRight = 32;
  mainFrame.primaryAxisSizingMode = 'AUTO';
  mainFrame.counterAxisSizingMode = 'AUTO';
  mainFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  mainFrame.cornerRadius = 16;
  mainFrame.minWidth = 800;
  
  // Title
  const title = createStyledText('⬜ Система Radius', 0, 0, 32, 'Bold');
  mainFrame.appendChild(title);
  
  // Stats
  const stats = createStyledText(
    `Всего переменных: ${radiusVars.length}`,
    0, 0, 14, 'Regular', { r: 0.5, g: 0.5, b: 0.5 }
  );
  mainFrame.appendChild(stats);
  
  // Group by collection
  const varsByCollection = new Map<string, Variable[]>();
  for (const v of radiusVars) {
    const list = varsByCollection.get(v.variableCollectionId) || [];
    list.push(v);
    varsByCollection.set(v.variableCollectionId, list);
  }
  
  for (const coll of collections) {
    const vars = varsByCollection.get(coll.id);
    if (!vars || vars.length === 0) continue;
    
    // Collection section
    const collSection = figma.createFrame();
    collSection.name = coll.name;
    collSection.layoutMode = 'VERTICAL';
    collSection.itemSpacing = 16;
    collSection.primaryAxisSizingMode = 'AUTO';
    collSection.counterAxisSizingMode = 'AUTO';
    collSection.fills = [];
    
    // Collection title
    const collTitle = createStyledText(`📦 ${coll.name}`, 0, 0, 20, 'Medium');
    collSection.appendChild(collTitle);
    
    // Radius visualization - group by category
    const categories: { [key: string]: Variable[] } = {};
    for (const variable of vars) {
      const parts = variable.name.split('/');
      const category = parts.length > 2 ? parts[1] : 'primitives';
      if (!categories[category]) categories[category] = [];
      categories[category].push(variable);
    }
    
    for (const [category, catVars] of Object.entries(categories)) {
      // Category header
      const catHeader = createStyledText(
        category.charAt(0).toUpperCase() + category.slice(1),
        0, 0, 14, 'Medium', { r: 0.4, g: 0.4, b: 0.4 }
      );
      collSection.appendChild(catHeader);
      
      // Items grid
      const grid = figma.createFrame();
      grid.name = `${category}-grid`;
      grid.layoutMode = 'HORIZONTAL';
      grid.layoutWrap = 'WRAP';
      grid.itemSpacing = 16;
      grid.counterAxisSpacing = 16;
      grid.primaryAxisSizingMode = 'FIXED';
      grid.resize(760, 10);
      grid.counterAxisSizingMode = 'AUTO';
      grid.fills = [];
      
      for (const variable of catVars.slice(0, 20)) {
        const mode = coll.modes[0];
        const resolved = await resolveVariableValue(variable, mode.modeId);
        const numValue = typeof resolved === 'number' ? resolved : 0;
        
        const item = figma.createFrame();
        item.name = variable.name;
        item.layoutMode = 'VERTICAL';
        item.itemSpacing = 8;
        item.counterAxisAlignItems = 'CENTER';
        item.primaryAxisSizingMode = 'AUTO';
        item.counterAxisSizingMode = 'AUTO';
        item.fills = [];
        item.paddingTop = 8;
        item.paddingBottom = 8;
        
        // Visual radius preview
        const preview = figma.createRectangle();
        preview.resize(56, 56);
        // Cap radius at 28 for visual (half of box)
        const visualRadius = numValue >= 9999 ? 28 : Math.min(numValue, 28);
        preview.cornerRadius = visualRadius;
        preview.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.3, b: 0.9 } }];
        item.appendChild(preview);
        
        // Token name (short version)
        const shortName = variable.name.split('/').slice(-1)[0];
        const nameText = createStyledText(shortName, 0, 0, 11, 'Medium');
        item.appendChild(nameText);
        
        // Value
        const valueLabel = numValue >= 9999 ? 'full' : `${numValue}px`;
        const valueText = createStyledText(valueLabel, 0, 0, 10, 'Regular', { r: 0.5, g: 0.5, b: 0.5 });
        item.appendChild(valueText);
        
        grid.appendChild(item);
      }
      
      collSection.appendChild(grid);
    }
    
    mainFrame.appendChild(collSection);
    framesCreated++;
  }
  
  page.appendChild(mainFrame);
  await figma.setCurrentPageAsync(page);
  
  return { pageName, framesCreated: framesCreated || 1 };
}

// ============================================
// MESSAGE HANDLING
// ============================================

figma.ui.onmessage = async (msg: PluginMessage) => {
  try {
    // Handle resize message
    if (msg.type === 'resize') {
      const payload = msg.payload as { width: number; height: number };
      figma.ui.resize(
        Math.max(400, Math.min(1200, payload.width)),
        Math.max(400, Math.min(900, payload.height))
      );
      return;
    }

    switch (msg.type) {
      case 'create-color-variables': {
        const payload = msg.payload as { 
          collection: string;
          variables: Array<{ name: string; value: { r: number; g: number; b: number; a: number }; description: string }>;
          themes?: Array<{
            id: string;
            name: string;
            brandColor: string;
            hasLightMode: boolean;
            hasDarkMode: boolean;
          }>;
        };
        
        await createColorVariablesWithStructure(payload.variables, payload.themes);
        
        // Also create base tokens (spacing, radius, typography, etc.)
        await createBaseTokens();
        
        figma.ui.postMessage({
          type: 'variables-created',
          payload: { success: true }
        });
        figma.notify('✅ Variables созданы!');
        break;
      }

      case 'get-local-variables': {
        const collections = await getLocalVariableCollections();
        const variables = await getLocalVariables();
        figma.ui.postMessage({
          type: 'local-variables',
          payload: { collections, variables }
        });
        break;
      }

      case 'get-local-styles': {
        const styles = await extractLocalStyles();
        figma.ui.postMessage({
          type: 'local-styles',
          payload: styles
        });
        break;
      }

      case 'sync-from-project': {
        figma.notify('🔄 Синхронизация с проектом...');
        
        try {
          const projectData = await syncFromProject();
          
          figma.ui.postMessage({
            type: 'project-synced',
            payload: projectData
          });
          
          const { summary } = projectData;
          figma.notify(
            `✅ Синхронизировано: ${summary.managedCollections} коллекций, ` +
            `${summary.managedVariables} переменных, ` +
            `${summary.managedPaintStyles} paint стилей, ` +
            `${summary.managedTextStyles} text стилей`
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          figma.ui.postMessage({
            type: 'project-sync-error',
            payload: { error: errorMessage }
          });
          figma.notify(`❌ Ошибка синхронизации: ${errorMessage}`);
        }
        break;
      }

      case 'export-tokens': {
        const tokens = await extractTokensFromFigma();
        const payload = msg.payload as { format?: string } | undefined;
        const format = (payload && payload.format) ? payload.format : 'json';
        
        let output: unknown;
        switch (format) {
          case 'storybook':
            output = generateStorybookTokens(tokens);
            break;
          case 'css':
            output = generateCSSVariables(tokens);
            break;
          default:
            output = tokens;
        }

        figma.ui.postMessage({
          type: 'tokens-exported',
          payload: { tokens: output, format }
        });
        break;
      }

      // ========================================
      // EXPORT FRONTEND TOKENS FROM FIGMA VARIABLES
      // ========================================
      case 'export-frontend-from-figma': {
        try {
          const payload = msg.payload as { format?: string } | undefined;
          const format = payload?.format || 'json';
          
          const frontendTokens = await exportFrontendTokensFromFigma();
          
          let output: string;
          if (format === 'css') {
            // Convert to CSS variables
            output = frontendTokensToCss(frontendTokens);
          } else if (format === 'scss') {
            // Convert to SCSS variables
            output = frontendTokensToScss(frontendTokens);
          } else {
            // JSON format
            output = JSON.stringify(frontendTokens, null, 2);
          }
          
          figma.ui.postMessage({
            type: 'frontend-tokens-exported',
            payload: { output, format }
          });
          
          figma.notify('✅ Frontend токены экспортированы!');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          figma.ui.postMessage({
            type: 'frontend-export-error',
            payload: { error: errorMessage }
          });
          figma.notify(`❌ Ошибка экспорта: ${errorMessage}`);
        }
        break;
      }

      // ========================================
      // EXPORT TOKENS BY THEME (Flat structure for frontend)
      // ========================================
      case 'export-tokens-by-theme': {
        try {
          const tokensByTheme = await exportTokensByTheme();
          const output = JSON.stringify(tokensByTheme, null, 2);
          
          figma.ui.postMessage({
            type: 'tokens-by-theme-exported',
            payload: { output }
          });
          
          figma.notify('✅ Токены по темам экспортированы!');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          figma.ui.postMessage({
            type: 'tokens-by-theme-error',
            payload: { error: errorMessage }
          });
          figma.notify(`❌ Ошибка экспорта: ${errorMessage}`);
        }
        break;
      }

      case 'import-tokens': {
        const { tokens } = msg.payload as { tokens: DesignTokens };
        await importTokensToFigma(tokens);
        figma.ui.postMessage({
          type: 'tokens-imported',
          payload: { success: true }
        });
        break;
      }

      case 'sync-to-figma': {
        // Sync themes to Figma Variables
        // Data comes directly in msg, not in msg.payload
        const syncMsg = msg as unknown as { 
          type: string;
          variables: Array<{ name: string; value: { r: number; g: number; b: number; a: number }; description: string }>;
          themes: Array<{
            id: string;
            name: string;
            brandColor: string;
            accentColor?: string;
            neutralTint?: string;
            hasLightMode: boolean;
            hasDarkMode: boolean;
            isSystem?: boolean;
          }>;
        };
        
        try {
          const stats = await createColorVariablesWithStructure(syncMsg.variables, syncMsg.themes);
          await createBaseTokens();
          
          // Get actual counts from Figma
          const allVars = await figma.variables.getLocalVariablesAsync();
          const collections = await figma.variables.getLocalVariableCollectionsAsync();
          
          const primitivesCount = allVars.filter(v => {
            const col = collections.find(c => c.id === v.variableCollectionId);
            return col?.name === 'Primitives';
          }).length;
          
          const tokensCount = allVars.filter(v => {
            const col = collections.find(c => c.id === v.variableCollectionId);
            return col?.name === 'Tokens';
          }).length;
          
          const componentsCount = allVars.filter(v => {
            const col = collections.find(c => c.id === v.variableCollectionId);
            return col?.name === 'Components';
          }).length;
          
          figma.notify(`✅ Синхронизировано: ${primitivesCount} примитивов, ${tokensCount} токенов, ${componentsCount} компонентов`);
          figma.ui.postMessage({
            type: 'themes-synced',
            payload: { 
              success: true,
              stats: {
                primitives: primitivesCount,
                tokens: tokensCount,
                components: componentsCount,
                total: primitivesCount + tokensCount + componentsCount
              }
            }
          });
        } catch (error) {
          console.error('Sync error:', error);
          figma.notify(`❌ Ошибка синхронизации: ${error}`, { error: true });
          figma.ui.postMessage({
            type: 'themes-synced',
            payload: { success: false, error: String(error) }
          });
        }
        break;
      }

      case 'sync-figma-variables': {
        const payload = msg.payload as { direction?: string } | undefined;
        const direction = (payload && payload.direction) ? payload.direction : 'from-figma';
        
        if (direction === 'from-figma') {
          const tokens = await extractTokensFromFigma();
          figma.ui.postMessage({
            type: 'tokens-synced',
            payload: { tokens, direction }
          });
        }
        break;
      }

      case 'create-typography-variables': {
        const payload = msg.payload as { 
          variables: Array<{ 
            name: string; 
            value: number | string; 
            type: 'NUMBER' | 'STRING';
            collection: string;
          }>;
        };
        
        await createTypographyVariables(payload.variables);
        
        figma.ui.postMessage({
          type: 'variables-created',
          payload: { success: true }
        });
        figma.notify('✅ Typography Variables созданы!');
        break;
      }

      case 'create-text-styles': {
        const payload = msg.payload as TextStylePayload;
        
        figma.notify('⏳ Создание Text Styles...');
        
        const result = await createTextStyles(payload);
        
        figma.ui.postMessage({
          type: 'text-styles-created',
          payload: { 
            success: result.errors.length === 0,
            created: result.created,
            updated: result.updated,
            errors: result.errors
          }
        });
        
        if (result.errors.length > 0) {
          figma.notify(`⚠️ Text Styles: ${result.created} создано, ${result.updated} обновлено, ${result.errors.length} ошибок`);
        } else {
          figma.notify(`✅ Text Styles: ${result.created} создано, ${result.updated} обновлено`);
        }
        break;
      }

      case 'create-color-paint-styles': {
        const payload = msg.payload as ColorPaintStylesPayload;
        
        figma.notify(`⏳ Создание ${payload.colors.length} Paint Styles...`);
        
        const result = await createColorPaintStyles(payload);
        
        figma.ui.postMessage({
          type: 'color-paint-styles-created',
          payload: { 
            success: result.errors.length === 0,
            created: result.created,
            updated: result.updated,
            errors: result.errors
          }
        });
        
        if (result.errors.length > 0) {
          figma.notify(`⚠️ Paint Styles: ${result.created} создано, ${result.updated} обновлено, ${result.errors.length} ошибок`);
        } else {
          figma.notify(`✅ Paint Styles: ${result.created} создано, ${result.updated} обновлено`);
        }
        break;
      }

      // Create Paint Styles from ALL Figma Variables in Components collection
      case 'create-paint-styles-from-figma': {
        figma.notify('⏳ Загрузка цветов из Figma...');
        
        try {
          // Get all local variable collections
          const collections = await figma.variables.getLocalVariableCollectionsAsync();
          
          // Find Components collection (primary) or Tokens (fallback)
          let targetCollection = collections.find(c => c.name === 'Components');
          let collectionName = 'Components';
          
          if (!targetCollection) {
            targetCollection = collections.find(c => c.name === 'Tokens');
            collectionName = 'Tokens';
          }
          
          if (!targetCollection) {
            targetCollection = collections.find(c => c.name === 'Primitives');
            collectionName = 'Primitives';
          }
          
          if (!targetCollection) {
            figma.notify('⚠️ Не найдены коллекции цветов. Сначала сгенерируйте цвета.');
            break;
          }
          
          // Get all variables from the collection
          const allVariables = await figma.variables.getLocalVariablesAsync('COLOR');
          const collectionVariables = allVariables.filter(v => v.variableCollectionId === targetCollection!.id);
          
          if (collectionVariables.length === 0) {
            figma.notify(`⚠️ Нет цветов в коллекции ${collectionName}`);
            break;
          }
          
          // Get first mode for resolving values
          const modeId = targetCollection.modes[0].modeId;
          
          // Helper function to recursively resolve alias chains
          async function resolveColorValue(value: VariableValue, depth: number = 0): Promise<RGB | RGBA | null> {
            // Prevent infinite loops
            if (depth > 10) return null;
            
            // Direct color value
            if (value && typeof value === 'object' && 'r' in value) {
              return value as RGB | RGBA;
            }
            
            // Alias - resolve recursively
            if (value && typeof value === 'object' && 'type' in value && (value as any).type === 'VARIABLE_ALIAS') {
              try {
                const aliasedVar = await figma.variables.getVariableByIdAsync((value as any).id);
                if (aliasedVar) {
                  // Get value from first available mode
                  const aliasValue = aliasedVar.valuesByMode[Object.keys(aliasedVar.valuesByMode)[0]];
                  return resolveColorValue(aliasValue, depth + 1);
                }
              } catch (e) {
                // Can't resolve
              }
            }
            
            return null;
          }
          
          // Prepare colors for paint styles
          const colors: ColorPaintStylesPayload['colors'] = [];
          
          for (const variable of collectionVariables) {
            const value = variable.valuesByMode[modeId];
            
            // Resolve the color (handles both direct values and alias chains)
            const resolvedColor = await resolveColorValue(value);
            
            if (resolvedColor) {
              colors.push({
                name: variable.name,
                hex: rgbToHex(resolvedColor),
                r: resolvedColor.r,
                g: resolvedColor.g,
                b: resolvedColor.b,
                a: 'a' in resolvedColor ? resolvedColor.a : 1,
                description: variable.description || '',
                category: variable.name.split('/')[0] || 'color',
                shade: '',
              });
            }
          }
          
          if (colors.length === 0) {
            figma.notify('⚠️ Не удалось получить цвета из переменных');
            break;
          }
          
          figma.notify(`⏳ Создание ${colors.length} Paint Styles из ${collectionName}...`);
          
          const result = await createColorPaintStyles({ colors, structureMode: 'grouped' });
          
          figma.ui.postMessage({
            type: 'color-paint-styles-created',
            payload: { 
              success: result.errors.length === 0,
              created: result.created,
              updated: result.updated,
              errors: result.errors
            }
          });
          
          if (result.errors.length > 0) {
            figma.notify(`⚠️ Paint Styles: ${result.created} создано, ${result.updated} обновлено, ${result.errors.length} ошибок`);
          } else {
            figma.notify(`✅ Paint Styles из ${collectionName}: ${result.created} создано, ${result.updated} обновлено`);
          }
        } catch (error) {
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
        break;
      }

      case 'create-semantic-typography-variables': {
        const payload = msg.payload as SemanticTypographyVariablesPayload;
        
        const hasBreakpoints = payload.breakpoints && payload.breakpoints.length > 0;
        const modeNames = hasBreakpoints 
          ? payload.breakpoints!.map(b => b.label).join(', ')
          : 'default';
        
        figma.notify(`⏳ Создание семантических Variables${hasBreakpoints ? ` (режимы: ${modeNames})` : ''}...`);
        
        const result = await createSemanticTypographyVariables(payload);
        
        figma.ui.postMessage({
          type: 'semantic-typography-variables-created',
          payload: { 
            success: result.errors.length === 0,
            created: result.created,
            aliased: result.aliased,
            modes: result.modes,
            errors: result.errors
          }
        });
        
        if (result.errors.length > 0) {
          figma.notify(`⚠️ Variables: ${result.created} создано, ${result.aliased} алиасов, ${result.modes} режимов, ${result.errors.length} ошибок`);
        } else {
          const modeInfo = result.modes > 0 ? `, ${result.modes} режимов` : '';
          figma.notify(`✅ Variables: ${result.created} создано, ${result.aliased} алиасов${modeInfo}`);
        }
        break;
      }

      // ========================================
      // GAP HANDLERS
      // ========================================

      case 'create-gap-primitives': {
        const primitives = msg.primitives as Array<{ name: string; value: number }>;
        
        figma.notify(`⏳ Создание ${primitives.length} примитивов gap...`);
        
        const result = await createGapPrimitives(primitives);
        
        figma.ui.postMessage({
          type: 'gap-primitives-created',
          count: result.created + result.updated
        });
        
        figma.notify(`✅ Gap примитивы: ${result.created} создано, ${result.updated} обновлено`);
        break;
      }

      case 'create-gap-semantic': {
        const tokens = msg.tokens as Array<{ 
          id: string; 
          path: string;
          desktop: string; 
          tablet: string; 
          mobile: string; 
        }>;
        
        figma.notify(`⏳ Создание ${tokens.length} семантических токенов gap...`);
        
        try {
          const result = await createGapSemanticCollection({ tokens });
          
          figma.ui.postMessage({
            type: 'gap-semantic-created',
            count: result.created
          });
          
          if (result.errors.length > 0) {
            figma.notify(`⚠️ Gap: ${result.created} создано, ${result.aliased} алиасов, ${result.errors.length} ошибок`);
          } else {
            figma.notify(`✅ Gap: ${result.created} создано, ${result.aliased} алиасов`);
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'gap-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      // ========================================
      // RADIUS HANDLERS
      // ========================================

      case 'create-radius-primitives': {
        const primitives = msg.primitives as Array<{ name: string; value: number }>;
        
        figma.notify(`⏳ Создание ${primitives.length} примитивов radius...`);
        
        const result = await createRadiusPrimitives(primitives);
        
        figma.ui.postMessage({
          type: 'radius-primitives-created',
          count: result.created + result.updated
        });
        
        figma.notify(`✅ Radius примитивы: ${result.created} создано, ${result.updated} обновлено`);
        break;
      }

      case 'create-radius-semantic': {
        const tokens = (msg.tokens || []) as unknown as Array<{ 
          id: string; 
          path: string;
          primitiveRef: string;
        }>;
        
        figma.notify(`⏳ Создание ${tokens.length} семантических токенов radius...`);
        
        try {
          const result = await createRadiusSemanticCollection({ tokens });
          
          figma.ui.postMessage({
            type: 'radius-semantic-created',
            count: result.created
          });
          
          if (result.errors.length > 0) {
            figma.notify(`⚠️ Radius: ${result.created} создано, ${result.aliased} алиасов, ${result.errors.length} ошибок`);
          } else {
            figma.notify(`✅ Radius: ${result.created} создано, ${result.aliased} алиасов`);
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'radius-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      // ========================================
      // ICON SIZE HANDLERS
      // ========================================

      case 'create-icon-size-primitives': {
        const primitives = msg.primitives as Array<{ name: string; value: number }>;
        
        figma.notify(`⏳ Создание ${primitives.length} примитивов icon size...`);
        
        const result = await createIconSizePrimitives(primitives);
        
        figma.ui.postMessage({
          type: 'icon-size-primitives-created',
          count: result.created + result.updated
        });
        
        figma.notify(`✅ Icon Size примитивы: ${result.created} создано, ${result.updated} обновлено`);
        break;
      }

      case 'create-icon-size-semantic': {
        const tokens = (msg.tokens || []) as unknown as Array<{ 
          id: string; 
          path: string;
          category: string;
          name: string;
          description?: string;
          desktop: string;
          tablet: string;
          mobile: string;
        }>;
        
        figma.notify(`⏳ Создание ${tokens.length} семантических токенов icon size...`);
        
        try {
          const result = await createIconSizeSemanticCollection({ tokens });
          
          figma.ui.postMessage({
            type: 'icon-size-semantic-created',
            count: result.created
          });
          
          if (result.errors.length > 0) {
            figma.notify(`⚠️ Icon Size: ${result.created} создано, ${result.aliased} алиасов, ${result.errors.length} ошибок`);
          } else {
            figma.notify(`✅ Icon Size: ${result.created} создано, ${result.aliased} алиасов`);
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'icon-size-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'generate-icon-size-documentation': {
        figma.notify('⏳ Генерация документации Icon Size...');
        
        try {
          const result = await generateIconSizeDocumentation();
          
          figma.ui.postMessage({
            type: 'icon-size-documentation-generated',
            pageName: result.pageName,
            framesCreated: result.framesCreated
          });
          
          figma.notify(`✅ Документация Icon Size: ${result.framesCreated} фреймов на странице "${result.pageName}"`);
        } catch (error) {
          figma.ui.postMessage({
            type: 'icon-size-documentation-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка генерации: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      // ========================================
      // EFFECTS HANDLERS (Shadows, Blur, Opacity)
      // ========================================

      case 'create-effects-primitives': {
        const payload = msg.payload as EffectsPrimitivesPayload;
        
        const totalPrimitives = 
          payload.shadowOffsetX.length +
          payload.shadowOffsetY.length +
          payload.shadowBlur.length +
          payload.shadowSpread.length +
          payload.shadowColors.length +
          payload.blurs.length +
          payload.opacities.length;
        
        figma.notify(`⏳ Создание ${totalPrimitives} примитивов effects...`);
        
        try {
          const result = await createEffectsPrimitives(payload);
          
          figma.ui.postMessage({
            type: 'effects-primitives-created',
            payload: {
              created: result.created,
              updated: result.updated,
              errors: result.errors
            }
          });
          
          if (result.errors.length > 0) {
            figma.notify(`⚠️ Effects примитивы: ${result.created} создано, ${result.updated} обновлено, ${result.errors.length} ошибок`);
          } else {
            figma.notify(`✅ Effects примитивы: ${result.created} создано, ${result.updated} обновлено`);
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'effects-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'create-effects-semantic': {
        const payload = msg.payload as EffectsSemanticPayload;
        
        figma.notify(`⏳ Создание ${payload.semanticTokens.length} семантических токенов effects...`);
        
        try {
          const result = await createEffectsSemanticCollection(payload);
          
          figma.ui.postMessage({
            type: 'effects-semantic-created',
            payload: {
              created: result.created,
              aliased: result.aliased,
              errors: result.errors
            }
          });
          
          if (result.errors.length > 0) {
            figma.notify(`⚠️ Effects: ${result.created} создано, ${result.aliased} алиасов, ${result.errors.length} ошибок`);
          } else {
            figma.notify(`✅ Effects: ${result.created} создано, ${result.aliased} алиасов`);
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'effects-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'create-effects-styles': {
        const payload = msg.payload as {
          styles: Array<{
            name: string;
            type: 'shadow' | 'blur';
            shadowType?: 'drop' | 'inset';
            offsetX?: number;
            offsetY?: number;
            blur?: number;
            spread?: number;
            color?: string;
            opacity?: number;
          }>;
        };
        
        figma.notify(`⏳ Создание ${payload.styles.length} стилей эффектов...`);
        
        try {
          const result = await createEffectStyles(payload.styles);
          
          figma.ui.postMessage({
            type: 'effects-styles-created',
            payload: result
          });
          
          if (result.errors.length > 0) {
            figma.notify(`⚠️ Стили эффектов: ${result.created} создано, ${result.updated} обновлено, ${result.errors.length} ошибок`);
          } else {
            figma.notify(`✅ Стили эффектов: ${result.created} создано, ${result.updated} обновлено`);
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'effects-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      // ========================================
      // SPACING HANDLERS
      // ========================================

      case 'create-spacing-primitives': {
        const payload = msg.payload as {
          primitives: Array<{ name: string; value: number }>;
        };
        
        figma.notify(`⏳ Создание ${payload.primitives.length} примитивов spacing...`);
        
        const result = await createSpacingPrimitives(payload.primitives);
        
        figma.ui.postMessage({
          type: 'spacing-primitives-created',
          payload: result
        });
        
        figma.notify(`✅ Spacing примитивы: ${result.created} создано, ${result.updated} обновлено`);
        break;
      }

      case 'create-spacing-semantic-variables': {
        const payload = msg.payload as SpacingSemanticPayload;
        
        figma.notify(`⏳ Создание ${payload.semanticTokens.length} семантических spacing...`);
        
        const result = await createSpacingSemanticVariables(payload);
        
        figma.ui.postMessage({
          type: 'spacing-semantic-created',
          payload: result
        });
        
        if (result.errors.length > 0) {
          figma.notify(`⚠️ Spacing: ${result.created} создано, ${result.aliased} алиасов, ${result.errors.length} ошибок`);
        } else {
          figma.notify(`✅ Spacing: ${result.created} создано, ${result.aliased} алиасов`);
        }
        break;
      }

      case 'create-spacing-semantic': {
        const payload = msg.payload as SpacingSemanticData;
        
        figma.notify(`⏳ Создание ${payload.tokens.length} семантических токенов в "${payload.collectionName}"...`);
        
        try {
          const result = await createSpacingSemanticCollection(payload);
          
          figma.ui.postMessage({
            type: 'spacing-semantic-created',
            payload: result
          });
          
          if (result.errors.length > 0) {
            figma.notify(`⚠️ Spacing: ${result.created} создано, ${result.errors.length} ошибок`);
          } else {
            figma.notify(`✅ Spacing: ${result.created} создано, ${result.aliased} алиасов`);
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'spacing-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'create-scaling-collection': {
        const data = msg.data as {
          collectionName: string;
          modes: string[];
          tokens: Array<{
            name: string;
            values: { Desktop: number; Tablet: number; Mobile: number };
            description?: string;
          }>;
        };
        
        figma.notify(`⏳ Создание коллекции "${data.collectionName}" с ${data.tokens.length} токенами...`);
        
        try {
          const result = await createScalingCollection(data);
          
          figma.ui.postMessage({
            type: 'scaling-export-success',
            count: result.created,
          });
          
          figma.notify(`✅ Создано ${result.created} переменных в "${data.collectionName}"`);
        } catch (error) {
          figma.ui.postMessage({
            type: 'scaling-export-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'notify': {
        const { message } = msg.payload as { message: string };
        figma.notify(message);
        break;
      }

      // ========================================
      // STROKE (BORDER) HANDLERS
      // ========================================

      case 'create-stroke-primitives': {
        const { widths, styles, dashArrays } = msg as unknown as {
          widths: Array<{ name: string; value: number }>;
          styles: Array<{ name: string; value: string }>;
          dashArrays: Array<{ name: string; value: string }>;
        };
        
        const totalPrimitives = (widths?.length || 0) + (styles?.length || 0) + (dashArrays?.length || 0);
        figma.notify(`⏳ Создание ${totalPrimitives} примитивов stroke...`);
        
        try {
          const result = await createStrokePrimitives({ widths, styles, dashArrays });
          
          figma.ui.postMessage({
            type: 'stroke-primitives-created',
            count: result.created + result.updated
          });
          
          if (result.errors.length > 0) {
            console.error('[Stroke] Errors:', result.errors);
            figma.notify(`⚠️ Stroke примитивы: ${result.created} создано, ${result.updated} обновлено, ${result.errors.length} ошибок`);
          } else {
            figma.notify(`✅ Stroke примитивы: ${result.created} создано, ${result.updated} обновлено`);
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'stroke-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'create-stroke-semantic': {
        const tokens = msg.tokens as unknown as Array<{
          id: string;
          path: string;
          category: string;
          property: 'width' | 'style' | 'color';
          widthRef?: string;
          styleRef?: string;
          colorRef?: string;
        }>;
        
        figma.notify(`⏳ Создание ${tokens.length} семантических токенов stroke...`);
        
        try {
          const result = await createStrokeSemanticCollection({ tokens });
          
          figma.ui.postMessage({
            type: 'stroke-semantic-created',
            count: result.created
          });
          
          if (result.errors.length > 0) {
            figma.notify(`⚠️ Stroke: ${result.created} создано, ${result.aliased} алиасов, ${result.errors.length} ошибок`);
          } else {
            figma.notify(`✅ Stroke: ${result.created} создано, ${result.aliased} алиасов`);
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'stroke-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      // ========================================
      // GRID (LAYOUT GRID) HANDLERS
      // ========================================

      case 'create-grid-primitives': {
        const { gutter, margin, container } = msg as unknown as {
          gutter: Array<{ name: string; value: number }>;
          margin: Array<{ name: string; value: number }>;
          container: Array<{ name: string; value: number }>;
        };
        
        const totalPrimitives = (gutter?.length || 0) + (margin?.length || 0) + (container?.length || 0);
        figma.notify(`⏳ Создание ${totalPrimitives} примитивов grid...`);
        
        try {
          const result = await createGridPrimitives({ 
            gutters: gutter || [], 
            margins: margin || [], 
            containers: container || [] 
          });
          
          figma.ui.postMessage({
            type: 'grid-primitives-created',
            count: result.created + result.updated
          });
          
          if (result.errors.length > 0) {
            console.error('[Grid] Errors:', result.errors);
            figma.notify(`⚠️ Grid примитивы: ${result.created} создано, ${result.updated} обновлено, ${result.errors.length} ошибок`);
          } else {
            figma.notify(`✅ Grid примитивы: ${result.created} создано, ${result.updated} обновлено`);
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'grid-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'create-grid-semantic': {
        const tokens = msg.tokens as unknown as Array<{
          id: string;
          path: string;
          category: string;
          desktop: { columns: number; gutter: string; margin: string; alignment: string; maxWidth?: string };
          tablet: { columns: number; gutter: string; margin: string; alignment: string; maxWidth?: string };
          mobile: { columns: number; gutter: string; margin: string; alignment: string; maxWidth?: string };
        }>;
        
        figma.notify(`⏳ Создание ${tokens.length} семантических токенов grid...`);
        
        try {
          const result = await createGridSemanticCollection({ tokens });
          
          figma.ui.postMessage({
            type: 'grid-semantic-created',
            count: result.created
          });
          
          if (result.errors.length > 0) {
            figma.notify(`⚠️ Grid: ${result.created} создано, ${result.aliased} алиасов, ${result.errors.length} ошибок`);
          } else {
            figma.notify(`✅ Grid: ${result.created} создано, ${result.aliased} алиасов`);
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'grid-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'apply-grid-to-frame': {
        const { tokenName, breakpoint } = msg as unknown as { tokenName: string; breakpoint: 'desktop' | 'tablet' | 'mobile' };
        
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
          figma.notify('⚠️ Выберите фрейм для применения сетки');
          break;
        }
        
        const frame = selection[0];
        if (frame.type !== 'FRAME') {
          figma.notify('⚠️ Выберите фрейм (не другой тип элемента)');
          break;
        }
        
        try {
          const result = await applyGridToFrame(frame, tokenName, breakpoint);
          figma.notify(`✅ Сетка "${tokenName}" (${breakpoint}) применена к фрейму`);
          figma.ui.postMessage({ type: 'grid-applied', success: true });
        } catch (error) {
          figma.ui.postMessage({
            type: 'grid-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'create-grid-components': {
        const grids = (msg as unknown as { components: Array<{
          id: string;
          name: string;
          path: string;
          description: string;
          desktop: { columns: number; gutter: number; margin: number; alignment: string };
          tablet: { columns: number; gutter: number; margin: number; alignment: string };
          mobile: { columns: number; gutter: number; margin: number; alignment: string };
        }> }).components;
        
        figma.notify(`⏳ Создание ${grids.length * 3} Grid Styles...`);
        
        try {
          const result = await createGridStyles(grids);
          figma.ui.postMessage({
            type: 'grid-components-created',
            count: result.created + result.updated,
            pageName: result.pageName,
          });
          figma.notify(`✅ Grid Styles: ${result.created} создано, ${result.updated} обновлено`);
        } catch (error) {
          figma.ui.postMessage({
            type: 'grid-error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      // ========================================
      // DOCUMENTATION GENERATORS
      // ========================================

      case 'generate-colors-documentation': {
        figma.notify('📖 Создание документации по цветам...');
        try {
          const result = await generateColorsDocumentation();
          figma.notify(`✅ Документация создана: страница "${result.pageName}"`);
          figma.ui.postMessage({ type: 'docs-colors-created', pageName: result.pageName });
        } catch (error) {
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'generate-typography-documentation': {
        figma.notify('📖 Создание документации по типографике...');
        try {
          const result = await generateTypographyDocumentation();
          figma.notify(`✅ Документация создана: страница "${result.pageName}"`);
          figma.ui.postMessage({ type: 'docs-typography-created', pageName: result.pageName });
        } catch (error) {
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'generate-spacing-documentation': {
        figma.notify('📖 Создание документации по Spacing...');
        try {
          const result = await generateSpacingDocumentation();
          figma.notify(`✅ Документация создана: страница "${result.pageName}"`);
          figma.ui.postMessage({ type: 'docs-spacing-created', pageName: result.pageName });
        } catch (error) {
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'generate-gap-documentation': {
        figma.notify('📖 Создание документации по Gap...');
        try {
          const result = await generateGapDocumentation();
          figma.notify(`✅ Документация создана: страница "${result.pageName}"`);
          figma.ui.postMessage({ type: 'docs-gap-created', pageName: result.pageName });
        } catch (error) {
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'generate-radius-documentation': {
        figma.notify('📖 Создание документации по Radius...');
        try {
          const result = await generateRadiusDocumentation();
          figma.notify(`✅ Документация создана: страница "${result.pageName}"`);
          figma.ui.postMessage({ type: 'docs-radius-created', pageName: result.pageName });
        } catch (error) {
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      case 'generate-grid-documentation': {
        figma.notify('📖 Создание документации по Grid...');
        try {
          const result = await generateGridDocumentation();
          figma.notify(`✅ Документация создана: страница "${result.pageName}"`);
          figma.ui.postMessage({ type: 'docs-grid-created', pageName: result.pageName });
        } catch (error) {
          figma.notify(`❌ Ошибка: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      }

      // ========================================
      // SYNC HANDLERS
      // ========================================

      case 'sync-get-collections': {
        // Получить список коллекций из Figma
        try {
          const collections = await figma.variables.getLocalVariableCollectionsAsync();
          const collectionsData = collections.map(c => ({
            id: c.id,
            name: c.name,
            modes: c.modes.map(m => ({ modeId: m.modeId, name: m.name })),
            defaultModeId: c.defaultModeId,
            variableCount: c.variableIds.length,
          }));
          
          figma.ui.postMessage({
            type: 'sync-collections-loaded',
            payload: { collections: collectionsData }
          });
        } catch (error) {
          figma.ui.postMessage({
            type: 'sync-error',
            payload: { error: error instanceof Error ? error.message : 'Failed to load collections' }
          });
        }
        break;
      }

      case 'sync-get-variables': {
        // Получить переменные из конкретной коллекции
        const { collectionId } = msg.payload as { collectionId: string };
        try {
          const allVariables = await figma.variables.getLocalVariablesAsync();
          const collectionVars = allVariables.filter(v => v.variableCollectionId === collectionId);
          const collection = await figma.variables.getVariableCollectionByIdAsync(collectionId);
          
          if (!collection) {
            throw new Error('Collection not found');
          }
          
          // Преобразуем в формат для UI
          const variablesData = collectionVars.map(v => {
            const modeValues = collection.modes.map(mode => {
              const value = v.valuesByMode[mode.modeId];
              
              // Проверяем, является ли значение алиасом
              let aliasId: string | undefined;
              let aliasName: string | undefined;
              let resolvedValue: VariableValue | null = value;
              
              if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'VARIABLE_ALIAS') {
                aliasId = (value as VariableAlias).id;
                // Получаем имя переменной-алиаса
                const aliasVar = allVariables.find(av => av.id === aliasId);
                aliasName = aliasVar?.name;
                resolvedValue = null; // Для алиасов значение неизвестно
              }
              
              return {
                modeId: mode.modeId,
                modeName: mode.name,
                value: resolvedValue,
                aliasId,
                aliasName,
              };
            });
            
            return {
              id: v.id,
              name: v.name,
              resolvedType: v.resolvedType,
              description: v.description || '',
              collectionId: v.variableCollectionId,
              collectionName: collection.name,
              modeValues,
              scopes: v.scopes,
            };
          });
          
          figma.ui.postMessage({
            type: 'sync-variables-loaded',
            payload: { 
              collectionId,
              variables: variablesData 
            }
          });
        } catch (error) {
          figma.ui.postMessage({
            type: 'sync-error',
            payload: { error: error instanceof Error ? error.message : 'Failed to load variables' }
          });
        }
        break;
      }

      case 'sync-apply-changes': {
        // Применить изменения из diff
        const { collectionName, changes, modesToAdd } = msg.payload as {
          collectionName: string;
          changes: Array<{
            type: 'add' | 'update' | 'delete';
            variableName: string;
            figmaId?: string;
            pluginVariable?: {
              name: string;
              type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
              description?: string;
              modeValues: Record<string, any>;
              aliasTo?: string;
            };
          }>;
          modesToAdd: string[];
        };
        
        try {
          figma.notify(`⏳ Синхронизация ${collectionName}...`);
          
          const result = await applySyncChanges(collectionName, changes, modesToAdd);
          
          figma.ui.postMessage({
            type: 'sync-applied',
            payload: result
          });
          
          if (result.success) {
            figma.notify(`✅ Синхронизация: +${result.created}, ~${result.updated}, -${result.deleted}`);
          } else {
            figma.notify(`⚠️ Синхронизация завершена с ошибками`);
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'sync-error',
            payload: { error: error instanceof Error ? error.message : 'Sync failed' }
          });
          figma.notify(`❌ Ошибка синхронизации: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
        break;
      }

      case 'sync-delete-variable': {
        // Удалить одну переменную
        const { variableId } = msg.payload as { variableId: string };
        try {
          const variable = await figma.variables.getVariableByIdAsync(variableId);
          if (variable) {
            variable.remove();
            figma.ui.postMessage({ type: 'sync-variable-deleted', payload: { variableId } });
          }
        } catch (error) {
          figma.ui.postMessage({
            type: 'sync-error',
            payload: { error: error instanceof Error ? error.message : 'Delete failed' }
          });
        }
        break;
      }

      // ============================================================
      // CLIENT STORAGE HANDLERS (for UI persistence)
      // ============================================================
      case 'storage-get': {
        const { key, requestId } = msg.payload as { key: string; requestId: string };
        try {
          const data = await figma.clientStorage.getAsync(key);
          figma.ui.postMessage({
            type: 'storage-get-response',
            payload: { key, data, requestId, success: true }
          });
        } catch (error) {
          figma.ui.postMessage({
            type: 'storage-get-response',
            payload: { key, data: null, requestId, success: false, error: String(error) }
          });
        }
        break;
      }

      case 'storage-set': {
        const { key, data, requestId } = msg.payload as { key: string; data: any; requestId: string };
        try {
          await figma.clientStorage.setAsync(key, data);
          figma.ui.postMessage({
            type: 'storage-set-response',
            payload: { key, requestId, success: true }
          });
        } catch (error) {
          figma.ui.postMessage({
            type: 'storage-set-response',
            payload: { key, requestId, success: false, error: String(error) }
          });
        }
        break;
      }

      // ========================================
      // EXPORT SELECTED CHANGES TO FIGMA
      // ========================================
      
      case 'export-selected-changes': {
        const { changes } = msg.payload as { changes: Array<{
          module: 'colors' | 'typography' | 'spacing' | 'gap' | 'radius' | 'iconSize';
          type: 'add' | 'update' | 'delete';
          category: string;
          name: string;
        }> };
        
        if (!changes || changes.length === 0) {
          figma.notify('ℹ️ Нет выбранных изменений для экспорта');
          break;
        }
        
        figma.notify(`⏳ Экспортируем ${changes.length} изменений...`);
        
        const results = {
          typography: { created: 0, updated: 0, deleted: 0 },
          spacing: { created: 0, updated: 0, deleted: 0 },
          gap: { created: 0, updated: 0, deleted: 0 },
          radius: { created: 0, updated: 0, deleted: 0 },
          iconSize: { created: 0, updated: 0, deleted: 0 },
          errors: [] as string[]
        };
        
        try {
          // Get breakpoints for responsive tokens
          const typographyData = await figma.clientStorage.getAsync('typography-state');
          let breakpoints: Array<{ name: string; label: string; minWidth: number; scale: number }> = [
            { name: 'desktop', label: 'Desktop', minWidth: 1024, scale: 1 },
            { name: 'tablet', label: 'Tablet', minWidth: 768, scale: 0.9 },
            { name: 'mobile', label: 'Mobile', minWidth: 0, scale: 0.85 }
          ];
          
          if (typographyData?.breakpoints) {
            breakpoints = typographyData.breakpoints;
          }
          
          // Group changes by module
          const typographyChanges = changes.filter(c => c.module === 'typography');
          const spacingChanges = changes.filter(c => c.module === 'spacing');
          const gapChanges = changes.filter(c => c.module === 'gap');
          const radiusChanges = changes.filter(c => c.module === 'radius');
          const iconSizeChanges = changes.filter(c => c.module === 'iconSize');
          
          // ========================================
          // PROCESS DELETIONS FIRST
          // ========================================
          const deleteChanges = changes.filter(c => c.type === 'delete');
          if (deleteChanges.length > 0) {
            const collections = await figma.variables.getLocalVariableCollectionsAsync();
            
            for (const change of deleteChanges) {
              try {
                // Map module to collection name
                const collectionName = {
                  'typography': 'Typography',
                  'spacing': 'Spacing',
                  'gap': 'Gap',
                  'radius': 'Radius',
                  'iconSize': 'Icon Size',
                  'colors': 'Primitives'
                }[change.module] || change.module;
                
                const collection = collections.find(c => c.name === collectionName);
                if (!collection) {
                  results.errors.push(`Collection ${collectionName} not found for delete`);
                  continue;
                }
                
                // Get all variables in collection
                const variables = await Promise.all(
                  collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id))
                );
                
                // Find variable to delete by name
                // change.name could be "gap.modal.new" or "gap/modal/new"
                const searchName = change.name.replace(/\./g, '/');
                const variable = variables.find(v => v && v.name === searchName);
                
                if (variable) {
                  variable.remove();
                  // Track deleted count
                  if (change.module === 'gap') results.gap.deleted++;
                  else if (change.module === 'spacing') results.spacing.deleted++;
                  else if (change.module === 'radius') results.radius.deleted++;
                  else if (change.module === 'iconSize') results.iconSize.deleted++;
                  else if (change.module === 'typography') results.typography.deleted++;
                } else {
                  results.errors.push(`Variable ${searchName} not found in ${collectionName}`);
                }
              } catch (e) {
                results.errors.push(`Delete ${change.name}: ${e instanceof Error ? e.message : String(e)}`);
              }
            }
          }
          
          // Process Typography changes (non-delete)
          const typographyAddUpdates = typographyChanges.filter(c => c.type !== 'delete');
          if (typographyAddUpdates.length > 0 && typographyData?.state) {
            try {
              const typographyState = typographyData.state;
              const changedNames = new Set(typographyChanges.map(c => c.name));
              
              // Find semantic tokens matching changes
              // Note: c.name is the full token id like "typography.page.subtitle"
              // t.id is the same format, t.path is an array
              const tokensToExport = typographyState.semanticTokens?.filter((t: any) => {
                const pathStr = Array.isArray(t.path) ? t.path.join('.') : t.path;
                return changedNames.has(t.id) || changedNames.has(pathStr) || changedNames.has(t.name);
              }) || [];
              
              if (tokensToExport.length > 0) {
                const semanticPayload: SemanticTypographyVariablesPayload = {
                  semanticTokens: tokensToExport.map((token: any) => ({
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
                    responsive: token.responsive,
                    deviceOverrides: token.deviceOverrides,
                  })),
                  primitives: {
                    fontSizes: typographyState.fontSizes?.map((s: any) => ({ name: s.name, value: s.value })) || [],
                    lineHeights: typographyState.lineHeights?.map((lh: any) => ({ name: lh.name, value: lh.value })) || [],
                    fontWeights: typographyState.fontWeights?.map((fw: any) => ({ name: fw.name, value: fw.value })) || [],
                    letterSpacings: typographyState.letterSpacings?.map((ls: any) => ({ name: ls.name, value: ls.value })) || [],
                  },
                  breakpoints: breakpoints,
                };
                
                const varResult = await createSemanticTypographyVariables(semanticPayload);
                results.typography.created += varResult.created;
                
                // Also create Text Styles
                const textStylesPayload = {
                  semanticTokens: tokensToExport.map((token: any) => ({
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
                  })),
                  primitives: {
                    fontFamilies: typographyState.fontFamilies?.map((f: any) => ({ name: f.name, value: f.value, isEnabled: true })) || [],
                    fontSizes: typographyState.fontSizes?.map((s: any) => ({ name: s.name, value: s.value })) || [],
                    lineHeights: typographyState.lineHeights?.map((lh: any) => ({ name: lh.name, value: lh.value, unit: lh.unit || '%' })) || [],
                    fontWeights: typographyState.fontWeights?.map((fw: any) => ({ name: fw.name, value: fw.value })) || [],
                    letterSpacings: typographyState.letterSpacings?.map((ls: any) => ({ name: ls.name, value: ls.value })) || [],
                  }
                };
                
                const textStylesResult = await createTextStyles(textStylesPayload);
                results.typography.updated += textStylesResult.updated;
              }
            } catch (e) {
              results.errors.push(`Typography: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
          
          // Process Spacing changes (non-delete)
          const spacingAddUpdates = spacingChanges.filter(c => c.type !== 'delete');
          if (spacingAddUpdates.length > 0) {
            const spacingData = await figma.clientStorage.getAsync('spacing-state');
            if (spacingData) {
              try {
                const changedNames = new Set(spacingAddUpdates.map(c => c.name));
                
                // Find tokens matching changes
                const tokensToExport = spacingData.semanticTokens?.filter((t: any) =>
                  changedNames.has(t.path) || changedNames.has(t.name)
                ) || [];
                
                if (tokensToExport.length > 0) {
                  const primMap = new Map<string, number>();
                  spacingData.primitives?.forEach((p: any) => primMap.set(p.name, p.value));
                  
                  const tokens = tokensToExport.map((token: any) => ({
                    path: token.path,
                    desktop: { ref: token.desktop, value: primMap.get(token.desktop) || 0 },
                    tablet: { ref: token.tablet, value: primMap.get(token.tablet) || 0 },
                    mobile: { ref: token.mobile, value: primMap.get(token.mobile) || 0 },
                  }));
                  
                  const semResult = await createSpacingSemanticCollection({
                    collectionName: 'Spacing',
                    tokens
                  });
                  results.spacing.created += semResult.created;
                }
              } catch (e) {
                results.errors.push(`Spacing: ${e instanceof Error ? e.message : String(e)}`);
              }
            }
          }
          
          // Process Gap changes (non-delete)
          const gapAddUpdates = gapChanges.filter(c => c.type !== 'delete');
          if (gapAddUpdates.length > 0) {
            const gapData = await figma.clientStorage.getAsync('gap-state');
            if (gapData) {
              try {
                const changedNames = new Set(gapAddUpdates.map(c => c.name));
                
                const tokensToExport = gapData.semanticTokens?.filter((t: any) =>
                  changedNames.has(t.path) || changedNames.has(t.name)
                ) || [];
                
                if (tokensToExport.length > 0) {
                  const semResult = await createGapSemanticCollection({
                    tokens: tokensToExport.map((t: any) => ({
                      id: t.id,
                      path: t.path,
                      desktop: t.desktop,
                      tablet: t.tablet,
                      mobile: t.mobile,
                    }))
                  });
                  results.gap.created += semResult.created;
                }
              } catch (e) {
                results.errors.push(`Gap: ${e instanceof Error ? e.message : String(e)}`);
              }
            }
          }
          
          // Process Radius changes (non-delete)
          const radiusAddUpdates = radiusChanges.filter(c => c.type !== 'delete');
          if (radiusAddUpdates.length > 0) {
            const radiusData = await figma.clientStorage.getAsync('radius-state');
            if (radiusData) {
              try {
                const changedNames = new Set(radiusAddUpdates.map(c => c.name));
                
                const tokensToExport = radiusData.semanticTokens?.filter((t: any) =>
                  changedNames.has(t.path) || changedNames.has(t.name)
                ) || [];
                
                if (tokensToExport.length > 0) {
                  const semResult = await createRadiusSemanticCollection({
                    tokens: tokensToExport.map((t: any) => ({
                      id: t.id,
                      path: t.path,
                      primitiveRef: t.primitiveRef,
                    }))
                  });
                  results.radius.created += semResult.created;
                }
              } catch (e) {
                results.errors.push(`Radius: ${e instanceof Error ? e.message : String(e)}`);
              }
            }
          }
          
          // Process Icon Size changes
          // Process Icon Size changes (non-delete)
          const iconSizeAddUpdates = iconSizeChanges.filter(c => c.type !== 'delete');
          if (iconSizeAddUpdates.length > 0) {
            const iconSizeData = await figma.clientStorage.getAsync('icon-size-state');
            if (iconSizeData) {
              try {
                const changedNames = new Set(iconSizeAddUpdates.map(c => c.name));
                
                const tokensToExport = iconSizeData.semanticTokens?.filter((t: any) =>
                  changedNames.has(t.path) || changedNames.has(t.name)
                ) || [];
                
                if (tokensToExport.length > 0) {
                  const semResult = await createIconSizeSemanticCollection({
                    tokens: tokensToExport.map((t: any) => ({
                      id: t.id,
                      path: t.path,
                      category: t.category,
                      name: t.name,
                      description: t.description,
                      desktop: t.desktop,
                      tablet: t.tablet,
                      mobile: t.mobile,
                    }))
                  });
                  results.iconSize.created += semResult.created;
                }
              } catch (e) {
                results.errors.push(`Icon Size: ${e instanceof Error ? e.message : String(e)}`);
              }
            }
          }
          
          // Build summary message
          const parts: string[] = [];
          if (results.gap.created > 0 || results.gap.deleted > 0) {
            const gapParts: string[] = [];
            if (results.gap.created > 0) gapParts.push(`+${results.gap.created}`);
            if (results.gap.deleted > 0) gapParts.push(`-${results.gap.deleted}`);
            parts.push(`Gap: ${gapParts.join(' ')}`);
          }
          if (results.radius.created > 0 || results.radius.deleted > 0) {
            const radiusParts: string[] = [];
            if (results.radius.created > 0) radiusParts.push(`+${results.radius.created}`);
            if (results.radius.deleted > 0) radiusParts.push(`-${results.radius.deleted}`);
            parts.push(`Radius: ${radiusParts.join(' ')}`);
          }
          if (results.iconSize.created > 0 || results.iconSize.deleted > 0) {
            const iconParts: string[] = [];
            if (results.iconSize.created > 0) iconParts.push(`+${results.iconSize.created}`);
            if (results.iconSize.deleted > 0) iconParts.push(`-${results.iconSize.deleted}`);
            parts.push(`Icon Size: ${iconParts.join(' ')}`);
          }
          if (results.spacing.created > 0 || results.spacing.deleted > 0) {
            const spacingParts: string[] = [];
            if (results.spacing.created > 0) spacingParts.push(`+${results.spacing.created}`);
            if (results.spacing.deleted > 0) spacingParts.push(`-${results.spacing.deleted}`);
            parts.push(`Spacing: ${spacingParts.join(' ')}`);
          }
          if (results.typography.created > 0 || results.typography.updated > 0 || results.typography.deleted > 0) {
            const typoParts: string[] = [];
            if (results.typography.created > 0) typoParts.push(`+${results.typography.created}`);
            if (results.typography.updated > 0) typoParts.push(`~${results.typography.updated}`);
            if (results.typography.deleted > 0) typoParts.push(`-${results.typography.deleted}`);
            parts.push(`Typography: ${typoParts.join(' ')}`);
          }
          
          if (parts.length > 0) {
            figma.notify(`✅ Экспорт завершён: ${parts.join(', ')}`);
          } else {
            figma.notify('ℹ️ Токены не найдены для выбранных изменений');
          }
          
          if (results.errors.length > 0) {
            console.error('Export errors:', results.errors);
          }
          
          figma.ui.postMessage({
            type: 'export-selected-complete',
            payload: results
          });
        } catch (error) {
          figma.notify(`❌ Ошибка экспорта: ${error instanceof Error ? error.message : 'Unknown error'}`);
          figma.ui.postMessage({
            type: 'export-selected-error',
            payload: { error: error instanceof Error ? error.message : 'Unknown error' }
          });
        }
        break;
      }

      // ========================================
      // EXPORT ALL TO FIGMA
      // ========================================
      
      case 'export-all-to-figma': {
        figma.notify('⏳ Экспортируем все изменения в Figma...');
        
        const results = {
          typography: { created: 0, updated: 0 },
          spacing: { created: 0, updated: 0 },
          gap: { created: 0, updated: 0 },
          radius: { created: 0, updated: 0 },
          iconSize: { created: 0, updated: 0 },
          errors: [] as string[]
        };
        
        try {
          // Get breakpoints settings from clientStorage
          const breakpointsData = await figma.clientStorage.getAsync('typography-breakpoints');
          let breakpoints: Array<{ name: string; label: string; minWidth: number; scale: number }> = [];
          
          if (breakpointsData) {
            // Data from clientStorage is already an object
            const bpState = breakpointsData as any;
            breakpoints = bpState.breakpoints || [];
          } else {
            // Default breakpoints
            breakpoints = [
              { name: 'desktop', label: 'Desktop', minWidth: 1024, scale: 1 },
              { name: 'tablet', label: 'Tablet', minWidth: 768, scale: 0.9 },
              { name: 'mobile', label: 'Mobile', minWidth: 0, scale: 0.85 }
            ];
          }
          
          // 1. Typography - get from clientStorage
          const typographyData = await figma.clientStorage.getAsync('typography-state');
          if (typographyData) {
            try {
              // Typography saves nested structure: { state: {...}, breakpoints: [...], responsiveEnabled: bool }
              const typographyState = typographyData.state || typographyData;
              
              // First export primitives to Primitives collection
              if (typographyState.fontSizes?.length > 0 || typographyState.lineHeights?.length > 0 || typographyState.fontWeights?.length > 0) {
                const variables: Array<{ name: string; value: number | string; type: 'NUMBER' | 'STRING'; collection: string }> = [];
                
                typographyState.fontSizes?.forEach((fs: any) => {
                  variables.push({ name: `font/size/${fs.name}`, value: fs.value, type: 'NUMBER', collection: 'Primitives' });
                });
                
                typographyState.lineHeights?.forEach((lh: any) => {
                  variables.push({ name: `font/lineHeight/${lh.name}`, value: lh.value, type: 'NUMBER', collection: 'Primitives' });
                });
                
                typographyState.fontWeights?.forEach((fw: any) => {
                  variables.push({ name: `font/weight/${fw.name}`, value: fw.value, type: 'NUMBER', collection: 'Primitives' });
                });
                
                if (variables.length > 0) {
                  await createTypographyVariables(variables);
                  results.typography.created += variables.length;
                }
              }
              
              // Create semantic Typography Variables with device modes
              if (typographyState.semanticTokens && typographyState.semanticTokens.length > 0) {
                const semanticPayload: SemanticTypographyVariablesPayload = {
                  semanticTokens: typographyState.semanticTokens.map((token: any) => ({
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
                    responsive: token.responsive, // IMPORTANT: Pass responsive flag!
                    deviceOverrides: token.deviceOverrides,
                  })),
                  primitives: {
                    fontSizes: typographyState.fontSizes?.map((s: any) => ({ name: s.name, value: s.value })) || [],
                    lineHeights: typographyState.lineHeights?.map((lh: any) => ({ name: lh.name, value: lh.value })) || [],
                    fontWeights: typographyState.fontWeights?.map((fw: any) => ({ name: fw.name, value: fw.value })) || [],
                    letterSpacings: typographyState.letterSpacings?.map((ls: any) => ({ name: ls.name, value: ls.value })) || [],
                  },
                  breakpoints: breakpoints,
                };
                
                const varResult = await createSemanticTypographyVariables(semanticPayload);
                results.typography.created += varResult.created;
                
                // Also create Text Styles
                const textStylesPayload = {
                  semanticTokens: typographyState.semanticTokens.map((token: any) => ({
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
                  })),
                  primitives: {
                    fontFamilies: typographyState.fontFamilies?.map((f: any) => ({ name: f.name, value: f.value, isEnabled: true })) || [],
                    fontSizes: typographyState.fontSizes?.map((s: any) => ({ name: s.name, value: s.value })) || [],
                    lineHeights: typographyState.lineHeights?.map((lh: any) => ({ name: lh.name, value: lh.value, unit: lh.unit || '%' })) || [],
                    fontWeights: typographyState.fontWeights?.map((fw: any) => ({ name: fw.name, value: fw.value })) || [],
                    letterSpacings: typographyState.letterSpacings?.map((ls: any) => ({ name: ls.name, value: ls.value })) || [],
                  }
                };
                
                const textStylesResult = await createTextStyles(textStylesPayload);
                results.typography.updated += textStylesResult.updated;
              }
            } catch (e) {
              results.errors.push(`Typography: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
          
          // 2. Spacing - get from clientStorage
          const spacingData = await figma.clientStorage.getAsync('spacing-state');
          if (spacingData) {
            try {
              const spacingState = spacingData;
              
              // Export primitives first
              if (spacingState.primitives && spacingState.primitives.length > 0) {
                const enabledPrimitives = spacingState.primitives.filter((p: any) => p.enabled);
                if (enabledPrimitives.length > 0) {
                  const primResult = await createSpacingPrimitives(enabledPrimitives.map((p: any) => ({
                    name: p.name,
                    value: p.value
                  })));
                  results.spacing.created += primResult.created;
                  results.spacing.updated += primResult.updated;
                }
              }
              
              // Export semantic tokens
              if (spacingState.semanticTokens && spacingState.semanticTokens.length > 0) {
                // Build primitive map
                const primMap = new Map<string, number>();
                spacingState.primitives?.forEach((p: any) => primMap.set(p.name, p.value));
                
                const tokens = spacingState.semanticTokens.map((token: any) => ({
                  path: token.path,
                  desktop: { ref: token.desktop, value: primMap.get(token.desktop) || 0 },
                  tablet: { ref: token.tablet, value: primMap.get(token.tablet) || 0 },
                  mobile: { ref: token.mobile, value: primMap.get(token.mobile) || 0 },
                }));
                
                const semResult = await createSpacingSemanticCollection({
                  collectionName: 'Spacing',
                  tokens
                });
                results.spacing.created += semResult.created;
              }
            } catch (e) {
              results.errors.push(`Spacing: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
          
          // 3. Gap - get from clientStorage
          const gapData = await figma.clientStorage.getAsync('gap-state');
          if (gapData) {
            try {
              const gapState = gapData;
              
              // Export primitives
              if (gapState.primitives && gapState.primitives.length > 0) {
                const enabledPrimitives = gapState.primitives.filter((p: any) => p.enabled);
                if (enabledPrimitives.length > 0) {
                  const primResult = await createGapPrimitives(enabledPrimitives.map((p: any) => ({
                    name: p.name,
                    value: p.value
                  })));
                  results.gap.created += primResult.created;
                  results.gap.updated += primResult.updated;
                }
              }
              
              // Export semantic tokens
              if (gapState.semanticTokens && gapState.semanticTokens.length > 0) {
                const semResult = await createGapSemanticCollection({
                  tokens: gapState.semanticTokens.map((t: any) => ({
                    id: t.id,
                    path: t.path,
                    desktop: t.desktop,
                    tablet: t.tablet,
                    mobile: t.mobile,
                  }))
                });
                results.gap.created += semResult.created;
              }
            } catch (e) {
              results.errors.push(`Gap: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
          
          // 4. Radius - get from clientStorage
          const radiusData = await figma.clientStorage.getAsync('radius-state');
          if (radiusData) {
            try {
              const radiusState = radiusData;
              
              // Export primitives
              if (radiusState.primitives && radiusState.primitives.length > 0) {
                const enabledPrimitives = radiusState.primitives.filter((p: any) => p.enabled);
                if (enabledPrimitives.length > 0) {
                  const primResult = await createRadiusPrimitives(enabledPrimitives.map((p: any) => ({
                    name: p.name,
                    value: p.value
                  })));
                  results.radius.created += primResult.created;
                  results.radius.updated += primResult.updated;
                }
              }
              
              // Export semantic tokens
              if (radiusState.semanticTokens && radiusState.semanticTokens.length > 0) {
                const semResult = await createRadiusSemanticCollection({
                  tokens: radiusState.semanticTokens.map((t: any) => ({
                    id: t.id,
                    path: t.path,
                    primitiveRef: t.primitiveRef,
                  }))
                });
                results.radius.created += semResult.created;
              }
            } catch (e) {
              results.errors.push(`Radius: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
          
          // 5. Icon Size - get from clientStorage
          const iconSizeData = await figma.clientStorage.getAsync('icon-size-state');
          if (iconSizeData) {
            try {
              const iconSizeState = iconSizeData;
              
              // Export primitives
              if (iconSizeState.primitives && iconSizeState.primitives.length > 0) {
                const selectedPrimitives = iconSizeState.primitives.filter((p: any) => p.selected);
                if (selectedPrimitives.length > 0) {
                  const primResult = await createIconSizePrimitives(selectedPrimitives.map((p: any) => ({
                    name: p.name,
                    value: p.value
                  })));
                  results.iconSize.created += primResult.created;
                  results.iconSize.updated += primResult.updated;
                }
              }
              
              // Export semantic tokens
              if (iconSizeState.semanticTokens && iconSizeState.semanticTokens.length > 0) {
                const semResult = await createIconSizeSemanticCollection({
                  tokens: iconSizeState.semanticTokens.map((t: any) => ({
                    id: t.id,
                    path: t.path,
                    category: t.category,
                    name: t.name,
                    description: t.description,
                    desktop: t.desktop,
                    tablet: t.tablet,
                    mobile: t.mobile,
                  }))
                });
                results.iconSize.created += semResult.created;
              }
            } catch (e) {
              results.errors.push(`Icon Size: ${e instanceof Error ? e.message : String(e)}`);
            }
          }
          
          // Build summary message
          const parts: string[] = [];
          if (results.typography.created > 0 || results.typography.updated > 0) {
            parts.push(`Typography: ${results.typography.created}+${results.typography.updated}`);
          }
          if (results.spacing.created > 0 || results.spacing.updated > 0) {
            parts.push(`Spacing: ${results.spacing.created}+${results.spacing.updated}`);
          }
          if (results.gap.created > 0 || results.gap.updated > 0) {
            parts.push(`Gap: ${results.gap.created}+${results.gap.updated}`);
          }
          if (results.radius.created > 0 || results.radius.updated > 0) {
            parts.push(`Radius: ${results.radius.created}+${results.radius.updated}`);
          }
          if (results.iconSize.created > 0 || results.iconSize.updated > 0) {
            parts.push(`IconSize: ${results.iconSize.created}+${results.iconSize.updated}`);
          }
          
          if (parts.length > 0) {
            figma.notify(`✅ Экспорт завершён: ${parts.join(', ')}`);
          } else {
            figma.notify('ℹ️ Нет данных для экспорта. Создайте токены в соответствующих секциях.');
          }
          
          if (results.errors.length > 0) {
            console.error('Export errors:', results.errors);
          }
          
          figma.ui.postMessage({
            type: 'export-all-complete',
            payload: results
          });
        } catch (error) {
          figma.notify(`❌ Ошибка экспорта: ${error instanceof Error ? error.message : 'Unknown error'}`);
          figma.ui.postMessage({
            type: 'export-all-error',
            payload: { error: error instanceof Error ? error.message : 'Unknown error' }
          });
        }
        break;
      }

      case 'storage-delete': {
        const { key, requestId } = msg.payload as { key: string; requestId: string };
        try {
          await figma.clientStorage.deleteAsync(key);
          figma.ui.postMessage({
            type: 'storage-delete-response',
            payload: { key, requestId, success: true }
          });
        } catch (error) {
          figma.ui.postMessage({
            type: 'storage-delete-response',
            payload: { key, requestId, success: false, error: String(error) }
          });
        }
        break;
      }

      case 'storage-get-all-keys': {
        const { requestId } = msg.payload as { requestId: string };
        try {
          const keys = await figma.clientStorage.keysAsync();
          figma.ui.postMessage({
            type: 'storage-get-all-keys-response',
            payload: { keys, requestId, success: true }
          });
        } catch (error) {
          figma.ui.postMessage({
            type: 'storage-get-all-keys-response',
            payload: { keys: [], requestId, success: false, error: String(error) }
          });
        }
        break;
      }
    }
  } catch (error) {
    console.error('Plugin error:', error);
    figma.notify(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    figma.ui.postMessage({
      type: 'error',
      payload: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
};

// Notify that plugin is ready
figma.ui.postMessage({ type: 'plugin-ready' });
