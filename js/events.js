import { state, sites, gradientPresets, layoutPresets, patternList, pushHistory, undo, redo, serializeCustom, deserializeCustom, createDefaultCustom } from './state.js';
import { renderAllGallery, renderCustomPreview, buildCustomCreator, buildGalleryBatchLogoPanel } from './render.js';
import { downloadCanvas, showToast, clamp, debounce, mulberry32, hashStr } from './utils.js';

let _updatingHash = false;
let _pendingRender = null;
let _historyTimer = null;

function scheduleHistoryPush() {
  clearTimeout(_historyTimer);
  _historyTimer = setTimeout(() => {
    pushHistory();
  }, 600);
}

export function flushHistory() {
  clearTimeout(_historyTimer);
  pushHistory();
}

/* ── Tab switching ───────────────────────────────────────────────── */
export function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      state.activeTab = target;
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === target));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `tab-${target}`));
    });
  });
}

/* ── Gallery controls ────────────────────────────────────────────── */
export function initGalleryControls() {
  const patternSel = document.getElementById('gallery-pattern');
  const densitySel = document.getElementById('gallery-density');

  if (patternSel) {
    patternSel.addEventListener('change', () => {
      state.galleryPattern = patternSel.value;
      renderAllGallery();
    });
  }
  if (densitySel) {
    densitySel.addEventListener('change', () => {
      state.galleryDensity = densitySel.value;
      renderAllGallery();
    });
  }

  const batchToggle = document.getElementById('batch-logo-toggle');
  if (batchToggle) {
    batchToggle.addEventListener('click', () => {
      const panel = document.getElementById('gallery-batch-logo');
      const expanded = panel.classList.toggle('expanded');
      batchToggle.setAttribute('aria-expanded', String(expanded));
      panel.setAttribute('aria-hidden', String(!expanded));
      if (expanded && !panel.innerHTML.trim()) buildGalleryBatchLogoPanel();
    });
  }
}

/* ── Gallery download all ────────────────────────────────────────── */
export function initGalleryDownloadAll() {
  const btn = document.getElementById('download-all');
  if (btn) {
    btn.addEventListener('click', () => {
      showToast(`Downloading ${sites.length} images\u2026`);
      sites.forEach((site, i) => {
        const canvas = state.canvases[site.id];
        if (canvas) setTimeout(() => downloadCanvas(canvas, `og-${site.id}.png`), i * 200);
      });
    });
  }
}

/* ── URL state / share link ──────────────────────────────────────── */
function updateHash() {
  if (!location) return;
  const hash = serializeCustom(state.custom);
  if (location.hash.slice(1) !== hash) {
    _updatingHash = true;
    location.hash = hash;
    setTimeout(() => { _updatingHash = false; }, 0);
  }
}

function hydrateFromHash() {
  const hash = location.hash.slice(1);
  if (!hash) return false;
  const parsed = deserializeCustom(hash);
  if (!parsed) return false;
  state.custom = { ...createDefaultCustom(), ...parsed };
  return true;
}

export function initUrlState() {
  window.addEventListener('hashchange', () => {
    if (_updatingHash) return;
    if (hydrateFromHash()) {
      buildCustomCreator();
      renderCustomPreview();
      pushHistory();
    }
  });
}

/* ── Custom creator controls ─────────────────────────────────────── */
function scheduleRender() {
  if (_pendingRender) cancelAnimationFrame(_pendingRender);
  _pendingRender = requestAnimationFrame(() => {
    renderCustomPreview();
    _pendingRender = null;
  });
}

function setCustom(updates) {
  Object.assign(state.custom, updates);
  scheduleRender();
  pushHistory();
  updateHash();
}

function readLogoFile(input, callback) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => callback(e.target.result);
  reader.readAsDataURL(input.files[0]);
}

function rebuildSidebar() {
  buildCustomCreator();
  renderCustomPreview();
}

