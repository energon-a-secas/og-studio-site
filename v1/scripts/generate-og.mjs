#!/usr/bin/env node
/**
 * generate-og.mjs — Render all OG Studio site previews and save as JPGs.
 *
 * Usage:
 *   cd og-studio-site
 *   node scripts/generate-og.mjs
 *
 * Requirements: npm install --save-dev playwright
 * Outputs:      assets/og-{site-id}.jpg for every site in state.js
 */

import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { sites } from '../js/state.js';

const __dir = fileURLToPath(new URL('..', import.meta.url));
const ASSETS = join(__dir, 'assets');
const PORT = 18790;

/* ── Tiny static file server ─────────────────────────────────────── */
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.mjs': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.svg': 'image/svg+xml',
};

function serve() {
  return new Promise(resolve => {
    const srv = createServer((req, res) => {
      const urlPath = req.url.split('?')[0];
      const p = join(__dir, urlPath === '/' ? 'index.html' : urlPath);
      try {
        const data = readFileSync(p);
        res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end();
      }
    });
    srv.listen(PORT, () => { console.log(`Serving on http://localhost:${PORT}`); resolve(srv); });
  });
}

/* ── Main ────────────────────────────────────────────────────────── */
async function main() {
  if (!existsSync(ASSETS)) mkdirSync(ASSETS, { recursive: true });

  const ids = sites.map((s) => s.id);
  const expected = ids.length;

  const srv = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', (err) => console.error('  page error:', err.message));

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ogStudioGalleryReady, { timeout: 15000 });
  await page.evaluate(() => window.__ogStudioGalleryReady);

  await page.waitForFunction((n) => {
    const canvases = document.querySelectorAll('#gallery-grid .card canvas');
    if (canvases.length < n) return false;
    const c = canvases[0];
    if (!c || c.width !== 1200 || c.height !== 630) return false;
    const ctx = c.getContext('2d');
    const px = ctx.getImageData(600, 315, 1, 1).data;
    return px[0] + px[1] + px[2] > 24;
  }, expected, { timeout: 20000 });

  console.log(`Found ${ids.length} sites: ${ids.join(', ')}`);

  for (let i = 0; i < ids.length; i++) {
    const dataUrl = await page.evaluate((idx) => {
      const grid = document.getElementById('gallery-grid');
      const canvas = grid.querySelectorAll('.card canvas')[idx];
      return canvas ? canvas.toDataURL('image/jpeg', 0.92) : null;
    }, i);

    if (!dataUrl) { console.log(`  Skipped index ${i} — no canvas`); continue; }

    const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
    const buf = Buffer.from(base64, 'base64');
    const outPath = join(ASSETS, `og-${ids[i]}.jpg`);
    writeFileSync(outPath, buf);
    console.log(`  ${outPath.split('/').pop()} (${(buf.length / 1024).toFixed(0)} KB)`);
  }

  await browser.close();
  srv.close();
  console.log(`\nDone — ${ids.length} images saved to assets/`);
}

main().catch(err => { console.error(err); process.exit(1); });
