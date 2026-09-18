#!/usr/bin/env node
// record-gif.mjs — scripted demo GIFs for site previews.
//
// Drives a page through a small scenario (hold, eased scroll down, hold,
// scroll back) in headless Chromium and encodes the frames straight to GIF
// with gifenc — no ffmpeg, no native deps. Output matches the hub's hover
// preview format (646x462, desktop layout rendered at half device scale).
//
// THE SIZE IS THE HUB'S CARD BOX, and it is the only reason to change it.
// A hub card measures 358 CSS px wide and 233..285 tall, a median aspect of
// 1.401 over the 73 of them, and `.card-preview img` scales the gif to that
// box. This recorder shipped at 646x300 (aspect 2.153), so every preview it
// made was displayed 1.537x narrower than it was captured: under the old
// `object-fit: fill` as a horizontal squash, and under `cover` it would have
// been a 35% side crop instead. 646x462 is aspect 1.398, which the box
// reproduces within 10% at both extremes of its height range, and it keeps
// 646 across because the card is 358 wide and oversampling 1.8x is what makes
// the gif sharp on a retina display. The recording viewport follows from it
// (1292x924, a real desktop), so shrinking the output to save bytes narrows
// the browser the sites are recorded in and collapses their layouts. It does
// not cost anything measured: --light at 646x462 came in at 554 KB against
// the 567 KB the old 256-colour 646x300 profile produced for the same card.
//
//   node scripts/record-gif.mjs <target> [flags]      one site
//   node scripts/record-gif.mjs --all-missing [flags] every live hub card on a
//                                                     neorgon domain that has no
//                                                     preview gif yet (skip-existing,
//                                                     so the run is resumable and
//                                                     hand-made gifs are never touched)
//   node scripts/record-gif.mjs --all [flags]         every live hub card, existing
//                                                     previews included, --force
//                                                     implied. What a change to the
//                                                     format above is re-run with:
//                                                     one flag rather than a shell
//                                                     loop nobody writes down
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
//   --size WxH         output pixels (default 646x462, see the note above)
//   --fps N            frames per second (default 10)
//   --light            lighter clip: 41 frames instead of 56, 160 colors —
//                      roughly a third smaller, the batch default
//   --colors N         palette size 2..256 (default 256, or 160 with --light)
//   --max-kb N         weight budget (default 1200). Over it, the palette is
//                      stepped down and the clip re-encoded, which is free:
//                      the frames are already in hand. Floor is 32 colours,
//                      and a clip still over budget there is reported, not
//                      degraded further
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

