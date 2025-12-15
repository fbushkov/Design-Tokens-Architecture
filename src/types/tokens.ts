/**
 * Design Tokens Type Definitions
 * 3-level token structure: Primitives -> Semantic -> Composite
 */

// ============================================
// BASE TOKEN TYPES
// ============================================

export type TokenType = 
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'fontSize'
  | 'lineHeight'
  | 'letterSpacing'
  | 'shadow'
  | 'borderRadius'
  | 'borderWidth'
  | 'opacity'
  | 'duration'
  | 'easing'
  | 'spacing'
  | 'gradient';

export interface BaseToken {
  $type: TokenType;
  $value: unknown;
  $description?: string;
  $extensions?: Record<string, unknown>;
}

// ============================================
// PRIMITIVE TOKEN VALUES
// ============================================

export interface ColorValue {
  hex: string;
  rgba: { r: number; g: number; b: number; a: number };
}

export interface DimensionValue {
  value: number;
  unit: 'px' | 'rem' | 'em' | '%' | 'vw' | 'vh';
}

export interface ShadowValue {
  offsetX: DimensionValue;
  offsetY: DimensionValue;
  blur: DimensionValue;
  spread: DimensionValue;
  color: ColorValue;
  type: 'dropShadow' | 'innerShadow';
}

export interface GradientStop {
  color: ColorValue;
  position: number; // 0-1
}

export interface GradientValue {
  type: 'linear' | 'radial' | 'angular' | 'diamond';
  angle?: number;
  stops: GradientStop[];
}

export interface AnimationValue {
  duration: number; // ms
  easing: string; // cubic-bezier or keyword
  delay?: number;
}

export interface TypographyValue {
  fontFamily: string;
  fontWeight: number | string;
  fontSize: DimensionValue;
  lineHeight: DimensionValue | number;
  letterSpacing: DimensionValue;
  textDecoration?: string;
  textTransform?: string;
}

// ============================================
// LEVEL 1: PRIMITIVE TOKENS
// ============================================

export interface PrimitiveColorToken extends BaseToken {
  $type: 'color';
  $value: ColorValue;
}

export interface PrimitiveDimensionToken extends BaseToken {
  $type: 'dimension';
  $value: DimensionValue;
}

export interface PrimitiveFontToken extends BaseToken {
  $type: 'fontFamily';
  $value: string;
}

export interface PrimitiveShadowToken extends BaseToken {
  $type: 'shadow';
  $value: ShadowValue | ShadowValue[];
}

export interface PrimitiveGradientToken extends BaseToken {
  $type: 'gradient';
  $value: GradientValue;
}

export type PrimitiveToken =
  | PrimitiveColorToken
  | PrimitiveDimensionToken
  | PrimitiveFontToken
  | PrimitiveShadowToken
  | PrimitiveGradientToken;

export interface PrimitiveTokens {
  colors: Record<string, Record<string, PrimitiveColorToken>>;
  dimensions: Record<string, PrimitiveDimensionToken>;
  fonts: Record<string, PrimitiveFontToken>;
  shadows: Record<string, PrimitiveShadowToken>;
  gradients: Record<string, PrimitiveGradientToken>;
}

// ============================================
// LEVEL 2: SEMANTIC TOKENS (Context + States)
// ============================================

export type SemanticContext = 
  | 'brand'
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'surface'
  | 'background'
  | 'text'
  | 'border'
  | 'icon';

export type InteractionState = 
  | 'default'
  | 'hover'
  | 'active'
  | 'focus'
  | 'disabled'
  | 'selected'
  | 'visited';

export interface SemanticToken extends BaseToken {
  $context: SemanticContext;
  $state?: InteractionState;
  $reference: string; // Reference to primitive token path
}

export interface SemanticColorToken extends SemanticToken {
  $type: 'color';
  $value: ColorValue | string; // Can be resolved value or reference
}

export interface SemanticSpacingToken extends SemanticToken {
  $type: 'spacing';
  $value: DimensionValue | string;
}

export interface SemanticTypographyToken extends SemanticToken {
  $type: 'fontSize' | 'lineHeight' | 'letterSpacing';
  $value: DimensionValue | number | string;
}

