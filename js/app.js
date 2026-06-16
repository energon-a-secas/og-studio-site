import { buildGalleryGrid, renderAllGallery, buildCustomCreator, renderCustomPreview } from './render.js';
import { initTabs, initGalleryControls, initGalleryDownloadAll, initCustomControls, initGalleryBatchLogoEvents, initKeyboardShortcuts, hydrateFromHash } from './events.js';
import { pushHistory } from './state.js';

function raf() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

/** Playwright generate-og.mjs waits on this before exporting canvases. */
window.__ogStudioGalleryReady = (async () => {
  const restored = hydrateFromHash();
  buildGalleryGrid();
  await renderAllGallery();
  buildCustomCreator();
  renderCustomPreview();
  initTabs();
  initGalleryControls();
  initGalleryDownloadAll();
  initCustomControls();
  initGalleryBatchLogoEvents();
  initKeyboardShortcuts();
  pushHistory();
  await raf();
})();
