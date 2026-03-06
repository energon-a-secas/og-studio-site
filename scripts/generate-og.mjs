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

  const srv = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  // ES modules are deferred — wait for canvases to be both present AND rendered
  // (canvas.width > 300 means our JS has set it to 1200)
  await page.waitForFunction(() => {
    const canvases = document.querySelectorAll('#gallery-grid .card canvas');
    return canvases.length > 0 && canvases[0].width === 1200;
  }, { timeout: 10000 });

  // Get site count and IDs from the page itself
  const siteIds = await page.evaluate(() => {
    const grid = document.getElementById('gallery-grid');
    const titles = grid.querySelectorAll('.card-title');
    // Convert title to kebab-case id (matching state.js id convention)
    return Array.from(titles).map(el => {
      return el.textContent.trim().toLowerCase().replace(/\s+/g, '-');
    });
  });

  // Also read the actual IDs from state.js by parsing the file
  const stateContent = readFileSync(join(__dir, 'js', 'state.js'), 'utf-8');
  const idMatches = [...stateContent.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);

  const ids = idMatches.length === siteIds.length ? idMatches : siteIds;
  console.log(`Found ${ids.length} sites: ${ids.join(', ')}`);

  // Extract each canvas as JPEG data URL
  const count = ids.length;
  for (let i = 0; i < count; i++) {
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
  console.log(`\nDone — ${count} images saved to assets/`);
}

main().catch(err => { console.error(err); process.exit(1); });
