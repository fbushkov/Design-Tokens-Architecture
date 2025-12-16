# Typography Token Architecture

## Обзор

Система типографических токенов следует 3-уровневой архитектуре: **Primitives → Semantic → Components**.

## 1. Примитивы (Primitives)

Базовые значения типографики, не привязанные к контексту использования.

### Font Families
```
font.family.roboto         → "Roboto"
font.family.roboto-mono    → "Roboto Mono"
font.family.inter          → "Inter"
font.family.system-sans    → "system-ui"
```

### Font Sizes (px)
```
font.size.10  → 10px    font.size.32  → 32px
font.size.11  → 11px    font.size.36  → 36px
font.size.12  → 12px    font.size.40  → 40px
font.size.13  → 13px    font.size.48  → 48px
font.size.14  → 14px    font.size.56  → 56px
font.size.15  → 15px    font.size.64  → 64px
font.size.16  → 16px    font.size.72  → 72px
font.size.18  → 18px    font.size.96  → 96px
font.size.20  → 20px
font.size.24  → 24px
font.size.28  → 28px
```

### Line Heights (multiplier → % в Figma)
```
font.lineHeight.100  → 1.0  (100%)
font.lineHeight.110  → 1.1  (110%)
font.lineHeight.120  → 1.2  (120%)
font.lineHeight.125  → 1.25 (125%)
font.lineHeight.130  → 1.3  (130%)
font.lineHeight.140  → 1.4  (140%)
font.lineHeight.150  → 1.5  (150%)
font.lineHeight.160  → 1.6  (160%)
font.lineHeight.170  → 1.7  (170%)
font.lineHeight.180  → 1.8  (180%)
font.lineHeight.200  → 2.0  (200%)
```

### Font Weights
```
font.weight.100  → Thin
font.weight.200  → Extra Light
font.weight.300  → Light
font.weight.400  → Regular
font.weight.500  → Medium
font.weight.600  → Semibold
font.weight.700  → Bold
font.weight.800  → Extra Bold
font.weight.900  → Black
```

### Letter Spacing (em → % в Figma)
```
font.letterSpacing.n050  → -0.05em (-5%)
font.letterSpacing.n025  → -0.025em (-2.5%)
font.letterSpacing.n020  → -0.02em (-2%)
font.letterSpacing.n015  → -0.015em (-1.5%)
font.letterSpacing.n010  → -0.01em (-1%)
font.letterSpacing.000   → 0
font.letterSpacing.010   → 0.01em (1%)
font.letterSpacing.015   → 0.015em (1.5%)
font.letterSpacing.020   → 0.02em (2%)
font.letterSpacing.025   → 0.025em (2.5%)
font.letterSpacing.050   → 0.05em (5%)
font.letterSpacing.075   → 0.075em (7.5%)
font.letterSpacing.100   → 0.1em (10%)
font.letterSpacing.150   → 0.15em (15%)
```

### Text Decoration & Transform
```
font.decoration.none, underline, line-through, overline
font.transform.none, uppercase, lowercase, capitalize
font.style.normal, italic
```

## 2. Семантические токены (Semantic)

Контекстное применение примитивов. Ссылаются на примитивы через синтаксис `{font.category.value}`.

### Категории (17 категорий, 90+ токенов)

| Категория | Описание | Подкатегории |
|-----------|----------|--------------|
| `page` | Заголовки страниц | hero, title, subtitle |
| `section` | Заголовки секций | heading, subheading |
| `card` | Карточки | title, subtitle, body, meta |
| `modal` | Модальные окна | title, subtitle |
| `sidebar` | Боковые панели | groupTitle (UPPERCASE), itemLabel |
| `paragraph` | Текстовые блоки | lead, default, compact, dense |
| `helper` | Вспомогательный текст | hint, caption, footnote |
| `action` | Кнопки и ссылки | button.primary/compact/large, link.inline/standalone/navigation |
| `form` | Формы | label.default/floating/required, input.value/placeholder, textarea.value, validation.error/success/warning, helpText |
| `data` | Данные и таблицы | table.header/cell/cellNumeric/footer, metric.value/valueCompact/label/delta/unit |
| `status` | Статусы | badge.default/counter, tag |
| `notification` | Уведомления | toast.title/message, banner.title/message, alert.title/description |
| `navigation` | Навигация | menu.item/itemActive/groupLabel, breadcrumb.item/current, tab.label/labelActive/badge, pagination.item/info |
| `code` | Код | inline, block, lineNumber, comment |
| `content` | Контент | blockquote.text/citation, list.item/itemCompact, timestamp.absolute/relative |
| `empty` | Пустые состояния | title, description, action |
| `loading` | Загрузка | label, percentage, status |

