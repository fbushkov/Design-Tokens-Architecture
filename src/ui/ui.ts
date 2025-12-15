/**
 * Plugin UI Script
 * Color palette generation and Figma integration
 */

// ============================================
// COLOR GENERATOR (inline for sandbox)
// ============================================

interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface ColorValueData {
  hex: string;
  rgba: RGBAColor;
}

interface GeneratedColorToken {
  $type: 'color';
  $value: ColorValueData;
  $description?: string;
}

const OPACITY_SCALE = [25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500, 525, 550, 575, 600, 625, 650, 675, 700, 725, 750, 775, 800, 825, 850, 875, 900, 925, 950, 975] as const;
type OpacityStep = typeof OPACITY_SCALE[number];

function parseHexToRgba(hex: string): RGBAColor {
  const cleanHex = hex.replace('#', '');
  const fullHex = cleanHex.length === 3 
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex;
  
  return {
    r: parseInt(fullHex.substring(0, 2), 16) / 255,
    g: parseInt(fullHex.substring(2, 4), 16) / 255,
    b: parseInt(fullHex.substring(4, 6), 16) / 255,
    a: 1
  };
}

function formatRgbaToHex(rgba: RGBAColor): string {
  const toHex = (n: number): string => {
    const hex = Math.round(Math.min(1, Math.max(0, n)) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  const hex = `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
  return rgba.a < 1 ? hex + toHex(rgba.a) : hex;
}

function blendColors(background: RGBAColor, foreground: RGBAColor, alpha: number): RGBAColor {
  return {
    r: foreground.r * alpha + background.r * (1 - alpha),
    g: foreground.g * alpha + background.g * (1 - alpha),
    b: foreground.b * alpha + background.b * (1 - alpha),
    a: 1
  };
}

// Color scale: 25-475 = lighter shades, 500 = base, 525-975 = darker shades
// Total: 38 steps (19 light + 500 + 19 dark, but we skip 500 since it's base)
interface ColorPaletteData {
  name: string;
  shades: Record<number, { hex: string; rgba: RGBAColor }>;
}

function generatePalette(name: string, hex: string): ColorPaletteData {
  const baseRgba = parseHexToRgba(hex);
  const white: RGBAColor = { r: 1, g: 1, b: 1, a: 1 };
  const black: RGBAColor = { r: 0, g: 0, b: 0, a: 1 };
  
  const palette: ColorPaletteData = {
    name,
    shades: {}
  };

  // Generate all shades from 25 to 975
  // 25-475: lighter (blend with white, 25 = most white, 475 = almost base)
  // 500: base color
  // 525-975: darker (blend with black, 525 = almost base, 975 = most black)
  
  for (const step of OPACITY_SCALE) {
    let rgba: RGBAColor;
    
    if (step < 500) {
      // Lighter shades: blend base with white
      // step 25 = 95% white, step 475 = 5% white
      const whiteAmount = (500 - step) / 500; // 0.95 at 25, 0.05 at 475
      rgba = blendColors(baseRgba, white, whiteAmount);
    } else if (step === 500) {
      // Base color
      rgba = { ...baseRgba };
    } else {
      // Darker shades: blend base with black
      // step 525 = 5% black, step 975 = 95% black
      const blackAmount = (step - 500) / 500; // 0.05 at 525, 0.95 at 975
      rgba = blendColors(baseRgba, black, blackAmount);
    }
    
    palette.shades[step] = { hex: formatRgbaToHex(rgba).toUpperCase(), rgba };
  }

  return palette;
}

// ============================================
// STATE
// ============================================

let generatedPalettes: ColorPaletteData[] = [];
let exportOutput = '';

// ============================================
// DOM ELEMENTS
// ============================================

const $ = (id: string) => document.getElementById(id);

const elements = {
  tabs: document.querySelectorAll('.tab') as NodeListOf<HTMLButtonElement>,
  tabContents: document.querySelectorAll('.tab-content') as NodeListOf<HTMLDivElement>,
  
  // Color inputs
  colorBrand: $('color-brand') as HTMLInputElement,
  colorBrandHex: $('color-brand-hex') as HTMLInputElement,
  colorAccent: $('color-accent') as HTMLInputElement,
  colorAccentHex: $('color-accent-hex') as HTMLInputElement,
  colorNeutral: $('color-neutral') as HTMLInputElement,
  colorNeutralHex: $('color-neutral-hex') as HTMLInputElement,
  colorSuccess: $('color-success') as HTMLInputElement,
  colorSuccessHex: $('color-success-hex') as HTMLInputElement,
  colorWarning: $('color-warning') as HTMLInputElement,
  colorWarningHex: $('color-warning-hex') as HTMLInputElement,
  colorError: $('color-error') as HTMLInputElement,
  colorErrorHex: $('color-error-hex') as HTMLInputElement,
  
  // Buttons
  btnGenerate: $('btn-generate') as HTMLButtonElement,
  btnCreateVariables: $('btn-create-variables') as HTMLButtonElement,
  btnExport: $('btn-export') as HTMLButtonElement,
  btnCopy: $('btn-copy') as HTMLButtonElement,
  btnDownload: $('btn-download') as HTMLButtonElement,
  btnImport: $('btn-import') as HTMLButtonElement,
  btnValidate: $('btn-validate') as HTMLButtonElement,
  
  // Other
  palettePreview: $('palette-preview') as HTMLDivElement,
  paletteContainer: $('palette-container') as HTMLDivElement,
  exportFormat: $('export-format') as HTMLSelectElement,
  exportOutput: $('export-output') as HTMLDivElement,
  importInput: $('import-input') as HTMLTextAreaElement,
  tokenTree: $('token-tree') as HTMLDivElement,
  statPrimitives: $('stat-primitives') as HTMLDivElement,
  statSemantic: $('stat-semantic') as HTMLDivElement,
  statComposite: $('stat-composite') as HTMLDivElement,
  notification: $('notification') as HTMLDivElement,
};

// ============================================
// UTILITIES
// ============================================

function showNotification(message: string, isError = false): void {
  elements.notification.textContent = message;
  elements.notification.classList.toggle('error', isError);
  elements.notification.classList.add('show');
  setTimeout(() => elements.notification.classList.remove('show'), 3000);
}

function postMessage(type: string, payload?: unknown): void {
  parent.postMessage({ pluginMessage: { type, payload } }, '*');
}

function syncColorInputs(colorInput: HTMLInputElement, hexInput: HTMLInputElement): void {
  colorInput.addEventListener('input', () => {
    hexInput.value = colorInput.value.toUpperCase();
  });
  
  hexInput.addEventListener('input', () => {
    const hex = hexInput.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      colorInput.value = hex;
    }
  });
}

// ============================================
// PALETTE RENDERING
// ============================================

function renderPalette(palette: ColorPaletteData): string {
  // Show shades in a single row (25-975)
  const colorDivs = OPACITY_SCALE.map(step => {
    const shade = palette.shades[step];
    const isMid = step === 500;
    return `<div class="palette-color${isMid ? ' palette-base-mark' : ''}" 
          style="background-color: ${shade.hex}" 
          data-info="${step}: ${shade.hex}" 
          title="${step}: ${shade.hex}"></div>`;
  }).join('');

  return `
    <div class="palette-section">
      <div class="palette-header">
        <div class="palette-title">
          <div class="palette-base" style="background-color: ${palette.shades[500].hex}"></div>
          ${palette.name}
        </div>
        <span style="font-size: 10px; color: var(--color-text-secondary)">500: ${palette.shades[500].hex}</span>
      </div>
      <div class="palette-row">
        <div class="palette-row-label">25 → 975</div>
        <div class="palette-colors">${colorDivs}</div>
      </div>
    </div>
  `;
}

function renderAllPalettes(): void {
  if (generatedPalettes.length === 0) {
    elements.palettePreview.style.display = 'none';
    return;
  }

  elements.palettePreview.style.display = 'block';
  elements.paletteContainer.innerHTML = generatedPalettes.map(renderPalette).join('');
  
  // Update stats
  const primCount = generatedPalettes.length * OPACITY_SCALE.length;
  elements.statPrimitives.textContent = primCount.toString();
  elements.statSemantic.textContent = (generatedPalettes.length * 15).toString();
  elements.statComposite.textContent = '24';
}

function renderTokenTree(): void {
  if (generatedPalettes.length === 0) {
    elements.tokenTree.innerHTML = '<p style="color: var(--color-text-secondary);">Сначала сгенерируйте палитру</p>';
    return;
  }

  let html = '';
  
  for (const palette of generatedPalettes) {
    html += `
      <div class="token-group">
        <div class="token-group-header">
          <div class="token-color" style="background-color: ${palette.shades[500].hex}"></div>
          ${palette.name}
        </div>
        <div class="token-group-content">
    `;
    
    // Show a few samples
    const samples = [25, 100, 300, 500, 700, 900, 975];
    for (const step of samples) {
      html += `
        <div class="token-item">
          <div class="token-color" style="background-color: ${palette.shades[step].hex}"></div>
          <span class="token-name">${palette.name}-${step}</span>
          <span class="token-value">${palette.shades[step].hex}</span>
        </div>
      `;
    }
    
    html += `</div></div>`;
  }
  
  elements.tokenTree.innerHTML = html;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

function generateJSON(): object {
  const primitives: Record<string, unknown> = {};
  
  for (const palette of generatedPalettes) {
    primitives[palette.name] = {};
    
    for (const step of OPACITY_SCALE) {
      (primitives[palette.name] as any)[step] = {
        $type: 'color',
        $value: palette.shades[step]
      };
    }
  }
  
  return {
    $version: '1.0.0',
    $name: 'Generated Design Tokens',
    primitives: { colors: primitives },
    semantic: {},
    composite: {}
  };
}

function generateCSS(): string {
  const lines = [':root {', '  /* Generated Design Tokens */'];
  
  for (const palette of generatedPalettes) {
    lines.push(``, `  /* ${palette.name} */`);
    
    for (const step of OPACITY_SCALE) {
      lines.push(`  --color-${palette.name}-${step}: ${palette.shades[step].hex};`);
    }
  }
  
  lines.push('}');
  return lines.join('\n');
}

function generateSCSS(): string {
  const lines = ['// Generated Design Tokens'];
  
  for (const palette of generatedPalettes) {
    lines.push(``, `// ${palette.name}`);
    
    lines.push(`$color-${palette.name}: (`);
    for (const step of OPACITY_SCALE) {
      lines.push(`  ${step}: ${palette.shades[step].hex},`);
    }
    lines.push(`);`);
  }
  
  return lines.join('\n');
}

function generateFigmaVariables(): object {
  const variables: Array<{name: string; value: RGBAColor; description: string}> = [];
  
  for (const palette of generatedPalettes) {
    for (const step of OPACITY_SCALE) {
      const description = step < 500 
        ? `${palette.name} lightened ${Math.round((500 - step) / 5)}%`
        : step === 500 
          ? `${palette.name} base color`
          : `${palette.name} darkened ${Math.round((step - 500) / 5)}%`;
      
      // Group all colors under colors/ folder
      variables.push({
        name: `colors/${palette.name}/${step}`,
        value: palette.shades[step].rgba,
        description
      });
    }
  }
  
  return { collection: 'Primitives', variables };
}

// ============================================
// EVENT HANDLERS
// ============================================

// Tabs
elements.tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetId = tab.dataset.tab;
    elements.tabs.forEach(t => t.classList.remove('active'));
    elements.tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    if (targetId) {
      const target = $(targetId);
      if (target) target.classList.add('active');
    }
    
    if (targetId === 'preview') {
      renderTokenTree();
    }
  });
});

