/**
 * Token Manager - Constants and Default Values
 */

import { 
  TokenManagerSettings, 
  TokenManagerState, 
  CategoryDefinition,
  CollectionConfig 
} from './token-manager';

// ============================================
// DEFAULT SETTINGS
// ============================================

export const DEFAULT_SETTINGS: TokenManagerSettings = {
  separator: '/',
  caseStyle: 'kebab',
  exportFormat: 'json',
  autoSync: false,
  darkModeEnabled: true,
};

// ============================================
// COLOR SCALE
// ============================================

export const COLOR_SCALE = [
  25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 
  275, 300, 325, 350, 375, 400, 425, 450, 475, 500, 
  525, 550, 575, 600, 625, 650, 675, 700, 725, 750, 
  775, 800, 825, 850, 875, 900, 925, 950, 975
] as const;

export type ColorStep = typeof COLOR_SCALE[number];

// ============================================
// DEFAULT PALETTES
// ============================================

export const DEFAULT_PALETTES = [
  { name: 'brand', hex: '#3B82F6', label: 'Brand' },
  { name: 'accent', hex: '#8B5CF6', label: 'Accent' },
  { name: 'neutral', hex: '#6B7280', label: 'Neutral' },
  { name: 'success', hex: '#10B981', label: 'Success' },
  { name: 'warning', hex: '#F59E0B', label: 'Warning' },
  { name: 'error', hex: '#EF4444', label: 'Error' },
  { name: 'info', hex: '#06B6D4', label: 'Info' },
];

// ============================================
// DEFAULT COLLECTIONS
// ============================================

export const DEFAULT_COLLECTIONS: CollectionConfig[] = [
  {
    name: 'Primitives',
    modes: [{ id: 'default', name: 'Default', isDefault: true }],
    tokenCount: 0,
  },
  {
    name: 'Tokens',
    modes: [
      { id: 'light', name: 'light', isDefault: true },
      { id: 'dark', name: 'dark', isDefault: false },
    ],
    tokenCount: 0,
  },
  {
    name: 'Components',
    // Components have no modes - they reference Tokens which handle theme switching
    modes: [{ id: 'default', name: 'Default', isDefault: true }],
    tokenCount: 0,
  },
];

