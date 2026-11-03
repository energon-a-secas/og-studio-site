// The recorder must not ship a 3D site's fallback as that site's demo.
//
// Every page below draws something either way, which is the point: the
// fallback path renders, so the only way to tell the two apart is to watch the
// page ask for a context. Pages are served through page.route on a made-up
// host, so nothing here touches the network. The CLI tests at the bottom run
// the real recorder on file:// pages and need the sibling neorgon-site repo,
// because the recorder reads the hub's card list to resolve every target.
//
//   node --test tests/        (or: make test)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { LAUNCH, addGlProbe, readGlProbe, glVerdict } from '../scripts/gl-probe.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const RECORDER = path.join(ROOT, 'scripts', 'record-gif.mjs');
const HUB_INDEX = path.resolve(ROOT, '..', 'neorgon-site', 'index.html');

// A page that draws in 3D when it can and apologises in 2D when it cannot, the
// way headmap, parla and headroom do. `ask` is the context request it makes.
const page3d = (ask, { before = '' } = {}) => `<!doctype html><html><head><script>
  ${before}
  // In <head>, on a canvas made before <body> exists: the probe has to be in
  // place before the first site script, not merely before load.
  const c = document.createElement('canvas');
  c.id = 'scene';
  const gl = ${ask};
  window.result = gl ? '3d' : 'fallback';
  addEventListener('DOMContentLoaded', () => {
    if (gl) {
      c.width = 200; c.height = 120;
      gl.clearColor(0.2, 0.4, 0.8, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      document.body.append(c);
    } else {
      document.body.innerHTML = "<p>This browser can't show the 3D view.</p>";
    }
    window.done = true;
  });
</script></head><body></body></html>`;

const THREE_LIKE = page3d("c.getContext('webgl2', { antialias: true })");
const CAVEAT = page3d("c.getContext('webgl', { failIfMajorPerformanceCaveat: true })");
// A fallback chain on one canvas: refused, then granted. That canvas got 3D.
const CHAIN = page3d("c.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) || c.getContext('webgl')");
// A capability check on a throwaway canvas, then the real one. Partial, not a failure.
const CAPABILITY_CHECK = page3d("c.getContext('webgl2')", {
  before: "window.fast = !!document.createElement('canvas').getContext('webgl', { failIfMajorPerformanceCaveat: true });",
});
const FLAT = `<!doctype html><canvas id="flat" width="10" height="10"></canvas><script>
  document.getElementById('flat').getContext('2d').fillRect(0, 0, 10, 10);
  window.result = '2d'; window.done = true;
</script>`;

// Headless Chromium here has no navigator.gpu, so WebGPU gets a stand-in whose
// adapter is null, installed ahead of the probe the way a real GPU object is.
function fakeNullGpu() {
  class GPU { requestAdapter() { return Promise.resolve(null); } }
  window.GPU = GPU;
  Object.defineProperty(Navigator.prototype, 'gpu', { get: () => new GPU(), configurable: true });
}
const webgpuPage = (thenWebgl) => `<!doctype html><script>
  navigator.gpu.requestAdapter().then((adapter) => {
    const c = document.createElement('canvas');
    const gl = !adapter && ${thenWebgl} ? c.getContext('webgl2') : null;
    window.result = adapter ? 'webgpu' : gl ? '3d' : 'fallback';
    window.done = true;
  });
</script>`;

async function probe(launch, body, { before } = {}) {
  const browser = await chromium.launch(launch);
  try {
    const context = await browser.newContext();
    if (before) await context.addInitScript(before);
    await addGlProbe(context);
    const page = await context.newPage();
    await page.route('http://probe.test/**', (r) => r.fulfill({ contentType: 'text/html', body }));
    await page.goto('http://probe.test/');
    await page.waitForFunction(() => window.done === true, null, { timeout: 10000 });
    return { verdict: glVerdict(await readGlProbe(page)), result: await page.evaluate(() => window.result) };
  } finally {
    await browser.close();
  }
}

// ── The verdict, without a browser ───────────────────────────────────────────

test('glVerdict: no probe log is unknown, never a pass', () => {
  assert.equal(glVerdict(null).status, 'unknown');
});

test('glVerdict: a page that never asked is none', () => {
  assert.deepEqual(glVerdict({ canvases: [], adapters: [] }), { status: 'none', lines: [] });
});

test('glVerdict: refused everywhere is fallback, refused beside granted is partial', () => {
  const refused = { kind: 'canvas', id: 'deviceFloor', granted: [], refused: ['webgl2'] };
  const granted = { kind: 'canvas', id: '', granted: ['webgl2'], refused: [] };
  const off = glVerdict({ canvases: [refused], adapters: [] });
  assert.equal(off.status, 'fallback');
  assert.deepEqual(off.lines, ['canvas#deviceFloor asked for webgl2 and got null']);
  assert.equal(glVerdict({ canvases: [refused, granted], adapters: [] }).status, 'partial');
  assert.equal(glVerdict({ canvases: [granted], adapters: [] }).status, 'ok');
});

