import { W, H, sites, state, gradientPresets, patternList, layoutPresets, logoPositions, brandingPositions, resolveBackground } from './state.js';
import { drawGradientBg, drawPattern, drawVignette, drawGrain, drawText, drawLogo, drawBranding, drawBadge } from './patterns.js';
import { downloadCanvas, clamp } from './utils.js';

/* ── Render a single site card ───────────────────────────────────── */
export async function renderSite(site, canvas, pattern, density, galleryLogo = null) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const defaultStops = gradientPresets[0].stops;

  drawGradientBg(ctx, defaultStops);
  drawPattern(ctx, site.id, site.accent, pattern, density);
  drawVignette(ctx, 0.35);
  if (galleryLogo && galleryLogo.src) {
    await drawLogo(ctx, galleryLogo, site.accent);
  }
  drawText(ctx, site.title, site.subtitle, site.accent);
}

/* ── Build gallery grid ──────────────────────────────────────────── */
export function buildGalleryGrid() {
  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = '';
  for (const site of sites) {
    const card = document.createElement('div');
    card.className = 'card';

    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `
      <div>
        <div class="card-title" style="color:${site.accent}">${site.title}</div>
        <div class="card-domain">${site.domain}</div>
      </div>
    `;

    const canvas = document.createElement('canvas');
    state.canvases[site.id] = canvas;

    const actions = document.createElement('div');
    actions.className = 'actions';
    const dlBtn = document.createElement('button');
    dlBtn.textContent = 'Download PNG';
    dlBtn.setAttribute('aria-label', `Download ${site.title} preview as PNG`);
    dlBtn.onclick = () => downloadCanvas(canvas, `og-${site.id}.png`);
    actions.appendChild(dlBtn);

    card.appendChild(header);
    card.appendChild(canvas);
    card.appendChild(actions);
    grid.appendChild(card);
  }
}

/* ── Render all gallery canvases ─────────────────────────────────── */
export async function renderAllGallery() {
  for (const site of sites) {
    if (state.canvases[site.id]) {
      await renderSite(site, state.canvases[site.id], state.galleryPattern, state.galleryDensity, state.galleryLogo);
    }
  }
}

/* ── Render custom preview ───────────────────────────────────────── */
export async function renderCustomPreview() {
  const canvas = document.getElementById('custom-canvas');
  if (!canvas) return;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const c = state.custom;
  const bg = resolveBackground(c);

  drawGradientBg(ctx, bg);
  drawPattern(ctx, c.title + c.subtitle, c.accent, c.pattern, c.density);
  drawVignette(ctx, c.effects?.vignette ?? 0.35);
  await drawLogo(ctx, c.logo, c.accent);
  drawText(ctx, c.title, c.subtitle, c.accent, c);
  if (c.showBranding) drawBranding(ctx, c.brandingText, c.brandingPosition);
  drawBadge(ctx, c.showBadge);
  drawGrain(ctx, c.effects?.grain ?? 0);
}

