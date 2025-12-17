# 🏗️ Архитектура плагина Design Tokens Manager

> **Последнее обновление**: 17 декабря 2025
> **Версия**: 2.8 (All Collections + Frontend Export)

## 📌 Основная идея

**"Плагин как единственный источник истины"** (Plugin as Source of Truth)

Плагин управляет всеми дизайн-токенами централизованно и синхронизирует их с Figma Variables. Это обеспечивает:
- Единую точку управления токенами
- Консистентность между дизайном и кодом
- Экспорт в различные форматы (CSS, SCSS, JSON, Tailwind, Storybook)

---

## 🎯 3-уровневая архитектура токенов

```
┌─────────────────────────────────────────────────────────────────┐
│                     🧩 COMPONENTS (270+ токенов)                │
│    Компонентные токены — для конкретных UI-компонентов          │
│    БЕЗ режимов — используют алиасы на Tokens                    │
│                                                                 │
│    button/primary/bg       →  action/primary                    │
│    input/border-focus      →  border/focus                      │
│    card/bg                 →  bg/card/card-primary              │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ссылается на
┌─────────────────────────────────────────────────────────────────┐
│                      🏷️ TOKENS (366 токенов)                    │
│    Семантические токены — описывают назначение                  │
│    РЕЖИМЫ: light | dark | {theme}-light | {theme}-dark          │
│                                                                 │
│    action/primary      →  brand-500 (light) / brand-400 (dark)  │
│    text/primary        →  neutral-900 (light) / neutral-50 (dark)│
│    background/primary  →  neutral-25 (light) / neutral-950 (dark)│
└─────────────────────────────────────────────────────────────────┘
                              ↓ ссылается на
┌─────────────────────────────────────────────────────────────────┐
│                    🎨 PRIMITIVES (377+ токенов)                 │
│    Базовые значения — цвета, размеры, тени и т.д.              │
│    БЕЗ режимов — только значения                                │
│                                                                 │
│    colors/brand/brand-500                =  #3B82F6             │
│    colors/brand-green-theme/...-500      =  #22C55E (кастом)    │
│    colors/neutral/neutral-25             =  #FAFAFA             │
│    spacing/md                            =  16                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Компоненты (Component Tokens)

### Полный список поддерживаемых компонентов (23 типа):

| # | Компонент | Описание | Токены |
|---|-----------|----------|--------|
| 1 | **button/** | Кнопки (primary, secondary, ghost, danger) | 20 |
| 2 | **input/** | Текстовые поля | 12 |
| 3 | **select/** | Выпадающие списки | 9 |
| 4 | **checkbox/** | Чекбоксы | 6 |
| 5 | **radio/** | Радиокнопки | 5 |
| 6 | **toggle/** | Переключатели | 4 |
| 7 | **card/** | Карточки | 6 |
| 8 | **modal/** | Модальные окна | 5 |
| 9 | **badge/** | Бейджи (success, warning, error, info, neutral) | 10 |
| 10 | **alert/** | Уведомления | 16 |
| 11 | **tooltip/** | Подсказки | 2 |
| 12 | **avatar/** | Аватары | 4 |
| 13 | **tabs/** | Вкладки | 4 |
| 14 | **nav/** | Навигация | 7 |
| 15 | **table/** | Таблицы | 7 |
| 16 | **pagination/** | Пагинация | 5 |
| 17 | **progress/** | Прогресс-бары | 3 |
| 18 | **skeleton/** | Скелетоны загрузки | 1 |
| 19 | **divider/** | Разделители | 2 |
| 20 | **dropdown/** | Выпадающие меню | 11 |
| 21 | **breadcrumb/** | Хлебные крошки | 5 |
| 22 | **chip/** | Чипы/теги | 17 |
| 23 | **stepper/** | Степперы | 14 |
| 24 | **accordion/** | Аккордеоны | 8 |
| 25 | **slider/** | Слайдеры/ползунки | 8 |
| 26 | **datepicker/** | Выбор даты | 17 |
| 27 | **popover/** | Всплывающие окна | 6 |
| 28 | **snackbar/** | Снэкбары/тосты | 15 |
| 29 | **empty-state/** | Пустые состояния | 3 |
| 30 | **upload/** | Загрузка файлов | 18 |
| 31 | **sidebar/** | Боковые панели | 16 |

### Пример структуры компонента:

```
button/
├── primary/
│   ├── primary-bg              → action/primary/primary
│   ├── primary-bg-hover        → action/primary/primary-hover
│   ├── primary-bg-active       → action/primary/primary-active
│   ├── primary-bg-focus        → action/primary/primary-focus
│   ├── primary-bg-disabled     → action/primary/primary-disabled
│   ├── primary-label           → content/on-action-primary
│   └── primary-icon            → content/on-action-primary
├── secondary/
│   ├── ...
├── ghost/
│   ├── ...
└── danger/
    └── ...