test('glVerdict: a null WebGPU adapter is fallback unless WebGL was granted', () => {
  const nullAdapter = { settled: true, granted: false };
  assert.equal(glVerdict({ canvases: [], adapters: [nullAdapter] }).status, 'fallback');
  const withGl = glVerdict({
    canvases: [{ kind: 'canvas', id: '', granted: ['webgl2'], refused: [] }], adapters: [nullAdapter],
  });
  assert.equal(withGl.status, 'partial');
  assert.match(withGl.lines[0], /requestAdapter\(\) resolved to null once/);
});

// ── The probe, in the browser the recorder launches ──────────────────────────

test('LAUNCH grants WebGL: a 3D page draws in 3D and the probe says ok', async () => {
  const { verdict, result } = await probe(LAUNCH, THREE_LIKE);
  assert.equal(result, '3d', 'the recorder\'s own browser could not get a webgl2 context');
  assert.equal(verdict.status, 'ok');
});

test('without the swiftshader flag the page falls back, and the probe catches it', async () => {
  // This is the 2026-09-18 bug: the recorder launched with no args, and
  // headmap's preview read "This browser can't show the 3D head" for weeks.
  const { verdict, result } = await probe({}, THREE_LIKE);
  assert.equal(result, 'fallback',
    'headless Chromium granted WebGL without --enable-unsafe-swiftshader; if that is now the default, '
    + 'this test needs a different way to refuse a context');
  assert.equal(verdict.status, 'fallback');
  assert.deepEqual(verdict.lines, ['canvas#scene asked for webgl2 and got null']);
});

test('a context refused even with the flag is still caught (failIfMajorPerformanceCaveat)', async () => {
  const { verdict, result } = await probe(LAUNCH, CAVEAT);
  assert.equal(result, 'fallback');
  assert.equal(verdict.status, 'fallback');
});

test('a fallback chain on one canvas that ends in a context is ok', async () => {
  const { verdict, result } = await probe(LAUNCH, CHAIN);
  assert.equal(result, '3d');
  assert.equal(verdict.status, 'ok');
});

test('a refused capability check beside a granted canvas is partial, not a failure', async () => {
  const { verdict, result } = await probe(LAUNCH, CAPABILITY_CHECK);
  assert.equal(result, '3d');
  assert.equal(verdict.status, 'partial');
});

test('a 2d canvas is not a GPU request', async () => {
  const { verdict, result } = await probe(LAUNCH, FLAT);
  assert.equal(result, '2d');
  assert.equal(verdict.status, 'none');
});

test('a null WebGPU adapter with nothing after it is fallback', async () => {
  const { verdict, result } = await probe(LAUNCH, webgpuPage(false), { before: fakeNullGpu });
  assert.equal(result, 'fallback');
  assert.equal(verdict.status, 'fallback');
});

test('a null WebGPU adapter that falls back to WebGL is partial', async () => {
  const { verdict, result } = await probe(LAUNCH, webgpuPage(true), { before: fakeNullGpu });
  assert.equal(result, '3d');
  assert.equal(verdict.status, 'partial');
});

// ── The recorder itself ──────────────────────────────────────────────────────

const noHub = !fs.existsSync(HUB_INDEX) && 'needs ../neorgon-site/index.html beside this repo';

function recordFile(dir, name, html, extra = []) {
  const page = path.join(dir, `${name}.html`);
  fs.writeFileSync(page, html);
  const out = path.join(dir, `${name}.gif`);
  const run = spawnSync(process.execPath, [RECORDER, pathToFileURL(page).href,
    '--out', out, '--scenario', path.join(dir, 'still.json'), ...extra], { encoding: 'utf8', timeout: 90000 });
  return { ...run, out };
}

test('the recorder refuses a page that got no context and writes nothing', { skip: noHub }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-gl-probe-'));
  try {
    fs.writeFileSync(path.join(dir, 'still.json'), JSON.stringify([{ hold: 2 }]));

    const ok = recordFile(dir, 'ok', THREE_LIKE);
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.ok(fs.existsSync(ok.out));
    assert.match(ok.stdout, /3D: every canvas that asked for a GPU context got one/);

    const off = recordFile(dir, 'off', CAVEAT);
    assert.equal(off.status, 1, off.stdout + off.stderr);
    assert.ok(!fs.existsSync(off.out), 'a refused page must not leave a gif behind');
    assert.match(off.stdout, /asked for WebGL and got none: this clip is its fallback/);
    assert.match(off.stdout, /canvas#scene asked for webgl and got null/);
    assert.match(off.stderr, /nothing was written/);

    const forced = recordFile(dir, 'forced', CAVEAT, ['--allow-no-gl']);
    assert.equal(forced.status, 0, forced.stdout + forced.stderr);
    assert.ok(fs.existsSync(forced.out));
    assert.match(forced.stdout, /recording it anyway: --allow-no-gl/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
