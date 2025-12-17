/**
 * Sync Manager Types and Logic
 * 
 * Система синхронизации между Plugin State и Figma Variables/Styles
 */

// ============================================
// TYPES
// ============================================

/**
 * Типы коллекций для синхронизации
 */
export type SyncCollectionType = 
  | 'Primitives'    // Базовые примитивы (spacing, radius, colors)
  | 'Typography'    // Typography токены
  | 'Tokens'        // Semantic tokens
  | 'Spacing'       // Spacing коллекция
  | 'Gap'           // Gap коллекция
  | 'Radius'        // Radius коллекция
  | 'IconSize';     // Icon Size коллекция

/**
 * Тип переменной Figma
 */
export type FigmaVariableType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

/**
 * Значение переменной для режима
 */
export interface ModeValue {
  modeId: string;
  modeName: string;
  value: number | string | boolean | { r: number; g: number; b: number; a?: number };
  // Если значение - алиас на другую переменную
  aliasId?: string;
  aliasName?: string;
}

/**
 * Переменная из Figma (для синхронизации)
 */
export interface SyncFigmaVariable {
  id: string;
  name: string;
  resolvedType: FigmaVariableType;
  description?: string;
  collectionId: string;
  collectionName: string;
  modeValues: ModeValue[];
  // Scopes for publishing
  scopes?: string[];
}

/**
 * Коллекция из Figma
 */
export interface FigmaCollection {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  variableCount: number;
}

/**
 * Переменная из Plugin State (то что хотим синхронизировать)
 */
export interface PluginVariable {
  name: string;                    // Путь переменной: typography/page/hero/fontSize
  type: FigmaVariableType;
  description?: string;
  // Значения по режимам (ключ - имя режима: desktop, tablet, mobile)
  modeValues: Record<string, number | string | boolean | { r: number; g: number; b: number; a?: number }>;
  // Или ссылка на примитив
  aliasTo?: string;               // Имя примитива для алиаса
}

/**
 * Тип изменения при синхронизации
 */
export type SyncChangeType = 'add' | 'update' | 'delete' | 'unchanged';

/**
 * Одно изменение для синхронизации
 */
export interface SyncChange {
  type: SyncChangeType;
  variableName: string;
  
  // Для update - показываем разницу
  oldValue?: any;
  newValue?: any;
  
  // Для какого режима изменение (или все)
  modeName?: string;
  
  // Figma ID если существует
  figmaId?: string;
  
  // Plugin data
  pluginVariable?: PluginVariable;
}

/**
 * Результат сравнения для синхронизации
 */
export interface SyncDiff {
  collectionName: string;
  collectionId?: string;           // Figma ID если коллекция существует
  
  // Изменения режимов
  modesToAdd: string[];
  modesToRemove: string[];
  
  // Изменения переменных
  changes: SyncChange[];
  
  // Summary
  summary: {
    add: number;
    update: number;
    delete: number;
    unchanged: number;
  };
}

/**
 * Результат синхронизации
 */
export interface SyncResult {
  success: boolean;
  collectionName: string;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
  warnings: string[];
}

// ============================================
// SYNC STATE
// ============================================

interface SyncState {
  // Кэш данных из Figma
  figmaCollections: FigmaCollection[];
  figmaVariables: Map<string, SyncFigmaVariable[]>;  // collectionId -> variables
  
  // Последний diff
  lastDiff: SyncDiff | null;
  
  // Настройки синхронизации
  settings: {
    includeDeletes: boolean;       // Удалять переменные которых нет в plugin
    preserveUnmanaged: boolean;    // Сохранять переменные которые не управляются плагином
    syncScopes: boolean;           // Синхронизировать scopes
  };
}

let syncState: SyncState = {
  figmaCollections: [],
  figmaVariables: new Map(),
  lastDiff: null,
  settings: {
    includeDeletes: false,
    preserveUnmanaged: true,
    syncScopes: true,
  },
};