```

---

## 🎨 Система цветовых тем

### Принцип работы тем:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ЦВЕТА ДЕЛЯТСЯ НА ДВА ТИПА                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔒 СИСТЕМНЫЕ (не меняются при смене темы):                     │
│     • neutral  - серые тона для фонов/текстов                   │
│     • success  - зелёный для успешных состояний                 │
│     • warning  - жёлтый/оранжевый для предупреждений            │
│     • error    - красный для ошибок                             │
│     • info     - синий для информации                           │
│                                                                 │
│  🎨 БРЕНДОВЫЕ (меняются при смене темы):                        │
│     • brand    - основной цвет бренда → action, links, accents  │
│     • accent   - дополнительный акцентный цвет                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Структура режимов в Tokens:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         TOKENS Collection                               │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────┤
│ Variable     │ light        │ dark         │ green-light  │ green-dark │
├──────────────┼──────────────┼──────────────┼──────────────┼────────────┤
│ action/      │ brand/       │ brand/       │ brand-green- │ brand-green│
│ primary      │ brand-500    │ brand-400    │ theme/..500  │ theme/..400│
├──────────────┼──────────────┼──────────────┼──────────────┼────────────┤
│ bg/page/     │ neutral/     │ neutral/     │ neutral/     │ neutral/   │
│ primary      │ neutral-25   │ neutral-950  │ neutral-25   │ neutral-950│
│              │              │              │ (SAME!)      │ (SAME!)    │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────┘
```

### Именование примитивов для тем:

| Тип | Формат именования | Пример |
|-----|-------------------|--------|
| Default brand | `colors/brand/brand-{step}` | `colors/brand/brand-500` |
| Custom theme | `colors/brand-{id}-theme/brand-{id}-theme-{step}` | `colors/brand-green-theme/brand-green-theme-500` |

---

## 🔧 Технические детали

### SEMANTIC_COLOR_MAPPINGS

Маппинг определяет как семантические токены ссылаются на примитивы:

```typescript
{
  category: 'action',      // Категория токена
  subcategory: 'primary',  // Подкатегория  
  variant: undefined,      // Вариант (hover, active)
  states: ['default'],     // Состояния
  sourceColor: 'brand',    // 🎯 'brand' заменяется на тему!
  sourceStep: 500          // Шаг в палитре
}
```

**Логика замены для кастомных тем:**
```typescript
if (themeColorOverride && sourceColor === 'brand') {
  sourceColor = `brand-${themeColorOverride}-theme`;
}
// sourceColor !== 'brand' → НЕ меняется (системные цвета)
```

### Модификация step по состояниям:

| Состояние | Light Theme | Dark Theme |
|-----------|-------------|------------|
| default | без изменений | без изменений |
| hover | +50 | -50 |
| active | +100 | -100 |
| disabled | 200 | 700 |
| focus | +25 | -25 |
| visited | +100 | +100 |

---

## � Архитектура Spacing (отступы)

### 2-уровневая архитектура:

```
┌─────────────────────────────────────────────────────────────────┐
│                 📐 SPACING COLLECTION                           │
│       Семантические spacing с режимами устройств                │
│       РЕЖИМЫ: Desktop | Tablet | Mobile                         │
│                                                                 │
│       spacing/button/default/paddingX                           │
│         → Desktop: {space.16}                                   │
│         → Tablet:  {space.14}                                   │
│         → Mobile:  {space.12}                                   │
│                                                                 │
│       spacing/card/comfortable/padding                          │
│         → Desktop: {space.24}                                   │
│         → Tablet:  {space.20}                                   │
│         → Mobile:  {space.16}                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ алиасы на
┌─────────────────────────────────────────────────────────────────┐
│                 🎨 PRIMITIVES COLLECTION                        │
│       Примитивные значения spacing                              │
│       БЕЗ режимов — только значения                             │
│                                                                 │
│       space/0  = 0px        space/24 = 24px                     │
│       space/1  = 1px        space/28 = 28px                     │
│       space/2  = 2px        space/32 = 32px                     │
│       space/4  = 4px        space/40 = 40px                     │
│       space/6  = 6px        space/48 = 48px                     │
│       space/8  = 8px        space/64 = 64px                     │
│       space/10 = 10px       space/80 = 80px                     │
│       space/12 = 12px       space/96 = 96px                     │
│       space/14 = 14px       space/128 = 128px                   │
│       space/16 = 16px       space/160 = 160px                   │
│       space/18 = 18px       space/192 = 192px                   │
│       space/20 = 20px       space/256 = 256px                   │
└─────────────────────────────────────────────────────────────────┘
```

### Примитивы (30 значений):
`0, 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 80, 96, 112, 128, 160, 192, 224, 256`

### Категории семантических токенов (15 категорий, 90+ токенов):

| # | Категория | Описание | Примеры токенов |
|---|-----------|----------|-----------------|
| 1 | **inline** | Инлайн-элементы | icon.paddingX, badge.paddingX, chip.paddingX |
| 2 | **button** | Кнопки | compact.paddingX/Y, default.paddingX/Y, large.paddingX/Y |
| 3 | **input** | Поля ввода | default.paddingX/Y, compact.paddingX/Y, textarea.padding |
| 4 | **card** | Карточки | compact.padding, default.padding, header.paddingX/Y |
| 5 | **modal** | Модальные окна | compact.padding, default.padding, header/body/footer |
| 6 | **dropdown** | Выпадающие меню | paddingX/Y, item.paddingX/Y, tooltip.padding |
| 7 | **list** | Списки | item.paddingX/Y, nested.paddingLeft, group.paddingY |
| 8 | **table** | Таблицы | cell.paddingX/Y, cellCompact.padding, header.padding |
| 9 | **navigation** | Навигация | item.paddingX/Y, tab.paddingX/Y, sidebar.padding |
| 10 | **alert** | Уведомления | compact.paddingX/Y, default.paddingX/Y, toast/banner |
| 11 | **badge** | Бейджи | paddingX/Y, tag.paddingX/Y, chip.paddingX/Y |
| 12 | **form** | Формы | field.marginBottom, label.marginBottom, group/section |
| 13 | **page** | Страницы | paddingX/Y, paddingXWide/YWide, section.marginBottom |
| 14 | **content** | Контент | paragraph.marginBottom, heading.marginTop/Bottom |
| 15 | **grid** | Сетка | inset.none/tight/default/relaxed/loose |

