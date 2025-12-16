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

### Категории

| Категория | Описание | Примеры подкатегорий |
|-----------|----------|---------------------|
| `page` | Заголовки страниц | hero, title, subtitle |
| `section` | Заголовки секций | heading, subheading |
| `card` | Карточки | title, subtitle, body |
| `modal` | Модальные окна | title, body |
| `sidebar` | Боковые панели | title, item |
| `paragraph` | Текстовые блоки | lead, default, compact |
| `helper` | Вспомогательный текст | hint, caption |
| `action` | Кнопки и ссылки | button.primary, button.compact, link |
| `form` | Формы | label, input, validation |
| `data` | Данные и таблицы | table.header, table.cell, metric.value |
| `status` | Статусы | badge, tag |
| `notification` | Уведомления | toast.title, alert.message |
| `navigation` | Навигация | menu.item, tab.label, breadcrumb |
| `code` | Код | inline, block |

### Структура токена

```typescript
typography.{category}.{subcategory?}.{name}
```

Примеры:
```
typography.page.hero           → 56px, Bold, 1.1, -0.025em
typography.page.title          → 40px, Bold, 1.2, -0.02em
typography.card.title          → 18px, Semibold, 1.3, 0
typography.form.label.default  → 14px, Medium, 1.0, 0
typography.data.table.header   → 12px, Semibold, 1.2, 0.025em, UPPERCASE
typography.data.table.cell     → 14px, Regular, 1.4, 0
typography.code.inline         → 13px, Regular (Mono), 1.4, 0
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

### Синхронизация с Figma

#### Вариант 1: Figma Variables (частичная типографика)
1. Перейдите на вкладку "Превью"
2. Нажмите "🔄 Синхронизировать с Figma Variables"
3. Создаются только числовые переменные (size, line-height, letter-spacing)

#### Вариант 2: Text Styles (полная типографика) ⭐
1. Перейдите на вкладку "Превью"
2. Нажмите "🎨 Создать Text Styles в Figma"
3. Создаются полноценные Text Styles со всеми свойствами

**Рекомендация:** Используйте Text Styles для типографики, так как они поддерживают все необходимые свойства.

---

*Документ обновлён: 16 декабря 2025*