export function initCustomControls() {
  const sidebar = document.getElementById('creator-sidebar');
  if (!sidebar) return;

  sidebar.addEventListener('input', (e) => {
    const id = e.target.id;
    const c = state.custom;

    // Text fields
    if (id === 'c-title') { c.title = e.target.value; scheduleRender(); updateHash(); scheduleHistoryPush(); return; }
    if (id === 'c-subtitle') { c.subtitle = e.target.value; scheduleRender(); updateHash(); scheduleHistoryPush(); return; }
    if (id === 'c-branding-text') { c.brandingText = e.target.value; scheduleRender(); updateHash(); scheduleHistoryPush(); return; }
    if (id === 'c-logo-url') { c.logo.src = e.target.value; scheduleRender(); updateHash(); scheduleHistoryPush(); return; }

    // Sliders with labels
    const sliders = {
      'c-fontsize': ['fontSize', 'c-fontsize-val', v => v],
      'c-title-weight': ['titleWeight', 'c-title-weight-val', v => v],
      'c-subtitle-weight': ['subtitleWeight', 'c-subtitle-weight-val', v => v],
      'c-letter-spacing': ['letterSpacing', 'c-letter-spacing-val', v => v],
      'c-line-height': ['lineHeight', 'c-line-height-val', v => v],
      'c-glow': ['glowIntensity', 'c-glow-val', v => Math.round(v * 100) + '%'],
      'c-logo-scale': ['logo.scale', 'c-logo-scale-val', v => v],
      'c-logo-opacity': ['logo.opacity', 'c-logo-opacity-val', v => Math.round(v * 100) + '%'],
      'c-logo-rotation': ['logo.rotation', 'c-logo-rotation-val', v => v + '°'],
      'c-vignette': ['effects.vignette', 'c-vignette-val', v => Math.round(v * 100) + '%'],
      'c-grain': ['effects.grain', 'c-grain-val', v => Math.round(v * 100) + '%'],
    };
    if (sliders[id]) {
      const [path, labelId, format] = sliders[id];
      const val = parseFloat(e.target.value);
      setPath(c, path, val);
      const label = document.getElementById(labelId);
      if (label) label.textContent = format(val);
      scheduleRender();
      updateHash();
      scheduleHistoryPush();
      return;
    }

    // Number inputs
    if (id === 'c-logo-x' || id === 'c-logo-y') {
      const key = id === 'c-logo-x' ? 'x' : 'y';
      c.logo[key] = parseInt(e.target.value) || 0;
      scheduleRender();
      updateHash();
      return;
    }

    // Color
    if (id === 'c-accent-picker') {
      c.accent = e.target.value;
      document.getElementById('c-accent-text').value = c.accent;
      scheduleRender();
      updateHash();
      scheduleHistoryPush();
      return;
    }
    if (id === 'c-accent-text') {
      if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
        c.accent = e.target.value;
        document.getElementById('c-accent-picker').value = c.accent;
        scheduleRender();
        updateHash();
        scheduleHistoryPush();
      }
      return;
    }
    if (id === 'c-solid-color') {
      c.background.solidColor = e.target.value;
      document.getElementById('c-solid-color-text').value = c.background.solidColor;
      scheduleRender();
      updateHash();
      scheduleHistoryPush();
      return;
    }
    if (id === 'c-solid-color-text') {
      if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
        c.background.solidColor = e.target.value;
        document.getElementById('c-solid-color').value = c.background.solidColor;
        scheduleRender();
        updateHash();
        scheduleHistoryPush();
      }
      return;
    }

    // Gradient angle
    if (id === 'c-gradient-angle') {
      c.background.customGradient.angle = parseInt(e.target.value);
      document.getElementById('c-gradient-angle-val').textContent = c.background.customGradient.angle + '°';
      scheduleRender();
      updateHash();
      scheduleHistoryPush();
      return;
    }

    // Custom gradient stop inputs
    if (e.target.classList.contains('stop-color') || e.target.classList.contains('stop-pos')) {
      const row = e.target.closest('.stop-row');
      const idx = parseInt(row.dataset.index);
      const stops = c.background.customGradient.stops;
      if (!stops[idx]) return;
      if (e.target.classList.contains('stop-color')) stops[idx].color = e.target.value;
      if (e.target.classList.contains('stop-pos')) {
        stops[idx].pos = parseFloat(e.target.value);
        row.querySelector('.stop-pos-val').textContent = Math.round(stops[idx].pos * 100) + '%';
      }
      scheduleRender();
      updateHash();
      scheduleHistoryPush();
      return;
    }
  });

  sidebar.addEventListener('change', (e) => {
    const id = e.target.id;
    const c = state.custom;

    if (id === 'c-density') { c.density = e.target.value; scheduleRender(); pushHistory(); updateHash(); return; }
    if (id === 'c-bg-type') {
      const val = e.target.value;
      c.background.type = val === 'custom-gradient' ? 'gradient' : val;
      c.background.gradientIndex = val === 'custom-gradient' ? -1 : 0;
      document.getElementById('gradient-preset-field').style.display = val === 'gradient' ? 'block' : 'none';
      document.getElementById('custom-gradient-field').style.display = val === 'custom-gradient' ? 'block' : 'none';
      document.getElementById('solid-color-field').style.display = val === 'solid' ? 'block' : 'none';
      scheduleRender();
      pushHistory();
      updateHash();
      return;
    }
    if (id === 'c-branding-position') { c.brandingPosition = e.target.value; scheduleRender(); pushHistory(); updateHash(); return; }

    // Checkboxes
    const checks = {
      'c-show-branding': 'showBranding',
      'c-show-badge': 'showBadge',
      'c-logo-tint': 'logo.tint',
      'c-logo-shadow': 'logo.shadow',
      'c-glass': 'effects.glassPanel',
    };
    if (checks[id]) {
      setPath(c, checks[id], e.target.checked);
      scheduleRender();
      pushHistory();
      updateHash();
      return;
    }

    // File upload
    if (id === 'c-logo-file') {
      readLogoFile(e.target, (dataUrl) => {
        c.logo.src = dataUrl;
        rebuildSidebar();
        pushHistory();
        updateHash();
      });
      return;
    }
  });

  sidebar.addEventListener('click', (e) => {
    const c = state.custom;

    // Pattern selection
    const patOpt = e.target.closest('.pattern-option');
    if (patOpt) {
      c.pattern = patOpt.dataset.pattern;
      sidebar.querySelectorAll('.pattern-option').forEach(p => p.classList.toggle('active', p.dataset.pattern === c.pattern));
      scheduleRender();
      pushHistory();
      updateHash();
      return;
    }

    // Gradient preset selection
    const swatch = e.target.closest('.gradient-swatch');
    if (swatch) {
      c.background.gradientIndex = parseInt(swatch.dataset.index);
      c.background.type = 'gradient';
      sidebar.querySelectorAll('.gradient-swatch').forEach(s => s.classList.toggle('active', parseInt(s.dataset.index) === c.background.gradientIndex));
      const typeSel = document.getElementById('c-bg-type');
      if (typeSel && typeSel.value !== 'gradient') {
        typeSel.value = 'gradient';
        document.getElementById('gradient-preset-field').style.display = 'block';
        document.getElementById('custom-gradient-field').style.display = 'none';
        document.getElementById('solid-color-field').style.display = 'none';
      }
      scheduleRender();
      pushHistory();
      updateHash();
      return;
    }

    // Template layout selection
    const tpl = e.target.closest('.template-card');
    if (tpl) {
      c.layout = tpl.dataset.layout;
      sidebar.querySelectorAll('.template-card').forEach(t => t.classList.toggle('active', t.dataset.layout === c.layout));
      scheduleRender();
      pushHistory();
      updateHash();
      return;
    }

    // Text align
    const alignBtn = e.target.closest('.align-btn');
    if (alignBtn) {
      c.textAlign = alignBtn.dataset.align;
      sidebar.querySelectorAll('.align-btn').forEach(b => b.classList.toggle('active', b.dataset.align === c.textAlign));
      scheduleRender();
      pushHistory();
      updateHash();
      return;
    }

    // Logo position
    const posBtn = e.target.closest('.logo-pos');
    if (posBtn && posBtn.closest('#logo-position-grid')) {
      c.logo.position = posBtn.dataset.position;
      sidebar.querySelectorAll('#logo-position-grid .logo-pos').forEach(b => b.classList.toggle('active', b.dataset.position === c.logo.position));
      document.getElementById('logo-custom-coords').style.display = c.logo.position === 'custom' ? 'flex' : 'none';
      scheduleRender();
      pushHistory();
      updateHash();
      return;
    }

    // Add/remove gradient stops
    if (e.target.id === 'c-add-stop') {
      const stops = c.background.customGradient.stops;
      const last = stops[stops.length - 1];
      const prev = stops[stops.length - 2] || { pos: 0 };
      let pos = clamp((last.pos + prev.pos) / 2, 0, 1);
      if (Math.abs(pos - last.pos) < 0.04) pos = clamp(last.pos + 0.05, 0, 1);
      stops.push({ pos, color: last.color });
      stops.sort((a, b) => a.pos - b.pos);
      rebuildSidebar();
      scheduleRender();
      pushHistory();
      updateHash();
      return;
    }
    if (e.target.classList.contains('remove-stop')) {
      const row = e.target.closest('.stop-row');
      const idx = parseInt(row.dataset.index);
      if (c.background.customGradient.stops.length > 2) {
        c.background.customGradient.stops.splice(idx, 1);
        rebuildSidebar();
        scheduleRender();
        pushHistory();
        updateHash();
      }
      return;
    }

    // Undo / Redo
    if (e.target.id === 'c-undo') { doUndo(); return; }
    if (e.target.id === 'c-redo') { doRedo(); return; }

    // Remix
    if (e.target.id === 'c-remix') { doRemix(); return; }

    // Download
    if (e.target.id === 'c-download') {
      const canvas = document.getElementById('custom-canvas');
      const filename = c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') || 'custom';
      downloadCanvas(canvas, `og-${filename}.png`);
      showToast('Image downloaded!');
      return;
    }

    // Copy share link
    if (e.target.id === 'c-copy-link') {
      updateHash();
      const url = location.href;
      navigator.clipboard.writeText(url).then(() => showToast('Share link copied!')).catch(() => showToast('Copy failed'));
      return;
    }
  });
}