### Пример адаптивных значений:

| Токен | Desktop | Tablet | Mobile |
|-------|---------|--------|--------|
| spacing.button.default.paddingX | {space.16} | {space.14} | {space.12} |
| spacing.button.default.paddingY | {space.8} | {space.8} | {space.6} |
| spacing.card.comfortable.padding | {space.24} | {space.20} | {space.16} |
| spacing.modal.default.padding | {space.24} | {space.20} | {space.16} |
| spacing.page.paddingX | {space.24} | {space.20} | {space.16} |

### Использование в Figma:

1. **Создать примитивы** → кнопка "Экспорт примитивов" → коллекция `Primitives` с `space/0..256`
2. **Создать семантику** → кнопка "Экспорт семантики" → коллекция `Spacing` с режимами Desktop/Tablet/Mobile
3. **Применить режим** → выбрать фрейм → установить режим (Desktop/Tablet/Mobile) → все spacing автоматически адаптируются

---
## ↔️ Архитектура Gap (flex/grid gaps)

### 2-уровневая архитектура:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ↔️ GAP COLLECTION                            │
│       Семантические gap с режимами устройств                    │
│       РЕЖИМЫ: Desktop | Tablet | Mobile                         │
│                                                                 │
│       gap/action/group                                          │
│         → Desktop: {gap.8}                                      │
│         → Tablet:  {gap.8}                                      │
│         → Mobile:  {gap.6}                                      │
│                                                                 │
│       gap/grid/default                                          │
│         → Desktop: {gap.16}                                     │
│         → Tablet:  {gap.16}                                     │
│         → Mobile:  {gap.12}                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓ алиасы на
┌─────────────────────────────────────────────────────────────────┐
│                 🎨 PRIMITIVES COLLECTION                        │
│       Примитивные значения gap                                  │
│       БЕЗ режимов — только значения                             │
│                                                                 │
│       gap/0  = 0px         gap/24 = 24px                        │
│       gap/2  = 2px         gap/28 = 28px                        │
│       gap/4  = 4px         gap/32 = 32px                        │
│       gap/6  = 6px         gap/40 = 40px                        │
│       gap/8  = 8px         gap/48 = 48px                        │
│       gap/10 = 10px        gap/56 = 56px                        │
│       gap/12 = 12px        gap/64 = 64px                        │
│       gap/16 = 16px        gap/80 = 80px                        │
│       gap/20 = 20px        gap/96 = 96px                        │
└─────────────────────────────────────────────────────────────────┘
```

### Примитивы (18 значений):
`0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64, 80, 96`

### Категории семантических токенов (13 категорий, 97 токенов):

| # | Категория | Описание | Примеры токенов |
|---|-----------|----------|-----------------|
| 1 | **inline** | Инлайн-элементы | icon, text, badge, tag, action |
| 2 | **action** | Кнопки, тулбары | group, groupCompact, toolbar, buttonContent |
| 3 | **form** | Формы | field, fieldCompact, group, section, radioGroup |
| 4 | **card** | Карточки | header, body, footer, sections, tags |
| 5 | **list** | Списки | items, itemsSpaced, itemContent, groups |
| 6 | **navigation** | Навигация | items, tabs, breadcrumb, pagination |
| 7 | **table** | Таблицы | rows, cellContent, toolbar, pagination |
| 8 | **modal** | Модальные окна | header, body, footer, sections, actions |
| 9 | **alert** | Уведомления | content, actions, toast, banner |
| 10 | **content** | Контент | sections, blocks, paragraphs, headingToContent |
| 11 | **grid** | Grid layouts | tight, default, relaxed, loose, cards, tiles |
| 12 | **stack** | Vertical stacks | none, tight, default, relaxed, loose |
| 13 | **data** | Метрики, графики | metric, metricGroup, stat, chartLegend |

### Пример адаптивных значений:

| Токен | Desktop | Tablet | Mobile |
|-------|---------|--------|--------|
| gap.action.group | {gap.8} | {gap.8} | {gap.6} |
| gap.form.field | {gap.16} | {gap.16} | {gap.12} |
| gap.grid.default | {gap.16} | {gap.16} | {gap.12} |
| gap.content.sections | {gap.48} | {gap.40} | {gap.32} |
| gap.stack.default | {gap.8} | {gap.8} | {gap.6} |

### Использование в Figma:

1. **Создать примитивы** → кнопка "Экспорт примитивов" → коллекция `Primitives` с `gap/0..96`
2. **Создать семантику** → кнопка "Экспорт семантики" → коллекция `Gap` с режимами Desktop/Tablet/Mobile
3. **Применить режим** → выбрать фрейм → установить режим (Desktop/Tablet/Mobile) → все gap автоматически адаптируются

---

## ⬜ Архитектура Radius (border-radius)

### 2-уровневая архитектура:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ⬜ RADIUS COLLECTION                         │
│       Семантические radius для компонентов                      │
│       БЕЗ режимов — алиасы на примитивы                        │
│                                                                 │
│       radius/interactive/button      → {radius.6}               │
│       radius/interactive/buttonPill  → {radius.full}            │
│       radius/container/card          → {radius.8}               │
│       radius/media/avatar            → {radius.full}            │
│       radius/feedback/badge          → {radius.full}            │
└─────────────────────────────────────────────────────────────────┘
                              ↓ алиасы
┌─────────────────────────────────────────────────────────────────┐
│                    PRIMITIVES COLLECTION                        │
│       Примитивные значения radius                               │
│       БЕЗ режимов — только значения в px                        │
│                                                                 │
│       radius/0    = 0px          radius/16   = 16px             │
│       radius/2    = 2px          radius/20   = 20px             │
│       radius/4    = 4px          radius/24   = 24px             │
│       radius/6    = 6px          radius/32   = 32px             │
│       radius/8    = 8px          radius/full = 9999px           │
│       radius/10   = 10px                                        │
│       radius/12   = 12px                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Категории семантических токенов (8 категорий, 58 токенов):

| # | Категория | Описание | Примеры токенов |
|---|-----------|----------|-----------------|
| 1 | **interactive** | Кнопки, инпуты, чекбоксы | button, buttonPill, input, checkbox, radio, switch |
| 2 | **container** | Карточки, модалки, панели | card, cardSubtle, modal, dropdown, panel |
| 3 | **feedback** | Уведомления, статусы | alert, toast, badge, tag, chip, indicator |
| 4 | **media** | Аватары, изображения, видео | avatar, thumbnail, image, video, icon |
| 5 | **form** | Поля ввода, селекты | input, select, textarea, fieldGroup, fileUpload |
| 6 | **data** | Таблицы, графики, прогресс | table, chart, progress, skeleton |
| 7 | **overlay** | Модалки, drawer, диалоги | modal, drawer, dialog, sheet, backdrop |
| 8 | **special** | Код, цитаты, callout | code, codeBlock, kbd, mark, callout, quote |

### Примеры значений:

| Токен | Значение | Использование |
|-------|----------|---------------|
| radius.interactive.button | {radius.6} | Стандартные кнопки |
| radius.interactive.buttonPill | {radius.full} | Pill-кнопки (округлые) |
| radius.container.card | {radius.8} | Карточки контента |
| radius.media.avatar | {radius.full} | Круглые аватары |
| radius.feedback.badge | {radius.full} | Круглые бейджи |
| radius.feedback.tag | {radius.4} | Прямоугольные теги |
| radius.overlay.drawer | {radius.0} | Drawer без скругления |
| radius.special.code | {radius.4} | Inline code |

### Использование в Figma:

1. **Создать примитивы** → кнопка "Экспорт примитивов" → коллекция `Primitives` с `radius/0..full`
2. **Создать семантику** → кнопка "Экспорт семантики" → коллекция `Radius` с алиасами
3. **Применить к компонентам** → использовать семантические переменные (radius/interactive/button) вместо raw values

---

## 🎯 Архитектура Icon Size (размеры иконок)

### 2-уровневая архитектура:

```
┌─────────────────────────────────────────────────────────────────┐
│                    🎯 ICON SIZE COLLECTION                      │
│       Семантические размеры иконок для UI компонентов           │
│       БЕЗ режимов — алиасы на примитивы                        │
│                                                                 │
│       iconSize/interactive/button       → {iconSize.16}         │
│       iconSize/interactive/buttonLarge  → {iconSize.20}         │
│       iconSize/form/checkbox            → {iconSize.16}         │
│       iconSize/navigation/item          → {iconSize.20}         │
│       iconSize/empty/illustration       → {iconSize.96}         │
└─────────────────────────────────────────────────────────────────┘
                              ↓ алиасы