/* ── Build custom creator sidebar ────────────────────────────────── */
export function buildCustomCreator() {
  const sidebar = document.getElementById('creator-sidebar');
  if (!sidebar) return;

  const c = state.custom;
  const bg = c.background;
  const isCustomGradient = bg.gradientIndex === -1 || bg.gradientIndex === 'custom';

  sidebar.innerHTML = `
    <div class="field-group">
      <div class="field-group-title">Actions</div>
      <div class="action-row">
        <button id="c-undo" class="secondary" title="Undo (Ctrl+Z)">↩ Undo</button>
        <button id="c-redo" class="secondary" title="Redo (Ctrl+Shift+Y)">↪ Redo</button>
        <button id="c-remix" title="Randomize style">✨ Remix</button>
      </div>
    </div>

    <div class="field-group">
      <div class="field-group-title">Template</div>
      <div class="template-grid" id="template-grid">
        ${Object.entries(layoutPresets).map(([id, l]) => `
          <div class="template-card${c.layout === id ? ' active' : ''}" data-layout="${id}" title="${l.name}">
            <div class="template-preview template-${id}"></div>
            <div class="template-name">${l.name}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="field-group">
      <div class="field-group-title">Text</div>
      <div class="field">
        <label for="c-title">Title</label>
        <input type="text" id="c-title" value="${escapeHtml(c.title)}">
      </div>
      <div class="field">
        <label for="c-subtitle">Subtitle</label>
        <input type="text" id="c-subtitle" value="${escapeHtml(c.subtitle)}">
      </div>
      <div class="field">
        <label>Text align</label>
        <div class="align-picker" id="text-align-picker">
          ${['left','center','right'].map(a => `
            <button type="button" class="align-btn${c.textAlign === a ? ' active' : ''}" data-align="${a}" aria-label="Align ${a}">
              ${alignIcon(a)}
            </button>
          `).join('')}
        </div>
      </div>
      <div class="field">
        <label for="c-fontsize">Title font size: <span id="c-fontsize-val">${c.fontSize}</span>px</label>
        <input type="range" id="c-fontsize" min="48" max="140" value="${c.fontSize}">
      </div>
      <div class="field">
        <label for="c-title-weight">Title weight: <span id="c-title-weight-val">${c.titleWeight}</span></label>
        <input type="range" id="c-title-weight" min="400" max="900" step="100" value="${c.titleWeight}">
      </div>
      <div class="field">
        <label for="c-subtitle-weight">Subtitle weight: <span id="c-subtitle-weight-val">${c.subtitleWeight}</span></label>
        <input type="range" id="c-subtitle-weight" min="300" max="700" step="100" value="${c.subtitleWeight}">
      </div>
      <div class="field">
        <label for="c-letter-spacing">Letter spacing: <span id="c-letter-spacing-val">${c.letterSpacing}</span>px</label>
        <input type="range" id="c-letter-spacing" min="-2" max="8" step="0.5" value="${c.letterSpacing}">
      </div>
      <div class="field">
        <label for="c-line-height">Line height: <span id="c-line-height-val">${c.lineHeight}</span></label>
        <input type="range" id="c-line-height" min="0.9" max="1.8" step="0.05" value="${c.lineHeight}">
      </div>
      <div class="field">
        <label for="c-glow">Glow intensity: <span id="c-glow-val">${Math.round(c.glowIntensity * 100)}</span>%</label>
        <input type="range" id="c-glow" min="0" max="1" step="0.05" value="${c.glowIntensity}">
      </div>
    </div>

    <div class="field-group">
      <div class="field-group-title">Colors & Background</div>
      <div class="field">
        <label>Accent color</label>
        <div class="color-field">
          <input type="color" id="c-accent-picker" value="${c.accent}">
          <input type="text" id="c-accent-text" value="${c.accent}" maxlength="7">
        </div>
      </div>
      <div class="field">
        <label for="c-bg-type">Background type</label>
        <select id="c-bg-type">
          <option value="gradient" ${bg.type === 'gradient' ? 'selected' : ''}>Gradient preset</option>
          <option value="custom-gradient" ${isCustomGradient ? 'selected' : ''}>Custom gradient</option>
          <option value="solid" ${bg.type === 'solid' ? 'selected' : ''}>Solid color</option>
        </select>
      </div>
      <div class="field" id="gradient-preset-field" ${isCustomGradient || bg.type === 'solid' ? 'style="display:none"' : ''}>
        <label>Gradient presets</label>
        <div class="gradient-presets" id="gradient-presets">
          ${gradientPresets.map((g, i) => `
            <div class="gradient-swatch${i === bg.gradientIndex ? ' active' : ''}"
                 data-index="${i}" title="${g.name}"
                 style="background:linear-gradient(135deg,${g.stops.map(s => s.color).join(',')})"></div>
          `).join('')}
        </div>
      </div>
      <div class="field" id="custom-gradient-field" ${!isCustomGradient ? 'style="display:none"' : ''}>
        <label>Custom gradient</label>
        <div class="field-row">
          <label for="c-gradient-angle">Angle</label>
          <input type="range" id="c-gradient-angle" min="0" max="360" value="${bg.customGradient.angle}">
          <span id="c-gradient-angle-val">${bg.customGradient.angle}°</span>
        </div>
        <div class="stops-list" id="gradient-stops">
          ${bg.customGradient.stops.map((s, i) => stopRow(s, i)).join('')}
        </div>
        <button type="button" id="c-add-stop" class="secondary" style="width:100%;margin-top:8px">Add stop</button>
      </div>
      <div class="field" id="solid-color-field" ${bg.type !== 'solid' ? 'style="display:none"' : ''}>
        <label>Solid color</label>
        <div class="color-field">
          <input type="color" id="c-solid-color" value="${bg.solidColor}">
          <input type="text" id="c-solid-color-text" value="${bg.solidColor}" maxlength="7">
        </div>
      </div>
    </div>

    <div class="field-group">
      <div class="field-group-title">Pattern</div>
      <div class="pattern-grid" id="pattern-selector">
        ${patternList.map(p => `
          <div class="pattern-option${p.id === c.pattern ? ' active' : ''}" data-pattern="${p.id}">${p.name}</div>
        `).join('')}
      </div>
      <div class="field" style="margin-top:10px">
        <label for="c-density">Density</label>
        <select id="c-density">
          <option value="low"${c.density === 'low' ? ' selected' : ''}>Low</option>
          <option value="medium"${c.density === 'medium' ? ' selected' : ''}>Medium</option>
          <option value="high"${c.density === 'high' ? ' selected' : ''}>High</option>
        </select>
      </div>
    </div>

    <div class="field-group">
      <div class="field-group-title">Logo / Watermark</div>
      <div class="field">
        <label for="c-logo-file">Upload image</label>
        <input type="file" id="c-logo-file" accept="image/*">
        ${c.logo.src ? `<img class="logo-thumb" src="${c.logo.src}" alt="Logo preview">` : ''}
      </div>
      <div class="field">
        <label for="c-logo-url">Or image URL</label>
        <input type="text" id="c-logo-url" value="${escapeHtml(c.logo.src)}" placeholder="https://…">
      </div>
      <div class="field">
        <label>Position</label>
        <div class="logo-position-grid" id="logo-position-grid">
          ${logoPositions.map(p => `
            <button type="button" class="logo-pos${c.logo.position === p.id ? ' active' : ''}" data-position="${p.id}" title="${p.label}" aria-label="${p.label}">
              ${p.label}
            </button>
          `).join('')}
        </div>
      </div>
      <div class="field-row" id="logo-custom-coords" ${c.logo.position !== 'custom' ? 'style="display:none"' : ''}>
        <div class="field" style="flex:1">
          <label for="c-logo-x">X</label>
          <input type="number" id="c-logo-x" value="${c.logo.x}" min="0" max="${W}">
        </div>
        <div class="field" style="flex:1">
          <label for="c-logo-y">Y</label>
          <input type="number" id="c-logo-y" value="${c.logo.y}" min="0" max="${H}">
        </div>
      </div>
      <div class="field">
        <label for="c-logo-scale">Scale: <span id="c-logo-scale-val">${c.logo.scale}</span></label>
        <input type="range" id="c-logo-scale" min="0.1" max="3" step="0.05" value="${c.logo.scale}">
      </div>
      <div class="field">
        <label for="c-logo-opacity">Opacity: <span id="c-logo-opacity-val">${Math.round(c.logo.opacity * 100)}</span>%</label>
        <input type="range" id="c-logo-opacity" min="0" max="1" step="0.05" value="${c.logo.opacity}">
      </div>
      <div class="field">
        <label for="c-logo-rotation">Rotation: <span id="c-logo-rotation-val">${c.logo.rotation}</span>°</label>
        <input type="range" id="c-logo-rotation" min="-180" max="180" value="${c.logo.rotation}">
      </div>
      <div class="field">
        <label>
          <input type="checkbox" id="c-logo-tint" ${c.logo.tint ? 'checked' : ''}>
          Tint to accent color
        </label>
      </div>
      <div class="field">
        <label>
          <input type="checkbox" id="c-logo-shadow" ${c.logo.shadow ? 'checked' : ''}>
          Shadow / glow
        </label>
      </div>
    </div>

    <div class="field-group">
      <div class="field-group-title">Effects</div>
      <div class="field">
        <label for="c-vignette">Vignette: <span id="c-vignette-val">${Math.round((c.effects?.vignette ?? 0.35) * 100)}</span>%</label>
        <input type="range" id="c-vignette" min="0" max="1" step="0.05" value="${c.effects?.vignette ?? 0.35}">
      </div>
      <div class="field">
        <label for="c-grain">Grain: <span id="c-grain-val">${Math.round((c.effects?.grain ?? 0) * 100)}</span>%</label>
        <input type="range" id="c-grain" min="0" max="1" step="0.05" value="${c.effects?.grain ?? 0}">
      </div>
      <div class="field">
        <label>
          <input type="checkbox" id="c-glass" ${c.effects?.glassPanel ? 'checked' : ''}>
          Frosted glass panel behind text
        </label>
      </div>
    </div>

    <div class="field-group">
      <div class="field-group-title">Branding</div>
      <div class="field">
        <label>
          <input type="checkbox" id="c-show-branding" ${c.showBranding ? 'checked' : ''}>
          Show branding text
        </label>
      </div>
      <div class="field">
        <label for="c-branding-text">Branding text</label>
        <input type="text" id="c-branding-text" value="${escapeHtml(c.brandingText)}">
      </div>
      <div class="field">
        <label for="c-branding-position">Branding position</label>
        <select id="c-branding-position">
          ${brandingPositions.map(p => `
            <option value="${p.id}"${c.brandingPosition === p.id ? ' selected' : ''}>${p.label}</option>
          `).join('')}
        </select>
      </div>
      <div class="field">
        <label>
          <input type="checkbox" id="c-show-badge" ${c.showBadge ? 'checked' : ''}>
          Show "Made with OG Studio" badge
        </label>
      </div>
    </div>

    <div class="field-group">
      <div class="field-group-title">Export & Share</div>
      <button id="c-download" style="width:100%;padding:12px;margin-bottom:10px">Download PNG</button>
      <button id="c-copy-link" class="secondary" style="width:100%;padding:12px">Copy share link</button>
    </div>
  `;
}

function stopRow(s, i) {
  return `
    <div class="stop-row" data-index="${i}">
      <input type="color" class="stop-color" value="${s.color}" aria-label="Stop ${i + 1} color">
      <input type="range" class="stop-pos" min="0" max="1" step="0.01" value="${s.pos}" aria-label="Stop ${i + 1} position">
      <span class="stop-pos-val">${Math.round(s.pos * 100)}%</span>
      <button type="button" class="remove-stop secondary" ${i <= 1 ? 'disabled' : ''}>×</button>
    </div>
  `;
}

function alignIcon(align) {
  if (align === 'left') return '⬅';
  if (align === 'right') return '➡';
  return '≡';
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

/* ── Build gallery batch logo panel ──────────────────────────────── */
export function buildGalleryBatchLogoPanel() {
  const container = document.getElementById('gallery-batch-logo');
  if (!container) return;
  const g = state.galleryLogo;

  container.innerHTML = `
    <div class="batch-logo-panel">
      <div class="field">
        <label for="g-logo-file">Upload logo</label>
        <input type="file" id="g-logo-file" accept="image/*">
        ${g.src ? `<img class="logo-thumb" src="${g.src}" alt="Logo preview">` : ''}
      </div>
      <div class="field">
        <label for="g-logo-url">Or URL</label>
        <input type="text" id="g-logo-url" value="${escapeHtml(g.src)}" placeholder="https://…">
      </div>
      <div class="field">
        <label>Position</label>
        <div class="logo-position-grid" id="g-logo-position-grid">
          ${logoPositions.filter(p => p.id !== 'custom').map(p => `
            <button type="button" class="logo-pos${g.position === p.id ? ' active' : ''}" data-position="${p.id}" title="${p.label}" aria-label="${p.label}">${p.label}</button>
          `).join('')}
        </div>
      </div>
      <div class="field">
        <label for="g-logo-scale">Scale: <span id="g-logo-scale-val">${g.scale}</span></label>
        <input type="range" id="g-logo-scale" min="0.1" max="3" step="0.05" value="${g.scale}">
      </div>
      <div class="field">
        <label for="g-logo-opacity">Opacity: <span id="g-logo-opacity-val">${Math.round(g.opacity * 100)}</span>%</label>
        <input type="range" id="g-logo-opacity" min="0" max="1" step="0.05" value="${g.opacity}">
      </div>
      <div class="field">
        <label>
          <input type="checkbox" id="g-logo-tint" ${g.tint ? 'checked' : ''}>
          Tint to site accent
        </label>
      </div>
      <div class="field">
        <label>
          <input type="checkbox" id="g-logo-shadow" ${g.shadow ? 'checked' : ''}>
          Shadow / glow
        </label>
      </div>
    </div>
  `;
}
