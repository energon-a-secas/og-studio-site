import { state, sites } from './state.js';
import { renderAllGallery, renderCustomPreview, buildCustomCreator } from './render.js';
import { downloadCanvas, showToast } from './utils.js';

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

/* ── Custom creator controls ─────────────────────────────────────── */
export function initCustomControls() {
  const sidebar = document.getElementById('creator-sidebar');
  if (!sidebar) return;

  sidebar.addEventListener('input', (e) => {
    const id = e.target.id;
    const c = state.custom;

    if (id === 'c-title') { c.title = e.target.value; renderCustomPreview(); }
    if (id === 'c-subtitle') { c.subtitle = e.target.value; renderCustomPreview(); }
    if (id === 'c-fontsize') {
      c.fontSize = parseInt(e.target.value);
      document.getElementById('c-fontsize-val').textContent = c.fontSize;
      renderCustomPreview();
    }
    if (id === 'c-accent-picker') {
      c.accent = e.target.value;
      document.getElementById('c-accent-text').value = c.accent;
      renderCustomPreview();
    }
    if (id === 'c-accent-text') {
      if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
        c.accent = e.target.value;
        document.getElementById('c-accent-picker').value = c.accent;
        renderCustomPreview();
      }
    }
    if (id === 'c-branding-text') { c.brandingText = e.target.value; renderCustomPreview(); }
  });

  sidebar.addEventListener('change', (e) => {
    const id = e.target.id;
    const c = state.custom;

    if (id === 'c-density') { c.density = e.target.value; renderCustomPreview(); }
    if (id === 'c-show-branding') { c.showBranding = e.target.checked; renderCustomPreview(); }
  });

  sidebar.addEventListener('click', (e) => {
    const c = state.custom;

    // pattern selection
    const patOpt = e.target.closest('.pattern-option');
    if (patOpt) {
      c.pattern = patOpt.dataset.pattern;
      sidebar.querySelectorAll('.pattern-option').forEach(p => p.classList.toggle('active', p.dataset.pattern === c.pattern));
      renderCustomPreview();
    }

    // gradient selection
    const swatch = e.target.closest('.gradient-swatch');
    if (swatch) {
      c.gradientIndex = parseInt(swatch.dataset.index);
      sidebar.querySelectorAll('.gradient-swatch').forEach(s => s.classList.toggle('active', parseInt(s.dataset.index) === c.gradientIndex));
      renderCustomPreview();
    }

    // download
    if (e.target.id === 'c-download') {
      const canvas = document.getElementById('custom-canvas');
      const filename = c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') || 'custom';
      downloadCanvas(canvas, `og-${filename}.png`);
      showToast('Image downloaded!');
    }
  });
}