┌─────────────────────────────────────────────────────────────────┐
│                    PRIMITIVES COLLECTION                        │
│       Примитивные значения размеров иконок                      │
│       БЕЗ режимов — только значения в px                        │
│                                                                 │
│       iconSize/10 = 10px        iconSize/36 = 36px              │
│       iconSize/12 = 12px        iconSize/40 = 40px              │
│       iconSize/14 = 14px        iconSize/48 = 48px              │
│       iconSize/16 = 16px        iconSize/56 = 56px              │
│       iconSize/18 = 18px        iconSize/64 = 64px              │
│       iconSize/20 = 20px        iconSize/72 = 72px              │
│       iconSize/24 = 24px        iconSize/96 = 96px              │
│       iconSize/28 = 28px                                        │
│       iconSize/32 = 32px                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Категории семантических токенов (14 категорий, 90+ токенов):

| # | Категория | Описание | Примеры токенов |
|---|-----------|----------|------------------|
| 1 | **interactive** | Кнопки, ссылки, меню, табы | button, buttonLarge, buttonCompact, link, menuItem, tab |
| 2 | **form** | Инпуты, чекбоксы, валидация | inputPrefix, checkbox, radio, switch, validation |
| 3 | **navigation** | Навигация, breadcrumbs | item, breadcrumbSeparator, paginationArrow, back, close |
| 4 | **status** | Бейджи, теги, индикаторы | badge, tag, chip, indicator, dot |
| 5 | **notification** | Алерты, тосты, баннеры | alert, alertLarge, toast, banner |
| 6 | **data** | Таблицы, метрики, графики | tableAction, tableSort, metricTrend, chartLegend |
| 7 | **media** | Аватары, плееры, placeholder | avatarBadge, placeholder, playButton, controls |
| 8 | **empty** | Пустые состояния | illustration, illustrationSmall, icon, iconLarge |
| 9 | **modal** | Модальные окна | close, headerIcon, confirmationIcon |
| 10 | **card** | Карточки | headerIcon, action, meta, feature |
| 11 | **list** | Списки | itemIcon, bullet, dragHandle, expandCollapse |
| 12 | **action** | FAB, контекстное меню | primary, secondary, tertiary, fab, more, contextMenu |
| 13 | **loading** | Спиннеры | spinner, spinnerCompact, spinnerLarge, buttonSpinner |
| 14 | **special** | Лого, социальные, рейтинг | logo, logoSmall, social, rating, stepIndicator |

