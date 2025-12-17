/**
 * Tokens Generator UI
 * Управление семантическими токенами (уровень 2: Primitives → Tokens → Components)
 * Tokens ссылаются на Primitives и поддерживают темы (light, dark, и кастомные)
 */

import { getState, createToken, getTokens } from '../types/token-manager-state';
import { TokenDefinition } from '../types/token-manager';
import { getCurrentProduct, getThemes, ThemeConfig } from './primitives-generator-ui';

// ============================================
// ВАЛИДАЦИЯ ПРИМИТИВОВ
// ============================================

/**
 * Проверяет, есть ли созданные примитивы (цвета)
 */
export function hasPrimitives(): boolean {
  const state = getState();
  const colorPrimitives = state.tokens.filter(
    t => t.collection === 'Primitives' && t.type === 'COLOR'
  );
  return colorPrimitives.length > 0;
}

/**
 * Обновляет состояние вкладки Tokens (disabled/enabled)
 */
export function updateTokensTabState(): void {
  const hasColors = hasPrimitives();
  const tab = document.querySelector('[data-tab="tokens"]') as HTMLButtonElement;
  const tabContent = document.getElementById('tokens');
  const warningBox = document.getElementById('tokens-no-primitives-warning');
  const contentSection = document.getElementById('tokens-content-section');
  
  if (tab) {
    tab.classList.toggle('disabled', !hasColors);
    tab.title = hasColors ? '' : 'Сначала создайте примитивы';
  }
  
  if (warningBox) {
    warningBox.style.display = hasColors ? 'none' : 'block';
  }
  
  if (contentSection) {
    contentSection.style.display = hasColors ? 'block' : 'none';
  }
}

// ============================================
// ТИПЫ И ИНТЕРФЕЙСЫ
// ============================================

