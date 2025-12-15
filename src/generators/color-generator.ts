/**
 * Color Generator
 * Generates color palettes with transparent-light and transparent-dark overlays
 * 
 * Logic:
 * 1. Take base HEX color
 * 2. Generate transparent-light variants (white overlay with opacity)
 * 3. Generate transparent-dark variants (black overlay with opacity)
 * 4. Create full primitive → semantic → composite structure
 */

// ============================================
// TYPES
// ============================================

export interface RGBA {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
  a: number; // 0-1
}

export interface ColorValue {
  hex: string;
  rgba: RGBA;
}

export interface GeneratedColorToken {
  $type: 'color';
  $value: ColorValue;
  $description?: string;
}

// Opacity scale: from 25 to 975, step 25
export const OPACITY_SCALE = [25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500, 525, 550, 575, 600, 625, 650, 675, 700, 725, 750, 775, 800, 825, 850, 875, 900, 925, 950, 975] as const;
export type OpacityStep = typeof OPACITY_SCALE[number];

// Semantic contexts for colors
export type ColorContext = 
  | 'brand'
  | 'accent'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

// Interaction states
export type ColorState = 
  | 'default'
  | 'hover'
  | 'active'
  | 'focus'
  | 'disabled'
  | 'selected';

// Semantic color roles
export type ColorRole =
  | 'background'
  | 'surface'
  | 'text'
  | 'textSecondary'
  | 'textTertiary'
  | 'border'
  | 'borderStrong'
  | 'icon'
  | 'iconSecondary';

// ============================================
// COLOR CONVERSION UTILITIES
// ============================================

/**
 * Convert HEX to RGBA (0-1 range)
 */