### Примеры значений:

| Токен | Значение | Использование |
|-------|----------|---------------|
| iconSize.interactive.button | {iconSize.16} | Иконки в кнопках стандартного размера |
| iconSize.interactive.buttonLarge | {iconSize.20} | Иконки в крупных кнопках |
| iconSize.form.checkbox | {iconSize.16} | Галочка в чекбоксах |
| iconSize.navigation.hamburger | {iconSize.24} | Иконка бургер-меню |
| iconSize.status.badge | {iconSize.12} | Маленькие иконки в бейджах |
| iconSize.empty.illustration | {iconSize.96} | Крупные иконки в пустых состояниях |
| iconSize.action.fab | {iconSize.24} | Иконка в FAB кнопке |
| iconSize.loading.spinner | {iconSize.20} | Стандартный спиннер |

### Диапазоны размеров:

| Диапазон | Размеры | Применение |
|----------|---------|------------|
| **XS** | 10-14px | Индикаторы, стрелки, мелкие UI элементы |
| **S** | 16-20px | Кнопки, инпуты, меню, навигация |
| **M** | 24-32px | Заголовки карточек, FAB, значимые действия |
| **L** | 36-48px | Медиа, пустые состояния, подтверждения |
| **XL** | 56-96px | Иллюстрации, крупные пустые состояния |

### Отличие от Spacing/Gap/Radius:

| Аспект | Spacing/Gap | Radius | Icon Size |
|--------|-------------|--------|----------|
| Режимы | Desktop/Tablet/Mobile | Нет | Нет |
| Адаптивность | Да | Нет | Нет |
| Причина | Размеры иконок не должны меняться между устройствами |

### Использование в Figma:

1. **Создать примитивы** → кнопка "Экспорт примитивов" → коллекция `Primitives` с `iconSize/10..96`
2. **Создать семантику** → кнопка "Экспорт семантики" → коллекция `Icon Size` с алиасами
3. **Применить к компонентам** → использовать семантические переменные (iconSize/interactive/button) вместо raw values

---

## 🔢 Общий паттерн для числовых (Number) токенов

### Архитектура числовых переменных:

Все числовые сущности (Spacing, Gap, Radius, а также будущие Sizing и т.д.) следуют единому паттерну:

