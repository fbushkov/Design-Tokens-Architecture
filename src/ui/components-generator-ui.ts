/**
 * Components Generator UI
 * Управление токенами компонентов (уровень 3: Primitives → Tokens → Components)
 * Components ссылаются на Tokens
 */

import { getState, createToken } from '../types/token-manager-state';
import { TokenDefinition } from '../types/token-manager';
import { productState, getCurrentProduct } from './primitives-generator-ui';
import { tokensState, hasPrimitives, updateTokensTabState } from './tokens-generator-ui';

// ============================================
// ВАЛИДАЦИЯ ТОКЕНОВ
// ============================================

/**
 * Проверяет, есть ли созданные семантические токены
 */
export function hasSemanticTokens(): boolean {
  const state = getState();
  const semanticTokens = state.tokens.filter(
    t => t.collection === 'Tokens' && t.type === 'COLOR'
  );
  return semanticTokens.length > 0;
}

/**
 * Обновляет состояние вкладки Components (disabled/enabled)
 * Вкладка доступна если есть примитивы (для просмотра)
 * Но генерация требует также семантические токены
 */
export function updateComponentsTabState(): void {
  const hasPrims = hasPrimitives();
  const hasSemTokens = hasSemanticTokens();
  
  // Вкладка доступна если есть примитивы (как и Tokens)
  const tabEnabled = hasPrims;
  // Генерация доступна только если есть и примитивы, и семантические токены
  const canGenerate = hasPrims && hasSemTokens;
  
  const tab = document.querySelector('[data-tab="components"]') as HTMLButtonElement;
  const warningBox = document.getElementById('components-no-tokens-warning');
  const contentSection = document.getElementById('components-content-section');
  const generateBtn = document.getElementById('btn-generate-components') as HTMLButtonElement;
  
  if (tab) {
    tab.classList.toggle('disabled', !tabEnabled);
    tab.title = tabEnabled ? '' : 'Сначала создайте примитивы';
  }
  
  // Показываем предупреждение если нет примитивов ИЛИ нет токенов
  if (warningBox) {
    if (!hasPrims) {
      warningBox.style.display = 'block';
      warningBox.innerHTML = `
        <div class="warning-icon">⚠️</div>
        <div class="warning-text">
          <strong>Нет примитивов</strong><br>
          Сначала создайте цвета на вкладке <a href="#" class="goto-tab" data-target="primitives">🎨 Примитивы</a>
        </div>
      `;
    } else if (!hasSemTokens) {
      warningBox.style.display = 'block';
      warningBox.innerHTML = `
        <div class="warning-icon">💡</div>
        <div class="warning-text">
          <strong>Нет семантических токенов</strong><br>
          Для генерации компонентов сначала создайте токены на вкладке <a href="#" class="goto-tab" data-target="tokens">🏷 Токены</a>
        </div>
      `;
    } else {
      warningBox.style.display = 'none';
    }
  }
  
  // Контент показываем если есть примитивы
  if (contentSection) {
    contentSection.style.display = hasPrims ? 'block' : 'none';
  }
  
  // Кнопка генерации доступна только если есть токены
  if (generateBtn) {
    generateBtn.disabled = !canGenerate;
    generateBtn.title = canGenerate ? '' : 'Сначала создайте семантические токены на вкладке "Токены"';
  }
}

// ============================================
// ТИПЫ И ИНТЕРФЕЙСЫ
// ============================================

interface ComponentTokenMapping {
  token: string;
  reference: string; // ссылка на semantic token (без темы)
  desc: string;
}

// ============================================
// СОСТОЯНИЕ
// ============================================

