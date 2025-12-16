/**
 * Scaling Tokens Type Definitions
 * Separate collection with device modes (Desktop/Tablet/Mobile)
 * For: size, spacing, radius, padding, etc.
 */

// ============================================
// DEVICE MODES
// ============================================

export interface DeviceMode {
  name: string;       // "desktop", "tablet", "mobile"
  label: string;      // "Desktop", "Tablet", "Mobile"
  minWidth: number;   // For reference: 1280, 768, 0
}

export const DEFAULT_DEVICE_MODES: DeviceMode[] = [
  { name: 'desktop', label: 'Desktop', minWidth: 1280 },
  { name: 'tablet', label: 'Tablet', minWidth: 768 },
  { name: 'mobile', label: 'Mobile', minWidth: 0 },
];

// ============================================
// SCALING TOKEN TYPES
// ============================================

export type ScalingCategory = 'size' | 'spacing' | 'radius' | 'padding' | 'gap' | 'label';

export interface ScalingToken {
  id: string;
  name: string;                    // "xs", "s", "m", "l", "xl", "2xl"
  category: ScalingCategory;       // "size", "spacing", etc.
  values: {
    desktop: number;
    tablet: number;
    mobile: number;
  };
  description?: string;
}

export interface ScalingState {
  collectionName: string;          // e.g., "IconScaling", "Dimensions"
  deviceModes: DeviceMode[];
  tokens: ScalingToken[];
}

// ============================================
// CATEGORY DEFINITIONS
// ============================================

export const SCALING_CATEGORIES: Record<ScalingCategory, { label: string; description: string }> = {
  size: { label: 'Size', description: 'Размеры элементов (иконки, аватары и т.д.)' },
  spacing: { label: 'Spacing', description: 'Отступы между элементами' },
  radius: { label: 'Radius', description: 'Радиусы скругления' },
  padding: { label: 'Padding', description: 'Внутренние отступы' },
  gap: { label: 'Gap', description: 'Расстояние в flex/grid' },
  label: { label: 'Label', description: 'Размеры текстовых меток' },
};

// ============================================
// SIZE NAMES (T-shirt sizing)
// ============================================

export const SIZE_NAMES = ['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl'] as const;
export type SizeName = typeof SIZE_NAMES[number];

// ============================================
// DEFAULT TOKENS
// ============================================

