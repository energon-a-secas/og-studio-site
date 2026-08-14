#!/usr/bin/env node
// record-gif.mjs — scripted demo GIFs for site previews.
//
// Drives a page through a small scenario (hold, eased scroll down, hold,
// scroll back) in headless Chromium and encodes the frames straight to GIF
// with gifenc — no ffmpeg, no native deps. Output matches the hub's hover
// preview format (646x300, desktop layout rendered at half device scale).
//
//   node scripts/record-gif.mjs <target> [flags]      one site
//   node scripts/record-gif.mjs --all-missing [flags] every live hub card on a
//                                                     neorgon domain that has no
//                                                     preview gif yet (skip-existing,
//                                                     so the run is resumable and
//                                                     hand-made gifs are never touched)
//
// <target> resolves in this order:
//   has "://"            → recorded as-is (--deploy then needs --card)
//   hub card id          → domain read from neorgon-site/index.html
//   og id (js/state.js)  → its domain; card id reverse-looked-up by domain
//   bare domain          → https://<domain>/
//
// Flags:
//   --out <file>       write here (default assets/gif-<name>.gif)
//   --deploy           copy to ../neorgon-site/assets/previews/<card>.gif
//                      and add the PREVIEW_MAP entry when missing
//   --card <id>        card id for --deploy when it cannot be derived
//   --force            overwrite an existing preview gif file
//   --size WxH         output pixels (default 646x300)
//   --fps N            frames per second (default 10)
//   --light            lighter clip: 41 frames instead of 56, 160 colors —
//                      roughly a third smaller, the batch default
//   --colors N         palette size 2..256 (default 256, or 160 with --light)
//   --scenario <file>  JSON steps: [{"hold":8},{"scroll":{"to":"60%","frames":26}},
//                      {"click":{"sel":"..."}}, {"hover":{"sel":"..."}},
//                      {"type":{"sel":"...","text":"..."}}]
//
// A preview that exists in PREVIEW_MAP but not on disk (the map had 14 of
// those when this tool landed) deploys without --force: filling a hole is
// not overwriting.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import gifenc from 'gifenc';
import pngjs from 'pngjs';

const { GIFEncoder, quantize, applyPalette } = gifenc;
const { PNG } = pngjs;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OG_ROOT = path.resolve(HERE, '..');
const HUB = path.resolve(OG_ROOT, '..', 'neorgon-site');
const PREVIEWS = path.join(HUB, 'assets', 'previews');
const PREVIEWS_JS = path.join(HUB, 'js', 'previews.js');

const DEFAULT_SCENARIO = [
  { hold: 8 },
  { scroll: { to: '65%', frames: 26 } },
  { hold: 5 },
  { scroll: { to: 0, frames: 12 } },
  { hold: 5 },
];

const LIGHT_SCENARIO = [
  { hold: 6 },
  { scroll: { to: '65%', frames: 18 } },
  { hold: 4 },
  { scroll: { to: 0, frames: 9 } },
  { hold: 4 },
];

// ── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const a = { target: null, out: null, deploy: false, card: null, force: false,
    size: '646x300', fps: 10, scenario: null, light: false, colors: null, allMissing: false };
  for (let i = 0; i < argv.length; i += 1) {
    const v = argv[i];
    if (v === '--deploy') a.deploy = true;
    else if (v === '--force') a.force = true;
    else if (v === '--light') a.light = true;
    else if (v === '--all-missing') a.allMissing = true;
    else if (v === '--out') a.out = argv[(i += 1)];
    else if (v === '--card') a.card = argv[(i += 1)];
    else if (v === '--size') a.size = argv[(i += 1)];
    else if (v === '--fps') a.fps = Number(argv[(i += 1)]);
    else if (v === '--colors') a.colors = Number(argv[(i += 1)]);
    else if (v === '--scenario') a.scenario = argv[(i += 1)];
    else if (!v.startsWith('--') && !a.target) a.target = v;
    else throw new Error(`unknown argument: ${v}`);
  }
  if (!a.target && !a.allMissing) {
    throw new Error('usage: record-gif.mjs <card|og-id|domain|url> [flags], or --all-missing');
  }
  if (!a.colors) a.colors = a.light ? 160 : 256;
  return a;
}

// ── Target resolution ────────────────────────────────────────────────────────

/** Map card-id -> {domain, soon} straight from the hub's own markup. */
function hubCards() {
  const html = fs.readFileSync(path.join(HUB, 'index.html'), 'utf8');
  const cards = new Map();
  for (const m of html.matchAll(/data-card-id="([^"]+)"([\s\S]{0,900}?)card-domain">([^<]+)</g)) {
    cards.set(m[1], { domain: m[3].trim(), soon: m[2].includes('data-status="soon"') });
  }
  return cards;
}