export interface SemanticTokens {
  colors: Record<SemanticContext, Record<InteractionState, SemanticColorToken>>;
  spacing: Record<string, SemanticSpacingToken>;
  typography: Record<string, SemanticTypographyToken>;
  borders: Record<string, SemanticToken>;
  shadows: Record<string, SemanticToken>;
  animations: Record<string, SemanticToken>;
}

// ============================================
// LEVEL 3: COMPOSITE TOKENS (Components)
// ============================================

export interface CompositeTokenValue {
  [property: string]: string | CompositeTokenValue; // References to semantic tokens
}

export interface ComponentToken {
  $type: 'component';
  $component: string;
  $variant?: string;
  $size?: string;
  $state?: InteractionState;
  $value: CompositeTokenValue;
  $description?: string;
}

export interface ButtonTokens {
  background: string;
  text: string;
  border: string;
  borderRadius: string;
  padding: {
    horizontal: string;
    vertical: string;
  };
  shadow?: string;
  typography: {
    fontSize: string;
    fontWeight: string;
    lineHeight: string;
  };
  animation?: {
    duration: string;
    easing: string;
  };
}

export interface InputTokens {
  background: string;
  text: string;
  placeholder: string;
  border: string;
  borderRadius: string;
  padding: {
    horizontal: string;
    vertical: string;
  };
  typography: {
    fontSize: string;
    lineHeight: string;
  };
  focus: {
    border: string;
    shadow: string;
  };
}

export interface CardTokens {
  background: string;
  border: string;
  borderRadius: string;
  padding: string;
  shadow: string;
}

export interface CompositeTokens {
  button: Record<string, Record<string, ComponentToken>>;
  input: Record<string, Record<string, ComponentToken>>;
  card: Record<string, ComponentToken>;
  modal: Record<string, ComponentToken>;
  tooltip: Record<string, ComponentToken>;
  badge: Record<string, ComponentToken>;
  [component: string]: Record<string, ComponentToken | Record<string, ComponentToken>>;
}

// ============================================
// COMPLETE TOKEN STRUCTURE
// ============================================

export interface DesignTokens {
  $schema?: string;
  $version: string;
  $name: string;
  $description?: string;
  primitives: PrimitiveTokens;
  semantic: Partial<SemanticTokens>;
  composite: Partial<CompositeTokens>;
}

// ============================================
// EXPORT FORMATS
// ============================================

export interface StorybookTokenFormat {
  global: Record<string, unknown>;
  components: Record<string, unknown>;
}

export interface FigmaVariableFormat {
  collections: FigmaVariableCollection[];
}

export interface FigmaVariableCollection {
  name: string;
  modes: string[];
  variables: FigmaVariable[];
}

export interface FigmaVariable {
  name: string;
  type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, unknown>;
  description?: string;
  scopes?: string[];
}

export interface CSSVariableFormat {
  root: Record<string, string>;
  components: Record<string, Record<string, string>>;
}

// ============================================
// PLUGIN MESSAGE TYPES
// ============================================

export type PluginMessageType =
  | 'export-tokens'
  | 'import-tokens'
  | 'sync-figma-variables'
  | 'generate-storybook'
  | 'get-local-styles'
  | 'get-local-variables'
  | 'create-variables'
  | 'update-variables'
  | 'notify';

export interface PluginMessage {
  type: PluginMessageType;
  payload?: unknown;
}

export interface ExportTokensMessage extends PluginMessage {
  type: 'export-tokens';
  payload: {
    format: 'json' | 'css' | 'scss' | 'storybook';
    includeLevel: ('primitives' | 'semantic' | 'composite')[];
  };
}

export interface ImportTokensMessage extends PluginMessage {
  type: 'import-tokens';
  payload: {
    tokens: DesignTokens;
    targetCollection?: string;
  };
}

export interface SyncFigmaVariablesMessage extends PluginMessage {
  type: 'sync-figma-variables';
  payload: {
    direction: 'to-figma' | 'from-figma';
    collections?: string[];
  };
}