### Структура токена

```typescript
typography.{category}.{subcategory}.{variant?}
```

### Примеры токенов с контекстом

```
// Страничные заголовки
typography.page.hero           → 56px, Bold, 110%, -2.5% - Landing pages, main CTAs
typography.page.title          → 40px, Bold, 120%, -2% - Page title H1
typography.page.subtitle       → 24px, Semibold, 130%, -1.5% - Page subtitle

// Карточки
typography.card.title          → 18px, Semibold, 130%, 0 - Card title
typography.card.body           → 14px, Regular, 150%, 0 - Card body text
typography.card.meta           → 11px, Regular, 130%, 1.5% - Date, author info

// Формы
typography.form.label.default  → 14px, Medium, 100%, 0 - Standard label
typography.form.label.floating → 12px, Medium, 100%, 1% - Floating label
typography.form.input.placeholder → 14px, Regular, 140%, 0, italic - Placeholder

// Данные
typography.data.table.header   → 12px, Semibold, 120%, 2.5%, UPPERCASE - Table header
typography.data.table.cellNumeric → 13px, Regular (Mono), 140%, 0 - Numbers
typography.data.metric.value   → 36px, Bold, 100%, -2% - KPI value

// Навигация
typography.navigation.menu.groupLabel → 11px, Semibold, 100%, 7.5%, UPPERCASE - Menu group
typography.navigation.breadcrumb.current → 13px, Medium, 100%, 0 - Current page

// Код
typography.code.inline         → 13px, Regular (Mono), 140%, 0 - Inline code
typography.code.comment        → 13px, Regular (Mono), 160%, 0, italic - Comments

// Специальные состояния
typography.empty.title         → 20px, Semibold, 130%, -1% - Empty state title
typography.loading.percentage  → 12px, Medium (Mono), 100%, 0 - Loading %
```

## 3. Компонентные токены (Components)

Токены для конкретных UI-компонентов, ссылающиеся на семантические токены.

```
component.button.primary.typography → {typography.action.button.primary}
component.input.label.typography    → {typography.form.label.default}
component.card.title.typography     → {typography.card.title}
```

## Figma Variables

### Структура коллекций

1. **Primitives** (без режимов)
   - `font/size/{value}`
   - `font/lineHeight/{value}` (в %)
   - `font/weight/{value}`
   - `font/letterSpacing/{value}` (в %)

2. **Tokens** (с режимами light/dark)
   - Семантические токены со ссылками на примитивы

3. **Components** (без режимов)
   - Компонентные токены со ссылками на Tokens

### Ограничения Figma Variables

⚠️ Figma Variables **не поддерживают**:
- `font-family` (только Text Styles)
- `text-decoration` (только Text Styles)
- `text-transform` (только Text Styles)
- `font-style` (только Text Styles)

| Свойство | Variables | Text Styles |
|----------|-----------|-------------|
| Font Size | ✅ NUMBER | ✅ |
| Line Height | ✅ NUMBER (%) | ✅ |
| Letter Spacing | ✅ NUMBER (%) | ✅ |
| Font Family | ❌ | ✅ |
| Font Weight | ❌ | ✅ |
| Text Decoration | ❌ | ✅ |
| Text Transform | ❌ | ✅ |
| Font Style | ❌ | ✅ |

## Figma Text Styles

Для полной типографики используйте **Text Styles** вместо Variables.

### Что создаётся
- Полноценные Text Styles с именами вида `typography/category/subcategory/name`
- Все свойства: font-family, size, weight, line-height, letter-spacing
- Дополнительные свойства: text-decoration, text-case (transform)

### Процесс создания
1. Семантические токены преобразуются в Text Styles
2. Шрифты загружаются автоматически с fallback вариантами
3. Существующие стили обновляются, новые создаются

### Именование стилей
```
typography/page/hero         → Hero заголовок страницы
typography/card/title        → Заголовок карточки
typography/form/label/default → Метка формы
typography/data/table/header  → Заголовок таблицы
```

## Конвертация значений

| Свойство | В коде | В Figma |
|----------|--------|---------|
| line-height | 1.4 (множитель) | 140 (%) |
| letter-spacing | -0.025em | -2.5 (%) |

## Файловая структура