function ogSites() {
  const state = fs.readFileSync(path.join(OG_ROOT, 'js', 'state.js'), 'utf8');
  const sites = new Map();
  for (const m of state.matchAll(/\{\s*id:\s*'([^']+)'.*?domain:\s*'([^']+)'/g)) {
    sites.set(m[1], m[2]);
  }
  return sites;
}

/** -> {url, card, name} — card may be null (URL targets), name is for filenames. */
function resolveTarget(target, cardFlag) {
  const cards = hubCards();
  const byDomain = new Map([...cards].map(([id, c]) => [c.domain, id]));
  if (target.includes('://')) {
    const host = new URL(target).hostname;
    return { url: target, card: cardFlag || byDomain.get(host) || null,
      name: cardFlag || byDomain.get(host) || host.replace(/\./g, '-') };
  }
  if (cards.has(target)) {
    return { url: `https://${cards.get(target).domain}/`, card: target, name: target };
  }
  const og = ogSites();
  if (og.has(target)) {
    const dom = og.get(target);
    const card = cardFlag || byDomain.get(dom) || null;
    return { url: `https://${dom}/`, card, name: card || target };
  }
  if (target.includes('.')) {
    const card = cardFlag || byDomain.get(target) || null;
    return { url: `https://${target}/`, card, name: card || target.replace(/\./g, '-') };
  }
  throw new Error(`cannot resolve "${target}": not a hub card id, og id, domain, or URL`);
}

// ── Scenario engine ──────────────────────────────────────────────────────────

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);

async function maxScroll(page) {
  return page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    return Math.max(0, el.scrollHeight - window.innerHeight);
  });
}

function parseScrollTo(to, max, from) {
  if (to === 'bottom') return max;
  if (typeof to === 'string' && to.endsWith('%')) return (max * parseFloat(to)) / 100;
  if (typeof to === 'number') return Math.min(to, max);
  return from;
}

/** Expand steps into an array of per-frame async ops. */
async function buildFrameOps(page, steps) {
  const ops = [];
  let pos = 0;
  const max = await maxScroll(page);
  for (const step of steps) {
    if (step.hold) {
      for (let i = 0; i < step.hold; i += 1) ops.push(null);
    } else if (step.scroll) {
      const from = pos;
      const to = parseScrollTo(step.scroll.to, max, from);
      const n = step.scroll.frames || 20;
      for (let i = 1; i <= n; i += 1) {
        const y = Math.round(from + (to - from) * easeInOut(i / n));
        ops.push(() => page.evaluate((v) => window.scrollTo(0, v), y));
      }
      pos = to;
    } else if (step.click) {
      ops.push(() => page.click(step.click.sel, { timeout: 3000 }).catch(() => {}));
      for (let i = 0; i < (step.click.frames || 6); i += 1) ops.push(null);
    } else if (step.hover) {
      ops.push(() => page.hover(step.hover.sel, { timeout: 3000 }).catch(() => {}));
      for (let i = 0; i < (step.hover.frames || 6); i += 1) ops.push(null);
    } else if (step.type) {
      ops.push(() => page.fill(step.type.sel, step.type.text, { timeout: 3000 }).catch(() => {}));
      for (let i = 0; i < (step.type.frames || 8); i += 1) ops.push(null);
    }
  }
  return ops;
}

// ── Recording ────────────────────────────────────────────────────────────────