// Sync color inputs
syncColorInputs(elements.colorBrand, elements.colorBrandHex);
syncColorInputs(elements.colorAccent, elements.colorAccentHex);
syncColorInputs(elements.colorNeutral, elements.colorNeutralHex);
syncColorInputs(elements.colorSuccess, elements.colorSuccessHex);
syncColorInputs(elements.colorWarning, elements.colorWarningHex);
syncColorInputs(elements.colorError, elements.colorErrorHex);

// Generate palette
elements.btnGenerate.addEventListener('click', () => {
  generatedPalettes = [
    generatePalette('brand', elements.colorBrandHex.value),
    generatePalette('accent', elements.colorAccentHex.value),
    generatePalette('neutral', elements.colorNeutralHex.value),
    generatePalette('success', elements.colorSuccessHex.value),
    generatePalette('warning', elements.colorWarningHex.value),
    generatePalette('error', elements.colorErrorHex.value),
  ];
  
  renderAllPalettes();
  showNotification('✨ Палитра сгенерирована!');
});

// Create Figma Variables
elements.btnCreateVariables.addEventListener('click', () => {
  if (generatedPalettes.length === 0) {
    showNotification('Сначала сгенерируйте палитру', true);
    return;
  }
  
  const figmaData = generateFigmaVariables();
  postMessage('create-color-variables', figmaData);
  showNotification('📤 Создаю Variables в Figma...');
});