export const DEFAULT_SCALING_TOKENS: ScalingToken[] = [
  // Size
  { id: 'scale-size-xs', name: 'xs', category: 'size', values: { desktop: 12, tablet: 10, mobile: 10 }, description: 'Extra small' },
  { id: 'scale-size-s', name: 's', category: 'size', values: { desktop: 16, tablet: 14, mobile: 12 }, description: 'Small' },
  { id: 'scale-size-m', name: 'm', category: 'size', values: { desktop: 24, tablet: 20, mobile: 16 }, description: 'Medium' },
  { id: 'scale-size-l', name: 'l', category: 'size', values: { desktop: 32, tablet: 28, mobile: 24 }, description: 'Large' },
  { id: 'scale-size-xl', name: 'xl', category: 'size', values: { desktop: 48, tablet: 40, mobile: 32 }, description: 'Extra large' },
  { id: 'scale-size-2xl', name: '2xl', category: 'size', values: { desktop: 64, tablet: 56, mobile: 48 }, description: '2X large' },

  // Spacing
  { id: 'scale-spacing-xs', name: 'xs', category: 'spacing', values: { desktop: 4, tablet: 4, mobile: 4 }, description: 'Extra small gap' },
  { id: 'scale-spacing-s', name: 's', category: 'spacing', values: { desktop: 8, tablet: 6, mobile: 4 }, description: 'Small gap' },
  { id: 'scale-spacing-m', name: 'm', category: 'spacing', values: { desktop: 16, tablet: 12, mobile: 8 }, description: 'Medium gap' },
  { id: 'scale-spacing-l', name: 'l', category: 'spacing', values: { desktop: 24, tablet: 20, mobile: 16 }, description: 'Large gap' },

  // Radius
  { id: 'scale-radius-none', name: 'none', category: 'radius', values: { desktop: 0, tablet: 0, mobile: 0 }, description: 'No radius' },
  { id: 'scale-radius-xs', name: 'xs', category: 'radius', values: { desktop: 2, tablet: 2, mobile: 2 }, description: 'Extra small radius' },
  { id: 'scale-radius-s', name: 's', category: 'radius', values: { desktop: 4, tablet: 4, mobile: 4 }, description: 'Small radius' },
  { id: 'scale-radius-m', name: 'm', category: 'radius', values: { desktop: 8, tablet: 8, mobile: 6 }, description: 'Medium radius' },
  { id: 'scale-radius-l', name: 'l', category: 'radius', values: { desktop: 12, tablet: 10, mobile: 8 }, description: 'Large radius' },
  { id: 'scale-radius-xl', name: 'xl', category: 'radius', values: { desktop: 16, tablet: 14, mobile: 12 }, description: 'Extra large radius' },
  { id: 'scale-radius-full', name: 'full', category: 'radius', values: { desktop: 9999, tablet: 9999, mobile: 9999 }, description: 'Full (pill)' },

  // Padding
  { id: 'scale-padding-xs', name: 'xs', category: 'padding', values: { desktop: 8, tablet: 6, mobile: 4 }, description: 'Extra small padding' },
  { id: 'scale-padding-s', name: 's', category: 'padding', values: { desktop: 12, tablet: 10, mobile: 8 }, description: 'Small padding' },
  { id: 'scale-padding-m', name: 'm', category: 'padding', values: { desktop: 16, tablet: 14, mobile: 12 }, description: 'Medium padding' },
  { id: 'scale-padding-l', name: 'l', category: 'padding', values: { desktop: 24, tablet: 20, mobile: 16 }, description: 'Large padding' },
  { id: 'scale-padding-xl', name: 'xl', category: 'padding', values: { desktop: 32, tablet: 28, mobile: 24 }, description: 'Extra large padding' },

  // Gap
  { id: 'scale-gap-xs', name: 'xs', category: 'gap', values: { desktop: 4, tablet: 4, mobile: 2 }, description: 'Extra small gap' },
  { id: 'scale-gap-s', name: 's', category: 'gap', values: { desktop: 8, tablet: 6, mobile: 4 }, description: 'Small gap' },
  { id: 'scale-gap-m', name: 'm', category: 'gap', values: { desktop: 12, tablet: 10, mobile: 8 }, description: 'Medium gap' },
  { id: 'scale-gap-l', name: 'l', category: 'gap', values: { desktop: 16, tablet: 14, mobile: 12 }, description: 'Large gap' },
  { id: 'scale-gap-xl', name: 'xl', category: 'gap', values: { desktop: 24, tablet: 20, mobile: 16 }, description: 'Extra large gap' },

  // Label (font sizes for labels/captions)
  { id: 'scale-label-xs', name: 'xs', category: 'label', values: { desktop: 10, tablet: 10, mobile: 10 }, description: 'Caption' },
  { id: 'scale-label-s', name: 's', category: 'label', values: { desktop: 12, tablet: 11, mobile: 10 }, description: 'Small label' },
  { id: 'scale-label-m', name: 'm', category: 'label', values: { desktop: 14, tablet: 13, mobile: 12 }, description: 'Default label' },
  { id: 'scale-label-l', name: 'l', category: 'label', values: { desktop: 16, tablet: 15, mobile: 14 }, description: 'Large label' },
  { id: 'scale-label-xl', name: 'xl', category: 'label', values: { desktop: 18, tablet: 17, mobile: 16 }, description: 'Extra large label' },
  { id: 'scale-label-2xl', name: '2xl', category: 'label', values: { desktop: 20, tablet: 18, mobile: 16 }, description: 'Heading label' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createDefaultScalingState(): ScalingState {
  return {
    collectionName: 'Spacing',
    deviceModes: [...DEFAULT_DEVICE_MODES],
    tokens: [...DEFAULT_SCALING_TOKENS],
  };
}

export function generateScalingTokenId(): string {
  return `scale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getTokensByCategory(tokens: ScalingToken[], category: ScalingCategory): ScalingToken[] {
  return tokens.filter(t => t.category === category);
}
