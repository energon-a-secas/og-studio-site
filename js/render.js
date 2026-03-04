import { W, H, sites, state, gradientPresets, patternList } from './state.js';
import { drawGradientBg, drawPattern, drawVignette, drawText, drawBranding } from './patterns.js';
import { downloadCanvas } from './utils.js';

/* ── Render a single site card ───────────────────────────────────── */
export function renderSite(site, canvas, pattern, density) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const defaultStops = gradientPresets[0].stops;

  drawGradientBg(ctx, defaultStops);
  drawPattern(ctx, site.id, site.accent, pattern, density);
  drawVignette(ctx);
  drawText(ctx, site.title, site.subtitle, site.accent);
  drawBranding(ctx);
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
    dlBtn.onclick = () => downloadCanvas(canvas, `og-${site.id}.png`);
    actions.appendChild(dlBtn);

    card.appendChild(header);
    card.appendChild(canvas);
    card.appendChild(actions);
    grid.appendChild(card);
  }
}

/* ── Render all gallery canvases ─────────────────────────────────── */
export function renderAllGallery() {
  for (const site of sites) {
    if (state.canvases[site.id]) {
      renderSite(site, state.canvases[site.id], state.galleryPattern, state.galleryDensity);
    }
  }
}

/* ── Render custom preview ───────────────────────────────────────── */
export function renderCustomPreview() {
  const canvas = document.getElementById('custom-canvas');
  if (!canvas) return;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const c = state.custom;
  const gradient = gradientPresets[c.gradientIndex] || gradientPresets[0];

  drawGradientBg(ctx, gradient.stops);
  drawPattern(ctx, c.title + c.subtitle, c.accent, c.pattern, c.density);
  drawVignette(ctx);
  drawText(ctx, c.title, c.subtitle, c.accent, c.fontSize);
  if (c.showBranding) drawBranding(ctx, c.brandingText);
}

/* ── Build custom creator sidebar ────────────────────────────────── */
export function buildCustomCreator() {
  const sidebar = document.getElementById('creator-sidebar');
  if (!sidebar) return;

  const c = state.custom;

  sidebar.innerHTML = `
    <div class="field-group">
      <div class="field-group-title">Text</div>
      <div class="field">
        <label>Title</label>
        <input type="text" id="c-title" value="${c.title}">
      </div>
      <div class="field">
        <label>Subtitle</label>
        <input type="text" id="c-subtitle" value="${c.subtitle}">
      </div>
      <div class="field">
        <label>Title font size: <span id="c-fontsize-val">${c.fontSize}</span>px</label>
        <input type="range" id="c-fontsize" min="32" max="96" value="${c.fontSize}" style="width:100%">
      </div>
    </div>

    <div class="field-group">
      <div class="field-group-title">Colors</div>
      <div class="field">
        <label>Accent color</label>
        <div class="color-field">
          <input type="color" id="c-accent-picker" value="${c.accent}">
          <input type="text" id="c-accent-text" value="${c.accent}" maxlength="7">
        </div>
      </div>
      <div class="field">
        <label>Background gradient</label>
        <div class="gradient-presets" id="gradient-presets">
          ${gradientPresets.map((g, i) => `
            <div class="gradient-swatch${i === c.gradientIndex ? ' active' : ''}"
                 data-index="${i}" title="${g.name}"
                 style="background:linear-gradient(135deg,${g.stops.map(s => s.color).join(',')})"></div>
          `).join('')}
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
        <label>Density</label>
        <select id="c-density">
          <option value="low"${c.density === 'low' ? ' selected' : ''}>Low</option>
          <option value="medium"${c.density === 'medium' ? ' selected' : ''}>Medium</option>
          <option value="high"${c.density === 'high' ? ' selected' : ''}>High</option>
        </select>
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
        <label>Branding text</label>
        <input type="text" id="c-branding-text" value="${c.brandingText}">
      </div>
    </div>

    <button id="c-download" style="width:100%;padding:12px">Download PNG</button>
  `;
}