// Headless Chromium has no GPU, and without this flag it has no WebGL at all:
// `canvas.getContext('webgl')` fails outright. A site that draws in 3D therefore
// recorded its own no-WebGL fallback, and every such fallback says so on the page,
// so the hub shipped a preview reading "This browser can't show the 3D head" for
// headmap and would have shipped "this browser gave no 3D canvas" for portent.
// Nothing reported it: the frames differ, the weight is normal, and the recorder
// cannot know that the page it captured is apologising. SwiftShader is a software
// rasteriser, so it is slow rather than unavailable, which is fine for a clip
// recorded frame by frame. "unsafe" in the flag name is Chrome warning that
// software GL is not sandboxed to a GPU process, not that the output is wrong.
const LAUNCH = { args: ['--enable-unsafe-swiftshader'] };

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
    size: '646x462', fps: 10, scenario: null, light: false, colors: null,
    allMissing: false, all: false, maxKB: 1200 };
  for (let i = 0; i < argv.length; i += 1) {
    const v = argv[i];
    if (v === '--deploy') a.deploy = true;
    else if (v === '--force') a.force = true;
    else if (v === '--light') a.light = true;
    else if (v === '--all-missing') a.allMissing = true;
    else if (v === '--all') { a.all = true; a.allMissing = true; a.force = true; }
    else if (v === '--out') a.out = argv[(i += 1)];
    else if (v === '--card') a.card = argv[(i += 1)];
    else if (v === '--size') a.size = argv[(i += 1)];
    else if (v === '--fps') a.fps = Number(argv[(i += 1)]);
    else if (v === '--colors') a.colors = Number(argv[(i += 1)]);
    else if (v === '--max-kb') a.maxKB = Number(argv[(i += 1)]);
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

/** Map card-id -> {domain, soon, ghost} straight from the hub's own markup.
 *
 *  Anchored on the card element rather than on its id, because `ghost-card` sits
 *  on the opening tag *before* `data-card-id` and a locked ghost must never be
 *  recorded. There is deliberately **no character cap** on the span from the tag
 *  to the card-domain line. One sat here at 900 and silently dropped every card
 *  whose markup outgrew it: `autopilot` (1141) and `ehq` (1295) were invisible to
 *  this recorder, so the two ghosts were excluded by accident of a character
 *  budget rather than by intent, and `autopilot.neorgon.com` was one longer SVG
 *  away from being recorded and deployed as a preview for a locked easter egg.
 *  A dropped card leaves no trace anywhere: it simply never gets a preview, and
 *  the hub's own preview-lint reports it as an ordinary GAP. Hence the count
 *  check below, which is the only thing that can see the drop happen. */
function hubCards() {
  const html = fs.readFileSync(path.join(HUB, 'index.html'), 'utf8');
  const cards = new Map();
  for (const m of html.matchAll(/class="site-card([^"]*)"([\s\S]*?)card-domain">([^<]+)</g)) {
    const id = m[2].match(/data-card-id="([^"]+)"/);
    if (!id) continue;
    cards.set(id[1], {
      domain: m[3].trim(),
      soon: m[2].includes('data-status="soon"'),
      ghost: m[1].includes('ghost-card'),
    });
  }
  const declared = (html.match(/data-card-id="/g) || []).length;
  if (cards.size !== declared) {
    throw new Error(`hubCards saw ${cards.size} of ${declared} cards in the hub's index.html: `
      + 'one has no card-domain line, or the markup no longer matches. Fix this before '
      + 'recording, a card this function cannot see is a card that silently never gets a preview.');
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

/** A scenario step that could not act must say so.
 *
 *  These three used to `.catch(() => {})`, so a stale or ambiguous selector
 *  recorded a page nobody had touched and still reported success. The only signal
 *  was the clip coming out as a single frame, and that signal disappears the
 *  moment one step of four happens to work: the result is a preview that shows
 *  less than it claims, at full weight, with a clean log. Playwright's own message
 *  distinguishes the two cases worth knowing apart, a selector that matches
 *  nothing and one that matches several. */
function warnStep(kind, sel, err) {
  const first = String(err.message || err).split('\n')[0];
  const why = /Timeout/.test(first) ? 'matched nothing within 3s' : first;
  console.log(`  ⚠ ${kind} ${sel}: ${why}`);
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
      ops.push(() => page.click(step.click.sel, { timeout: 3000 })
        .catch(e => warnStep('click', step.click.sel, e)));
      for (let i = 0; i < (step.click.frames || 6); i += 1) ops.push(null);
    } else if (step.hover) {
      ops.push(() => page.hover(step.hover.sel, { timeout: 3000 })
        .catch(e => warnStep('hover', step.hover.sel, e)));
      for (let i = 0; i < (step.hover.frames || 6); i += 1) ops.push(null);
    } else if (step.type) {
      ops.push(() => page.fill(step.type.sel, step.type.text, { timeout: 3000 })
        .catch(e => warnStep('type', step.type.sel, e)));
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

function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

/* A `hold` step captures the same pixels several times, and this encoder writes
   every frame in full (gifenc has no inter-frame delta), so a held second costs
   a full image per frame. Coalescing identical neighbours into one frame with a
   longer delay is therefore not an optimisation of the output, it is declining
   to pay for the same image twice, and it is invisible: a viewer showing one
   frame for 400ms and one showing four identical frames for 100ms each are the
   same animation.

   This is where the weight was. `aficion` does not scroll at all (its page is
   exactly one viewport tall), so all 41 of its frames were byte-identical and
   its 1925 KB preview was one still image sent 41 times. The palette loop below
   spent six encodes grinding that down to 32 colours, because a symptom lever
   is still a lever and it moved. Every clip benefits: the light profile holds
   for 14 of its 41 frames. */
function coalesce(frames, delay) {
  const out = [];
  for (const frame of frames) {
    const last = out[out.length - 1];
    if (last && sameBytes(last.frame, frame)) {
      last.delay += delay;
      continue;
    }
    out.push({ frame, delay });
  }
  return out;
}

function encode(frames, outW, outH, fps, colors) {
  // One palette for the whole clip, sampled across it, keeps frames coherent
  // and compresses far better than per-frame palettes. Sampled from the frames
  // as recorded, not the coalesced list, so dropping duplicates cannot shift
  // which moments the palette is fitted to.
  const samples = [frames[0], frames[Math.floor(frames.length / 2)], frames[frames.length - 1]];
  const joined = new Uint8Array(samples.length * frames[0].length);
  samples.forEach((f, i) => joined.set(f, i * f.length));
  const palette = quantize(joined, colors);
  const gif = GIFEncoder();
  const written = coalesce(frames, Math.round(1000 / fps));
  written.forEach(({ frame, delay }, i) => {
    gif.writeFrame(applyPalette(frame, palette), outW, outH,
      i === 0 ? { palette, delay, repeat: 0 } : { palette, delay });
  });
  gif.finish();
  return { buf: Buffer.from(gif.bytes()), written: written.length };
}

/* A hover preview is downloaded because someone paused over a card, so its
   weight is a cost the visitor never asked for. The palette is the only lever
   that does not cost geometry or duration, and re-encoding is free: the frames
   are already captured, so this retries the cheap half of the pipeline rather
   than the browser. Stepping 30% at a time converges in two or three tries.
   Below 32 colours a screenshot starts to band visibly, so that is the floor
   and an over-budget clip is reported rather than wrecked to fit. Growing the
   format from 646x300 to 646x462 is what made this necessary: the same --light
   profile produced five previews over the tool's own 1600 KB warning line and
   one at 3007 KB.

   It returns the smallest encoding it saw rather than the last one. On the two
   clips that reach the floor the curve is monotonic, so the two are the same
   buffer: memes measured 160c=2977 112c=2716 78c=2441 55c=2215 39c=2015
   32c=1878 KB, aficion the same shape. That was worth checking rather than
   assuming, because dithering a photographic page is pixel-level noise and
   noise defeats LZW, which is a plausible route to a smaller palette costing
   MORE bytes; it just is not what these pages do. Keeping the best costs one
   buffer and makes the loop correct whether or not the next page inverts. */
function encodeWithin(frames, outW, outH, fps, colors, maxKB) {
  const FLOOR = 32;
  const tried = [];
  let best = null;
  let c = colors;
  for (;;) {
    const { buf, written } = encode(frames, outW, outH, fps, c);
    const kb = Math.round(buf.length / 1024);
    tried.push(`${c}c=${kb}KB`);
    if (!best || kb < best.kb) best = { buf, kb, colors: c, written };
    if (kb <= maxKB || c <= FLOOR) return { ...best, tried };
    c = Math.max(FLOOR, Math.round(c * 0.7));
  }
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
    throw new Error(`${path.relative(HUB, dest)} already exists, pass --force to replace it`);
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

/* Steps, and where they came from, in precedence order: an explicit --scenario,
   then this card's own file, then the profile default.

   `scenarios/<card>.json` exists so that a page needing a hand-tuned clip keeps
   it through the next batch. Without it the only place such tuning could live
   was a --scenario flag on one invocation, so `make gifs-all` would quietly
   re-record that card with the generic profile and undo the fix, which is the
   kind of regression nobody attributes to the batch that caused it. Two image
   galleries need it today (see those files for why). Reporting the source
   matters as much as honouring it: a batch line that shows `scenarios/memes`
   explains why one card's clip differs from its 62 neighbours. */
function pickSteps(a, card) {
  if (a.scenario) {
    return { steps: JSON.parse(fs.readFileSync(a.scenario, 'utf8')), from: a.scenario };
  }
  const perCard = card && path.join(OG_ROOT, 'scenarios', `${card}.json`);
  if (perCard && fs.existsSync(perCard)) {
    return { steps: JSON.parse(fs.readFileSync(perCard, 'utf8')), from: `scenarios/${card}.json` };
  }
  return { steps: a.light ? LIGHT_SCENARIO : DEFAULT_SCENARIO, from: a.light ? '--light' : 'default' };
}

async function recordOne(browser, a, { url, card, name }) {
  const [outW, outH] = a.size.split('x').map(Number);
  if (!outW || !outH) throw new Error(`bad --size: ${a.size}`);
  const { steps, from } = pickSteps(a, card);
  if (from.startsWith('scenarios/')) console.log(`  scenario: ${from}`);
  const frames = await record(browser, { url, outW, outH, fps: a.fps, steps });
  const { buf: gifBuf, kb, colors, tried, written } = encodeWithin(
    frames, outW, outH, a.fps, a.colors, a.maxKB);
  const out = a.out || path.join(OG_ROOT, 'assets', `gif-${name}.gif`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, gifBuf);
  const dedup = written < frames.length ? `, ${written}/${frames.length} frames after coalescing` : '';
  console.log(`  wrote ${out} (${kb} KB${dedup}${colors !== a.colors ? `, palette ${a.colors} to ${colors}, smallest of ${tried.length} tries` : ''})`);
  if (written === 1) {
    console.log('    every frame was identical: this clip is a still image. The page did not move,'
      + ` so the scenario recorded nothing. Give it scenarios/${card || name}.json with click or hover steps.`);
  }
  if (kb > a.maxKB) {
    // The curve, not just the verdict: it is what says whether this page is
    // uncompressible or merely dithering badly, and they need different fixes.
    console.log(`  ⚠ ${kb} KB over the ${a.maxKB} KB budget, best of ${tried.join(' ')}`);
    console.log('    the palette lever is spent: give this page a --scenario that holds still, or accept the weight');
  }
  if (a.deploy) {
    if (!card) throw new Error('--deploy needs a hub card id; pass --card <id>');
    const { dest, patched } = deployToHub(gifBuf, card, a.force);
    console.log(`  deployed → ${dest}${patched ? ' (PREVIEW_MAP entry added)' : ''}`);
  }
  return kb;
}

async function batchMissing(a) {
  /* Three exclusions, all deliberate. A Soon card serves nothing. A ghost card is
     locked, so a preview of it would spoil the thing it exists to hide. And a card
     whose displayed domain is not a neorgon.com host is pointing somewhere we do
     not publish: the four third-party profile cards, and `chasqui`, whose card
     links to its repo because its subdomain was never created. That last one is
     why the display domain has to agree with the href, otherwise this list picks
     up a card whose only possible outcome is a DNS failure. */
  const ours = [...hubCards()]
    .filter(([, c]) => !c.soon && !c.ghost && /(^|\.)neorgon\.com$/.test(c.domain))
    .map(([id, c]) => ({ id, domain: c.domain }));
  const todo = a.all ? ours : ours.filter(({ id }) => !fs.existsSync(previewFileFor(id)));
  const skipped = ours.length - todo.length;
  console.log(a.all
    ? `batch: re-recording all ${todo.length} live cards at ${a.size}`
    : `batch: ${todo.length} live cards need a preview gif (${skipped} already have one)`);
  if (todo.length === 0) return;

  const browser = await chromium.launch(LAUNCH);
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
  const browser = await chromium.launch(LAUNCH);
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