```
┌─────────────────────────────────────────────────────────────────┐
│              СЕМАНТИЧЕСКАЯ КОЛЛЕКЦИЯ                            │
│       Название: Spacing / Gap / Typography / Sizing / etc      │
│       РЕЖИМЫ: Desktop | Tablet | Mobile                         │
│                                                                 │
│   Semantic tokens ссылаются на примитивы по режимам:            │
│   • Desktop → {primitive.X}                                     │
│   • Tablet  → {primitive.Y}                                     │
│   • Mobile  → {primitive.Z}                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓ алиасы
┌─────────────────────────────────────────────────────────────────┐
│                    PRIMITIVES COLLECTION                        │
│       Базовые числовые значения БЕЗ режимов                     │
│                                                                 │
│   • space/X = Ypx  (для Spacing)                                │
│   • gap/X = Ypx    (для Gap)                                    │
│   • typo/X = Ypx   (для Typography)                             │
│   • size/X = Ypx   (для Sizing)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Преимущества паттерна:

| Преимущество | Описание |
|--------------|----------|
| **Адаптивность** | Одна переменная — три значения для разных устройств |
| **Консистентность** | Единый подход к spacing, gap, typography, sizing |
| **Масштабируемость** | Легко добавить новые режимы (например, XXL для TV) |
| **Переиспользование** | Примитивы общие, семантика контекстная |
| **Фокус на дизайн** | Дизайнер работает с семантикой, режимы меняются автоматически |

### Отличие от цветов:

| Аспект | Цвета (Colors) | Числовые (Number) |
|--------|----------------|-------------------|
| Режимы | Light / Dark / Themes | Desktop / Tablet / Mobile |
| Причина | Тема оформления | Размер экрана |
| Примитивы | Коллекция Primitives | Коллекция Primitives |
| Семантика | Коллекция Tokens | Отдельные коллекции (Spacing, Gap, Typography) |

---

## 📖 Генерация документации

### Функционал:

Плагин позволяет автоматически создавать страницы документации в Figma для каждой категории токенов. Каждая страница содержит:

1. **Архитектурный фрейм** — описание принципов построения системы на русском языке
2. **Визуальное представление** — образцы цветов, примеры типографики, визуализация отступов
3. **Справочная информация** — список переменных с актуальными значениями

### Доступные генераторы:

| Категория | Кнопка | Содержимое страницы |
|-----------|--------|---------------------|
| **Цвета** | 📖 Создать документацию | Архитектура цветов, swatches по коллекциям/группам |
| **Типографика** | 📖 Создать документацию | Архитектура типографики, шкала размеров, семантические стили |
| **Spacing** | 📖 Создать документацию | Архитектура отступов, визуальные бары значений по режимам |
| **Gap** | 📖 Создать документацию | Архитектура gap, визуализация расстояний между элементами |
| **Radius** | 📖 Создать документацию | Архитектура радиусов, визуальные превью скруглений |
| **Icon Size** | 📖 Создать документацию | Архитектура размеров иконок, визуальные превью по категориям |

### Архитектурные описания:

Каждая страница документации начинается с фрейма, объясняющего принципы:

#### Цвета:
- Примитивы → Токены → Темы
- Семантика цветов (bg/primary, text/secondary)
- Переключение тем (Light/Dark)

#### Типографика:
- 2-уровневая архитектура с адаптивностью
- Примитивы (font-size, line-height, font-weight)
- Семантические стили (page/hero, card/title, body/regular)
- Адаптивность Desktop → Tablet → Mobile

#### Spacing:
- 2-уровневая архитектура (Primitives → Spacing Collection)
- Базовая шкала кратная 4px
- Семантические токены с контекстом (button/paddingX, card/padding)
- Режимы устройств

#### Gap:
- Отличие от Spacing (внутренние отступы vs расстояния между элементами)
- Использование в Auto Layout
- Адаптивность по устройствам

### Расположение кнопок:

- **Цвета**: вкладка "Цвета" → секция генерации
- **Типографика**: вкладка "Типографика" → таб "Экспорт"
- **Spacing**: вкладка "Spacing" → секция "Экспорт в Figma"
- **Gap**: вкладка "Gap" → секция "Экспорт в Figma"

---

## 📁 Файловая структура

```
plagin/
├── src/
│   ├── plugin/
│   │   └── code.ts                      # Figma plugin backend
│   │
│   ├── ui/
│   │   ├── ui.ts                        # UI entry point
│   │   ├── ui.html                      # HTML + CSS
│   │   ├── primitives-generator-ui.ts   # Primitives + Themes UI
│   │   ├── tokens-generator-ui.ts       # Tokens tab
│   │   ├── components-generator-ui.ts   # Components tab
│   │   ├── token-manager-ui.ts          # Token Manager
│   │   └── token-editor-ui.ts           # Token editing
│   │
│   ├── generators/
│   │   └── color-generator.ts           # Color palette generation
│   │
│   ├── types/
│   │   ├── tokens.ts
│   │   ├── token-manager.ts
│   │   └── token-manager-state.ts
│   │
│   └── utils/
│       ├── token-utils.ts
│       └── export-utils.ts
│
├── manifest.json
├── package.json
├── tsconfig.json
├── webpack.config.js
├── ARCHITECTURE.md                      # Этот файл
├── CHANGELOG.md                         # История изменений
└── README.md
```

---

## 🖥️ Структура интерфейса

### Вкладка "Примитивы" → Цвета:

```
┌─────────────────────────────────────────────────────────────┐
│ 🔧 Системные цвета (неизменные во всех темах)               │
│    [Neutral] [Success] [Warning] [Error] [Info]             │
├─────────────────────────────────────────────────────────────┤
│ 🎨 Брендовые цвета (основа для тем)                         │
│    [Brand Primary] [Accent]                                 │
│    + Добавить брендовый цвет                                │
├─────────────────────────────────────────────────────────────┤
│ 🎨 Цветовые темы (вариации брендовых цветов)                │
│    ┌──────────────────────────────────────────┐             │
│    │ green  #489D67  ☀️🌙  [✏️] [🗑]          │             │
│    └──────────────────────────────────────────┘             │
│    [+ Добавить тему] [🔄 Синхронизировать темы]             │
├─────────────────────────────────────────────────────────────┤
│ ➕ Дополнительные цвета                                      │
│    + Добавить цвет                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 См. также

- [CHANGELOG.md](./CHANGELOG.md) - История изменений
- [README.md](./README.md) - Инструкция по установке
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

| Вкладка | Назначение | Статус |
|---------|------------|--------|
| **🎨 Примитивы** | Генерация примитивов (цвета, типографика, spacing и т.д.) | ✅ Готово |
| **🏷️ Токены** | Генерация семантических токенов с поддержкой тем | ✅ Готово |
| **🧩 Компоненты** | Генерация компонентных токенов | ✅ Готово |
| **🗂 Token Manager** | Карта токенов, включение/выключение, редактирование | ✅ Готово |
| **📦 Экспорт** | Экспорт в JSON, CSS, SCSS, Tailwind, Figma | ✅ Готово |
| **📥 Импорт** | Импорт токенов из JSON | ⏳ В разработке |

### 🔒 Валидация и зависимости вкладок:

```
┌────────────────┐
│   ПРИМИТИВЫ    │  ← Всегда доступна
│  (Primitives)  │
└───────┬────────┘
        │ разблокирует
        ▼
┌────────────────┐
│    ТОКЕНЫ      │  ← Доступна после создания примитивов
│   (Tokens)     │
└───────┬────────┘
        │ разблокирует генерацию
        ▼
┌────────────────┐
│  КОМПОНЕНТЫ    │  ← Просмотр всегда, генерация после создания Tokens
│ (Components)   │
└────────────────┘
```

