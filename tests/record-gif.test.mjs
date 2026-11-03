// A scenario step that times out must say which of three things happened.
//
// They need different fixes: a selector that matches nothing wants a new
// selector, one that matches a hidden or covered element wants an earlier step,
// and a click whose handler is slow already landed and wants nothing at all.
// All three used to print "matched nothing within 3s", and headroom's crowd
// chips (twenty simulated minutes per click) were the slow kind.
//
// Runs the real recorder on a file:// page, so it needs the sibling
// neorgon-site repo the recorder reads its card list from.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const RECORDER = path.join(ROOT, 'scripts', 'record-gif.mjs');
const HUB_INDEX = path.resolve(ROOT, '..', 'neorgon-site', 'index.html');
const noHub = !fs.existsSync(HUB_INDEX) && 'needs ../neorgon-site/index.html beside this repo';

const PAGE = `<!doctype html><body style="font:40px sans-serif">
<button id="slow">slow</button>
<button id="hidden" style="visibility:hidden">hidden</button>
<p id="out">waiting</p>
<script>
  document.getElementById('slow').addEventListener('click', () => {
    const until = performance.now() + 3600;
    while (performance.now() < until) { /* a handler that outlasts the 3s step timeout */ }
    document.getElementById('out').textContent = 'clicked';
  });
</script></body>`;

test('a timed-out step names the reason: busy page, unactionable element, or no match', { skip: noHub }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-steps-'));
  try {
    const page = path.join(dir, 'steps.html');
    fs.writeFileSync(page, PAGE);
    const scenario = path.join(dir, 'steps.json');
    fs.writeFileSync(scenario, JSON.stringify([
      { click: { sel: '#slow', frames: 1 } },
      { click: { sel: '#hidden', frames: 1 } },
      { click: { sel: '#missing', frames: 1 } },
    ]));
    const run = spawnSync(process.execPath, [RECORDER, pathToFileURL(page).href,
      '--out', path.join(dir, 'steps.gif'), '--scenario', scenario], { encoding: 'utf8', timeout: 90000 });
    assert.equal(run.status, 0, run.stdout + run.stderr);
    assert.match(run.stdout, /⚠ click #slow: acted, but the page was still busy 3s later/);
    assert.match(run.stdout, /⚠ click #hidden: matched, but never became actionable within 3s/);
    assert.match(run.stdout, /⚠ click #missing: matched nothing within 3s/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