// ============================================
// GETTERS / SETTERS
// ============================================

export function getSyncState(): SyncState {
  return syncState;
}

export function getFigmaCollections(): FigmaCollection[] {
  return syncState.figmaCollections;
}

export function setFigmaCollections(collections: FigmaCollection[]): void {
  syncState.figmaCollections = collections;
}

export function getFigmaVariables(collectionId: string): SyncFigmaVariable[] {
  return syncState.figmaVariables.get(collectionId) || [];
}

export function setFigmaVariables(collectionId: string, variables: SyncFigmaVariable[]): void {
  syncState.figmaVariables.set(collectionId, variables);
}

export function getLastDiff(): SyncDiff | null {
  return syncState.lastDiff;
}

export function setLastDiff(diff: SyncDiff | null): void {
  syncState.lastDiff = diff;
}

export function getSyncSettings() {
  return syncState.settings;
}

export function updateSyncSettings(settings: Partial<SyncState['settings']>): void {
  syncState.settings = { ...syncState.settings, ...settings };
}

// ============================================
// DIFF CALCULATION
// ============================================

/**
 * Сравнить plugin state с Figma и получить diff
 */
export function calculateDiff(
  collectionName: string,
  pluginVariables: PluginVariable[],
  figmaCollection: FigmaCollection | null,
  figmaVariables: SyncFigmaVariable[]
): SyncDiff {
  const changes: SyncChange[] = [];
  
  // Создаём Map для быстрого поиска
  const figmaVarMap = new Map<string, SyncFigmaVariable>();
  figmaVariables.forEach(v => figmaVarMap.set(v.name, v));
  
  const pluginVarSet = new Set(pluginVariables.map(v => v.name));
  
  // 1. Проверяем plugin variables
  for (const pluginVar of pluginVariables) {
    const figmaVar = figmaVarMap.get(pluginVar.name);
    
    if (!figmaVar) {
      // Переменной нет в Figma - ADD
      changes.push({
        type: 'add',
        variableName: pluginVar.name,
        newValue: pluginVar.modeValues,
        pluginVariable: pluginVar,
      });
    } else {
      // Переменная существует - проверяем изменения
      const valueChanges = compareValues(pluginVar, figmaVar);
      
      if (valueChanges.length > 0) {
        // Есть изменения - UPDATE
        for (const change of valueChanges) {
          changes.push({
            type: 'update',
            variableName: pluginVar.name,
            figmaId: figmaVar.id,
            oldValue: change.oldValue,
            newValue: change.newValue,
            modeName: change.modeName,
            pluginVariable: pluginVar,
          });
        }
      } else {
        // Без изменений
        changes.push({
          type: 'unchanged',
          variableName: pluginVar.name,
          figmaId: figmaVar.id,
        });
      }
    }
  }
  
  // 2. Проверяем Figma variables которых нет в plugin (для удаления)
  if (syncState.settings.includeDeletes && !syncState.settings.preserveUnmanaged) {
    for (const figmaVar of figmaVariables) {
      if (!pluginVarSet.has(figmaVar.name)) {
        changes.push({
          type: 'delete',
          variableName: figmaVar.name,
          figmaId: figmaVar.id,
          oldValue: figmaVar.modeValues,
        });
      }
    }
  }
  
  // 3. Режимы (modes)
  const pluginModes = getUniqueModes(pluginVariables);
  const figmaModes = figmaCollection?.modes.map(m => m.name) || [];
  
  const modesToAdd = pluginModes.filter(m => !figmaModes.includes(m));
  const modesToRemove = figmaModes.filter(m => !pluginModes.includes(m) && m !== 'Mode 1');
  
  // Summary
  const summary = {
    add: changes.filter(c => c.type === 'add').length,
    update: changes.filter(c => c.type === 'update').length,
    delete: changes.filter(c => c.type === 'delete').length,
    unchanged: changes.filter(c => c.type === 'unchanged').length,
  };
  
  const diff: SyncDiff = {
    collectionName,
    collectionId: figmaCollection?.id,
    modesToAdd,
    modesToRemove: syncState.settings.includeDeletes ? modesToRemove : [],
    changes,
    summary,
  };
  
  syncState.lastDiff = diff;
  return diff;
}

