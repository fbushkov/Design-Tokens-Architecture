/**
 * Token Utilities
 * Helper functions for token transformations
 */

import { 
  DesignTokens, 
  ColorValue, 
  DimensionValue,
  ShadowValue,
  TypographyValue 
} from '../types';

/**
 * Convert HEX color to RGBA
 */
export function hexToRgba(hex: string): ColorValue['rgba'] {
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

/**
 * Convert RGBA to HEX
 */
export function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${a < 1 ? toHex(a) : ''}`;
}

/**
 * Create a ColorValue from HEX
 */
export function createColorValue(hex: string): ColorValue {
  return {
    hex,
    rgba: hexToRgba(hex)
  };
}

/**
 * Create a DimensionValue
 */
export function createDimensionValue(
  value: number, 
  unit: DimensionValue['unit'] = 'px'
): DimensionValue {
  return { value, unit };
}

/**
 * Convert dimension to CSS string
 */
export function dimensionToCSS(dimension: DimensionValue): string {
  return `${dimension.value}${dimension.unit}`;
}

/**
 * Convert shadow to CSS string
 */
export function shadowToCSS(shadow: ShadowValue): string {
  const inset = shadow.type === 'innerShadow' ? 'inset ' : '';
  return `${inset}${dimensionToCSS(shadow.offsetX)} ${dimensionToCSS(shadow.offsetY)} ${dimensionToCSS(shadow.blur)} ${dimensionToCSS(shadow.spread)} ${shadow.color.hex}`;
}

/**
 * Convert typography to CSS object
 */
export function typographyToCSS(typography: TypographyValue): Record<string, string> {
  return {
    'font-family': typography.fontFamily,
    'font-weight': typography.fontWeight.toString(),
    'font-size': typeof typography.fontSize === 'object' 
      ? dimensionToCSS(typography.fontSize) 
      : `${typography.fontSize}px`,
    'line-height': typeof typography.lineHeight === 'object' 
      ? dimensionToCSS(typography.lineHeight) 
      : typography.lineHeight.toString(),
    'letter-spacing': typeof typography.letterSpacing === 'object'
      ? dimensionToCSS(typography.letterSpacing)
      : `${typography.letterSpacing}px`,
    ...(typography.textDecoration && { 'text-decoration': typography.textDecoration }),
    ...(typography.textTransform && { 'text-transform': typography.textTransform })
  };
}

/**
 * Generate CSS custom properties from tokens
 */
export function tokensToCSSVariables(tokens: DesignTokens): string {
  const lines: string[] = [':root {'];

  // Primitive colors
  if (tokens.primitives.colors) {
    lines.push('  /* Primitive Colors */');
    for (const [group, colors] of Object.entries(tokens.primitives.colors)) {
      for (const [name, token] of Object.entries(colors)) {
        lines.push(`  --color-${group}-${name}: ${token.$value.hex};`);
      }
    }
    lines.push('');
  }

  // Primitive dimensions
  if (tokens.primitives.dimensions) {
    lines.push('  /* Primitive Dimensions */');
    for (const [name, token] of Object.entries(tokens.primitives.dimensions)) {
      lines.push(`  --dimension-${name}: ${dimensionToCSS(token.$value)};`);
    }
    lines.push('');
  }

  // Primitive shadows
  if (tokens.primitives.shadows) {
    lines.push('  /* Primitive Shadows */');
    for (const [name, token] of Object.entries(tokens.primitives.shadows)) {
      const shadows = Array.isArray(token.$value) ? token.$value : [token.$value];
      const cssValue = shadows.map(shadowToCSS).join(', ');
      lines.push(`  --shadow-${name}: ${cssValue};`);
    }
    lines.push('');
  }

  // Fonts
  if (tokens.primitives.fonts) {
    lines.push('  /* Primitive Fonts */');
    for (const [name, token] of Object.entries(tokens.primitives.fonts)) {
      lines.push(`  --font-${name}: ${token.$value};`);
    }
    lines.push('');
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generate SCSS variables from tokens
 */
export function tokensToSCSSVariables(tokens: DesignTokens): string {
  const lines: string[] = [];

  // Primitive colors
  if (tokens.primitives.colors) {
    lines.push('// Primitive Colors');
    for (const [group, colors] of Object.entries(tokens.primitives.colors)) {
      for (const [name, token] of Object.entries(colors)) {
        lines.push(`$color-${group}-${name}: ${token.$value.hex};`);
      }
    }
    lines.push('');
  }

  // Primitive dimensions
  if (tokens.primitives.dimensions) {
    lines.push('// Primitive Dimensions');
    for (const [name, token] of Object.entries(tokens.primitives.dimensions)) {
      lines.push(`$dimension-${name}: ${dimensionToCSS(token.$value)};`);
    }
    lines.push('');
  }

  // Maps for easy access
  lines.push('// Token Maps');
  
  if (tokens.primitives.colors) {
    lines.push('$colors: (');
    for (const [group, colors] of Object.entries(tokens.primitives.colors)) {
      lines.push(`  '${group}': (`);
      for (const [name, token] of Object.entries(colors)) {
        lines.push(`    '${name}': ${token.$value.hex},`);
      }
      lines.push('  ),');
    }
    lines.push(');');
  }

  return lines.join('\n');
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];
    
    if (
      sourceValue && 
      typeof sourceValue === 'object' && 
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>, 
        sourceValue as Record<string, unknown>
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }
  
  return result;
}

/**
 * Flatten nested token structure to dot notation
 */
export function flattenTokens(
  obj: Record<string, unknown>, 
  prefix: string = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (
      value && 
      typeof value === 'object' && 
      !Array.isArray(value) &&
      !('$type' in value)
    ) {
      Object.assign(result, flattenTokens(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Resolve token references
 */
export function resolveReference(
  reference: string, 
  tokens: DesignTokens
): unknown {
  const parts = reference.replace(/^\{|\}$/g, '').split('.');
  let current: unknown = tokens;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}