- **Примитивы → Токены**: После "Сгенерировать все" автоматический переход на вкладку Токены
- **Токены → Компоненты**: Кнопки генерации недоступны пока не созданы семантические токены

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
[Примитивы] ──генерация──► [Токены] ──генерация──► [Компоненты]
      │                        │                        │
      ▼                        ▼                        ▼
[Token Manager] ◄────── управление всеми токенами ──────►
      │
      ▼
[Экспорт] ──► Figma Variables / JSON / CSS / SCSS / Tailwind
```

---

## 🏷️ Вкладка "Токены" (Semantic Tokens)

### Категории семантических токенов:

| Категория | Описание | Примеры |
|-----------|----------|---------|
| **🎯 Action** | Интерактивные элементы | action/primary, action/secondary, action/destructive |
| **🖼 Background** | Фоны | background/primary, background/secondary, background/elevated |
| **📝 Text** | Текст | text/primary, text/secondary, text/disabled, text/on-action |
| **🔲 Border** | Границы | border/default, border/focus, border/error |
| **📊 Status** | Статусы | status/success, status/warning, status/error, status/info |

### Поддержка тем:

```
┌──────────────────────────────────────────────────────────────┐
│  🌞 Light        🌙 Dark        ➕ Add Theme                  │
│  ───────────────────────────────────────────────────────────│
│                                                              │
│  action/primary:                                             │
│    Light → brand-500                                        │
│    Dark  → brand-400                                        │
│                                                              │
│  text/primary:                                               │
│    Light → neutral-900                                      │
│    Dark  → neutral-50                                       │
│                                                              │
│  background/primary:                                         │
│    Light → neutral-0 (#FFFFFF)                              │
│    Dark  → neutral-950 (#0A0A0A)                            │
└──────────────────────────────────────────────────────────────┘
```

### Функционал:
- **Темы**: Light, Dark + кастомные темы
- **Выбор палитры**: Для каждого токена можно выбрать палитру и оттенок
- **Автомаппинг**: Автоматическое создание маппинга light/dark
- **Генерация**: Создаёт токены с mode-values в Figma

---

## 🧩 Вкладка "Компоненты" (Component Tokens)

### Типы компонентов:

| Компонент | Токены | Описание |
|-----------|--------|----------|
| **🔘 Button** | background, text, border, shadow | primary, secondary, ghost, destructive |
| **📝 Input** | background, border, text, placeholder | default, focus, error, disabled |
| **🃏 Card** | background, border, shadow | elevated, outlined, filled |
| **🏷 Badge** | background, text, border | success, warning, error, info, neutral |
| **⚠️ Alert** | background, border, icon, text | success, warning, error, info |
| **🧭 Navigation** | background, text, indicator | active, hover, disabled |

### Структура компонентных токенов:

```
components/
├── button/
│   ├── primary/
│   │   ├── background     → action/primary
│   │   ├── background-hover → action/primary-hover  
│   │   ├── text           → text/on-action
│   │   └── border         → transparent
│   ├── secondary/
│   └── ghost/
│
├── input/
│   ├── background         → background/primary
│   ├── border             → border/default
│   ├── border-focus       → border/focus
│   ├── text               → text/primary
│   └── placeholder        → text/secondary
│
├── card/
│   ├── background         → background/elevated
│   ├── border             → border/default
│   └── shadow             → shadows/md
│
├── badge/
│   └── {status}/
│       ├── background     → status/{status}-subtle
│       └── text           → status/{status}
│
├── alert/
│   └── {status}/
│       ├── background     → status/{status}-subtle
│       ├── border         → status/{status}
│       └── icon           → status/{status}
│
└── navigation/
    ├── background         → background/secondary
    ├── text               → text/secondary
    ├── text-active        → text/primary
    └── indicator          → action/primary
```

### Функционал:
- **Требуется Tokens**: Генерация недоступна без семантических токенов
- **Batch генерация**: Генерация всех компонентов одной кнопкой
- **Отдельная генерация**: Можно генерировать каждый компонент отдельно

---

## 📁 Структура файлов проекта

```
src/
├── plugin/
│   └── code.ts                    # Figma Plugin API, создание Variables
├── ui/
│   ├── ui.ts                      # Главный UI контроллер
│   ├── ui.html                    # HTML + CSS разметка
│   ├── primitives-generator-ui.ts # Генерация примитивов
│   ├── tokens-generator-ui.ts     # Генерация семантических токенов (NEW)
│   ├── components-generator-ui.ts # Генерация компонентных токенов (NEW)
│   ├── token-manager-ui.ts        # Token Manager UI (дерево, тулбар)
│   └── token-editor-ui.ts         # Редактор токена (правая панель)
├── types/
│   ├── token-manager.ts           # Типы: TMTokenType, TMColorValue, TokenDefinition
│   ├── token-manager-state.ts     # State management, CRUD операции
│   ├── token-manager-constants.ts # Константы, дефолтные значения
│   └── tokens.ts                  # Legacy типы
├── utils/
│   ├── export-utils.ts            # Экспорт: JSON, CSS, SCSS, Tailwind, Figma
│   ├── token-utils.ts             # Утилиты для работы с токенами
│   └── index.ts                   # Re-exports
└── generators/
    ├── color-generator.ts         # Генератор цветовых палитр
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

Token Manager имеет две основные вкладки:

### 🔄 Project Sync — синхронизация с проектом

Позволяет просмотреть текущее состояние Figma-проекта и управлять стилями.

| Функция | Описание |
|---------|----------|
| **Overview** | Общая статистика: коллекции, переменные, стили |
| **Collections** | Список всех Variable Collections с деталями |
| **Styles** | Список всех стилей (Paint, Text, Effect, Grid) |
| **Managed vs Other** | Разделение на управляемые плагином и внешние коллекции |
| **Create Paint Styles** | Создание Paint Styles из Components цветов |
| **Import to Token Map** | Импорт переменных в Token Map для управления |

#### Импорт в Token Map:

Позволяет загрузить существующие Figma Variables в Token Map для управления:
- Конвертирует Figma Variables → TokenDefinition
- Поддерживает типы: COLOR, FLOAT, STRING, BOOLEAN
- Парсит путь из имени переменной (`colors/brand/brand-500`)
- Сохраняет Figma ID для связи с оригиналом
- Пропускает дубликаты при повторном импорте
- После импорта → доступны настройки форматирования (separators, case styles)

#### Управляемые коллекции (Managed):
- Primitives, Tokens, Components — цветовые
- Spacing, Gap, Icon Size, Radius — числовые  
- Typography — типографика

#### Создание Paint Styles:

Плагин создаёт Paint Styles **только из Components** — самого специфичного уровня:
- `button/primary/primary-bg` → Paint Style с тем же именем
- Алиасы автоматически разрешаются до финального RGBA значения
- Цепочка: Components → Tokens → Primitives → final color

### 🗂 Token Map — карта токенов

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
| **Frontend** | .json | 📦 Только финальный уровень (Components + семантика) |
| Storybook | .json | Плоская структура для Storybook |
| CSS | .css | CSS Custom Properties |
| SCSS | .scss | SCSS maps и переменные |
| Tailwind | .js | Tailwind config colors |
| Figma | — | Создание Variables через API |

### Frontend Export — для разработчиков

Формат `Frontend` экспортирует **только финальный семантический уровень**:

| Категория | Источник | Пример |
|----------|----------|--------|
| colors | Components | `button/primary/primary-bg` → `#2781f3` |
| typography | Typography | `page/hero/hero-size` → `48` |
| spacing | Spacing | `layout/page/page-padding` → `24` |
| gap | Gap | `component/card/card-gap` → `16` |
| iconSize | Icon Size | `interactive/button/button-icon` → `20` |
| radius | Radius | `interactive/button/button-radius` → `8` |

**Почему так**: Фронтенд-разработчикам не нужны примитивы и промежуточные токены — им нужны готовые к использованию значения.

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
| Export Format | json, css, scss, tailwind, figma, **frontend** | json |

---

## 📅 История изменений

- **2025-12-17**: ✅ Расширен TMCollectionType на 7 коллекций (все управляемые)
- **2025-12-17**: ✅ Добавлен Frontend Export — только финальный уровень для разработчиков
- **2025-12-17**: ✅ Token Map теперь показывает все 7 коллекций в фильтрах
- **2025-12-17**: ✅ Добавлен импорт в Token Map из Project Sync (Figma Variables → TokenDefinition)
- **2025-12-17**: ✅ После импорта доступны настройки форматирования (separators, case styles)
- **2024-12-18**: ✅ Добавлен Project Sync — просмотр состояния Figma проекта (коллекции, переменные, стили)
- **2024-12-18**: ✅ Добавлено создание Paint Styles из Components цветов с разрешением алиасов
- **2024-12-18**: ✅ Token Manager разделён на две вкладки: 🔄 Project Sync и 🗂 Token Map
- **2025-01-XX**: ✅ Добавлена вкладка "Токены" с семантическими токенами и поддержкой тем (light/dark)
- **2025-01-XX**: ✅ Добавлена вкладка "Компоненты" с 6 типами компонентов (Button, Input, Card, Badge, Alert, Navigation)
- **2025-01-XX**: ✅ Валидация: Токены/Компоненты заблокированы до создания примитивов
- **2025-01-XX**: ✅ Автопереход на вкладку Токены после "Сгенерировать все" примитивы
- **2025-01-XX**: ✅ Исправлена ошибка Figma sync (RGB нормализация 0-255 → 0-1)
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
| ~~Semantic tokens (Tokens коллекция)~~ | 🔴 Высокий | ✅ Готово |
| ~~Component tokens~~ | 🔴 Высокий | ✅ Готово |
| ~~Light/Dark mode switching~~ | 🔴 Высокий | ✅ Готово |
| ~~Token references (aliases)~~ | 🟡 Средний | ✅ Готово |
| ~~Import from Figma Variables~~ | 🟡 Средний | ✅ Готово (Project Sync) |
| ~~Paint Styles from Variables~~ | 🟡 Средний | ✅ Готово |
| Batch operations | 🟡 Средний | ⏳ Планируется |
| Кастомные темы (Add Theme) | 🟡 Средний | ⏳ Планируется |
| Text Styles from Typography | 🟡 Средний | ⏳ Планируется |
| Undo/Redo | 🟢 Низкий | ⏳ Планируется |
| Git sync | 🟢 Низкий | ⏳ Планируется |
