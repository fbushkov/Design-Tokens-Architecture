# Design Tokens Manager - Figma Plugin

🎨 Figma plugin for managing design tokens with 3-level structure and Storybook export.

## Token Structure

This plugin implements a **3-level token architecture**:

### 1. Primitives (Примитивы)
Raw design values without context:
- **Colors**: Palette values (blue-500, gray-100, etc.)
- **Dimensions**: Spacing, radius, borders
- **Fonts**: Font families
- **Shadows**: Drop shadows, inner shadows
- **Gradients**: Linear, radial gradients

### 2. Semantic (Семантика)
Contextual tokens with states:
- **Context**: brand, neutral, success, error, surface, text, border
- **States**: default, hover, active, focus, disabled, selected
- References to primitive tokens

### 3. Composite (Композиты)
Component-level tokens:
- **Button**: primary, secondary, ghost variants
- **Input**: default, error states
- **Card**: default styling
- Complete component definitions with all properties

## Installation

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Watch for changes during development
npm run watch
```

## Usage

### In Figma:
1. Open Figma Desktop
2. Go to **Plugins → Development → Import plugin from manifest**
3. Select the `manifest.json` file from this project
4. Run the plugin from **Plugins → Development → Design Tokens Manager**

### Plugin Features:

#### Sync Tab
- **Sync from Figma**: Extract all Variables and Styles as tokens
- View statistics: colors, numbers, collections count

#### Export Tab
- **JSON**: Design Tokens Format (W3C compatible)
- **CSS**: CSS Custom Properties
- **SCSS**: SCSS Variables with maps
- **Storybook**: Storybook-compatible format

#### Import Tab
- Paste JSON tokens
- Validate structure
- Import to Figma Variables

#### Preview Tab
- Visual token tree
- Color previews
- Token count

## Project Structure

```
├── manifest.json          # Figma plugin manifest
├── package.json           # NPM dependencies
├── tsconfig.json          # TypeScript config
├── webpack.config.js      # Webpack bundler config
├── src/
│   ├── plugin/
│   │   └── code.ts        # Main plugin code (Figma sandbox)
│   ├── ui/
│   │   ├── ui.html        # Plugin UI template
│   │   └── ui.ts          # UI logic
│   ├── types/
│   │   ├── tokens.ts      # Token type definitions
│   │   └── index.ts       # Types export
│   ├── utils/
│   │   ├── token-utils.ts # Helper functions
│   │   └── index.ts       # Utils export
│   └── tokens/
│       └── example-tokens.json # Example token structure
└── dist/                  # Build output
    ├── code.js            # Compiled plugin code
    └── ui.html            # Bundled UI
```

## Token JSON Format

```json
{
  "$version": "1.0.0",
  "$name": "My Design System",
  "primitives": {
    "colors": {
      "palette": {
        "blue-500": {
          "$type": "color",
          "$value": {
            "hex": "#3b82f6",
            "rgba": { "r": 0.231, "g": 0.51, "b": 0.965, "a": 1 }
          }
        }
      }
    },
    "dimensions": {
      "spacing-4": {
        "$type": "dimension",
        "$value": { "value": 16, "unit": "px" }
      }
    }
  },
  "semantic": {
    "colors": {
      "brand": {
        "default": {
          "$type": "color",
          "$context": "brand",
          "$state": "default",
          "$reference": "{primitives.colors.palette.blue-500}"
        }
      }
    }
  },
  "composite": {
    "button": {
      "primary": {
        "default": {
          "$type": "component",
          "$component": "button",
          "$variant": "primary",
          "$value": {
            "background": "{semantic.colors.brand.default}",
            "padding": "{primitives.dimensions.spacing-4}"
          }
        }
      }
    }
  }
}
```

## Storybook Integration

Export tokens for Storybook:

1. In the plugin, go to **Export** tab
2. Select **Storybook Format**
3. Click **Export Tokens**
4. Copy or download the output
5. Save as `tokens.json` in your Storybook project

Example Storybook usage:
```javascript
// .storybook/preview.js
import tokens from './tokens.json';

export const parameters = {
  designTokens: tokens
};
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Production build |
| `npm run watch` | Development watch mode |
| `npm run dev` | Development build |
| `npm run typecheck` | TypeScript type checking |

## Requirements

- Node.js 18+
- Figma Desktop app
- TypeScript 5.0+

## License

MIT