export const componentsState = {
  selectedComponents: new Set<string>(['button', 'input', 'card', 'badge', 'alert', 'nav']),
  
  // Маппинг токенов компонентов на семантические токены
  componentMappings: {
    button: [
      // Primary Button
      { token: 'button/primary/background', reference: 'action/primary', desc: 'Primary btn bg' },
      { token: 'button/primary/background-hover', reference: 'action/primary-hover', desc: 'Primary btn hover' },
      { token: 'button/primary/background-active', reference: 'action/primary-active', desc: 'Primary btn active' },
      { token: 'button/primary/text', reference: 'text/inverse', desc: 'Primary btn text' },
      { token: 'button/primary/border', reference: 'action/primary', desc: 'Primary btn border' },
      // Secondary Button  
      { token: 'button/secondary/background', reference: 'action/secondary', desc: 'Secondary btn bg' },
      { token: 'button/secondary/background-hover', reference: 'action/secondary-hover', desc: 'Secondary btn hover' },
      { token: 'button/secondary/text', reference: 'text/primary', desc: 'Secondary btn text' },
      { token: 'button/secondary/border', reference: 'border/default', desc: 'Secondary btn border' },
      // Disabled
      { token: 'button/disabled/background', reference: 'action/disabled', desc: 'Disabled btn bg' },
      { token: 'button/disabled/text', reference: 'text/disabled', desc: 'Disabled btn text' },
    ],
    
    input: [
      { token: 'input/background', reference: 'background/primary', desc: 'Input bg' },
      { token: 'input/background-focus', reference: 'background/elevated', desc: 'Input focus bg' },
      { token: 'input/text', reference: 'text/primary', desc: 'Input text' },
      { token: 'input/placeholder', reference: 'text/tertiary', desc: 'Placeholder' },
      { token: 'input/border', reference: 'border/default', desc: 'Input border' },
      { token: 'input/border-focus', reference: 'border/focus', desc: 'Focus border' },
      { token: 'input/border-error', reference: 'border/error', desc: 'Error border' },
      { token: 'input/label', reference: 'text/secondary', desc: 'Label text' },
      { token: 'input/helper', reference: 'text/tertiary', desc: 'Helper text' },
      { token: 'input/error', reference: 'status/error', desc: 'Error text' },
    ],
    
    card: [
      { token: 'card/background', reference: 'background/elevated', desc: 'Card bg' },
      { token: 'card/background-hover', reference: 'background/secondary', desc: 'Card hover' },
      { token: 'card/border', reference: 'border/subtle', desc: 'Card border' },
      { token: 'card/title', reference: 'text/primary', desc: 'Card title' },
      { token: 'card/description', reference: 'text/secondary', desc: 'Card desc' },
      { token: 'card/divider', reference: 'border/default', desc: 'Card divider' },
    ],
    
    badge: [
      // Default
      { token: 'badge/default/background', reference: 'background/tertiary', desc: 'Default badge bg' },
      { token: 'badge/default/text', reference: 'text/primary', desc: 'Default badge text' },
      // Success
      { token: 'badge/success/background', reference: 'status/success-bg', desc: 'Success badge bg' },
      { token: 'badge/success/text', reference: 'status/success', desc: 'Success badge text' },
      // Warning
      { token: 'badge/warning/background', reference: 'status/warning-bg', desc: 'Warning badge bg' },
      { token: 'badge/warning/text', reference: 'status/warning', desc: 'Warning badge text' },
      // Error
      { token: 'badge/error/background', reference: 'status/error-bg', desc: 'Error badge bg' },
      { token: 'badge/error/text', reference: 'status/error', desc: 'Error badge text' },
      // Info
      { token: 'badge/info/background', reference: 'status/info-bg', desc: 'Info badge bg' },
      { token: 'badge/info/text', reference: 'status/info', desc: 'Info badge text' },
    ],
    
    alert: [
      // Success Alert
      { token: 'alert/success/background', reference: 'status/success-bg', desc: 'Success alert bg' },
      { token: 'alert/success/border', reference: 'status/success', desc: 'Success alert border' },
      { token: 'alert/success/icon', reference: 'status/success', desc: 'Success alert icon' },
      { token: 'alert/success/title', reference: 'text/primary', desc: 'Success alert title' },
      { token: 'alert/success/text', reference: 'text/secondary', desc: 'Success alert text' },
      // Warning Alert
      { token: 'alert/warning/background', reference: 'status/warning-bg', desc: 'Warning alert bg' },
      { token: 'alert/warning/border', reference: 'status/warning', desc: 'Warning alert border' },
      { token: 'alert/warning/icon', reference: 'status/warning', desc: 'Warning alert icon' },
      { token: 'alert/warning/title', reference: 'text/primary', desc: 'Warning alert title' },
      { token: 'alert/warning/text', reference: 'text/secondary', desc: 'Warning alert text' },
      // Error Alert
      { token: 'alert/error/background', reference: 'status/error-bg', desc: 'Error alert bg' },
      { token: 'alert/error/border', reference: 'status/error', desc: 'Error alert border' },
      { token: 'alert/error/icon', reference: 'status/error', desc: 'Error alert icon' },
      { token: 'alert/error/title', reference: 'text/primary', desc: 'Error alert title' },
      { token: 'alert/error/text', reference: 'text/secondary', desc: 'Error alert text' },
      // Info Alert
      { token: 'alert/info/background', reference: 'status/info-bg', desc: 'Info alert bg' },
      { token: 'alert/info/border', reference: 'status/info', desc: 'Info alert border' },
      { token: 'alert/info/icon', reference: 'status/info', desc: 'Info alert icon' },
      { token: 'alert/info/title', reference: 'text/primary', desc: 'Info alert title' },
      { token: 'alert/info/text', reference: 'text/secondary', desc: 'Info alert text' },
    ],
    
    nav: [
      { token: 'nav/background', reference: 'background/primary', desc: 'Nav bg' },
      { token: 'nav/border', reference: 'border/default', desc: 'Nav border' },
      { token: 'nav/item/text', reference: 'text/secondary', desc: 'Nav item text' },
      { token: 'nav/item/text-hover', reference: 'text/primary', desc: 'Nav item hover' },
      { token: 'nav/item/text-active', reference: 'text/brand', desc: 'Nav item active' },
      { token: 'nav/item/background-hover', reference: 'background/secondary', desc: 'Nav item hover bg' },
      { token: 'nav/item/background-active', reference: 'background/brand', desc: 'Nav item active bg' },
      { token: 'nav/item/indicator', reference: 'action/primary', desc: 'Active indicator' },
    ],
  } as Record<string, ComponentTokenMapping[]>,
};