interface ThemeDefinition {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface SemanticTokenMapping {
  tokenPath: string;
  category: string;
  description: string;
  themes: {
    [themeId: string]: string; // themeId → primitiveReference
  };
}

// ============================================
// СОСТОЯНИЕ
// ============================================

export const tokensState = {
  themes: [
    { id: 'light', name: 'Light', isDefault: true },
    { id: 'dark', name: 'Dark' }
  ] as ThemeDefinition[],
  
  currentTheme: 'light',
  
  selectedCategories: new Set<string>(['action', 'background', 'text', 'border', 'status']),
  
  // Маппинг семантических токенов на примитивы
  semanticMappings: {
    // Action - интерактивные элементы
    action: [
      { token: 'action/primary', light: 'brand-500', dark: 'brand-400', desc: 'Primary action' },
      { token: 'action/primary-hover', light: 'brand-600', dark: 'brand-300', desc: 'Primary hover' },
      { token: 'action/primary-active', light: 'brand-700', dark: 'brand-200', desc: 'Primary active' },
      { token: 'action/secondary', light: 'neutral-100', dark: 'neutral-800', desc: 'Secondary action' },
      { token: 'action/secondary-hover', light: 'neutral-200', dark: 'neutral-700', desc: 'Secondary hover' },
      { token: 'action/disabled', light: 'neutral-300', dark: 'neutral-600', desc: 'Disabled state' },
    ],
    
    // Background - фоны
    background: [
      { token: 'background/primary', light: 'neutral-25', dark: 'neutral-950', desc: 'Main background' },
      { token: 'background/secondary', light: 'neutral-50', dark: 'neutral-900', desc: 'Secondary bg' },
      { token: 'background/tertiary', light: 'neutral-100', dark: 'neutral-850', desc: 'Tertiary bg' },
      { token: 'background/elevated', light: 'neutral-25', dark: 'neutral-800', desc: 'Elevated surfaces' },
      { token: 'background/overlay', light: 'neutral-900', dark: 'neutral-25', desc: 'Overlay bg' },
      { token: 'background/brand', light: 'brand-50', dark: 'brand-950', desc: 'Brand background' },
    ],
    
    // Text - текст
    text: [
      { token: 'text/primary', light: 'neutral-900', dark: 'neutral-50', desc: 'Primary text' },
      { token: 'text/secondary', light: 'neutral-600', dark: 'neutral-400', desc: 'Secondary text' },
      { token: 'text/tertiary', light: 'neutral-400', dark: 'neutral-500', desc: 'Tertiary text' },
      { token: 'text/disabled', light: 'neutral-300', dark: 'neutral-600', desc: 'Disabled text' },
      { token: 'text/inverse', light: 'neutral-25', dark: 'neutral-950', desc: 'Inverse text' },
      { token: 'text/brand', light: 'brand-600', dark: 'brand-400', desc: 'Brand text' },
      { token: 'text/link', light: 'brand-500', dark: 'brand-400', desc: 'Link text' },
    ],
    
    // Border - границы
    border: [
      { token: 'border/default', light: 'neutral-200', dark: 'neutral-700', desc: 'Default border' },
      { token: 'border/strong', light: 'neutral-300', dark: 'neutral-600', desc: 'Strong border' },
      { token: 'border/subtle', light: 'neutral-100', dark: 'neutral-800', desc: 'Subtle border' },
      { token: 'border/focus', light: 'brand-500', dark: 'brand-400', desc: 'Focus ring' },
      { token: 'border/error', light: 'error-500', dark: 'error-400', desc: 'Error border' },
    ],
    
    // Status - статусные цвета
    status: [
      { token: 'status/success', light: 'success-500', dark: 'success-400', desc: 'Success' },
      { token: 'status/success-bg', light: 'success-50', dark: 'success-950', desc: 'Success bg' },
      { token: 'status/warning', light: 'warning-500', dark: 'warning-400', desc: 'Warning' },
      { token: 'status/warning-bg', light: 'warning-50', dark: 'warning-950', desc: 'Warning bg' },
      { token: 'status/error', light: 'error-500', dark: 'error-400', desc: 'Error' },
      { token: 'status/error-bg', light: 'error-50', dark: 'error-950', desc: 'Error bg' },
      { token: 'status/info', light: 'info-500', dark: 'info-400', desc: 'Info' },
      { token: 'status/info-bg', light: 'info-50', dark: 'info-950', desc: 'Info bg' },
    ],
  } as Record<string, Array<{ token: string; light: string; dark: string; desc: string }>>,
};

// ============================================
// ФУНКЦИИ РАБОТЫ С ТЕМАМИ
// ============================================

/**
 * Синхронизирует темы из Primitives с вкладкой Tokens
 */
function syncThemesFromPrimitives(): void {
  const primitivesThemes = getThemes();
  
  // Очищаем текущие темы и добавляем все режимы из примитивов
  tokensState.themes = [];
  
  for (const theme of primitivesThemes) {
    if (theme.hasLightMode) {
      const modeName = theme.id === 'default' ? 'light' : `${theme.id}-light`;
      const displayName = theme.id === 'default' ? 'Light' : `${theme.name} Light`;
      tokensState.themes.push({
        id: modeName,
        name: displayName,
        isDefault: theme.isSystem && modeName === 'light',
      });
    }
    if (theme.hasDarkMode) {
      const modeName = theme.id === 'default' ? 'dark' : `${theme.id}-dark`;
      const displayName = theme.id === 'default' ? 'Dark' : `${theme.name} Dark`;
      tokensState.themes.push({
        id: modeName,
        name: displayName,
        isDefault: theme.isSystem && modeName === 'dark',
      });
    }
  }
  
  // Убедимся что выбранная тема существует
  if (!tokensState.themes.find(t => t.id === tokensState.currentTheme)) {
    tokensState.currentTheme = tokensState.themes[0]?.id || 'light';
  }
}

export function addTheme(name: string): ThemeDefinition {
  const id = name.toLowerCase().replace(/\s+/g, '-');
  const theme: ThemeDefinition = { id, name };
  tokensState.themes.push(theme);
  return theme;
}

export function removeTheme(themeId: string): void {
  // Нельзя удалить дефолтные темы
  const theme = tokensState.themes.find(t => t.id === themeId);
  if (theme?.isDefault) return;
  
  tokensState.themes = tokensState.themes.filter(t => t.id !== themeId);
  if (tokensState.currentTheme === themeId) {
    tokensState.currentTheme = 'light';
  }
}

export function setCurrentTheme(themeId: string): void {
  tokensState.currentTheme = themeId;
}

// ============================================
// ГЕНЕРАЦИЯ ТОКЕНОВ
// ============================================

/**
 * Находит примитив по имени цвета
 * Имя цвета: "brand-500", "neutral-100", etc.
 */
function findPrimitiveByColorName(colorName: string): TokenDefinition | undefined {
  const state = getState();
  const tokens = state.tokens;
  
  // Ищем токен с именем, точно совпадающим с colorName
  // Примитивы имеют формат: "brand-500", "neutral-100", etc.
  return tokens.find(token => {
    if (token.collection !== 'Primitives') return false;
    if (token.type !== 'COLOR') return false;
    
    // Точное совпадение имени
    return token.name.toLowerCase() === colorName.toLowerCase();
  });
}

/**
 * Генерирует семантические токены для выбранных категорий
 */
export function generateSemanticTokens(): boolean {
  // Проверяем наличие примитивов
  if (!hasPrimitives()) {
    showNotification('❌ Сначала создайте примитивы (цвета) на вкладке "Примитивы"', true);
    return false;
  }
  
  const currentProduct = getCurrentProduct();
  
  const categories = Array.from(tokensState.selectedCategories);
  let createdCount = 0;
  let skippedCount = 0;
  const state = getState();
  
  categories.forEach(categoryKey => {
    const mappings = tokensState.semanticMappings[categoryKey];
    if (!mappings) return;
    
    mappings.forEach(mapping => {
      // Для каждой темы создаем токен
      tokensState.themes.forEach(theme => {
        const primitiveRef = (mapping as any)[theme.id] || mapping.light;
        if (!primitiveRef) return;
        
        // Находим примитив
        const primitive = findPrimitiveByColorName(primitiveRef);
        
        // Формируем path для токена
        // Структура: {category}/{name} (без theme - темы через modes в Figma)
        // Пример: action/primary, background/elevated, text/primary
        const tokenPathStr = mapping.token;
        const tokenPathArr = tokenPathStr.split('/').slice(0, -1); // все кроме последнего элемента
        const tokenName = mapping.token.split('/').pop() || mapping.token;
        // fullPath не включает productId - это чистый путь токена
        const fullPath = tokenPathStr;
        
        // Проверяем, существует ли уже
        const existingToken = state.tokens.find(
          t => t.fullPath === fullPath && t.collection === 'Tokens'
        );
        
        if (existingToken) {
          skippedCount++;
          return;
        }
        
        // Создаем токен
        let value: TokenDefinition['value'];
        let referenceInfo: { light: string; dark?: string } | undefined;
        
        if (primitive) {
          // Если нашли примитив - ссылаемся на него
          value = primitive.value;
          referenceInfo = { light: primitive.fullPath };
        } else {
          // Если не нашли - создаем placeholder (значения в формате 0-1 для Figma)
          value = { hex: '#808080', rgba: { r: 0.5, g: 0.5, b: 0.5, a: 1 } };
          console.warn(`Primitive not found: ${primitiveRef} for token ${tokenPathStr}`);
        }
        
        createToken({
          name: tokenName,
          path: tokenPathArr,
          fullPath,
          type: 'COLOR',
          value,
          collection: 'Tokens',
          references: referenceInfo,
          description: mapping.desc,
          tags: [theme.id, categoryKey, primitiveRef],
        });
        
        createdCount++;
      });
    });
  });
  
  console.log(`Generated ${createdCount} tokens, skipped ${skippedCount} existing`);
  
  // Отправляем событие обновления
  window.dispatchEvent(new CustomEvent('tokens-updated'));
  
  return true;
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

// ============================================
// UTILITIES
// ============================================

function showNotification(message: string, isError = false): void {
  const notification = document.getElementById('notification');
  if (!notification) return;
  
  notification.textContent = message;
  notification.classList.toggle('error', isError);
  notification.classList.add('show');
  setTimeout(() => notification.classList.remove('show'), 3000);
}

export function initTokensTab(): void {
  // Синхронизируем темы из примитивов при инициализации
  syncThemesFromPrimitives();
  
  // Слушаем события изменения тем в примитивах
  window.addEventListener('themes-updated', () => {
    syncThemesFromPrimitives();
    showNotification('🎨 Темы синхронизированы');
  });
  
  // Обработчики категорий
  document.querySelectorAll('.token-category-card').forEach(card => {
    const category = card.getAttribute('data-category');
    if (!category) return;
    
    // Изначально все выбраны
    card.classList.add('selected');
    
    card.addEventListener('click', () => {
      if (tokensState.selectedCategories.has(category)) {
        tokensState.selectedCategories.delete(category);
        card.classList.remove('selected');
      } else {
        tokensState.selectedCategories.add(category);
        card.classList.add('selected');
      }
    });
  });
  
  // Обработчик генерации токенов
  const btnGenerate = document.getElementById('btn-generate-tokens');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', () => {
      if (generateSemanticTokens()) {
        showNotification('🏷 Семантические токены сгенерированы!');
      }
    });
  }
  
  const btnGenerateFromPrimitives = document.getElementById('btn-generate-tokens-from-primitives');
  if (btnGenerateFromPrimitives) {
    btnGenerateFromPrimitives.addEventListener('click', () => {
      if (generateSemanticTokens()) {
        showNotification('🔗 Токены созданы из примитивов!');
      }
    });
  }
  
  // Проверяем состояние при инициализации
  updateTokensTabState();
  
  // Слушаем события обновления примитивов
  document.addEventListener('tokens-generated', updateTokensTabState);
  window.addEventListener('tokens-updated', updateTokensTabState);
}

// Экспорт для глобального доступа
(window as any).tokensGenerator = {
  addTheme,
  removeTheme,
  setCurrentTheme,
  generateSemanticTokens,
  tokensState,
  hasPrimitives,
  updateTokensTabState,
};
