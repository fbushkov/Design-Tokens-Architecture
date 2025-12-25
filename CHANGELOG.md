# 📝 Changelog - Design Tokens Plugin

## [2025-12-25] - Typography Line Height Enhancement 📐

### ✨ Добавлен line-height 115%

- **Новое значение**: `font/lineHeight/115` = 1.15 (115%)
- **Причина**: При font-size 14px и line-height 115% контейнер получается ровно 16px
- **Расчёт**: 14px × 1.15 = 16.1px ≈ 16px
- **Применение**: Оптимально для UI кнопок (Material Design, Apple HIG)

### 🔧 Улучшена миграция примитивов типографики

- При загрузке состояния автоматически добавляются новые line-heights из дефолтов
- Select в модалке редактирования токена обновляется после загрузки
- Это решает проблему, когда новые значения не появлялись в существующих проектах

---

## [2025-12-23] - Token Taxonomy Refactoring 🏗️

### ♻️ Рефакторинг именования токенов

Устранены когнитивные конфликты и дублирование в системе токенов.

#### `bg/interactive` → `bg/muted`
- **Проблема**: `interactive` конфликтовал с `action/` (оба "интерактивные")
- **Решение**: Переименовано в `muted` — приглушённые фоны для hover-областей
- **Применение**: list items, table rows, nav items, dropdown items

#### `stroke/` → объединён в `border/`
- **Проблема**: `stroke/` и `border/` дублировали друг друга
- **Решение**: Удалена категория `stroke/`, все токены теперь в `border/`
- **Примечание**: `stroke/width`, `stroke/style` остались (это Figma stroke properties)

#### Удалена категория `feedback/`
- **Проблема**: `feedback/success-surface` дублировал `bg/success/subtle`
- **Решение**: Компоненты теперь используют композицию:
  - `feedback/success-surface` → `bg/success/subtle`
  - `feedback/success-content` → `content/on-success`
  - `feedback/success-stroke` → `border/success`

#### `inverse` → `on-dark` / `dark`
- **Проблема**: "Inverse" было непонятным
- **Решение**: 
  - `bg/inverse` → `bg/dark` (тёмные фоны)
  - `content/inverse` → `content/on-dark` (контент на тёмном фоне)
  - `border/inverse` → `border/on-dark`

#### Унифицированы `on-*` токены в `content/`
- Все токены для контента на цветных поверхностях теперь в `content/`:
  - `content/on-brand`
  - `content/on-success`
  - `content/on-warning`
  - `content/on-error`
  - `content/on-info`
  - `content/on-dark`

#### Уточнена категория `surface/`
- `surface/` теперь только для контейнеров с границами:
  - `surface/card`, `surface/elevated`, `surface/modal`
  - `surface/popover`, `surface/drawer`, `surface/tooltip`
  - `surface/overlay`
- Удалены: `surface/page` (используй `bg/page`), `surface/inverse`

### 📊 Итоговая структура токенов

```
TOKENS/
├── bg/           → Области (page, muted, brand, success, dark, etc.)
├── surface/      → Контейнеры (card, modal, popover, tooltip, overlay)
├── text/         → Глобальный текст (primary, secondary, link, etc.)
├── content/      → Контент внутри компонентов (on-action-*, on-brand, on-dark)
├── border/       → Все границы (default, focus, error, brand, etc.)
├── action/       → Фоны кнопок (primary, secondary, ghost, danger)
├── icon/         → Глобальные иконки
└── divider/      → Разделители
```

### 📁 Изменённые файлы
- `src/plugin/code.ts` — SEMANTIC_COLOR_MAPPINGS и componentMappings

---

## [2025-12-23] - Component States Expansion & Transparent Primitive 🎨

### ✅ Добавлено

#### Transparent Base Color (Primitives)
- **Новый примитив**: `colors/transparent/transparent` = `rgba(0,0,0,0)`
- Добавлен в `baseColors` Map для поддержки ghost-кнопок
- UI: новая карточка с checkerboard preview в разделе Primitives

#### Ghost Action — полная поддержка transparent
- **До**: ghost-кнопки использовали `neutral` цвета для фона
- **После**: ghost использует `transparent` для default/focus/disabled состояний
- Hover/active остаются с subtle neutral фоном для обратной связи

#### Content Tokens для Ghost/Danger кнопок
- `content/on-action-ghost` → ссылается на `content/primary/primary`
- `content/on-action-ghost-disabled` → ссылается на `content/disabled/disabled`
- `content/on-action-danger` → ссылается на `content/on-action-primary`
- `content/on-action-danger-disabled` → ссылается на `content/disabled/disabled`

#### Расширенные компоненты

**Input** (было 13 → стало 19 токенов):
- `container-surface-disabled`
- `text-value-disabled`, `text-placeholder-disabled`, `text-label-disabled`
- `icon-disabled`, `icon-error`

**Card** (было 6 → стало 10 токенов):
- `container-surface-active`, `container-surface-selected`
- `container-stroke-hover`, `container-stroke-selected`

**Badge** (было 10 → стало 18 токенов):
- Borders для всех вариантов: `success-stroke`, `warning-stroke`, `error-stroke`, `info-stroke`, `neutral-stroke`
- **Новый brand вариант**: `brand-surface`, `brand-content`, `brand-stroke`

**Alert** (было 16 → стало 20 токенов):
- Link токены: `success-link`, `warning-link`, `error-link`, `info-link`

**Nav** (было 7 → стало 15 токенов):
- `item-surface-selected`, `item-surface-disabled`
- `item-content-hover`, `item-content-selected`, `item-content-disabled`
- `icon-hover`, `icon-selected`, `icon-disabled`

### 🔧 Исправлено

#### Token Naming для variant='default'
- **Проблема**: Токены с `variant: 'default'` получали суффикс `-default` (например `action/ghost/ghost-default`)
- **Решение**: `variant='default'` больше не добавляется к имени → `action/ghost/ghost`

#### Description Validation Error
- **Проблема**: `set_description: Property description failed validation`
- **Решение**: Добавлена проверка `if (varData.description)` перед присвоением

#### Tokens/Components Update Logic
- **До**: Генераторы пропускали существующие токены (SKIP)
- **После**: Генераторы обновляют существующие токены (UPDATE) для синхронизации изменений

### 📁 Изменённые файлы
- `src/plugin/code.ts` — ghost transparent, content tokens, component expansions, naming fix
- `src/ui/primitives-generator-ui.ts` — transparent в baseColors Map
- `src/ui/ui.html` — transparent color card с checkerboard CSS
- `src/ui/tokens-generator-ui.ts` — UPDATE вместо SKIP
- `src/ui/components-generator-ui.ts` — UPDATE вместо SKIP

### 📐 Архитектура ссылок

Компоненты ссылаются на Tokens (semantic), НЕ на Primitives напрямую:

```
Primitives:  colors/neutral/neutral-50
     ↓
Tokens:      bg/interactive/interactive-primary-active  →  neutral-100
     ↓
Components:  card/container-surface-active  →  bg/interactive/interactive-primary-active
```

---

## [2025-12-22] - Variable Scopes Implementation 🎯

### ✅ Добавлено

#### Variable Scopes — автоматическая настройка контекстов переменных
Figma Variable Scopes ограничивают где переменные показываются в property pickers.

