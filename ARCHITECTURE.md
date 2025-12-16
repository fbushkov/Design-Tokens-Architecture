# 🏗️ Архитектура плагина Design Tokens Manager

## 📌 Основная идея

**"Плагин как единственный источник истины"** (Plugin as Source of Truth)

Плагин управляет всеми дизайн-токенами централизованно и синхронизирует их с Figma Variables. Это обеспечивает:
- Единую точку управления токенами
- Консистентность между дизайном и кодом
- Экспорт в различные форматы (CSS, SCSS, JSON, Tailwind, Storybook)

---

## � Multi-Product архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                    GLOBAL HEADER                                │
│  [Выбор продукта: ▼]  🌐 Общие | Product A | Product B | + Add  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   SHARED      │     │  PER-PRODUCT  │     │  PER-PRODUCT  │
│  (все продукты)│     │   + THEMES    │     │   EXPORT      │
├───────────────┤     ├───────────────┤     ├───────────────┤
│ • System colors│     │ • Brand colors│     │ Экспорт для   │
│ • Spacing      │     │ • Accent      │     │ выбранного    │
│ • Radius       │     │ • Additional  │     │ продукта      │
│ • Shadows      │     │ • Light/Dark  │     │               │
│ • Borders      │     │   themes      │     │               │
│ • Typography   │     │               │     │               │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Структура токенов по продуктам:

```
Primitives/
├── colors/
│   ├── shared/                    ← ОБЩИЕ (все продукты)
│   │   ├── neutral/
│   │   ├── success/
│   │   ├── warning/
│   │   ├── error/
│   │   └── info/
│   │
│   └── products/                  ← ПО ПРОДУКТАМ
│       ├── product-a/
│       │   ├── brand/
│       │   ├── accent/
│       │   └── additional/
│       │
│       └── product-b/
│           ├── brand/
│           └── accent/
│
├── spacing/                       ← SHARED
├── radius/                        ← SHARED
├── shadows/                       ← SHARED
├── borders/                       ← SHARED
└── typography/                    ← SHARED
```

---

## �🎯 3-уровневая архитектура токенов

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENTS (107 токенов)                 │
│        button/primary/primary-bg → action/primary/primary   │
│        input/container/container-stroke → stroke/default    │
└─────────────────────────────────────────────────────────────┘
                              ↓ ссылается на
┌─────────────────────────────────────────────────────────────┐
│                     TOKENS (366 токенов)                    │
│        action/primary/primary → colors/brand/brand-500      │
│        text/primary/primary → colors/neutral/neutral-900    │
│                    (light/dark режимы)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓ ссылается на
┌─────────────────────────────────────────────────────────────┐
│                   PRIMITIVES (355 токенов)                  │
│           colors/brand/brand-500 = #3B82F6                  │
│           colors/neutral/neutral-900 = #1F2937              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🖥️ Структура интерфейса плагина

### Главные вкладки:

| Вкладка | Назначение |
|---------|------------|
| **🎨 Примитивы** | Генерация примитивов (цвета, типографика, spacing и т.д.) |
| **🗂 Token Manager** | Карта токенов, включение/выключение, редактирование |
| **📦 Экспорт** | Экспорт в JSON, CSS, SCSS, Tailwind, Figma |
| **📥 Импорт** | Импорт токенов из JSON |

### Вкладка "Примитивы" — подвкладки:

| Подвкладка | Функционал |
|------------|------------|
| **Все** | Обзор категорий + кнопка "Сгенерировать все" |
| **🎨 Цвета** | Brand, Accent, Neutral, Success, Warning, Error |
| **📝 Типографика** | Шрифты (Body, Heading, Mono), размеры, scale ratio |
| **📏 Отступы** | Base unit, scale (linear/fibonacci/golden) |
| **⬜ Радиусы** | Базовый радиус → none, sm, md, lg, xl, full |
| **🌑 Тени** | Цвет тени, прозрачность → xs, sm, md, lg, xl |
| **🔲 Границы** | Толщина обводок → none, thin, medium, thick |

### Поток работы:
```
[Примитивы] ──генерация──► [Token Manager] ──экспорт──► [Figma Variables / JSON]
                                  │
                           управление:
                           • включение/выключение
                           • редактирование
                           • добавление/удаление
                           • группировка
```

---

## 📁 Структура файлов проекта

```
src/
├── plugin/
│   └── code.ts              # Figma Plugin API, создание Variables
├── ui/
│   ├── ui.ts                # Главный UI контроллер
│   ├── ui.html              # HTML + CSS разметка
│   ├── primitives-generator-ui.ts  # Генерация примитивов
│   ├── token-manager-ui.ts  # Token Manager UI (дерево, тулбар)
│   └── token-editor-ui.ts   # Редактор токена (правая панель)
├── types/
│   ├── token-manager.ts     # Типы: TMTokenType, TMColorValue, TokenDefinition
│   ├── token-manager-state.ts  # State management, CRUD операции
│   ├── token-manager-constants.ts  # Константы, дефолтные значения
│   └── tokens.ts            # Legacy типы
├── utils/
│   ├── export-utils.ts      # Экспорт: JSON, CSS, SCSS, Tailwind, Figma
│   ├── token-utils.ts       # Утилиты для работы с токенами
│   └── index.ts             # Re-exports
└── generators/
    ├── color-generator.ts   # Генератор цветовых палитр
    └── index.ts
```

---

## 🔧 Типы токенов (TMTokenType)

Поддерживаемые Figma Variable Types:
- `COLOR` — цвета (RGBA)
- `NUMBER` — числа (spacing, radius, font-size)
- `STRING` — строки (font-family, shadows)
- `BOOLEAN` — логические значения

---

## 🎨 Категории примитивов

### Colors (цвета)

