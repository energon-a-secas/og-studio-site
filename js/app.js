import { buildGalleryGrid, renderAllGallery, buildCustomCreator, renderCustomPreview } from './render.js';
import { initTabs, initGalleryControls, initGalleryDownloadAll, initCustomControls } from './events.js';

buildGalleryGrid();
renderAllGallery();
buildCustomCreator();
renderCustomPreview();

initTabs();
initGalleryControls();
initGalleryDownloadAll();
initCustomControls();