**Реализованные категории:**
- **Primitives** → скрыты из всех pickers (дизайнеры используют семантические токены)
- **Spacing** → `WIDTH_HEIGHT` + `GAP` (padding, margin, gap)
- **Gap** → только `GAP` (Auto Layout gap)
- **Radius** → `CORNER_RADIUS`
- **Icon Size** → `WIDTH_HEIGHT`
- **Typography** → `FONT_SIZE`, `LINE_HEIGHT`, `LETTER_SPACING`, `FONT_WEIGHT`
- **Stroke colors** → `STROKE_COLOR` (не показываются в Fill picker)
- **Effect colors** → `EFFECT_COLOR` (только shadow/blur colors)
- **Effect floats** → `EFFECT_FLOAT` (opacity, blur, spread)
- **Stroke width** → `STROKE_FLOAT`

**Особенности:**
- Path-based detection для смешанных коллекций (stroke/..., effect/...)
- Primitives полностью скрыты (`scopes = []`)
- UI кнопка "Обновить Variable Scopes" в Token Manager

### 📁 Изменённые файлы
- `src/plugin/code.ts`:
  - `SCOPE_MAPPINGS` — маппинг категорий на Figma scopes
  - `getScopeCategoryByCollection()` — определение категории по коллекции/пути
  - `applyVariableScopes()` — применение scopes к переменным
  - Handler `update-variable-scopes` с детальным логированием
- `src/ui/token-manager-ui.ts` — кнопка UI

---

## [2025-12-22] - Bug Fixes: Spacing & Stroke Token Creation 🐛

### 🔧 Исправлено

#### Spacing: Дублирование токенов и конфликты переменных
- **Проблема**: При создании семантических Spacing токенов возникала ошибка `duplicate variable name`
- **Причина 1**: Дубликаты токенов в сохранённом состоянии (два `spacing.button.new.padding`)
- **Причина 2**: Переменная с таким именем уже существовала в другой коллекции
- **Решение**: 
  - Добавлена дедупликация токенов по `path` перед созданием (используется `Set`)
  - Добавлена проверка `allVariablesAnyType` для обнаружения конфликтов
  - FLOAT переменные из других коллекций переиспользуются вместо ошибки

#### Stroke: Invalid variable name `1.5`
- **Проблема**: Figma не позволяет использовать точки (`.`) в именах переменных
- **Решение**: 
  - Переименован примитив `1.5` → `1-5` в `stroke-tokens.ts`
  - Обновлены все ссылки `'1.5'` → `'1-5'` в `stroke-defaults.ts` (checkbox, radio)
  - Добавлен комментарий о Figma-ограничении

#### Icon Size: Упрощены примитивы
- Сокращён набор примитивов до 5 основных: 16, 24, 32, 48, 64
- Все семантические токены обновлены для использования только этих значений

### 📁 Изменённые файлы
- `src/plugin/code.ts` — дедупликация и conflict resolution
- `src/types/stroke-tokens.ts` — переименование `1.5` → `1-5`
- `src/types/stroke-defaults.ts` — обновление ссылок на `1-5`
- `src/types/icon-size-tokens.ts` — упрощённые примитивы

---

## [2025-12-19] - Tokens by Theme Export 🎨

### ✅ Добавлено

#### Новый формат экспорта "Tokens by Theme"
Flat структура семантических токенов, сгруппированных по темам — именно то, что нужно frontend-разработчикам:

**Особенности:**
- **Flat структура** — все токены на одном уровне (без вложенности)
- **Theme-first группировка** — `{ "light": {...}, "dark": {...} }`
- **Шаблонизация** — одинаковые ключи во всех темах
- **Только семантика** — экспорт коллекции Tokens (не Components)
- **kebab-case** — имена в формате `action-primary`, `bg-page-primary`

**Пример выходного JSON:**
```json
{
  "$schema": "tokens-by-theme",
  "$modes": ["light", "dark"],
  "light": {
    "action-primary": "#2781f3",
    "text-primary": "#19191a",
    "bg-page-primary": "#fcfcfc"
  },
  "dark": {
    "action-primary": "#2781f3",
    "text-primary": "#fcfcfc",
    "bg-page-primary": "#19191a"
  }
}
```

**Преобразование имён:**
- `action/primary/primary` → `action-primary`
- `action/primary/primary-hover` → `action-primary-hover`
- `bg/page/page-primary` → `bg-page-primary`

### 🔧 Технические детали

**Новые функции в code.ts:**
- `exportTokensByTheme()` — основная функция экспорта из коллекции Tokens
- `variableNameToFlatKey()` — преобразование пути переменной в flat kebab-case ключ

**Новый message handler:**
- `export-tokens-by-theme` — обработчик в code.ts
- `tokens-by-theme-exported` — обработчик результата в ui.ts

### 📁 Изменённые файлы
- `src/plugin/code.ts` — функции экспорта
- `src/ui/ui.ts` — обработчик нового формата
- `src/ui/ui.html` — опция в dropdown экспорта
- `src/ui/token-manager-ui.ts` — опция в настройках Token Manager
- `src/types/token-manager.ts` — обновлён тип exportFormat
- `src/utils/export-utils.ts` — обновлён тип ExportFormat

---

## [2025-12-19] - Frontend Export from Figma Variables 📤

### ✅ Добавлено

#### JSON Frontend Export — экспорт для разработчиков
Новый формат экспорта семантических токенов напрямую из Figma Variables:

**Особенности:**
- **Не требует генерации токенов** — читает данные прямо из Figma Variables
- **Deep Alias Resolution** — полное разрешение цепочек алиасов (Components → Tokens → Primitives)
- **Финальные значения** — HEX цвета, числа (не алиасы)
- **8 категорий**: colors, typography, spacing, gap, radius, iconSize, effects, grid

**Поддерживаемые коллекции Figma:**
| Коллекция | JSON категория |
|-----------|----------------|
| Components | colors |
| Typography | typography |
| Spacing | spacing |
| Gap | gap |
| Radius | radius |
| Icon Size | iconSize |
| Effects | effects |
| Grid | grid |

**Структура JSON:**
```json
{
  "$schema": "frontend-tokens",
  "$version": "1.0.0",
  "$timestamp": "2025-12-19T...",
  "colors": { "button": { "primary": { "primaryBg": "#2781f3" } } },
  "typography": { "page": { "hero": { "fontSize": 56, "lineHeight": 110 } } },
  "spacing": { ... },
  "gap": { ... },
  "radius": { ... },
  "iconSize": { ... },
  "effects": { ... },
  "grid": { ... }
}
```

**Использование:**
Token Manager → Export → "JSON (Frontend) — только семантика" → Export

### 🔧 Технические детали

**Новые функции в code.ts:**
- `resolveVariableToFinalValue()` — рекурсивное разрешение алиасов (до 10 уровней)
- `exportFrontendTokensFromFigma()` — основная функция экспорта из Figma Variables
- `toCamelCase()`, `toKebabCase()` — утилиты форматирования
- `frontendTokensToCss()`, `frontendTokensToScss()` — конвертеры (заготовка)

**Новый message handler:**
- `export-frontend-from-figma` — обработчик экспорта в code.ts
- `frontend-tokens-exported` — обработчик результата в ui.ts

**Оптимизации:**
- Удаление дублирования путей (categoryPrefixes) — `typography/typography/page` → `typography/page`
- Async API — использование `getVariableByIdAsync`, `getVariableCollectionByIdAsync`

### 📁 Изменённые файлы
- `src/plugin/code.ts` — функции экспорта, обработчики сообщений
- `src/ui/ui.ts` — обработчик frontend формата, download logic
- `src/ui/ui.html` — опция "JSON (Frontend)" в dropdown экспорта

---

## [2025-12-19] - Grid/Layout Token System ⊞

### ✅ Добавлено

#### Grid модуль — полная система Layout Grid токенов
2-уровневая архитектура (Primitives → Semantic) для управления сетками макетов:

