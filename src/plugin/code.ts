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

// Show the plugin UI
figma.showUI(__html__, { 
  width: 480, 
  height: 640,
  themeColors: true 
});

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
  states: string[];
  sourceColor: string;
  sourceStep: number; // 25-975, где 500 = base
}

// Define semantic token structure for LIGHT theme
// Light theme: use lighter shades (low numbers) for backgrounds, darker (high numbers) for text
const SEMANTIC_COLOR_MAPPINGS: SemanticColorMapping[] = [
  // Background - lighter shades for light theme
  { category: 'bg', subcategory: 'primary', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'bg', subcategory: 'secondary', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'bg', subcategory: 'tertiary', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'bg', subcategory: 'inverse', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'bg', subcategory: 'brand', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'bg', subcategory: 'accent', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'accent', sourceStep: 500 },
  { category: 'bg', subcategory: 'success', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'success', sourceStep: 100 },
  { category: 'bg', subcategory: 'warning', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'warning', sourceStep: 100 },
  { category: 'bg', subcategory: 'error', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'error', sourceStep: 100 },
  
  // Text - darker shades for light theme
  { category: 'text', subcategory: 'primary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'text', subcategory: 'secondary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'text', subcategory: 'tertiary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'text', subcategory: 'inverse', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'text', subcategory: 'brand', states: ['default', 'hover', 'disabled'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'text', subcategory: 'accent', states: ['default', 'hover', 'disabled'], sourceColor: 'accent', sourceStep: 500 },
  { category: 'text', subcategory: 'success', states: ['default', 'hover', 'disabled'], sourceColor: 'success', sourceStep: 600 },
  { category: 'text', subcategory: 'warning', states: ['default', 'hover', 'disabled'], sourceColor: 'warning', sourceStep: 600 },
  { category: 'text', subcategory: 'error', states: ['default', 'hover', 'disabled'], sourceColor: 'error', sourceStep: 600 },
  { category: 'text', subcategory: 'link', states: ['default', 'hover', 'visited', 'disabled'], sourceColor: 'brand', sourceStep: 500 },
  
  // Border
  { category: 'border', subcategory: 'primary', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'neutral', sourceStep: 300 },
  { category: 'border', subcategory: 'secondary', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'border', subcategory: 'brand', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'border', subcategory: 'accent', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'accent', sourceStep: 500 },
  { category: 'border', subcategory: 'success', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'success', sourceStep: 500 },
  { category: 'border', subcategory: 'warning', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'border', subcategory: 'error', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'error', sourceStep: 500 },
  
  // Divider
  { category: 'divider', subcategory: 'primary', states: ['default'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'divider', subcategory: 'secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'divider', subcategory: 'bold', states: ['default'], sourceColor: 'neutral', sourceStep: 400 },
  
  // Action (buttons, interactive elements)
  { category: 'action', subcategory: 'primary', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'action', subcategory: 'secondary', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'action', subcategory: 'tertiary', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'action', subcategory: 'destructive', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'error', sourceStep: 500 },
  { category: 'action', subcategory: 'success', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'success', sourceStep: 500 },
  
  // Icon
  { category: 'icon', subcategory: 'primary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'icon', subcategory: 'secondary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 500 },
  { category: 'icon', subcategory: 'inverse', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'icon', subcategory: 'brand', states: ['default', 'hover', 'disabled'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'icon', subcategory: 'accent', states: ['default', 'hover', 'disabled'], sourceColor: 'accent', sourceStep: 500 },
  { category: 'icon', subcategory: 'success', states: ['default', 'hover', 'disabled'], sourceColor: 'success', sourceStep: 500 },
  { category: 'icon', subcategory: 'warning', states: ['default', 'hover', 'disabled'], sourceColor: 'warning', sourceStep: 500 },
  { category: 'icon', subcategory: 'error', states: ['default', 'hover', 'disabled'], sourceColor: 'error', sourceStep: 500 },
  
  // Surface (cards, modals, etc.)
  { category: 'surface', subcategory: 'default', states: ['default', 'hover', 'active'], sourceColor: 'neutral', sourceStep: 25 },
  { category: 'surface', subcategory: 'raised', states: ['default', 'hover', 'active'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'surface', subcategory: 'overlay', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  
  // Focus
  { category: 'focus', subcategory: 'ring', states: ['default'], sourceColor: 'brand', sourceStep: 500 },
];

// Semantic mappings for DARK theme (inverted logic)
// Dark theme: use darker shades (high numbers) for backgrounds, lighter (low numbers) for text
const SEMANTIC_COLOR_MAPPINGS_DARK: SemanticColorMapping[] = [
  // Background - darker shades for dark theme
  { category: 'bg', subcategory: 'primary', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'neutral', sourceStep: 925 },
  { category: 'bg', subcategory: 'secondary', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'neutral', sourceStep: 875 },
  { category: 'bg', subcategory: 'tertiary', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'bg', subcategory: 'inverse', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'bg', subcategory: 'brand', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'bg', subcategory: 'accent', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'accent', sourceStep: 500 },
  { category: 'bg', subcategory: 'success', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'success', sourceStep: 800 },
  { category: 'bg', subcategory: 'warning', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'warning', sourceStep: 800 },
  { category: 'bg', subcategory: 'error', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'error', sourceStep: 800 },
  
  // Text - lighter shades for dark theme
  { category: 'text', subcategory: 'primary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 50 },
  { category: 'text', subcategory: 'secondary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 200 },
  { category: 'text', subcategory: 'tertiary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'text', subcategory: 'inverse', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 925 },
  { category: 'text', subcategory: 'brand', states: ['default', 'hover', 'disabled'], sourceColor: 'brand', sourceStep: 300 },
  { category: 'text', subcategory: 'accent', states: ['default', 'hover', 'disabled'], sourceColor: 'accent', sourceStep: 300 },
  { category: 'text', subcategory: 'success', states: ['default', 'hover', 'disabled'], sourceColor: 'success', sourceStep: 300 },
  { category: 'text', subcategory: 'warning', states: ['default', 'hover', 'disabled'], sourceColor: 'warning', sourceStep: 300 },
  { category: 'text', subcategory: 'error', states: ['default', 'hover', 'disabled'], sourceColor: 'error', sourceStep: 300 },
  { category: 'text', subcategory: 'link', states: ['default', 'hover', 'visited', 'disabled'], sourceColor: 'brand', sourceStep: 300 },
  
  // Border - adjusted for dark theme
  { category: 'border', subcategory: 'primary', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'neutral', sourceStep: 600 },
  { category: 'border', subcategory: 'secondary', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'border', subcategory: 'brand', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'border', subcategory: 'accent', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'accent', sourceStep: 400 },
  { category: 'border', subcategory: 'success', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'success', sourceStep: 400 },
  { category: 'border', subcategory: 'warning', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'warning', sourceStep: 400 },
  { category: 'border', subcategory: 'error', states: ['default', 'hover', 'focus', 'disabled'], sourceColor: 'error', sourceStep: 400 },
  
  // Divider - adjusted for dark theme
  { category: 'divider', subcategory: 'primary', states: ['default'], sourceColor: 'neutral', sourceStep: 700 },
  { category: 'divider', subcategory: 'secondary', states: ['default'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'divider', subcategory: 'bold', states: ['default'], sourceColor: 'neutral', sourceStep: 500 },
  
  // Action - similar for dark theme
  { category: 'action', subcategory: 'primary', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'brand', sourceStep: 500 },
  { category: 'action', subcategory: 'secondary', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'neutral', sourceStep: 800 },
  { category: 'action', subcategory: 'tertiary', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'neutral', sourceStep: 850 },
  { category: 'action', subcategory: 'destructive', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'error', sourceStep: 500 },
  { category: 'action', subcategory: 'success', states: ['default', 'hover', 'active', 'disabled'], sourceColor: 'success', sourceStep: 500 },
  
  // Icon - inverted for dark theme
  { category: 'icon', subcategory: 'primary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 100 },
  { category: 'icon', subcategory: 'secondary', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 400 },
  { category: 'icon', subcategory: 'inverse', states: ['default', 'hover', 'disabled'], sourceColor: 'neutral', sourceStep: 925 },
  { category: 'icon', subcategory: 'brand', states: ['default', 'hover', 'disabled'], sourceColor: 'brand', sourceStep: 400 },
  { category: 'icon', subcategory: 'accent', states: ['default', 'hover', 'disabled'], sourceColor: 'accent', sourceStep: 400 },
  { category: 'icon', subcategory: 'success', states: ['default', 'hover', 'disabled'], sourceColor: 'success', sourceStep: 400 },
  { category: 'icon', subcategory: 'warning', states: ['default', 'hover', 'disabled'], sourceColor: 'warning', sourceStep: 400 },
  { category: 'icon', subcategory: 'error', states: ['default', 'hover', 'disabled'], sourceColor: 'error', sourceStep: 400 },
  
  // Surface - inverted for dark theme
  { category: 'surface', subcategory: 'default', states: ['default', 'hover', 'active'], sourceColor: 'neutral', sourceStep: 900 },
  { category: 'surface', subcategory: 'raised', states: ['default', 'hover', 'active'], sourceColor: 'neutral', sourceStep: 850 },
  { category: 'surface', subcategory: 'overlay', states: ['default'], sourceColor: 'neutral', sourceStep: 600 },
  
  // Focus
  { category: 'focus', subcategory: 'ring', states: ['default'], sourceColor: 'brand', sourceStep: 400 },
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
    const actualMapping = mappings.find(m => 
      m.category === mapping.category && 
      m.subcategory === mapping.subcategory
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
    
    // Path: colors/{color}/{step}
    const sourceVarName = `colors/${actualMapping.sourceColor}/${step}`;
    
    return createdPrimitives.get(sourceVarName);
  };
  
  // 2. Create Semantic Token Variables with light/dark modes
  // Naming with category folders: bg/primary, bg/primary-hover, text/primary, etc.
  const refreshedVariables = await getLocalVariables();
  
  for (const mapping of SEMANTIC_COLOR_MAPPINGS) {
    for (const state of mapping.states) {
      // Token name with category folder: category/subcategory-state (e.g., bg/primary-hover)
      // For default state, just category/subcategory (e.g., bg/primary)
      const tokenName = state === 'default' 
        ? `${mapping.category}/${mapping.subcategory}`
        : `${mapping.category}/${mapping.subcategory}-${state}`;
      
      // Get primitives for light and dark modes
      const lightPrimitive = getPrimitiveForMapping(mapping, state, false);
      const darkMapping = SEMANTIC_COLOR_MAPPINGS_DARK.find(m => 
        m.category === mapping.category && m.subcategory === mapping.subcategory
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
      
      tokenVar.description = `${mapping.category} ${mapping.subcategory} - ${state} state`;
    }
  }
  
  // 3. Create Component Token Variables with light/dark modes
  // Updated to use category folders: button/primary-bg, input/border, etc.
  const componentMappings = [
    { name: 'button/primary-bg', source: 'action/primary' },
    { name: 'button/primary-bg-hover', source: 'action/primary-hover' },
    { name: 'button/primary-bg-active', source: 'action/primary-active' },
    { name: 'button/primary-bg-disabled', source: 'action/primary-disabled' },
    { name: 'button/primary-text', source: 'text/inverse' },
    { name: 'button/primary-text-disabled', source: 'text/tertiary-disabled' },
    
    { name: 'button/secondary-bg', source: 'action/secondary' },
    { name: 'button/secondary-bg-hover', source: 'action/secondary-hover' },
    { name: 'button/secondary-text', source: 'text/primary' },
    
    { name: 'button/destructive-bg', source: 'action/destructive' },
    { name: 'button/destructive-bg-hover', source: 'action/destructive-hover' },
    { name: 'button/destructive-text', source: 'text/inverse' },
    
    { name: 'input/bg', source: 'bg/primary' },
    { name: 'input/border', source: 'border/primary' },
    { name: 'input/border-hover', source: 'border/primary-hover' },
    { name: 'input/border-focus', source: 'border/brand-focus' },
    { name: 'input/border-error', source: 'border/error' },
    { name: 'input/text', source: 'text/primary' },
    { name: 'input/placeholder', source: 'text/tertiary' },
    
    { name: 'card/bg', source: 'surface/default' },
    { name: 'card/border', source: 'border/secondary' },
    
    { name: 'badge/success-bg', source: 'bg/success' },
    { name: 'badge/success-text', source: 'text/success' },
    { name: 'badge/warning-bg', source: 'bg/warning' },
    { name: 'badge/warning-text', source: 'text/warning' },
    { name: 'badge/error-bg', source: 'bg/error' },
    { name: 'badge/error-text', source: 'text/error' },
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
  // FONT SIZE TOKENS
  // ============================================
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
    const varName = `font-size/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `${value}px font size`;
  }
  
  // ============================================
  // FONT WEIGHT TOKENS
  // ============================================
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
    const varName = `font-weight/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `Font weight ${value}`;
  }
  
  // ============================================
  // LINE HEIGHT TOKENS
  // ============================================
  const lineHeightScale: Record<string, number> = {
    'none': 1,
    'tight': 1.25,
    'snug': 1.375,
    'normal': 1.5,
    'relaxed': 1.625,
    'loose': 2,
  };
  
  for (const [name, value] of Object.entries(lineHeightScale)) {
    const varName = `line-height/${name}`;
    let variable = existingVariables.find(v => 
      v.name === varName && v.variableCollectionId === primitivesCollection!.id
    );
    
    if (!variable) {
      variable = await createVariable(varName, primitivesCollection, 'FLOAT');
    }
    
    variable.setValueForMode(primitivesCollection.defaultModeId, value);
    variable.description = `Line height ${value}`;
  }
  
  // ============================================
  // LETTER SPACING TOKENS
  // ============================================
  const letterSpacingScale: Record<string, number> = {
    'tighter': -0.05,
    'tight': -0.025,
    'normal': 0,
    'wide': 0.025,
    'wider': 0.05,
    'widest': 0.1,
  };
  
  for (const [name, value] of Object.entries(letterSpacingScale)) {
    const varName = `letter-spacing/${name}`;
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
  // DURATION TOKENS (for animations)
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
    const varName = `duration/${name}`;
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
}

// ============================================
// MESSAGE HANDLING
// ============================================

figma.ui.onmessage = async (msg: PluginMessage) => {
  try {
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