```
src/
├── types/
│   └── typography-tokens.ts    # Типы и дефолтные значения
├── ui/
│   └── typography-generator-ui.ts  # UI логика
└── plugin/
    └── code.ts                 # Figma API интеграция
```

## Использование

### Генерация примитивов
1. Выберите нужные значения в сетках (Font Sizes, Line Heights и т.д.)
2. Нажмите "Сгенерировать примитивы типографики"

### Создание семантических токенов
1. Перейдите на вкладку "Семантика"
2. Нажмите "+ Добавить токен" или редактируйте существующие
3. Выберите категорию, подкатегорию и настройте свойства
4. Нажмите "Сгенерировать семантику"

### Синхронизация с Figma (3 варианта экспорта)

#### Вариант 1: Primitives → Figma Variables
Создаёт базовые числовые переменные (size, line-height, letter-spacing).

```
font/size/12, font/size/14, font/size/16, ...
font/lineHeight/100, font/lineHeight/120, ...
font/letterSpacing/-2.5, font/letterSpacing/0, ...
```

**Когда использовать:** Для создания основы системы, на которую будут ссылаться семантические переменные.

#### Вариант 2: Semantic → Figma Variables (aliases) ⭐ NEW
Создаёт семантические переменные с **алиасами** на примитивы.

```
typography/page/hero/fontSize → {font/size/56}
typography/page/hero/lineHeight → {font/lineHeight/110}
typography/page/hero/letterSpacing → {font/letterSpacing/-2.5}
typography/card/title/fontSize → {font/size/18}
...
```

**Когда использовать:** Для создания полной системы переменных. Позволяет менять значения в одном месте (примитивах), и все семантические токены обновятся автоматически.

**Важно:** Требует, чтобы примитивы были уже созданы в Figma.

### Адаптивные режимы (Breakpoints) 📱 NEW

Семантические переменные поддерживают **режимы для разных устройств**:

| Режим | Min Width | Scale | Пример (16px) |
|-------|-----------|-------|---------------|
| Desktop | 1280px | 100% | 16px |
| Tablet | 768px | 87.5% | 14px |
| Mobile | 0px | 75% | 12px |

#### Как это работает

```
typography/page/hero/fontSize
├── Desktop → {font/size/56}   # базовый
├── Tablet  → {font/size/48}   # × 0.875
└── Mobile  → {font/size/40}   # × 0.75
```

#### Использование в Figma

1. Создайте фреймы для разных устройств
2. Выберите фрейм → Панель справа → Variables → Выберите режим
3. Все элементы внутри фрейма автоматически переключат типографику

```
┌──────────────────────────────────────────────────┐
│ Desktop Frame (1440px)      Mode: Desktop        │
│   Hero Title: 56px                               │
│   Card Title: 18px                               │
└──────────────────────────────────────────────────┘

┌────────────────────────────────────┐
│ Tablet Frame (768px)  Mode: Tablet │
│   Hero Title: 48px                 │
│   Card Title: 16px                 │
└────────────────────────────────────┘

┌─────────────────────────┐
│ Mobile (375px)  Mobile  │
│   Hero: 40px            │
│   Card: 14px            │
└─────────────────────────┘
```

#### Настройка коэффициентов

В UI плагина можно настроить:
- **Название режима** — отображается в Figma
- **Min width** — для справки (Figma не переключает автоматически)
- **Scale** — коэффициент масштабирования (0.5–1.5)

⚠️ **Ограничение Figma:** режимы НЕ переключаются автоматически по размеру фрейма — нужно выбирать вручную.

#### Вариант 3: Text Styles (полная типографика) ⭐
Создаёт полноценные Figma Text Styles со всеми свойствами.

```
typography/page/hero         → 56px, Inter Bold, 110%, -2.5%
typography/card/title        → 18px, Inter Semibold, 130%, 0%
typography/form/label/default → 14px, Inter Medium, 100%, 0%
```

**Когда использовать:** Для прямого применения типографики к текстовым элементам. Включает font-family, font-weight, text-transform, которые недоступны в Variables.

### Рекомендуемый workflow

1. **Создайте Primitives Variables** — базовые значения
2. **Создайте Semantic Variables** — алиасы с контекстом и режимами
3. **Создайте Text Styles** — для применения к элементам
4. **Назначьте режимы фреймам** — Desktop/Tablet/Mobile

Все три варианта работают вместе и дополняют друг друга.

---

*Документ обновлён: 19 января 2025*