// Export
elements.btnExport.addEventListener('click', () => {
  if (generatedPalettes.length === 0) {
    showNotification('Сначала сгенерируйте палитру', true);
    return;
  }
  
  const format = elements.exportFormat.value;
  
  switch (format) {
    case 'json':
      exportOutput = JSON.stringify(generateJSON(), null, 2);
      break;
    case 'css':
      exportOutput = generateCSS();
      break;
    case 'scss':
      exportOutput = generateSCSS();
      break;
    case 'figma':
      exportOutput = JSON.stringify(generateFigmaVariables(), null, 2);
      break;
  }
  
  elements.exportOutput.textContent = exportOutput;
  showNotification('📦 Экспорт готов!');
});

// Copy
elements.btnCopy.addEventListener('click', async () => {
  if (!exportOutput) {
    showNotification('Сначала экспортируйте', true);
    return;
  }
  
  try {
    await navigator.clipboard.writeText(exportOutput);
    showNotification('📋 Скопировано!');
  } catch {
    showNotification('Ошибка копирования', true);
  }
});

// Download
elements.btnDownload.addEventListener('click', () => {
  if (!exportOutput) {
    showNotification('Сначала экспортируйте', true);
    return;
  }
  
  const format = elements.exportFormat.value;
  const ext: Record<string, string> = { json: 'json', css: 'css', scss: 'scss', figma: 'json' };
  const filename = `design-tokens.${ext[format]}`;
  
  const blob = new Blob([exportOutput], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('💾 Файл скачан!');
});

// Import
elements.btnValidate.addEventListener('click', () => {
  try {
    JSON.parse(elements.importInput.value);
    showNotification('✓ JSON валиден');
  } catch (e) {
    showNotification('✗ Невалидный JSON', true);
  }
});

elements.btnImport.addEventListener('click', () => {
  try {
    const data = JSON.parse(elements.importInput.value);
    postMessage('import-tokens', { tokens: data });
    showNotification('📤 Импортирую...');
  } catch {
    showNotification('✗ Невалидный JSON', true);
  }
});

// ============================================
// PLUGIN MESSAGES
// ============================================

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  switch (msg.type) {
    case 'variables-created':
      showNotification('✅ Variables созданы в Figma!');
      break;
    case 'tokens-imported':
      showNotification('✅ Токены импортированы!');
      break;
    case 'error':
      showNotification('❌ ' + msg.payload.error, true);
      break;
  }
};

console.log('UI loaded');