// ============================================
// SEMANTIC CATEGORIES
// ============================================

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'bg',
    name: 'bg',
    label: 'Backgrounds',
    subcategories: [
      { id: 'bg-page', name: 'page', label: 'Page', variants: ['primary', 'secondary', 'tertiary'], states: ['default'] },
      { id: 'bg-surface', name: 'surface', label: 'Surface', variants: ['primary', 'secondary', 'elevated'], states: ['default', 'hover'] },
      { id: 'bg-interactive', name: 'interactive', label: 'Interactive', variants: ['primary', 'secondary'], states: ['default', 'hover', 'active', 'selected', 'disabled'] },
      { id: 'bg-overlay', name: 'overlay', label: 'Overlay', variants: ['default', 'light', 'dark'], states: ['default'] },
      { id: 'bg-input', name: 'input', label: 'Input', variants: ['default', 'filled'], states: ['default', 'hover', 'focus', 'disabled', 'error'] },
      { id: 'bg-brand', name: 'brand', label: 'Brand', variants: ['subtle', 'default', 'strong'], states: ['default', 'hover'] },
      { id: 'bg-success', name: 'success', label: 'Success', variants: ['subtle', 'default'], states: ['default'] },
      { id: 'bg-warning', name: 'warning', label: 'Warning', variants: ['subtle', 'default'], states: ['default'] },
      { id: 'bg-error', name: 'error', label: 'Error', variants: ['subtle', 'default'], states: ['default'] },
      { id: 'bg-info', name: 'info', label: 'Info', variants: ['subtle', 'default'], states: ['default'] },
      { id: 'bg-inverse', name: 'inverse', label: 'Inverse', variants: ['primary', 'secondary'], states: ['default'] },
    ]
  },
  {
    id: 'text',
    name: 'text',
    label: 'Text',
    subcategories: [
      { id: 'text-primary', name: 'primary', label: 'Primary', states: ['default', 'hover', 'disabled'] },
      { id: 'text-secondary', name: 'secondary', label: 'Secondary', states: ['default', 'hover', 'disabled'] },
      { id: 'text-tertiary', name: 'tertiary', label: 'Tertiary', states: ['default', 'disabled'] },
      { id: 'text-placeholder', name: 'placeholder', label: 'Placeholder', states: ['default'] },
      { id: 'text-disabled', name: 'disabled', label: 'Disabled', states: ['default'] },
      { id: 'text-link', name: 'link', label: 'Link', variants: ['default', 'subtle'], states: ['default', 'hover', 'active', 'visited', 'disabled'] },
      { id: 'text-brand', name: 'brand', label: 'Brand', states: ['default', 'hover'] },
      { id: 'text-success', name: 'success', label: 'Success', states: ['default'] },
      { id: 'text-warning', name: 'warning', label: 'Warning', states: ['default'] },
      { id: 'text-error', name: 'error', label: 'Error', states: ['default'] },
      { id: 'text-info', name: 'info', label: 'Info', states: ['default'] },
      { id: 'text-inverse', name: 'inverse', label: 'Inverse', variants: ['primary', 'secondary'], states: ['default'] },
      { id: 'text-on-brand', name: 'on-brand', label: 'On Brand', states: ['default'] },
      { id: 'text-on-success', name: 'on-success', label: 'On Success', states: ['default'] },
      { id: 'text-on-warning', name: 'on-warning', label: 'On Warning', states: ['default'] },
      { id: 'text-on-error', name: 'on-error', label: 'On Error', states: ['default'] },
      { id: 'text-label', name: 'label', label: 'Label', variants: ['default', 'required'], states: ['default', 'disabled'] },
      { id: 'text-caption', name: 'caption', label: 'Caption', states: ['default'] },
      { id: 'text-helper', name: 'helper', label: 'Helper', states: ['default', 'error'] },
    ]
  },
  {
    id: 'border',
    name: 'border',
    label: 'Borders',
    subcategories: [
      { id: 'border-default', name: 'default', label: 'Default', states: ['default', 'hover'] },
      { id: 'border-subtle', name: 'subtle', label: 'Subtle', states: ['default'] },
      { id: 'border-strong', name: 'strong', label: 'Strong', states: ['default'] },
      { id: 'border-disabled', name: 'disabled', label: 'Disabled', states: ['default'] },
      { id: 'border-focus', name: 'focus', label: 'Focus', variants: ['default', 'error', 'success'], states: ['default'] },
      { id: 'border-input', name: 'input', label: 'Input', states: ['default', 'hover', 'focus', 'error', 'disabled'] },
      { id: 'border-card', name: 'card', label: 'Card', states: ['default', 'hover', 'selected'] },
      { id: 'border-brand', name: 'brand', label: 'Brand', states: ['default', 'hover'] },
      { id: 'border-success', name: 'success', label: 'Success', states: ['default'] },
      { id: 'border-warning', name: 'warning', label: 'Warning', states: ['default'] },
      { id: 'border-error', name: 'error', label: 'Error', states: ['default'] },
      { id: 'border-inverse', name: 'inverse', label: 'Inverse', states: ['default'] },
    ]
  },
  {
    id: 'icon',
    name: 'icon',
    label: 'Icons',
    subcategories: [
      { id: 'icon-primary', name: 'primary', label: 'Primary', states: ['default', 'hover', 'disabled'] },
      { id: 'icon-secondary', name: 'secondary', label: 'Secondary', states: ['default', 'hover', 'disabled'] },
      { id: 'icon-tertiary', name: 'tertiary', label: 'Tertiary', states: ['default', 'disabled'] },
      { id: 'icon-disabled', name: 'disabled', label: 'Disabled', states: ['default'] },
      { id: 'icon-brand', name: 'brand', label: 'Brand', states: ['default', 'hover'] },
      { id: 'icon-success', name: 'success', label: 'Success', states: ['default'] },
      { id: 'icon-warning', name: 'warning', label: 'Warning', states: ['default'] },
      { id: 'icon-error', name: 'error', label: 'Error', states: ['default'] },
      { id: 'icon-info', name: 'info', label: 'Info', states: ['default'] },
      { id: 'icon-inverse', name: 'inverse', label: 'Inverse', states: ['default'] },
      { id: 'icon-on-brand', name: 'on-brand', label: 'On Brand', states: ['default'] },
    ]
  },
  {
    id: 'action',
    name: 'action',
    label: 'Actions',
    subcategories: [
      { id: 'action-primary', name: 'primary', label: 'Primary', states: ['default', 'hover', 'active', 'focus', 'disabled'] },
      { id: 'action-secondary', name: 'secondary', label: 'Secondary', states: ['default', 'hover', 'active', 'focus', 'disabled'] },
      { id: 'action-tertiary', name: 'tertiary', label: 'Tertiary', states: ['default', 'hover', 'active', 'focus', 'disabled'] },
      { id: 'action-ghost', name: 'ghost', label: 'Ghost', states: ['default', 'hover', 'active', 'focus', 'disabled'] },
      { id: 'action-danger', name: 'danger', label: 'Danger', states: ['default', 'hover', 'active', 'focus', 'disabled'] },
      { id: 'action-success', name: 'success', label: 'Success', states: ['default', 'hover', 'active', 'focus', 'disabled'] },
      { id: 'action-warning', name: 'warning', label: 'Warning', states: ['default', 'hover', 'active', 'focus', 'disabled'] },
    ]
  },
  {
    id: 'feedback',
    name: 'feedback',
    label: 'Feedback',
    subcategories: [
      { id: 'feedback-success', name: 'success', label: 'Success', variants: ['surface', 'content', 'stroke', 'icon'], states: ['default'] },
      { id: 'feedback-warning', name: 'warning', label: 'Warning', variants: ['surface', 'content', 'stroke', 'icon'], states: ['default'] },
      { id: 'feedback-error', name: 'error', label: 'Error', variants: ['surface', 'content', 'stroke', 'icon'], states: ['default'] },
      { id: 'feedback-info', name: 'info', label: 'Info', variants: ['surface', 'content', 'stroke', 'icon'], states: ['default'] },
      { id: 'feedback-neutral', name: 'neutral', label: 'Neutral', variants: ['surface', 'content', 'stroke'], states: ['default'] },
    ]
  },
  {
    id: 'status',
    name: 'status',
    label: 'Status',
    subcategories: [
      { id: 'status-online', name: 'online', label: 'Online', states: ['default'] },
      { id: 'status-offline', name: 'offline', label: 'Offline', states: ['default'] },
      { id: 'status-away', name: 'away', label: 'Away', states: ['default'] },
      { id: 'status-busy', name: 'busy', label: 'Busy', states: ['default'] },
      { id: 'status-active', name: 'active', label: 'Active', states: ['default'] },
      { id: 'status-inactive', name: 'inactive', label: 'Inactive', states: ['default'] },
      { id: 'status-pending', name: 'pending', label: 'Pending', states: ['default'] },
      { id: 'status-completed', name: 'completed', label: 'Completed', states: ['default'] },
      { id: 'status-failed', name: 'failed', label: 'Failed', states: ['default'] },
      { id: 'status-draft', name: 'draft', label: 'Draft', states: ['default'] },
      { id: 'status-published', name: 'published', label: 'Published', states: ['default'] },
      { id: 'status-archived', name: 'archived', label: 'Archived', states: ['default'] },
    ]
  },
  {
    id: 'divider',
    name: 'divider',
    label: 'Dividers',
    subcategories: [
      { id: 'divider-default', name: 'default', label: 'Default', states: ['default'] },
      { id: 'divider-subtle', name: 'subtle', label: 'Subtle', states: ['default'] },
      { id: 'divider-strong', name: 'strong', label: 'Strong', states: ['default'] },
      { id: 'divider-inverse', name: 'inverse', label: 'Inverse', states: ['default'] },
    ]
  },
  {
    id: 'focus',
    name: 'focus',
    label: 'Focus',
    subcategories: [
      { id: 'focus-ring', name: 'ring', label: 'Ring', variants: ['default', 'error', 'success'], states: ['default'] },
      { id: 'focus-outline', name: 'outline', label: 'Outline', states: ['default'] },
    ]
  },
];

// ============================================
// INITIAL STATE
// ============================================

export const INITIAL_STATE: TokenManagerState = {
  tokens: [],
  collections: DEFAULT_COLLECTIONS,
  categories: DEFAULT_CATEGORIES,
  settings: DEFAULT_SETTINGS,
  selectedTokenId: null,
  expandedPaths: [],
  searchQuery: '',
  filterCollection: 'all',
  filterEnabled: 'all',
  lastSyncedAt: null,
  hasUnsavedChanges: false,
  syncStatus: 'idle',
};

// ============================================
// STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  STATE: 'token-manager-state',
  SETTINGS: 'token-manager-settings',
  TOKENS: 'token-manager-tokens',
} as const;