/**
 * Сравнить значения переменной
 */
function compareValues(
  pluginVar: PluginVariable, 
  figmaVar: SyncFigmaVariable
): Array<{ modeName: string; oldValue: any; newValue: any }> {
  const changes: Array<{ modeName: string; oldValue: any; newValue: any }> = [];
  
  for (const [modeName, pluginValue] of Object.entries(pluginVar.modeValues)) {
    const figmaMode = figmaVar.modeValues.find(mv => mv.modeName === modeName);
    
    if (!figmaMode) {
      // Режим не существует в Figma
      changes.push({ modeName, oldValue: undefined, newValue: pluginValue });
    } else {
      // Сравниваем значения
      const figmaValue = figmaMode.aliasId ? figmaMode.aliasName : figmaMode.value;
      const pluginValueCompare = pluginVar.aliasTo || pluginValue;
      
      if (!valuesEqual(figmaValue, pluginValueCompare)) {
        changes.push({ modeName, oldValue: figmaValue, newValue: pluginValueCompare });
      }
    }
  }
  
  return changes;
}

/**
 * Проверить равенство значений
 */
function valuesEqual(a: any, b: any): boolean {
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object' && a !== null && b !== null) {
    // Color comparison
    if ('r' in a && 'r' in b) {
      return Math.abs(a.r - b.r) < 0.001 && 
             Math.abs(a.g - b.g) < 0.001 && 
             Math.abs(a.b - b.b) < 0.001;
    }
    return JSON.stringify(a) === JSON.stringify(b);
  }
  
  return a === b;
}

/**
 * Получить уникальные имена режимов из plugin variables
 */
function getUniqueModes(variables: PluginVariable[]): string[] {
  const modes = new Set<string>();
  for (const v of variables) {
    Object.keys(v.modeValues).forEach(m => modes.add(m));
  }
  return Array.from(modes);
}

// ============================================
// HELPERS
// ============================================

/**
 * Преобразовать Figma Variable в PluginVariable формат
 */
export function figmaToPluginVariable(figmaVar: SyncFigmaVariable): PluginVariable {
  const modeValues: Record<string, any> = {};
  
  for (const mv of figmaVar.modeValues) {
    modeValues[mv.modeName] = mv.aliasId ? `{${mv.aliasName}}` : mv.value;
  }
  
  return {
    name: figmaVar.name,
    type: figmaVar.resolvedType,
    description: figmaVar.description,
    modeValues,
  };
}

/**
 * Получить display name для изменения
 */
export function getChangeDisplayName(change: SyncChange): string {
  // typography/page/hero/fontSize -> page/hero/fontSize
  const parts = change.variableName.split('/');
  return parts.length > 1 ? parts.slice(1).join('/') : change.variableName;
}

/**
 * Форматировать значение для отображения
 */
export function formatValue(value: any): string {
  if (value === undefined || value === null) return '—';
  
  if (typeof value === 'object') {
    if ('r' in value) {
      // Color
      const r = Math.round(value.r * 255);
      const g = Math.round(value.g * 255);
      const b = Math.round(value.b * 255);
      return `rgb(${r}, ${g}, ${b})`;
    }
    return JSON.stringify(value);
  }
  
  if (typeof value === 'string' && value.startsWith('{')) {
    // Alias reference
    return value;
  }
  
  return String(value);
}

// ============================================
// RESET
// ============================================

export function resetSyncState(): void {
  syncState = {
    figmaCollections: [],
    figmaVariables: new Map(),
    lastDiff: null,
    settings: {
      includeDeletes: false,
      preserveUnmanaged: true,
      syncScopes: true,
    },
  };
}