#### Структура цветов:

| Категория | Описание | Примеры |
|-----------|----------|---------|
| **🔧 Системные** | Базовые цвета для всех продуктов (обязательные) | neutral, success, warning, error, info |
| **🎨 Брендовые** | Цвета бренда продукта (ситуативные) | brand, accent, brand-secondary |
| **➕ Дополнительные** | Специфические цвета проекта (опциональные) | custom-1, highlight, promo |

#### Шкала оттенков (31 шаг):
```
25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300,
350, 400, 450, 500, 550, 600, 650, 700,
725, 750, 775, 800, 825, 850, 875, 900, 925, 950, 975
```

- **25-300**: Светлые оттенки (blend с белым)
- **350-450**: Переходные светлые
- **500**: Базовый цвет
- **550-650**: Переходные тёмные
- **700-975**: Тёмные оттенки (blend с чёрным)

#### Функционал:
- **Toggle shade**: Кликните на оттенок чтобы включить/выключить
- **Темы**: Light, Dark, Custom (добавление кастомных тем)
- **Генерация**: Только включённые оттенки добавляются в Token Manager

### Typography (типографика)
- **Шрифты**: font-family-body, font-family-heading, font-family-mono
- **Размеры**: font-size-xs → font-size-5xl (scale ratio)
- **Веса**: font-weight-regular/medium/semibold/bold
- **Высота строки**: line-height-tight/normal/relaxed
- **Трекинг**: letter-spacing-tight/normal/wide

### Spacing (отступы)
- **Шкалы**: linear, fibonacci, golden ratio
- **Токены**: none, xs, sm, md, lg, xl, 2xl, 3xl, 4xl

### Radius (радиусы)
- **Токены**: none, sm, md, lg, xl, 2xl, full

### Shadows (тени)
- **Токены**: xs, sm, md, lg, xl, 2xl, inner, none

### Borders (границы)
- **Токены**: none, thin (1px), medium (2px), thick (4px)

---

## 🗂 Token Manager — функционал

| Функция | Описание |
|---------|----------|
| **Дерево токенов** | Иерархический вид по path (colors/brand/...) |
| **Фильтры** | По коллекции (Primitives/Tokens/Components), по enabled |
| **Поиск** | Полнотекстовый по имени и path |
| **Выбор токена** | Клик → правая панель редактора |
| **Toggle enabled** | Включение/выключение токенов |
| **Expand/Collapse** | Сворачивание групп |
| **Настройки** | Separator (/, ., -), Case style, Export format |
| **Sync to Figma** | Создание Variables в Figma |
| **Export JSON** | Экспорт в выбранный формат |

---

## 📦 Форматы экспорта

| Формат | Файл | Описание |
|--------|------|----------|
| JSON | .json | Design Tokens (Style Dictionary compatible) |
| Storybook | .json | Плоская структура для Storybook |
| CSS | .css | CSS Custom Properties |
| SCSS | .scss | SCSS maps и переменные |
| Tailwind | .js | Tailwind config colors |
| Figma | — | Создание Variables через API |

---

## 🌓 Темы Light/Dark

- **Primitives** — без режимов (базовые значения)
- **Tokens** — light/dark режимы (ссылки на разные primitives)
- **Components** — light/dark режимы (наследуют от Tokens)

---

## 📝 Именование токенов

### Primitives:
```
colors/{palette}/{palette}-{step}    → colors/brand/brand-500
typography/{property}                → typography/font-size-md
spacing/{size}                       → spacing/lg
radius/{size}                        → radius/md
shadows/{level}                      → shadows/lg
borders/{width}                      → borders/thin
```

### Tokens (Semantic):
```
{category}/{subcategory}/{name}[-state]
text/primary/primary
text/primary/primary-hover
bg/card/card-primary
action/primary/primary-active
```

### Components:
```
{component}/{variant}/{property}[-state]
button/primary/primary-bg
button/primary/primary-bg-hover
input/container/container-stroke-focus
```

---

## 🔄 Настройки форматирования

| Настройка | Опции | По умолчанию |
|-----------|-------|--------------|
| Separator | `/`, `.`, `-` | `/` |
| Case Style | kebab, camel, snake, pascal | kebab |
| Export Format | json, css, scss, tailwind, figma | json |

---

## 📅 История изменений

- **2025-12-16**: Реструктуризация UI — вкладка Примитивы с подвкладками, Token Manager только для управления
- **2025-12-16**: Добавлен primitives-generator-ui.ts для генерации всех типов примитивов
- **2025-12-16**: Адаптивный интерфейс с поддержкой resize окна плагина
- **2025-12-16**: Добавлен export-utils.ts с 6 форматами экспорта
- **2025-12-16**: Token Manager: дерево токенов, фильтры, поиск, редактор, настройки
- **2025-12-16**: Исправлено именование токенов (согласованность папок и переменных)
- **2025-12-15**: Добавлен префикс цвета в primitives (brand-500 вместо 500)
- **2025-12-15**: Базовая структура 3-уровневой архитектуры

---

## 🚀 TODO / Roadmap

| Задача | Приоритет | Статус |
|--------|-----------|--------|
| Semantic tokens (Tokens коллекция) | 🔴 Высокий | ⏳ Планируется |
| Component tokens | 🔴 Высокий | ⏳ Планируется |
| Light/Dark mode switching | 🔴 Высокий | ⏳ Планируется |
| Token references (aliases) | 🟡 Средний | ⏳ Планируется |
| Import from Figma Variables | 🟡 Средний | ⏳ Планируется |
| Batch operations | 🟡 Средний | ⏳ Планируется |
| Undo/Redo | 🟢 Низкий | ⏳ Планируется |
| Git sync | 🟢 Низкий | ⏳ Планируется |