**Архитектурное решение: Компонентный подход**
- Grid Styles организованы по **компонентам** (page, cards, form, dashboard), а не по устройствам
- Внутри каждого компонента — варианты Desktop/Tablet/Mobile
- Обоснование: одна сетка Desktop не подходит для всех случаев (форма ≠ галерея ≠ дашборд)
- Стандартная практика design systems (Material Design, Carbon, Ant Design)

**Level 1 — Примитивы (Primitives коллекция):**
- `grid/gutter/*` — расстояние между колонками (0, 4, 8, 12, 16, 20, 24, 32, 40, 48 px)
- `grid/margin/*` — отступ от края (0, 16, 20, 24, 32, 48, 64, 80, 96, 120, 160 px)
- `grid/container/*` — max-width контейнеров (480, 560, 640...1920 px)
- ⚠️ **НЕЗАВИСИМЫ от Gap и Spacing** — своя шкала значений

**Level 2 — Семантика (Grid коллекция с режимами):**
| Категория | Описание | Примеры токенов |
|-----------|----------|----------------|
| page | Основные сетки страниц | default, wide, fluid |
| content | Контентные области | narrow, prose |
| container | Контейнеры с max-width | default, narrow, medium, wide, modal.* |
| cards | Сетки карточек | default, compact, spacious |
| gallery | Галереи, медиа | default, compact, thumbnails, masonry |
| dashboard | Дашборды, виджеты | main, compact, metrics |
| form | Формы | single, double, triple, inline |
| list | Списки | single, double, triple |
| navigation | Навигация | header, megaMenu, sidebar |
| data | Таблицы данных | table |
| footer | Футеры | default, simple |
| custom | Пользовательские | кастомные категории |

**Режимы (Modes) в коллекции Grid:**
- Desktop — полная сетка (12 col, gutter 24, margin 64)
- Tablet — средняя (8 col, gutter 20, margin 32)
- Mobile — компактная (4 col, gutter 16, margin 16)

#### Grid Styles (Layout Guide Styles)
- Создаются реальные Grid Styles в Figma (как Color/Text/Effect Styles)
- Для каждого токена создаются 3 стиля: desktop, tablet, mobile
- Путь: `layout/grid/{category}/{name}/{device}`
- Пример: `layout/grid/page/default/desktop`

#### UI для Grid
- Вкладка "⊞ Grid" в секции Примитивы
- Подвкладки: Примитивы | Семантика | Экспорт
- 3 типа примитивов: Gutter, Margin, Container
- 12 категорий семантических токенов + кастомные
- Табличный редактор с inline-редактированием
- Применение сетки к выбранному фрейму
- CRUD операции с автоматическим сохранением

#### Grid Documentation Generator
- Кнопка "📖 Создать документацию" во вкладке Экспорт
- Создаёт страницу "📖 Grid Documentation" с 6 фреймами:
  1. **Архитектура Grid** — 2-уровневая система, примитивы, категории
  2. **Grid vs Container** — когда что использовать, отличия
  3. **Иерархия применения** — ASCII-диаграмма Page → Container → Grid → Elements
  4. **Правила для значений** — Columns, Gutter, Margin, Alignment по устройствам
  5. **Как добавлять** — пошаговая инструкция (тип → категория → конфигурация)
  6. **Шпаргалка** — Q&A, типичные конфигурации, математика сеток

### 🔧 Исправлено

#### Figma LayoutGrid API валидация
- **Проблема**: "invalid variable name" — Figma Variables API не принимает точки в именах
- **Решение**: `token.path.replace(/\./g, '/')` — точки → слеши

- **Проблема**: "Unrecognized key(s) in object: 'offset', 'sectionSize'"
- **Причина**: Figma LayoutGrid для `pattern: 'COLUMNS'` требует `offset` для всех alignment
- **Решение**: `offset` теперь передаётся всегда (не только для MIN/MAX)

### 📁 Новые файлы
- `src/types/grid-tokens.ts` — типы: GridPrimitive, GridSemanticToken, GridState, GridLayoutConfig
- `src/ui/grid-generator-ui.ts` — UI модуль (~600 строк): initGridUI(), renderGridPrimitives(), renderGridSemanticTokens()

### 📁 Изменённые файлы
- `src/plugin/code.ts`:
  - Функции: `createGridPrimitives()`, `createGridSemanticCollection()`, `createGridStyles()`, `applyGridToFrame()`
  - Обработчики: `create-grid-primitives`, `create-grid-semantic`, `create-grid-components`, `apply-grid-to-frame`
- `src/ui/ui.html` — секция prim-grid с CSS стилями для grid UI
- `src/ui/ui.ts` — импорт и инициализация GridUI
- `src/ui/storage-utils.ts` — ключ GRID_STATE
- `src/ui/token-manager-ui.ts` — добавлен 'grid' в PendingChange module type
- `src/types/index.ts` — экспорт grid-tokens

---

## [2025-12-18] - Stroke Color Reference Fix 🔧

### 🐛 Исправлено

#### Критическое исправление: colorRef для Stroke токенов
Проблема: Stroke semantic tokens использовали неправильные пути для цветов (`neutral.300`, `brand.500`), 
вместо правильных путей к Tokens коллекции (`stroke/default/default`, `stroke/focus/focus`).

**Изменения:**

1. **stroke-tokens.ts** — теперь импортирует `COMPLETE_STROKE_SEMANTIC_TOKENS` из `stroke-defaults.ts`
   - Убран дублирующий `DEFAULT_STROKE_SEMANTIC_TOKENS` со старыми colorRef
   - Добавлен реэкспорт из stroke-defaults.ts с правильными путями

2. **stroke-defaults.ts** — содержит правильные colorRef:
   - `stroke/subtle/subtle` — тонкие границы
   - `stroke/default/default` — стандартные границы
   - `stroke/default/default-hover` — hover состояние
   - `stroke/strong/strong` — усиленные границы
   - `stroke/focus/focus` — фокус состояние
   - `stroke/error/error` — ошибки
   - `stroke/disabled/disabled` — неактивное состояние
   - `feedback/success-stroke/success-stroke` — успех
   - `feedback/warning-stroke/warning-stroke` — предупреждение
   - `feedback/info-stroke/info-stroke` — информация

3. **stroke-generator-ui.ts** — обновлён UI:
   - `getColorOptions()` — выпадающий список теперь содержит правильные пути к Tokens
   - `addStrokeSemanticToken()` — новые токены создаются с `colorRef: 'stroke/default/default'`

**Архитектура цветов Stroke:**
```
Stroke (коллекция)
  └── stroke/button/default/color → alias → Tokens.stroke/default/default
  └── stroke/button/focus/color → alias → Tokens.stroke/focus/focus
  └── stroke/input/error/color → alias → Tokens.stroke/error/error
```

---

## [2025-12-18] - Stroke (Border) Token System 🔲

### ✅ Добавлено

#### Stroke модуль — полная система границ элементов
2-уровневая архитектура (Primitives → Semantic) для управления границами:

**Level 1 — Примитивы:**
- `stroke.width.*` — толщина границ (0, 0.5, 1, 1.5, 2, 3, 4, 6, 8 px) — FLOAT
- `stroke.style.*` — стили границ (solid, dashed, dotted, none) — STRING
- `stroke.dashArray.*` — паттерны пунктира (2-2, 4-2, 4-4, 6-3, 8-4, 1-2) — STRING
- Возможность добавлять кастомные примитивы через UI