// ============================================
// ГЕНЕРАЦИЯ КОМПОНЕНТОВ
// ============================================

/**
 * Находит семантический токен по пути (без темы)
 */
function findSemanticToken(semanticPath: string, productId: string, themeId: string): TokenDefinition | undefined {
  const state = getState();
  const tokens = state.tokens;
  
  // Ищем токен в коллекции Tokens с нужной темой
  // Путь будет: tokens/{theme}/{semanticPath}
  const fullTokenPath = `${productId}/tokens/${themeId}/${semanticPath}`;
  
  return tokens.find(token => {
    if (token.collection !== 'Tokens') return false;
    return token.fullPath === fullTokenPath;
  });
}

/**
 * Генерирует токены компонентов для выбранных компонентов
 */
export function generateComponentTokens(): boolean {
  // Проверяем наличие примитивов
  if (!hasPrimitives()) {
    showNotification('❌ Сначала создайте примитивы (цвета) на вкладке "Примитивы"', true);
    return false;
  }
  
  // Проверяем наличие семантических токенов
  if (!hasSemanticTokens()) {
    showNotification('❌ Сначала создайте семантические токены на вкладке "Токены"', true);
    return false;
  }
  
  const currentProduct = getCurrentProduct();
  if (!currentProduct) {
    showNotification('❌ Выберите продукт', true);
    return false;
  }
  
  const components = Array.from(componentsState.selectedComponents);
  let createdCount = 0;
  let skippedCount = 0;
  
  components.forEach(componentKey => {
    const mappings = componentsState.componentMappings[componentKey];
    if (!mappings) return;
    
    mappings.forEach(mapping => {
      // Для каждой темы создаем токен компонента
      tokensState.themes.forEach(theme => {
        // Находим семантический токен для этой темы
        const semanticToken = findSemanticToken(mapping.reference, currentProduct.id, theme.id);
        
        // Формируем path для токена компонента
        // Структура: components/{theme}/{component}/{...path}
        const tokenPathStr = `components/${theme.id}/${mapping.token}`;
        const tokenPathArr = tokenPathStr.split('/').slice(0, -1);
        const tokenName = mapping.token.split('/').pop() || mapping.token;
        const fullPath = `${currentProduct.id}/${tokenPathStr}`;
        
        // Проверяем, существует ли уже
        const state = getState();
        const existingToken = state.tokens.find(
          t => t.fullPath === fullPath
        );
        
        if (existingToken) {
          skippedCount++;
          return;
        }
        
        // Создаем токен
        let value: TokenDefinition['value'];
        let referenceInfo: { light: string; dark?: string } | undefined;
        
        if (semanticToken) {
          // Если нашли семантический токен - ссылаемся на него
          value = semanticToken.value;
          referenceInfo = { light: semanticToken.fullPath };
        } else {
          // Если не нашли - создаем placeholder (значения в формате 0-1 для Figma)
          value = { hex: '#808080', rgba: { r: 0.5, g: 0.5, b: 0.5, a: 1 } };
          console.warn(`Semantic token not found: ${mapping.reference} for ${tokenPathStr}`);
        }
        
        createToken({
          name: tokenName,
          path: tokenPathArr,
          fullPath,
          type: 'COLOR',
          value,
          collection: 'Components',
          references: referenceInfo,
          description: mapping.desc,
          tags: [theme.id, componentKey, mapping.reference],
        });
        
        createdCount++;
      });
    });
  });
  
  console.log(`Generated ${createdCount} component tokens, skipped ${skippedCount} existing`);
  
  // Отправляем событие обновления
  window.dispatchEvent(new CustomEvent('tokens-updated'));
  
  return true;
}

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

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

export function initComponentsTab(): void {
  // Обработчики компонентов
  document.querySelectorAll('.component-card').forEach(card => {
    const component = card.getAttribute('data-component');
    if (!component) return;
    
    // Изначально все выбраны
    card.classList.add('selected');
    
    card.addEventListener('click', () => {
      if (componentsState.selectedComponents.has(component)) {
        componentsState.selectedComponents.delete(component);
        card.classList.remove('selected');
      } else {
        componentsState.selectedComponents.add(component);
        card.classList.add('selected');
      }
    });
  });
  
  // Обработчик генерации компонентов
  const btnGenerate = document.getElementById('btn-generate-components');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', () => {
      if (generateComponentTokens()) {
        showNotification('🧩 Компонентные токены сгенерированы!');
      }
    });
  }
  
  // Проверяем состояние при инициализации
  updateComponentsTabState();
  
  // Слушаем события обновления
  document.addEventListener('tokens-generated', updateComponentsTabState);
  window.addEventListener('tokens-updated', updateComponentsTabState);
}

// Экспорт для глобального доступа
(window as any).componentsGenerator = {
  generateComponentTokens,
  componentsState,
  hasSemanticTokens,
  updateComponentsTabState,
};