function doUndo() {
  flushHistory();
  if (undo()) {
    buildCustomCreator();
    renderCustomPreview();
    updateHash();
  }
}

function doRedo() {
  flushHistory();
  if (redo()) {
    buildCustomCreator();
    renderCustomPreview();
    updateHash();
  }
}

function doRemix() {
  const c = state.custom;
  const rng = mulberry32(hashStr(Date.now().toString()));
  const palette = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444'];
  c.accent = palette[Math.floor(rng() * palette.length)];
  c.background.gradientIndex = Math.floor(rng() * gradientPresets.length);
  c.background.type = 'gradient';
  c.pattern = patternList[Math.floor(rng() * (patternList.length - 1))].id;
  c.density = ['low', 'medium', 'high'][Math.floor(rng() * 3)];
  c.layout = Object.keys(layoutPresets)[Math.floor(rng() * Object.keys(layoutPresets).length)];
  c.glowIntensity = Math.round(rng() * 10) / 10;
  c.effects.vignette = Math.round((0.2 + rng() * 0.5) * 100) / 100;
  rebuildSidebar();
  pushHistory();
  updateHash();
}

/* ── Gallery batch logo events ───────────────────────────────────── */
export function initGalleryBatchLogoEvents() {
  const panel = document.getElementById('gallery-batch-logo');
  if (!panel) return;

  panel.addEventListener('input', (e) => {
    const id = e.target.id;
    const g = state.galleryLogo;
    if (id === 'g-logo-url') { g.src = e.target.value; renderAllGallery(); return; }
    if (id === 'g-logo-scale') { g.scale = parseFloat(e.target.value); document.getElementById('g-logo-scale-val').textContent = g.scale; renderAllGallery(); return; }
    if (id === 'g-logo-opacity') { g.opacity = parseFloat(e.target.value); document.getElementById('g-logo-opacity-val').textContent = Math.round(g.opacity * 100) + '%'; renderAllGallery(); return; }
  });

  panel.addEventListener('change', (e) => {
    const id = e.target.id;
    const g = state.galleryLogo;
    if (id === 'g-logo-file') {
      if (!e.target.files || !e.target.files[0]) return;
      const reader = new FileReader();
      reader.onload = (ev) => { g.src = ev.target.result; buildGalleryBatchLogoPanel(); renderAllGallery(); };
      reader.readAsDataURL(e.target.files[0]);
      return;
    }
    if (id === 'g-logo-tint') { g.tint = e.target.checked; renderAllGallery(); return; }
    if (id === 'g-logo-shadow') { g.shadow = e.target.checked; renderAllGallery(); return; }
  });

  panel.addEventListener('click', (e) => {
    const posBtn = e.target.closest('.logo-pos');
    if (posBtn && posBtn.closest('#g-logo-position-grid')) {
      state.galleryLogo.position = posBtn.dataset.position;
      panel.querySelectorAll('#g-logo-position-grid .logo-pos').forEach(b => b.classList.toggle('active', b.dataset.position === state.galleryLogo.position));
      renderAllGallery();
    }
  });
}

/* ── Keyboard shortcuts ──────────────────────────────────────────── */
export function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (state.activeTab !== 'custom') return;
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) doRedo();
      else doUndo();
      return;
    }
    if (mod && e.shiftKey && (e.key.toLowerCase() === 'y' || e.code === 'KeyY')) {
      e.preventDefault();
      doRedo();
    }
  });
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function setPath(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

export { hydrateFromHash, doUndo, doRedo, doRemix };