**Level 2 — Семантика (35+ категорий, ~300 токенов):**
| Категория | Описание | Примеры токенов |
|-----------|----------|-----------------|
| base | Базовые границы | default, subtle, strong, inverse |
| button | Кнопки | default, hover, active, focus, disabled |
| input | Поля ввода | default, hover, focus, error, success, disabled |
| checkbox/radio/switch | Контролы | default, checked, disabled |
| card | Карточки | default, hover, selected, interactive |
| modal | Модальные окна | container, header, footer |
| dropdown | Выпадающие меню | container, item, separator |
| table | Таблицы | row, cell, header |
| divider | Разделители | default, strong, subtle, decorative, vertical, section |
| alert | Уведомления | info, success, warning, error |
| tabs | Вкладки | default, active, indicator |
| navigation | Навигация | item, active, separator |
| accent | Акцентные | brand, primary, secondary, success, warning, error |
| interactive | Интерактивные | default, hover, active, focus |
| ... | +20 категорий | badge, tag, chip, avatar, list, menu, и др. |

**Свойства семантических токенов:**
- `property: 'width' | 'style' | 'color'` — тип свойства
- `widthRef` — ссылка на примитив толщины
- `styleRef` — ссылка на примитив стиля
- `colorRef` — ссылка на семантический цвет из коллекции Tokens

#### UI для Stroke
- Вкладка "🔲 Borders" в секции Примитивы
- Вкладки: Примитивы | Семантика | Экспорт
- 3 подвкладки примитивов: Width, Style, Dash Array
- Категории семантических токенов с выпадающим списком фильтрации
- Редактируемые таблицы с превью
- CRUD операции с автоматическим сохранением в clientStorage
- Трекинг изменений в Token Manager

#### Экспорт в Figma
- **Экспорт примитивов** → коллекция `Primitives`:
  - `stroke.width.*` — FLOAT переменные
  - `stroke.style.*` — STRING переменные  
  - `stroke.dashArray.*` — STRING переменные