async function record(browser, { url, outW, outH, fps, steps }) {
  const context = await browser.newContext({
    viewport: { width: outW * 2, height: outH * 2 },
    deviceScaleFactor: 0.5,
    reducedMotion: 'no-preference',
  });
  try {
    const page = await context.newPage();
    console.log(`  loading ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
      .catch(() => page.goto(url, { waitUntil: 'load', timeout: 45000 }));
    await page.addStyleTag({
      content: 'html{scroll-behavior:auto!important}::-webkit-scrollbar{display:none!important}html,body{scrollbar-width:none!important}',
    });
    await page.waitForTimeout(900);

    const ops = await buildFrameOps(page, steps);
    console.log(`  recording ${ops.length} frames at ${fps} fps (${(ops.length / fps).toFixed(1)}s)`);
    const frames = [];
    for (const op of ops) {
      if (op) await op();
      const png = PNG.sync.read(await page.screenshot({ type: 'png' }));
      if (png.width !== outW || png.height !== outH) {
        throw new Error(`frame is ${png.width}x${png.height}, expected ${outW}x${outH}`);
      }
      frames.push(new Uint8Array(png.data));
    }
    return frames;
  } finally {
    await context.close();
  }
}

function encode(frames, outW, outH, fps, colors) {
  // One palette for the whole clip, sampled across it, keeps frames coherent
  // and compresses far better than per-frame palettes.
  const samples = [frames[0], frames[Math.floor(frames.length / 2)], frames[frames.length - 1]];
  const joined = new Uint8Array(samples.length * frames[0].length);
  samples.forEach((f, i) => joined.set(f, i * f.length));
  const palette = quantize(joined, colors);
  const gif = GIFEncoder();
  const delay = Math.round(1000 / fps);
  frames.forEach((f, i) => {
    gif.writeFrame(applyPalette(f, palette), outW, outH,
      i === 0 ? { palette, delay, repeat: 0 } : { palette, delay });
  });
  gif.finish();
  return Buffer.from(gif.bytes());
}

// ── Hub deploy ───────────────────────────────────────────────────────────────

function previewMapEntry(card) {
  const js = fs.readFileSync(PREVIEWS_JS, 'utf8');
  const m = js.match(new RegExp(`['"]?${card}['"]?:\\s*'([^']+)'`));
  return m ? m[1] : null;
}

function previewFileFor(card) {
  return path.join(PREVIEWS, previewMapEntry(card) || `${card}.gif`);
}

function deployToHub(gifBuf, card, force) {
  const mapped = previewMapEntry(card);
  const file = mapped || `${card}.gif`;
  const dest = path.join(PREVIEWS, file);
  if (fs.existsSync(dest) && !force) {
    throw new Error(`${path.relative(HUB, dest)} already exists — pass --force to replace it`);
  }
  fs.mkdirSync(PREVIEWS, { recursive: true });
  fs.writeFileSync(dest, gifBuf);
  let patched = false;
  if (!mapped) {
    const js = fs.readFileSync(PREVIEWS_JS, 'utf8');
    const anchor = 'const PREVIEW_MAP = {';
    if (!js.includes(anchor)) throw new Error('previews.js drifted: PREVIEW_MAP anchor not found');
    const key = /^[a-z0-9]+$/i.test(card) ? card : `'${card}'`;
    fs.writeFileSync(PREVIEWS_JS, js.replace(anchor, `${anchor}\n    ${key}: '${file}',`));
    patched = true;
  }
  return { dest, patched };
}

// ── Modes ────────────────────────────────────────────────────────────────────

function pickSteps(a) {
  if (a.scenario) return JSON.parse(fs.readFileSync(a.scenario, 'utf8'));
  return a.light ? LIGHT_SCENARIO : DEFAULT_SCENARIO;
}

async function recordOne(browser, a, { url, card, name }) {
  const [outW, outH] = a.size.split('x').map(Number);
  if (!outW || !outH) throw new Error(`bad --size: ${a.size}`);
  const frames = await record(browser, { url, outW, outH, fps: a.fps, steps: pickSteps(a) });
  const gifBuf = encode(frames, outW, outH, a.fps, a.colors);
  const out = a.out || path.join(OG_ROOT, 'assets', `gif-${name}.gif`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, gifBuf);
  const kb = Math.round(gifBuf.length / 1024);
  console.log(`  wrote ${out} (${kb} KB)`);
  if (kb > 1600) console.log('  ⚠ heavier than the heaviest existing preview — consider --light');
  if (a.deploy) {
    if (!card) throw new Error('--deploy needs a hub card id; pass --card <id>');
    const { dest, patched } = deployToHub(gifBuf, card, a.force);
    console.log(`  deployed → ${dest}${patched ? ' (PREVIEW_MAP entry added)' : ''}`);
  }
  return kb;
}

async function batchMissing(a) {
  const ours = [...hubCards()]
    .filter(([, c]) => !c.soon && /(^|\.)neorgon\.com$/.test(c.domain))
    .map(([id, c]) => ({ id, domain: c.domain }));
  const todo = ours.filter(({ id }) => !fs.existsSync(previewFileFor(id)));
  const skipped = ours.length - todo.length;
  console.log(`batch: ${todo.length} live cards need a preview gif (${skipped} already have one)`);
  if (todo.length === 0) return;

  const browser = await chromium.launch();
  const ok = [];
  const failed = [];
  try {
    for (const { id, domain } of todo) {
      console.log(`${id}: demo gif of https://${domain}/`);
      try {
        const kb = await recordOne(browser, { ...a, deploy: true, out: null },
          { url: `https://${domain}/`, card: id, name: id });
        // The deployed copy is the artifact; the assets/ intermediate is a
        // duplicate that would otherwise get committed to this repo.
        fs.rmSync(path.join(OG_ROOT, 'assets', `gif-${id}.gif`), { force: true });
        ok.push(`${id} (${kb} KB)`);
      } catch (err) {
        failed.push(`${id}: ${err.message}`);
        console.log(`  ✗ ${err.message}`);
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`\ndone: ${ok.length} recorded, ${failed.length} failed, ${skipped} kept as-is`);
  for (const f of failed) console.log(`  ✗ ${f}`);
  if (ok.length === 0 && failed.length > 0) process.exit(1);
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.allMissing) {
    await batchMissing(a);
    return;
  }
  const target = resolveTarget(a.target, a.card);
  console.log(`${target.name}: demo gif of ${target.url}`);
  const browser = await chromium.launch();
  try {
    await recordOne(browser, a, target);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(`record-gif: ${err.message}`);
  process.exit(1);
});