export function hexToRgba(hex: string): RGBA {
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

/**
 * Convert RGBA (0-1 range) to HEX
 */
export function rgbaToHex(rgba: RGBA): string {
  const toHex = (n: number): string => {
    const hex = Math.round(Math.min(1, Math.max(0, n)) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  const hex = `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
  return rgba.a < 1 ? hex + toHex(rgba.a) : hex;
}

/**
 * Create ColorValue from HEX
 */
export function createColorValue(hex: string): ColorValue {
  return {
    hex: hex.toUpperCase(),
    rgba: hexToRgba(hex)
  };
}

/**
 * Create ColorValue from RGBA
 */
export function createColorValueFromRgba(rgba: RGBA): ColorValue {
  return {
    hex: rgbaToHex(rgba).toUpperCase(),
    rgba
  };
}

// ============================================
// COLOR BLENDING
// ============================================

/**
 * Blend two colors with alpha compositing
 * Formula: result = foreground * alpha + background * (1 - alpha)
 */
export function blendColors(background: RGBA, foreground: RGBA, opacity: number): RGBA {
  const alpha = opacity / 1000; // Convert 25-950 scale to 0.025-0.95
  
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1
  };
}

/**
 * Apply white overlay (transparent-light)
 * Makes color lighter by blending with white
 */
export function applyLightOverlay(baseColor: RGBA, opacity: OpacityStep): RGBA {
  const white: RGBA = { r: 1, g: 1, b: 1, a: 1 };
  return blendColors(baseColor, white, opacity);
}

/**
 * Apply black overlay (transparent-dark)
 * Makes color darker by blending with black
 */
export function applyDarkOverlay(baseColor: RGBA, opacity: OpacityStep): RGBA {
  const black: RGBA = { r: 0, g: 0, b: 0, a: 1 };
  return blendColors(baseColor, black, opacity);
}

/**
 * Create color with alpha transparency (for actual transparent colors)
 */
export function applyAlpha(baseColor: RGBA, opacity: OpacityStep): RGBA {
  return {
    ...baseColor,
    a: opacity / 1000
  };
}

// ============================================
// PALETTE GENERATION
// ============================================

export interface ColorPalette {
  base: GeneratedColorToken;
  light: Record<OpacityStep, GeneratedColorToken>;
  dark: Record<OpacityStep, GeneratedColorToken>;
  alpha: Record<OpacityStep, GeneratedColorToken>;
}

/**
 * Generate full color palette from base HEX
 */
export function generateColorPalette(
  baseHex: string, 
  name: string,
  description?: string
): ColorPalette {
  const baseRgba = hexToRgba(baseHex);
  
  const palette: ColorPalette = {
    base: {
      $type: 'color',
      $value: createColorValue(baseHex),
      $description: description || `Base ${name} color`
    },
    light: {} as Record<OpacityStep, GeneratedColorToken>,
    dark: {} as Record<OpacityStep, GeneratedColorToken>,
    alpha: {} as Record<OpacityStep, GeneratedColorToken>
  };

  // Generate light variants (white overlay)
  for (const step of OPACITY_SCALE) {
    const blended = applyLightOverlay(baseRgba, step);
    palette.light[step] = {
      $type: 'color',
      $value: createColorValueFromRgba(blended),
      $description: `${name} with ${step / 10}% white overlay`
    };
  }

  // Generate dark variants (black overlay)
  for (const step of OPACITY_SCALE) {
    const blended = applyDarkOverlay(baseRgba, step);
    palette.dark[step] = {
      $type: 'color',
      $value: createColorValueFromRgba(blended),
      $description: `${name} with ${step / 10}% black overlay`
    };
  }

  // Generate alpha variants (transparency)
  for (const step of OPACITY_SCALE) {
    const withAlpha = applyAlpha(baseRgba, step);
    palette.alpha[step] = {
      $type: 'color',
      $value: createColorValueFromRgba(withAlpha),
      $description: `${name} with ${step / 10}% opacity`
    };
  }

  return palette;
}

// ============================================
// PRIMITIVE TOKENS GENERATION
// ============================================

export interface PrimitiveColorTokens {
  [colorName: string]: {
    base: GeneratedColorToken;
    light: Record<string, GeneratedColorToken>;
    dark: Record<string, GeneratedColorToken>;
    alpha: Record<string, GeneratedColorToken>;
  };
}

export interface BaseColorInput {
  name: string;
  hex: string;
  description?: string;
}

/**
 * Generate primitive color tokens from base colors
 */
export function generatePrimitiveColors(
  baseColors: BaseColorInput[]
): PrimitiveColorTokens {
  const primitives: PrimitiveColorTokens = {};

  for (const color of baseColors) {
    const palette = generateColorPalette(color.hex, color.name, color.description);
    
    primitives[color.name] = {
      base: palette.base,
      light: {},
      dark: {},
      alpha: {}
    };

    // Convert numeric keys to string keys for JSON compatibility
    for (const step of OPACITY_SCALE) {
      primitives[color.name].light[step.toString()] = palette.light[step];
      primitives[color.name].dark[step.toString()] = palette.dark[step];
      primitives[color.name].alpha[step.toString()] = palette.alpha[step];
    }
  }

  return primitives;
}

// ============================================
// SEMANTIC TOKENS GENERATION
// ============================================

export interface SemanticColorMapping {
  context: ColorContext;
  role: ColorRole;
  state: ColorState;
  reference: string; // Path to primitive token
}

export interface SemanticColorToken extends GeneratedColorToken {
  $context: ColorContext;
  $role: ColorRole;
  $state: ColorState;
  $reference: string;
}

export interface SemanticColorConfig {
  context: ColorContext;
  baseColorName: string; // Reference to primitive color name
  mappings: {
    role: ColorRole;
    states: {
      state: ColorState;
      variant: 'base' | 'light' | 'dark' | 'alpha';
      step?: OpacityStep;
    }[];
  }[];
}

/**
 * Generate semantic color tokens based on config
 */
export function generateSemanticColors(
  primitives: PrimitiveColorTokens,
  configs: SemanticColorConfig[]
): Record<ColorContext, Record<ColorRole, Record<ColorState, SemanticColorToken>>> {
  const semantic: Record<string, Record<string, Record<string, SemanticColorToken>>> = {};

  for (const config of configs) {
    const baseColor = primitives[config.baseColorName];
    if (!baseColor) continue;

    if (!semantic[config.context]) {
      semantic[config.context] = {};
    }

    for (const mapping of config.mappings) {
      if (!semantic[config.context][mapping.role]) {
        semantic[config.context][mapping.role] = {};
      }

      for (const stateConfig of mapping.states) {
        let colorValue: ColorValue;
        let reference: string;

        if (stateConfig.variant === 'base') {
          colorValue = baseColor.base.$value;
          reference = `{primitives.colors.${config.baseColorName}.base}`;
        } else if (stateConfig.step) {
          const stepKey = stateConfig.step.toString();
          colorValue = baseColor[stateConfig.variant][stepKey].$value;
          reference = `{primitives.colors.${config.baseColorName}.${stateConfig.variant}.${stepKey}}`;
        } else {
          continue;
        }

        semantic[config.context][mapping.role][stateConfig.state] = {
          $type: 'color',
          $value: colorValue,
          $context: config.context,
          $role: mapping.role,
          $state: stateConfig.state,
          $reference: reference,
          $description: `${config.context} ${mapping.role} - ${stateConfig.state}`
        };
      }
    }
  }

  return semantic as Record<ColorContext, Record<ColorRole, Record<ColorState, SemanticColorToken>>>;
}

// ============================================
// COMPOSITE (COMPONENT) TOKENS GENERATION
// ============================================

export interface ComponentColorTokens {
  background: string;
  text: string;
  border?: string;
  icon?: string;
}

export interface ComponentColorStates {
  default: ComponentColorTokens;
  hover?: ComponentColorTokens;
  active?: ComponentColorTokens;
  focus?: ComponentColorTokens;
  disabled?: ComponentColorTokens;
}

export interface CompositeColorTokens {
  button: {
    primary: ComponentColorStates;
    secondary: ComponentColorStates;
    ghost: ComponentColorStates;
    danger: ComponentColorStates;
  };
  input: {
    default: ComponentColorStates;
    error: ComponentColorStates;
  };
  card: ComponentColorStates;
  badge: {
    neutral: ComponentColorStates;
    success: ComponentColorStates;
    warning: ComponentColorStates;
    error: ComponentColorStates;
  };
}

/**
 * Generate default composite tokens mapping
 */
export function generateDefaultCompositeColors(): CompositeColorTokens {
  return {
    button: {
      primary: {
        default: {
          background: '{semantic.brand.background.default}',
          text: '{semantic.neutral.text.default}',
          border: 'transparent'
        },
        hover: {
          background: '{semantic.brand.background.hover}',
          text: '{semantic.neutral.text.default}',
          border: 'transparent'
        },
        active: {
          background: '{semantic.brand.background.active}',
          text: '{semantic.neutral.text.default}',
          border: 'transparent'
        },
        disabled: {
          background: '{semantic.brand.background.disabled}',
          text: '{semantic.neutral.text.disabled}',
          border: 'transparent'
        }
      },
      secondary: {
        default: {
          background: '{semantic.neutral.surface.default}',
          text: '{semantic.neutral.text.default}',
          border: '{semantic.neutral.border.default}'
        },
        hover: {
          background: '{semantic.neutral.surface.hover}',
          text: '{semantic.neutral.text.default}',
          border: '{semantic.neutral.border.default}'
        }
      },
      ghost: {
        default: {
          background: 'transparent',
          text: '{semantic.brand.text.default}',
          border: 'transparent'
        },
        hover: {
          background: '{semantic.brand.background.hover}',
          text: '{semantic.brand.text.hover}'
        }
      },
      danger: {
        default: {
          background: '{semantic.error.background.default}',
          text: '{semantic.neutral.text.default}',
          border: 'transparent'
        },
        hover: {
          background: '{semantic.error.background.hover}',
          text: '{semantic.neutral.text.default}'
        }
      }
    },
    input: {
      default: {
        default: {
          background: '{semantic.neutral.surface.default}',
          text: '{semantic.neutral.text.default}',
          border: '{semantic.neutral.border.default}'
        },
        focus: {
          background: '{semantic.neutral.surface.default}',
          text: '{semantic.neutral.text.default}',
          border: '{semantic.brand.border.focus}'
        },
        disabled: {
          background: '{semantic.neutral.surface.disabled}',
          text: '{semantic.neutral.text.disabled}',
          border: '{semantic.neutral.border.disabled}'
        }
      },
      error: {
        default: {
          background: '{semantic.neutral.surface.default}',
          text: '{semantic.neutral.text.default}',
          border: '{semantic.error.border.default}'
        }
      }
    },
    card: {
      default: {
        background: '{semantic.neutral.surface.default}',
        text: '{semantic.neutral.text.default}',
        border: '{semantic.neutral.border.default}'
      },
      hover: {
        background: '{semantic.neutral.surface.hover}',
        text: '{semantic.neutral.text.default}',
        border: '{semantic.neutral.border.default}'
      }
    },
    badge: {
      neutral: {
        default: {
          background: '{semantic.neutral.background.default}',
          text: '{semantic.neutral.text.default}'
        }
      },
      success: {
        default: {
          background: '{semantic.success.background.default}',
          text: '{semantic.success.text.default}'
        }
      },
      warning: {
        default: {
          background: '{semantic.warning.background.default}',
          text: '{semantic.warning.text.default}'
        }
      },
      error: {
        default: {
          background: '{semantic.error.background.default}',
          text: '{semantic.error.text.default}'
        }
      }
    }
  };
}

// ============================================
// FULL COLOR SYSTEM GENERATION
// ============================================

export interface ColorSystemInput {
  brand: string;      // Main brand color HEX
  accent?: string;    // Secondary accent color HEX
  neutral?: string;   // Neutral gray base HEX (default: #6B7280)
  success?: string;   // Success color HEX (default: #22C55E)
  warning?: string;   // Warning color HEX (default: #F59E0B)
  error?: string;     // Error color HEX (default: #EF4444)
  info?: string;      // Info color HEX (default: #3B82F6)
}

export interface GeneratedColorSystem {
  primitives: PrimitiveColorTokens;
  semantic: Record<ColorContext, Record<ColorRole, Record<ColorState, SemanticColorToken>>>;
  composite: CompositeColorTokens;
}

/**
 * Generate complete color system from base colors
 */
export function generateColorSystem(input: ColorSystemInput): GeneratedColorSystem {
  // Default colors
  const colors: BaseColorInput[] = [
    { name: 'brand', hex: input.brand, description: 'Primary brand color' },
    { name: 'neutral', hex: input.neutral || '#6B7280', description: 'Neutral gray' },
    { name: 'success', hex: input.success || '#22C55E', description: 'Success state' },
    { name: 'warning', hex: input.warning || '#F59E0B', description: 'Warning state' },
    { name: 'error', hex: input.error || '#EF4444', description: 'Error state' },
    { name: 'info', hex: input.info || '#3B82F6', description: 'Information state' }
  ];

  if (input.accent) {
    colors.push({ name: 'accent', hex: input.accent, description: 'Secondary accent color' });
  }

  // Add white and black for backgrounds
  colors.push({ name: 'white', hex: '#FFFFFF', description: 'Pure white' });
  colors.push({ name: 'black', hex: '#000000', description: 'Pure black' });

  // Generate primitives
  const primitives = generatePrimitiveColors(colors);

  // Generate semantic mappings
  const semanticConfigs: SemanticColorConfig[] = [
    // Brand colors
    {
      context: 'brand',
      baseColorName: 'brand',
      mappings: [
        {
          role: 'background',
          states: [
            { state: 'default', variant: 'base' },
            { state: 'hover', variant: 'dark', step: 100 },
            { state: 'active', variant: 'dark', step: 200 },
            { state: 'disabled', variant: 'light', step: 500 }
          ]
        },
        {
          role: 'text',
          states: [
            { state: 'default', variant: 'base' },
            { state: 'hover', variant: 'dark', step: 100 },
            { state: 'disabled', variant: 'light', step: 400 }
          ]
        },
        {
          role: 'border',
          states: [
            { state: 'default', variant: 'base' },
            { state: 'focus', variant: 'base' },
            { state: 'hover', variant: 'dark', step: 100 }
          ]
        }
      ]
    },
    // Neutral colors
    {
      context: 'neutral',
      baseColorName: 'neutral',
      mappings: [
        {
          role: 'background',
          states: [
            { state: 'default', variant: 'light', step: 900 },
            { state: 'hover', variant: 'light', step: 800 },
            { state: 'disabled', variant: 'light', step: 950 }
          ]
        },
        {
          role: 'surface',
          states: [
            { state: 'default', variant: 'light', step: 950 },
            { state: 'hover', variant: 'light', step: 900 },
            { state: 'disabled', variant: 'light', step: 950 }
          ]
        },
        {
          role: 'text',
          states: [
            { state: 'default', variant: 'dark', step: 800 },
            { state: 'hover', variant: 'dark', step: 700 },
            { state: 'disabled', variant: 'light', step: 500 }
          ]
        },
        {
          role: 'textSecondary',
          states: [
            { state: 'default', variant: 'dark', step: 400 }
          ]
        },
        {
          role: 'border',
          states: [
            { state: 'default', variant: 'light', step: 700 },
            { state: 'hover', variant: 'light', step: 600 },
            { state: 'disabled', variant: 'light', step: 800 }
          ]
        }
      ]
    },
    // Success colors
    {
      context: 'success',
      baseColorName: 'success',
      mappings: [
        {
          role: 'background',
          states: [
            { state: 'default', variant: 'base' },
            { state: 'hover', variant: 'dark', step: 100 }
          ]
        },
        {
          role: 'text',
          states: [
            { state: 'default', variant: 'dark', step: 300 }
          ]
        },
        {
          role: 'border',
          states: [
            { state: 'default', variant: 'base' }
          ]
        }
      ]
    },
    // Warning colors
    {
      context: 'warning',
      baseColorName: 'warning',
      mappings: [
        {
          role: 'background',
          states: [
            { state: 'default', variant: 'base' },
            { state: 'hover', variant: 'dark', step: 100 }
          ]
        },
        {
          role: 'text',
          states: [
            { state: 'default', variant: 'dark', step: 400 }
          ]
        },
        {
          role: 'border',
          states: [
            { state: 'default', variant: 'base' }
          ]
        }
      ]
    },
    // Error colors
    {
      context: 'error',
      baseColorName: 'error',
      mappings: [
        {
          role: 'background',
          states: [
            { state: 'default', variant: 'base' },
            { state: 'hover', variant: 'dark', step: 100 }
          ]
        },
        {
          role: 'text',
          states: [
            { state: 'default', variant: 'dark', step: 300 }
          ]
        },
        {
          role: 'border',
          states: [
            { state: 'default', variant: 'base' }
          ]
        }
      ]
    }
  ];

  const semantic = generateSemanticColors(primitives, semanticConfigs);
  const composite = generateDefaultCompositeColors();

  return {
    primitives,
    semantic,
    composite
  };
}

// ============================================
// EXPORT FOR FIGMA VARIABLES
// ============================================

export interface FigmaVariableData {
  name: string;
  value: RGBA;
  description?: string;
}

/**
 * Flatten color system to Figma variables format
 */
export function flattenToFigmaVariables(
  system: GeneratedColorSystem
): {
  primitives: FigmaVariableData[];
  semantic: FigmaVariableData[];
} {
  const primitiveVars: FigmaVariableData[] = [];
  const semanticVars: FigmaVariableData[] = [];

  // Flatten primitives
  for (const [colorName, colorData] of Object.entries(system.primitives)) {
    // Base color
    primitiveVars.push({
      name: `${colorName}/base`,
      value: colorData.base.$value.rgba,
      description: colorData.base.$description
    });

    // Light variants
    for (const [step, token] of Object.entries(colorData.light)) {
      primitiveVars.push({
        name: `${colorName}/light/${step}`,
        value: token.$value.rgba,
        description: token.$description
      });
    }

    // Dark variants
    for (const [step, token] of Object.entries(colorData.dark)) {
      primitiveVars.push({
        name: `${colorName}/dark/${step}`,
        value: token.$value.rgba,
        description: token.$description
      });
    }

    // Alpha variants
    for (const [step, token] of Object.entries(colorData.alpha)) {
      primitiveVars.push({
        name: `${colorName}/alpha/${step}`,
        value: token.$value.rgba,
        description: token.$description
      });
    }
  }

  // Flatten semantic
  for (const [context, roles] of Object.entries(system.semantic)) {
    for (const [role, states] of Object.entries(roles)) {
      for (const [state, token] of Object.entries(states)) {
        semanticVars.push({
          name: `${context}/${role}/${state}`,
          value: token.$value.rgba,
          description: token.$description
        });
      }
    }
  }

  return { primitives: primitiveVars, semantic: semanticVars };
}