- **Экспорт семантики** → коллекция `Stroke`:
  - WIDTH токены — алиасы на stroke.width.* примитивы
  - STYLE токены — алиасы на stroke.style.* примитивы
  - COLOR токены — алиасы на colors/border/* из Tokens

### 📁 Новые файлы
- `src/types/stroke-tokens.ts` — типы: StrokeWidthPrimitive, StrokeStylePrimitive, StrokeDashArrayPrimitive, StrokeSemanticToken, StrokeState
- `src/types/stroke-defaults.ts` — ~300 дефолтных семантических токенов (COMPLETE_STROKE_SEMANTIC_TOKENS)
- `src/ui/stroke-generator-ui.ts` — UI модуль (~820 строк): initStrokeUI(), renderStrokePrimitives(), renderStrokeSemanticTokens(), exportStrokePrimitivesToFigma(), exportStrokeSemanticToFigma()

### 📁 Изменённые файлы
- `src/plugin/code.ts`:
  - Обработчики: `create-stroke-primitives`, `create-stroke-semantic`
  - Функции: `createStrokePrimitives()`, `createStrokeSemanticCollection()`
- `src/ui/ui.html` — секция prim-borders с CSS стилями для stroke UI
- `src/ui/ui.ts` — импорт и инициализация StrokeUI
- `src/ui/storage-utils.ts` — ключ STROKE_STATE
- `src/ui/token-manager-ui.ts` — добавлен 'stroke' в PendingChange module type

---

## [2025-12-18] - Base Colors & Performance Optimization 🎨⚡

### ✅ Добавлено

#### Редактируемые Base Colors
- **White** и **Black** теперь можно редактировать в UI
- Дефолтные значения: White = `#FCFCFC`, Black = `#19191A`
- Добавлены бейджи с назначением: "фон", "текст", "overlay 30%", "overlay 70%"
- Удалены кнопки блокировки — все base colors теперь редактируемы

#### Semantic Tokens — поддержка useBaseColor
- Новое поле `useBaseColor` в SemanticColorMapping для прямых ссылок на base colors
- Light theme: `bg/page/primary` → white, `text/primary` → black
- Dark theme: `bg/page/primary` → black, `text/primary` → white
- Overlay backgrounds используют `transparent-light` (30%) и `transparent-dark` (70%)
- Inverse text и on-color text корректно ссылаются на base colors

#### Статистика синхронизации
- Token Manager отображает результаты синхронизации: примитивы, токены, компоненты
- Индикатор источника данных: "(из Figma)", "(последняя синхр.)", "(локально)"
- Обработчик `themes-synced` с детальной статистикой

### 🔧 Исправлено

#### Ошибка дублирования переменных
- **Проблема**: При повторной синхронизации возникала ошибка "Variable already exists"
- **Решение**: Функция `createVariable()` теперь проверяет существование перед созданием
- Добавлены Set'ы для отслеживания: `processedPrimitiveNames`, `createdTokenNames`, `createdComponentNames`

#### Критическая оптимизация производительности ⚡
- **Проблема**: Синхронизация 221 примитива занимала очень много времени (зависание)
- **Причина**: `getLocalVariablesAsync()` вызывался для **каждой** переменной в `createVariable()`
- **Решение**: Добавлен кэш переменных `existingVariablesCache`:
  - `invalidateVariablesCache()` — сброс в начале синхронизации
  - `getCachedVariables()` — возврат кэша или загрузка один раз
  - **Результат**: ~200x ускорение синхронизации

#### Прозрачные цвета с альфа-каналом
- **Проблема**: `transparent-light` и `transparent-dark` имели `a=1` вместо `0.3`/`0.7`
- **Причина**: Функция `addBaseColorsToTokenManager()` не парсила rgba формат
- **Решение**: Новая функция `parseColorValue()` обрабатывает hex, `rgba()` и `transparent`
- Теперь transparent-light = `rgba(0,0,0,0.3)`, transparent-dark = `rgba(0,0,0,0.7)` ✅

#### Ошибка токена tooltip
- **Проблема**: `content/inverse/inverse-primary` не найден
- **Решение**: Исправлено на `content/inverse/inverse`

### 📁 Изменённые файлы
- `src/plugin/code.ts` — кэш переменных, useBaseColor, статистика
- `src/ui/primitives-generator-ui.ts` — parseColorValue(), collectColorsForSync()
- `src/ui/token-manager-ui.ts` — renderStats() с источником данных
- `src/ui/ui.ts` — обработчик themes-synced
- `src/ui/ui.html` — редактируемые base colors с бейджами

---

## [2025-12-18] - Effects System Complete 🌑

### ✅ Добавлено

#### Effects модуль — полная система эффектов
2-уровневая архитектура (Primitives → Semantic) для теней, размытия и прозрачности:

**Level 1 — Примитивы:**
- `shadow/offsetX/` — смещение тени по X (-4 до +4 px)
- `shadow/offsetY/` — смещение тени по Y (-8 до +32 px)
- `shadow/blur/` — размытие тени (0-64 px)
- `shadow/spread/` — распространение тени (-12 до +8 px)
- `shadow/color/` — цвета теней (black, white, brand, error, success, warning с разной прозрачностью)
- `blur/` — backdrop blur (0-64 px)
- `opacity/` — прозрачность (0-100%)

**Level 2 — Семантика (12 категорий, ~50 токенов):**
| Категория | Описание | Примеры |
|-----------|----------|--------|
| elevation | Уровни высоты | raised, float, dropdown, popover, modal, dragging |
| focus | Состояния фокуса | default, error, success, soft |
| button | Тени кнопок | default, hover, active, primary |
| card | Тени карточек | default, hover, selected, interactive |
| input | Тени инпутов | focus, error, success |
| modal | Тени модальных окон | backdrop, container |
| dropdown | Тени выпадающих меню | container, popover, tooltip, toast |
| directional | Направленные тени | top, bottom, left, right |
| inset | Внутренние тени | subtle, default, deep, input, well |
| glow | Эффекты свечения | brand-subtle/default/intense, error, success, warning |
| backdrop | Backdrop blur | subtle, default, medium, strong, intense, modal, header |
| opacity | Прозрачность состояний | disabled, muted, subtle и др. |

#### Effect Styles — Figma стили эффектов 🎨
- Кнопка **"🎨 Создать стили эффектов"** в секции Effects
- Создание нативных Figma Effect Styles из семантических токенов
- Поддержка **DROP_SHADOW** и **INNER_SHADOW** с полными параметрами
- Поддержка **BACKGROUND_BLUR** для backdrop-эффектов
- Стили доступны в панели Local Styles → Effect styles

**Файлы:**
- `src/types/effects-tokens.ts` — типы и дефолтные значения
- `src/ui/effects-generator-ui.ts` — UI компонент с 3 кнопками экспорта
- `src/plugin/code.ts` — функции:
  - `createEffectsPrimitives()` — примитивы в Variables
  - `createEffectsSemanticCollection()` — семантика в Variables
  - `createEffectStyles()` — нативные Effect Styles

**UI:**
- Вкладка "🌑 Effects" в секции Примитивы
- Вкладки: Примитивы (первая) | Семантика
- 7 подвкладок примитивов: Offset X, Offset Y, Blur, Spread, Colors, Backdrop, Opacity
- 12 категорий семантических токенов с фильтрацией
- Превью теней, blur и opacity в реальном времени
- **3 кнопки экспорта:**
  - 📤 Экспорт примитивов → Primitives collection
  - 📤 Экспорт семантики → Effects collection (Variables)
  - 🎨 Создать стили эффектов → Effect Styles

### 🔧 Исправлено

#### Баг с именами цветов теней
- **Проблема**: Имена `black.10`, `brand.20` содержали точку, которую Figma интерпретирует как разделитель групп
- **Решение**: Точки заменены на дефисы (`black-10`, `brand-20`)
- **Миграция**: При загрузке плагина автоматически конвертируются старые данные из localStorage

#### CSS конфликты между Effects и Typography
- **Проблема**: Effects стили переопределяли классы Typography UI (`.semantic-tokens-list`, `.token-header` и др.)
- **Решение**: Все CSS классы Effects переименованы с префиксом `effect-` (`.effects-semantic-list`, `.effect-token-header` и др.)

#### Баг letterSpacing в Typography
- **Проблема**: `parseFloat('n025')` возвращал `NaN`, letterSpacing показывал 0 в Figma
- **Решение**: Используется строковый ключ напрямую вместо parseFloat для поиска примитива

---

## [2025-12-17] - Export Selected Changes & Token Manager Improvements 🎯

### ✅ Добавлено

#### Экспорт выбранных изменений
- Кнопка "Экспортировать выбранные изменения" во вкладке "Изменения"
- Таблица изменений с чекбоксами для выборочного экспорта
- Экспортируются только отмеченные токены, а не все
- После успешного экспорта изменения автоматически удаляются из списка

#### CRUD для всех модулей токенов
- **Spacing**: добавление/редактирование/удаление семантических токенов + кнопка Save
- **Gap**: добавление/редактирование/удаление семантических токенов + кнопка Save
- **Radius**: добавление/редактирование/удаление с редактируемой таблицей
- **Icon Size**: переработан UI на редактируемую таблицу с CRUD операциями
- **Typography**: добавление/удаление секций (категорий)

#### Трекинг изменений
- Все CRUD операции автоматически добавляют изменения в `pendingChanges`
- Изменения сохраняются в `figma.clientStorage` и восстанавливаются при перезагрузке
- Группировка изменений по модулям в UI

### 🔧 Исправлено

#### Критические баги экспорта
- **Storage keys mismatch**: UI сохранял в `'spacing-state'`, code.ts читал `'plagin-spacing-state'` — исправлены все ключи
- **JSON.parse ошибка**: данные уже объекты, не строки — убраны лишние `JSON.parse()`
- **Typography nested structure**: данные хранятся как `{ state: {...} }` — добавлена обработка вложенной структуры
- **Token matching**: исправлено сравнение `token.id` со строками из pendingChanges

#### Сообщения между UI и Plugin
- Добавлены обработчики `export-selected-complete` и `export-selected-error` в ui.ts

### 📁 Изменённые файлы
- `src/ui/token-manager-ui.ts` — экспорт выбранных изменений, трекинг
- `src/ui/spacing-generator-ui.ts` — CRUD + Save + трекинг
- `src/ui/gap-generator-ui.ts` — CRUD + Save + трекинг
- `src/ui/radius-generator-ui.ts` — CRUD с таблицей
- `src/ui/icon-size-generator-ui.ts` — переработан UI
- `src/ui/typography-generator-ui.ts` — трекинг изменений
- `src/ui/ui.ts` — новые обработчики сообщений
- `src/plugin/code.ts` — `export-selected-changes` handler, исправлены storage keys

---

## [2025-12-17] - figma.clientStorage Persistence 💾

### 🔧 Исправлено

#### Критический баг персистентности
- **Проблема**: `localStorage` НЕ работает в Figma plugin iframes — выдаёт `SecurityError: Storage is disabled inside 'data:' URLs`
- **Решение**: Полностью переписана система хранения на `figma.clientStorage` API

#### Архитектура хранения
Создан модуль `storage-utils.ts` с асинхронным API:
```typescript
storageGet<T>(key) → Promise<T | null>
storageSet(key, data) → Promise<void>
storageDelete(key) → Promise<void>
```

Коммуникация через postMessage между UI и plugin code:
- UI отправляет `storage-get`, `storage-set`, `storage-delete`
- Plugin code обрабатывает через `figma.clientStorage.getAsync/setAsync/deleteAsync`
- Ответы возвращаются через `storage-*-response`

#### Обновлённые модули
Все модули теперь используют асинхронное хранение:
- `primitives-generator-ui.ts` — цвета, палитры, темы
- `typography-generator-ui.ts` — типографика, включая "Адаптивный размер"
- `spacing-generator-ui.ts` — spacing токены
- `gap-generator-ui.ts` — gap токены  
- `radius-generator-ui.ts` — radius токены
- `icon-size-generator-ui.ts` — размеры иконок
- `token-manager-ui.ts` — глобальный сброс системы

#### Paint Styles
- Кнопка "Создать Paint Styles" теперь экспортирует компонентные цвета (Components collection)
- Fallback на Tokens → Primitives если Components пуст

### 📁 Новые файлы
- `src/ui/storage-utils.ts` — утилита асинхронного хранения

---

## [2025-12-17] - Radius System ⬜

### ✅ Добавлено

#### Полная система Radius токенов
2-уровневая архитектура border-radius (аналогично Spacing/Gap):

- **Примитивы** (12 значений): radius.0 — radius.full (9999px)
- **Семантика** (58 токенов) по 8 категориям:
  - `interactive` — кнопки, инпуты, чекбоксы, слайдеры
  - `container` — карточки, модалки, панели
  - `feedback` — алерты, бейджи, теги, чипы
  - `media` — аватары, изображения, видео
  - `form` — поля ввода, селекты, textarea
  - `data` — таблицы, графики, прогресс
  - `overlay` — модалки, drawer, диалоги
  - `special` — код, цитаты, callout

#### UI для Radius
- Вкладка "⬜ Радиусы" с 3 под-вкладками: Примитивы / Семантика / Экспорт
- Визуальное превью радиусов (скруглённые квадраты)
- Фильтрация по категориям
- Экспорт в Figma Variables

#### Документация Radius
- Кнопка "📖 Создать документацию" для генерации страницы в Figma
- Архитектурный фрейм с описанием системы на русском
- Визуальное представление всех токенов с превью скруглений

### 📁 Файлы
- `src/types/radius-tokens.ts` — типы и дефолтные значения
- `src/ui/radius-generator-ui.ts` — UI логика
- Обновлены: `ui.html`, `ui.ts`, `code.ts`, `types/index.ts`

---

## [2025-12-17] - Documentation Generator 📖

### ✅ Добавлено

#### Генерация документации в Figma
Новая функция создания страниц документации для каждой категории токенов:

- **📖 Цвета**: страница с архитектурой цветовой системы и swatches
- **📖 Типографика**: шкала размеров, семантические стили, свойства шрифтов
- **📖 Spacing**: визуализация отступов с барами значений по режимам
- **📖 Gap**: визуализация расстояний между элементами

#### Архитектурные описания на русском языке
Каждая страница документации содержит фрейм с описанием:
- Принцип построения системы
- Уровни архитектуры (примитивы → семантика)
- Адаптивность и режимы
- Примеры использования

### 🔧 Изменено

#### Типографика UI
- Таб "Превью" переименован в "Экспорт"
- Удалено дублирующее превью стилей
- Кнопка документации перенесена в таб "Экспорт"

### 🐛 Исправлено

- Ошибка resize с нулевой шириной в Spacing документации
- Значения `[object Object]` заменены на реальные числа (резолв алиасов)

---

## [2025-12-17] - Gap Device Modes & Number Tokens Architecture 📐

### ✅ Добавлено

#### Gap коллекция с режимами устройств
- **Gap** теперь поддерживает режимы Desktop/Tablet/Mobile (как Spacing)
- Каждый семантический токен gap имеет адаптивные значения
- Пример: `gap.action.group` → Desktop: gap.8, Tablet: gap.8, Mobile: gap.6

#### Унифицированная архитектура числовых токенов
Документирован общий паттерн для всех Number переменных:
- **Примитивы** → коллекция Primitives (без режимов)
- **Семантика** → отдельные коллекции с режимами Desktop/Tablet/Mobile
- Применимо для: Spacing, Gap, Typography, будущих Sizing, Border-radius и т.д.

### 🔧 Изменено

#### Структура GapSemanticToken
```typescript
// Было (aliasTo):
{ id: 'gap.inline.icon', aliasTo: 'gap.4' }

// Стало (desktop/tablet/mobile):
{ id: 'g-1', path: 'gap.inline.icon', desktop: '4', tablet: '4', mobile: '4' }
```

#### Gap UI обновлён
- Таблица с колонками Desktop/Tablet/Mobile (как Spacing)
- Категории показывают количество токенов
- Единый стиль с Spacing UI

### 🗂 Архитектура коллекций (обновлено)
```
Collections:
├── Primitives — все примитивы (без режимов)
│   ├── color/*
│   ├── font/*
│   ├── space/*
│   └── gap/*
│
├── Tokens — цветовые темы
│   └── РЕЖИМЫ: light | dark | {theme}-light | {theme}-dark
│
├── Components — цвета компонентов (без режимов)
│
├── Typography — семантика шрифтов
│   └── РЕЖИМЫ: Desktop | Tablet | Mobile
│
├── Spacing — семантика отступов (padding)
│   └── РЕЖИМЫ: Desktop | Tablet | Mobile
│
└── Gap — семантика gap (flex/grid)
    └── РЕЖИМЫ: Desktop | Tablet | Mobile
```

---

## [2025-12-16] - Gap System & Typography Collection Fix 🔧

### ✅ Добавлено

#### 2-уровневая архитектура Gap
- **Уровень 1: Primitives** — 18 примитивов (gap/0, gap/2, gap/4... gap/96) в коллекции Primitives
- **Уровень 2: Gap** — отдельная коллекция для семантических токенов

#### Примитивы Gap (18 значений)
```
0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96
```

#### 13 категорий семантических токенов (97 токенов)
- **inline** — icon, text, badge, tag, action
- **action** — группы кнопок, тулбары
- **form** — поля, группы, секции, radio/checkbox
- **card** — header, body, footer, sections, meta
- **list** — items, content, groups
- **navigation** — tabs, breadcrumb, pagination
- **table** — cells, toolbar, pagination
- **modal** — header, body, footer, sections
- **alert** — toast, banner, content
- **content** — sections, blocks, paragraphs
- **grid** — tight, default, relaxed, cards, gallery
- **stack** — none, tight, default, relaxed, loose
- **data** — metrics, stats, chart

### 🔧 Исправлено

#### Typography в отдельную коллекцию
- **Было:** семантическая типографика создавалась в коллекции "Tokens"
- **Стало:** создаётся в отдельной коллекции "Typography"
- Режимы Desktop/Tablet/Mobile теперь в коллекции Typography

#### Исправлена архитектура коллекций
```
Collections:
├── Primitives — все примитивы (color/*, font/*, space/*, gap/*)
├── Tokens — ТОЛЬКО цветовые темы (light, dark)
├── Components — цвета компонентов  
├── Typography — семантика шрифтов (Desktop/Tablet/Mobile)
├── Spacing — семантика spacing (Desktop/Tablet/Mobile)
└── Gap — семантика gap
```

#### Gap UI
- Исправлена инициализация при переключении на таб Gap
- Примитивы и табы теперь корректно отображаются

---

## [2025-12-16] - Spacing UI Restructure 🎨

### ✅ Изменено

#### Перемещение Spacing в раздел Primitives
- **Spacing убран из основных табов** — теперь не отдельная вкладка верхнего уровня
- **Spacing добавлен в под-табы Primitives** — рядом с Colors, Typography
- **Унификация стилей** — табы Spacing используют те же CSS-классы что и Typography (`typo-tab`, `typo-tab-content`)

#### Структура табов
```
🎨 Primitives (основной таб)
├── 🎨 Цвета
├── 🔤 Типографика  
└── 📐 Spacing ← Новое расположение
```

#### Обновлённые файлы
- `src/ui/ui.html` — HTML разметка и стили
- `src/ui/spacing-generator-ui.ts` — JS селекторы обновлены под `typo-tab`

---

## [2025-12-16] - 2-Tier Spacing Architecture 📐

### ✅ Добавлено

#### 2-уровневая архитектура Spacing
- **Уровень 1: Primitives** — 30 примитивов (space/0, space/1, space/2... space/256) в коллекции Primitives
- **Уровень 2: Spacing** — отдельная коллекция с режимами Desktop/Tablet/Mobile
- **Алиасы на примитивы** — семантические токены ссылаются на примитивы, разные для каждого устройства

#### Примитивы Spacing (30 значений)
```
0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 80, 96, 112, 128, 160, 192, 224, 256
```

#### 15 категорий семантических токенов (90+ токенов)
- **inline** — инлайн-элементы (icon, badge, tag, chip, pill)
- **button** — кнопки (compact, default, large, icon, withIcon)
- **input** — поля ввода (default, compact, large, textarea, withIcon)
- **card** — карточки (compact, default, comfortable, spacious, header/body/footer)
- **modal** — модальные окна (compact, default, spacious, fullscreen)
- **dropdown** — выпадающие меню (item, itemCompact, popover, tooltip)
- **list** — списки (item, itemCompact, nested, group)
- **table** — таблицы (cell, cellCompact, header)
- **navigation** — навигация (item, tab, sidebar)
- **alert** — уведомления (compact, default, toast, banner)
- **badge** — бейджи (badge, tag, chip)
- **form** — формы (field, label, helpText, group, section, actions)
- **page** — страницы (padding, section, header, footer)
- **content** — контент (paragraph, heading, list, blockquote, codeBlock, divider)
- **grid** — сетка (inset: none, tight, default, relaxed, loose)

#### Пример адаптивных значений
```
spacing/button/default/paddingX
├── Desktop → {space.16}
├── Tablet  → {space.14}
└── Mobile  → {space.12}
```

#### UI
- **Вкладка Spacing** — 3 подвкладки (Примитивы, Семантика, Экспорт)
- **Grid примитивов** — визуальный выбор включенных значений
- **Таблица семантики** — редактирование токенов с выбором алиасов для Desktop/Tablet/Mobile
- **Экспорт** — раздельный экспорт примитивов и семантики

### 🔧 Исправлено
- Исправлена ошибка с sync API — использование `getLocalVariableCollectionsAsync()` вместо `getLocalVariableCollections()`
- Исправлен конфликт имён типов `SemanticSpacingToken` → `DeviceSpacingToken`

---

## [2025-01-19] - Adaptive Typography Modes 📱

### ✅ Добавлено

#### Адаптивные режимы (Breakpoints)
- **3 режима по умолчанию** — Desktop (100%), Tablet (87.5%), Mobile (75%)
- **Настраиваемые коэффициенты** — Scale от 0.5 до 1.5 для каждого режима
- **Автоматическое масштабирование** — fontSize и lineHeight масштабируются по коэффициенту
- **Поиск ближайших примитивов** — для масштабированных значений подбирается ближайший примитив

#### UI настройки брейкпоинтов
- **Панель настроек** — редактирование названий, min-width, scale
- **Превью масштабирования** — показывает пример: 16px → 12px
- **Toggle включения** — можно отключить адаптивные режимы

#### Figma Modes интеграция
- **Создание режимов в коллекции Tokens** — Desktop, Tablet, Mobile
- **Алиасы для каждого режима** — разные примитивы для разных устройств
- **Ограничение Figma** — до 4 режимов в бесплатном плане

#### Пример результата
```
typography/page/hero/fontSize
├── Desktop → {font/size/56}
├── Tablet  → {font/size/48}
└── Mobile  → {font/size/40}
```

---

## [2025-01-19] - Full Semantic Typography System

### ✅ Добавлено

#### Полная структура семантических токенов типографики (90+ токенов)
- **17 категорий** — page, section, card, modal, sidebar, paragraph, helper, action, form, data, status, notification, navigation, code, content, empty, loading
- **Подкатегории с описаниями** — каждая подкатегория содержит описание назначения
- **~90 предустановленных токенов** — полный набор для типичного интерфейса

#### Новые категории
- **content/** — blockquote (text, citation), list (item, itemCompact), timestamp (absolute, relative)
- **empty/** — title, description, action для пустых состояний
- **loading/** — label, percentage, status для состояний загрузки

#### Semantic Variables (алиасы на примитивы) ⭐ NEW
- **Кнопка "Semantic Variables"** — создание переменных с алиасами
- Переменные ссылаются на примитивы через Figma aliases
- Формат: `typography/{category}/{subcategory}/fontSize → {font/size/14}`
- Автоматический поиск ближайших значений примитивов
- Создание или обновление существующих переменных

#### 3 варианта экспорта в Figma
1. **Primitives Variables** — базовые числовые переменные
2. **Semantic Variables** — алиасы на примитивы (NEW)
3. **Text Styles** — полные стили с font-family

#### Обновлённая документация
- Полная таблица 17 категорий с подкатегориями
- Примеры токенов с контекстом использования
- Рекомендуемый workflow экспорта

---

## [2024-12-16] - Text Styles Support

### ✅ Добавлено

#### Figma Text Styles для полной типографики
- **Кнопка "Создать Text Styles в Figma"** — генерация полноценных Text Styles
- Поддержка всех свойств типографики:
  - Font Family (шрифт)
  - Font Size (размер)
  - Font Weight (начертание)
  - Line Height (высота строки)
  - Letter Spacing (межбуквенный интервал)
  - Text Decoration (подчёркивание, зачёркивание)
  - Text Case/Transform (UPPERCASE, lowercase, Capitalize)
- Автоматическая загрузка шрифтов с fallback вариантами
- Обновление существующих стилей при повторной генерации
- Информационный блок о различиях Variables vs Text Styles

#### Обновлённая документация
- Таблица сравнения Variables и Text Styles
- Инструкции по созданию Text Styles
- Рекомендации по использованию

---

## [2024-12-16] - Расширенные компоненты

### ✅ Добавлено

#### Новые компонентные токены (12 новых компонентов)
- **dropdown/** - Выпадающие меню (11 токенов)
  - container, item (hover, selected, disabled), icon, divider, header
- **breadcrumb/** - Хлебные крошки (5 токенов)
  - item (hover, current), separator, home icon
- **chip/** - Чипы/теги (17 токенов)
  - neutral, brand, success, warning, error варианты
  - surface, content, stroke, close icon для каждого
- **stepper/** - Степперы/визарды (14 токенов)
  - step (completed, active, inactive), connector, label
- **accordion/** - Аккордеоны (8 токенов)
  - header (hover, expanded), body, icon, divider
- **slider/** - Слайдеры (8 токенов)
  - track (fill), thumb (hover, active, stroke), mark, label
- **datepicker/** - Выбор даты (17 токенов)
  - container, header, nav, day (hover, selected, today, range, disabled, outside), weekday
- **popover/** - Всплывающие окна (6 токенов)
  - container, header, body, close, arrow
- **snackbar/** - Снэкбары/тосты (15 токенов)
  - container, text, action, close
  - success, error, warning, info варианты
- **empty-state/** - Пустые состояния (3 токена)
  - icon, title, description
- **upload/** - Загрузка файлов (18 токенов)
  - container (hover, active, stroke), icon, text, file, progress
- **sidebar/** - Боковые панели (16 токенов)
  - container, header, section, item (hover, active), badge, divider, footer

#### Общая статистика компонентов
- Всего компонентов: **31 тип**
- Всего компонентных токенов: **~270**

---

## [2024-12-16] - Темы и кастомные цвета

### ✅ Добавлено

#### Система цветовых тем
- **Цветовые темы (Color Themes)** - возможность создавать кастомные цветовые вариации бренда
- Каждая тема создаёт:
  - Примитивы: `colors/brand-{themeId}-theme/brand-{themeId}-theme-{step}`
  - Режимы в Tokens: `{themeId}-light` и `{themeId}-dark`
- Темы влияют только на **брендовые/интерактивные цвета** (кнопки, ссылки, акценты)
- **Системные цвета НЕ меняются** при смене темы (neutral, success, warning, error, info)

#### UI улучшения
- Секция "Цветовые темы" перемещена в раздел брендовых цветов
- Кнопка "Синхронизировать темы" для отправки тем в Figma Variables
- Чекбокс для опционального акцентного цвета в теме
- Улучшенное отображение карточек тем с hex-кодом и иконками режимов

### 🔧 Исправлено

#### Порядок режимов в Tokens
- Default тема (light/dark) всегда создаётся первой
- Темы сортируются: системные первыми, кастомные после
- Исправлена логика создания режимов для существующих коллекций

#### Именование примитивов
- Примитивы тем теперь называются `brand-{name}-theme` вместо просто `{name}`
- Пример: `colors/brand-green-theme/brand-green-theme-500`

#### Синхронизация
- Исправлена ошибка "cannot read property 'variables' of undefined"
- Корректная передача данных через postMessage

---

## Структура коллекций Figma Variables

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PRIMITIVES (377 переменных) - БЕЗ режимов                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│ colors/                                                                          │
│   ├── neutral/neutral-25...neutral-975        (31 оттенков)                     │
│   ├── success/success-25...success-975        (31 оттенков)                     │
│   ├── warning/warning-25...warning-975        (31 оттенков)                     │
│   ├── error/error-25...error-975              (31 оттенков)                     │
│   ├── info/info-25...info-975                 (31 оттенков)                     │
│   ├── brand/brand-25...brand-975              (31 оттенков) - основной бренд    │
│   ├── accent/accent-25...accent-975           (31 оттенков)                     │
│   └── brand-green-theme/brand-green-theme-25...975  (39 оттенков) - кастом тема │
│                                                                                  │
│ spacing/xs, sm, md, lg, xl, 2xl, 3xl...       (30 значений)                     │
│ radius/none, xs, sm, md, lg, xl, full...      (9 значений)                      │
│ typography/font-size-*, line-height-*, etc.   (34 значения)                     │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ TOKENS (366 переменных) - С режимами: light | dark | green-light | green-dark   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ bg/                                                                              │
│   ├── page/page-primary, page-secondary, page-tertiary                          │
│   ├── card/card-primary, card-secondary, card-elevated...                       │
│   ├── interactive/interactive-primary-hover, interactive-brand...               │
│   └── overlay/, modal/, drawer/, popover/, tooltip/                             │
│                                                                                  │
│ text/                                                                            │
│   ├── primary, secondary, tertiary, disabled, inverse                           │
│   ├── link/link-default, link-hover, link-active, link-visited                  │
│   └── on-brand, on-status-success, on-status-error...                           │
│                                                                                  │
│ border/                                                                          │
│   ├── primary, secondary, strong, focus, brand, interactive-hover...            │
│   └── status-success, status-warning, status-error, status-info                 │
│                                                                                  │
│ icon/                                                                            │
│   ├── primary, secondary, tertiary, disabled, inverse, brand                    │
│   └── status-success, status-warning, status-error, status-info                 │
│                                                                                  │
│ action/                                                                          │
│   ├── primary/primary, primary-hover, primary-active, primary-disabled...       │
│   ├── secondary/secondary, secondary-hover, secondary-active...                 │
│   ├── tertiary/, ghost/, danger/                                                │
│   └── text-primary, text-on-primary, text-on-secondary...                       │
│                                                                                  │
│ status/                                                                          │
│   ├── success-bg, success-text, success-border, success-icon                    │
│   ├── warning-bg, warning-text, warning-border, warning-icon                    │
│   ├── error-bg, error-text, error-border, error-icon                            │
│   └── info-bg, info-text, info-border, info-icon                                │
│                                                                                  │
│ divider/primary, secondary, strong, brand                                       │
│                                                                                  │
│ focus/ring, offset                                                               │
│                                                                                  │
│ selection/bg, text, highlight                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ COMPONENTS (129 переменных) - БЕЗ режимов (используют алиасы на Tokens)         │
├─────────────────────────────────────────────────────────────────────────────────┤
│ button/                                                                          │
│   ├── primary/bg, bg-hover, bg-active, bg-disabled, text, text-disabled...      │
│   ├── secondary/bg, bg-hover, text, border...                                   │
│   ├── tertiary/, ghost/, danger/                                                │
│   └── focus-ring, focus-offset                                                  │
│                                                                                  │
│ input/                                                                           │
│   ├── bg, bg-disabled, text, text-placeholder, border, border-hover...          │
│   ├── border-focus, border-error, border-success                                │
│   └── label, helper-text, error-text                                            │
│                                                                                  │
│ card/                                                                            │
│   ├── bg, bg-hover, border, border-hover, shadow                                │
│   └── header-text, body-text                                                    │
│                                                                                  │
│ badge/, alert/, tooltip/, modal/, dropdown/, tabs/, navigation/                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Логика работы тем

### Как темы влияют на цвета:

```
┌──────────────────────────────────────────────────────────────────┐
│                    ТЕМА: Default (brand = #3B82F6)               │
├──────────────┬─────────────────────┬─────────────────────────────┤
│ Token        │ light               │ dark                        │
├──────────────┼─────────────────────┼─────────────────────────────┤
│ action/      │ colors/brand/       │ colors/brand/               │
│ primary      │ brand-500           │ brand-400                   │
├──────────────┼─────────────────────┼─────────────────────────────┤
│ bg/page/     │ colors/neutral/     │ colors/neutral/             │
│ primary      │ neutral-25          │ neutral-950                 │
└──────────────┴─────────────────────┴─────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                 ТЕМА: Green (brand = #22C55E)                    │
├──────────────┬─────────────────────┬─────────────────────────────┤
│ Token        │ green-light         │ green-dark                  │
├──────────────┼─────────────────────┼─────────────────────────────┤
│ action/      │ colors/brand-green- │ colors/brand-green-         │
│ primary      │ theme/...-500       │ theme/...-400               │
├──────────────┼─────────────────────┼─────────────────────────────┤
│ bg/page/     │ colors/neutral/     │ colors/neutral/             │
│ primary      │ neutral-25 (SAME!)  │ neutral-950 (SAME!)         │
└──────────────┴─────────────────────┴─────────────────────────────┘
```

**Ключевой принцип**: 
- `sourceColor === 'brand'` → заменяется на цвет темы
- `sourceColor === 'neutral|success|warning|error|info'` → НЕ меняется

---

## Файловая структура проекта

```
plagin/
├── src/
│   ├── plugin/
│   │   └── code.ts                 # Figma plugin backend
│   │
│   ├── ui/
│   │   ├── ui.ts                   # UI entry point
│   │   ├── ui.html                 # HTML template with styles
│   │   ├── primitives-generator-ui.ts   # Primitives tab logic
│   │   ├── tokens-generator-ui.ts       # Tokens tab logic
│   │   ├── components-generator-ui.ts   # Components tab logic
│   │   ├── token-manager-ui.ts          # Token Manager tab
│   │   └── token-editor-ui.ts           # Token editing
│   │
│   ├── generators/
│   │   ├── color-generator.ts      # Color palette generation
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── tokens.ts               # Token type definitions
│   │   ├── token-manager.ts        # Token manager types
│   │   ├── token-manager-state.ts  # State management
│   │   └── token-manager-constants.ts
│   │
│   └── utils/
│       ├── token-utils.ts          # Token utilities
│       ├── export-utils.ts         # Export functionality
│       └── index.ts
│
├── manifest.json                   # Figma plugin manifest
├── package.json
├── tsconfig.json
├── webpack.config.js
├── ARCHITECTURE.md                 # Architecture documentation
├── CHANGELOG.md                    # This file
└── README.md
```

---

## Константы и маппинги

### SEMANTIC_COLOR_MAPPINGS (code.ts)
Определяет как семантические токены ссылаются на примитивы:

```typescript
{
  category: 'action',      // Категория токена
  subcategory: 'primary',  // Подкатегория
  variant: undefined,      // Вариант (hover, active, etc.)
  states: ['default'],     // Поддерживаемые состояния
  sourceColor: 'brand',    // Цвет-источник (заменяется для тем!)
  sourceStep: 500          // Шаг в палитре
}
```

### Состояния и их модификация step:
- `default` → без изменений
- `hover` → ±50 от базового
- `active` → ±100 от базового
- `disabled` → 200 (light) / 700 (dark)
- `focus` → ±25 от базового
- `visited` → +100
