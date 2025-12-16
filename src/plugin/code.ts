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

async function createVariable(
  name: string, 
  collection: VariableCollection, 
  type: VariableResolvedDataType
): Promise<Variable> {
  return figma.variables.createVariable(name, collection, type);
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
}

// ============================================
// SEMANTIC TOKEN STRUCTURE (LIGHT THEME)
// Comprehensive SaaS/CRM categories
// ============================================
const SEMANTIC_COLOR_MAPPINGS: SemanticColorMapping[] = [
  // ============================================
  // BG (BACKGROUND) - All background colors
  // ============================================
  // Page backgrounds
  { category: 'bg', subcategory: 'page', variant: 'primary', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'bg', subcategory: 'page', variant: 'secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'bg', subcategory: 'page', variant: 'tertiary', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  // Container/Card backgrounds
  { category: 'bg', subcategory: 'card', variant: 'primary', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'bg', subcategory: 'card', variant: 'secondary', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'bg', subcategory: 'card', variant: 'elevated', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  // Interactive backgrounds
  { category: 'bg', subcategory: 'interactive', variant: 'primary', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'bg', subcategory: 'interactive', variant: 'secondary', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 100 },
  // Overlay/Modal backgrounds
  { category: 'bg', subcategory: 'overlay', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'overlay', variant: 'light', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'bg', subcategory: 'modal', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'bg', subcategory: 'drawer', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'bg', subcategory: 'popover', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
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
  // Primary text hierarchy
  { category: 'text', subcategory: 'primary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 900 },
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
  // Inverse text
  { category: 'text', subcategory: 'inverse', variant: 'primary', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'text', subcategory: 'inverse', variant: 'secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 200 },
  // On-color text (for colored backgrounds)
  { category: 'text', subcategory: 'on-brand', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'text', subcategory: 'on-success', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'text', subcategory: 'on-warning', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'text', subcategory: 'on-error', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'text', subcategory: 'on-info', states: ['default'], sourceColor: 'neutral', sourceStep: 25 },
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
];

// ============================================
// SEMANTIC TOKEN STRUCTURE (DARK THEME)
// Comprehensive SaaS/CRM categories
// ============================================
const SEMANTIC_COLOR_MAPPINGS_DARK: SemanticColorMapping[] = [
  // ============================================
  // BG (BACKGROUND) - All background colors (dark theme)
  // ============================================
  // Page backgrounds
  { category: 'bg', subcategory: 'page', variant: 'primary', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  { category: 'bg', subcategory: 'page', variant: 'secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'page', variant: 'tertiary', states: ['default'], sourceColor: 'neutral', sourceStep: 850 },
  // Container/Card backgrounds
  { category: 'bg', subcategory: 'card', variant: 'primary', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'card', variant: 'secondary', states: ['default', 'hover'], sourceColor: 'neutral', sourceStep: 850 },
  { category: 'bg', subcategory: 'card', variant: 'elevated', states: ['default'], sourceColor: 'neutral', sourceStep: 850 },
  // Interactive backgrounds
  { category: 'bg', subcategory: 'interactive', variant: 'primary', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 850 },
  { category: 'bg', subcategory: 'interactive', variant: 'secondary', states: ['default', 'hover', 'active', 'selected', 'disabled'], sourceColor: 'neutral', sourceStep: 800 },
  // Overlay/Modal backgrounds
  { category: 'bg', subcategory: 'overlay', variant: 'default', states: ['default'], sourceColor: 'neutral', sourceStep: 950 },
  { category: 'bg', subcategory: 'overlay', variant: 'light', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
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
  // Primary text hierarchy
  { category: 'text', subcategory: 'primary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 50 },
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
  // Inverse text
  { category: 'text', subcategory: 'inverse', variant: 'primary', states: ['default'], sourceColor: 'neutral', sourceStep: 900 },
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
];

async function createColorVariablesWithStructure(
  variables: Array<{ name: string; value: { r: number; g: number; b: number; a: number }; description: string }>
): Promise<void> {
  const collections = await getLocalVariableCollections();
  
  // Create or get Primitives collection (default mode only)
  let primitivesCollection = collections.find(c => c.name === 'Primitives');
  if (!primitivesCollection) {
    primitivesCollection = await createVariableCollection('Primitives');
  }
  
  // Create or get Tokens collection with light/dark modes
  let tokensCollection = collections.find(c => c.name === 'Tokens');
  if (!tokensCollection) {
    tokensCollection = await createVariableCollection('Tokens');
  }
  
  // Ensure Tokens collection has light and dark modes
  let lightModeId = tokensCollection.modes.find(m => m.name === 'light')?.modeId;
  let darkModeId = tokensCollection.modes.find(m => m.name === 'dark')?.modeId;
  
  // Rename default mode to 'light' if needed, add 'dark' mode
  if (!lightModeId) {
    // Rename default mode to 'light'
    tokensCollection.renameMode(tokensCollection.defaultModeId, 'light');
    lightModeId = tokensCollection.defaultModeId;
  }
  
  if (!darkModeId) {
    // Add 'dark' mode
    darkModeId = tokensCollection.addMode('dark');
  }
  
  // Create or get Components collection with light/dark modes
  let componentsCollection = collections.find(c => c.name === 'Components');
  if (!componentsCollection) {
    componentsCollection = await createVariableCollection('Components');
  }
  
  // Ensure Components collection has light and dark modes
  let compLightModeId = componentsCollection.modes.find(m => m.name === 'light')?.modeId;
  let compDarkModeId = componentsCollection.modes.find(m => m.name === 'dark')?.modeId;
  
  if (!compLightModeId) {
    componentsCollection.renameMode(componentsCollection.defaultModeId, 'light');
    compLightModeId = componentsCollection.defaultModeId;
  }
  
  if (!compDarkModeId) {
    compDarkModeId = componentsCollection.addMode('dark');
  }
  
  const existingVariables = await getLocalVariables();
  const createdPrimitives: Map<string, Variable> = new Map();
  
  // 1. Create Primitive Variables
  // New structure: {color}/{step} where step is 25-975 (e.g., brand/500, neutral/25)
  // Primitives only have default mode
  for (const varData of variables) {
    const variableName = varData.name;
    
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
  
  // Helper function to get primitive reference for a mapping
  // Now uses unified scale: colors/{color}/{step} (e.g., colors/brand/500, colors/neutral/25)
  const getPrimitiveForMapping = (mapping: SemanticColorMapping, state: string, isDark: boolean): Variable | undefined => {
    const mappings = isDark ? SEMANTIC_COLOR_MAPPINGS_DARK : SEMANTIC_COLOR_MAPPINGS;
    // Find mapping considering variant if present
    const actualMapping = mappings.find(m => 
      m.category === mapping.category && 
      m.subcategory === mapping.subcategory &&
      m.variant === mapping.variant
    ) || mapping;
    
    let step = actualMapping.sourceStep;
    
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
    const sourceVarName = `colors/${actualMapping.sourceColor}/${actualMapping.sourceColor}-${step}`;
    
    return createdPrimitives.get(sourceVarName);
  };
  
  // 2. Create Semantic Token Variables with light/dark modes
  // Naming with category folders: bg/page/primary, bg/card/primary-hover, text/primary, etc.
  const refreshedVariables = await getLocalVariables();
  
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
      
      // Get primitives for light and dark modes
      const lightPrimitive = getPrimitiveForMapping(mapping, state, false);
      const darkMapping = SEMANTIC_COLOR_MAPPINGS_DARK.find(m => 
        m.category === mapping.category && 
        m.subcategory === mapping.subcategory &&
        m.variant === mapping.variant
      );
      const darkPrimitive = darkMapping ? getPrimitiveForMapping(darkMapping, state, true) : lightPrimitive;
      
      if (!lightPrimitive) {
        console.log(`Light primitive not found for: ${tokenName}`);
        continue;
      }
      
      let tokenVar = refreshedVariables.find(v => 
        v.name === tokenName && 
        v.variableCollectionId === tokensCollection!.id
      );
      
      if (!tokenVar) {
        tokenVar = await createVariable(tokenName, tokensCollection, 'COLOR');
      }
      
      // Set light mode value
      const lightAlias: VariableAlias = {
        type: 'VARIABLE_ALIAS',
        id: lightPrimitive.id
      };
      tokenVar.setValueForMode(lightModeId!, lightAlias);
      
      // Set dark mode value
      if (darkPrimitive) {
        const darkAlias: VariableAlias = {
          type: 'VARIABLE_ALIAS',
          id: darkPrimitive.id
        };
        tokenVar.setValueForMode(darkModeId!, darkAlias);
      }
      
      tokenVar.description = mapping.variant 
        ? `${mapping.category} ${mapping.subcategory} ${mapping.variant} - ${state} state`
        : `${mapping.category} ${mapping.subcategory} - ${state} state`;
    }
  }
  
  // 3. Create Component Token Variables with light/dark modes
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
    { name: 'tooltip/text/text-content', source: 'content/inverse/inverse-primary' },
    
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
  ];
  
  const allVariables = await getLocalVariables();
  
  for (const comp of componentMappings) {
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
    }
    
    const aliasValue: VariableAlias = {
      type: 'VARIABLE_ALIAS',
      id: sourceToken.id
    };
    
    // Components reference tokens (which handle light/dark internally)
    compVar.setValueForMode(compLightModeId!, aliasValue);
    compVar.setValueForMode(compDarkModeId!, aliasValue);
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
  
  // ============================================
  // SPACING TOKENS (based on 4px grid)
  // ============================================
  const spacingScale: Record<string, number> = {
    '0': 0,
    '1': 4,
    '2': 8,
    '3': 12,
    '4': 16,
    '5': 20,
    '6': 24,
    '7': 28,
    '8': 32,
    '9': 36,
    '10': 40,
    '11': 44,
    '12': 48,
    '14': 56,
    '16': 64,
    '20': 80,
    '24': 96,
    '28': 112,
    '32': 128,
    '36': 144,
    '40': 160,
    '44': 176,
    '48': 192,
    '52': 208,
    '56': 224,
    '60': 240,
    '64': 256,
    '72': 288,
    '80': 320,
    '96': 384,
  };
  
  for (const [name, value] of Object.entries(spacingScale)) {
    const varName = `spacing/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `${value}px spacing`;
  }
  
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
        };
        
        await createColorVariablesWithStructure(payload.variables);
        
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

      case 'import-tokens': {
        const { tokens } = msg.payload as { tokens: DesignTokens };
        await importTokensToFigma(tokens);
        figma.ui.postMessage({
          type: 'tokens-imported',
          payload: { success: true }
        });
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

      case 'notify': {
        const { message } = msg.payload as { message: string };
        figma.notify(message);
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
