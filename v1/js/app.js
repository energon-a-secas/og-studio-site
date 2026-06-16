import { buildGalleryGrid, renderAllGallery, buildCustomCreator, renderCustomPreview } from './render.js';
import { initTabs, initGalleryControls, initGalleryDownloadAll, initCustomControls } from './events.js';

function raf() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

/** Playwright generate-og.mjs waits on this before exporting canvases. */
window.__ogStudioGalleryReady = (async () => {
  buildGalleryGrid();
  renderAllGallery();
  buildCustomCreator();
  renderCustomPreview();
  initTabs();
  initGalleryControls();
  initGalleryDownloadAll();
  initCustomControls();
  await raf();
})();
