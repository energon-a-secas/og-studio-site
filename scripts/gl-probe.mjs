// gl-probe.mjs: did the page being recorded get the 3D canvas it asked for?
//
// A site that draws in WebGL and gets no context does not break, it falls back,
// and every fallback in the fleet renders something reasonable: headmap said
// "This browser can't show the 3D head", parla drew a flat radial diagram,
// headroom swaps its 3D floor for a 2D dot field with a one-line caption. The
// frames differ and the weight is normal, so neither the recorder's "every frame
// was identical" signal nor the hub's preview-lint can tell a 3D demo from its
// apology. This is what can: it watches the page ask, so it needs no selector,
// no per-site knowledge and no opinion about what the fallback looks like.
//
// installGlProbe runs inside the page (context.addInitScript) before any site
// script, and wraps the two doors a page uses to reach the GPU:
//   - getContext on HTMLCanvasElement and OffscreenCanvas, for the WebGL and
//     WebGPU context types only (a '2d' request is not evidence of anything)
//   - GPU.prototype.requestAdapter, which resolves to null when WebGPU is absent
// It changes no return value. It only writes down what came back.
//
// What it cannot see, by construction:
//   - a page that decides on its fallback without asking (a ?nogl switch, a
//     user-agent sniff, `if (!navigator.gpu)` read as a property). Nothing was
//     refused, so there is nothing to report.
//   - a context requested inside a Worker: init scripts do not run there.
//   - a context that was granted and then drew nothing. That is a blank-canvas
//     problem, and the clip itself shows it.
//   - WebGPU as headless Chromium ships it here: there is no navigator.gpu at
//     all, so a WebGPU page that checks for it first falls back without asking.
//     No fleet site uses WebGPU (audited 2026-11-03); the adapter wrap is for
//     the day the recorder runs where navigator.gpu exists and says null.

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
// It lives here, beside the probe, so the tests launch the browser the recorder
// launches: they assert both that this flag grants WebGL and that dropping it is
// caught.
//
// SwiftShader is still a "major performance caveat", so a page that asks with
// failIfMajorPerformanceCaveat: true is refused even with the flag. The probe
// reports that too, which is correct: the clip would be that page's fallback.
export const LAUNCH = { args: ['--enable-unsafe-swiftshader'] };

const GL_TYPES = ['webgl', 'webgl2', 'experimental-webgl', 'webgpu'];

/** Runs in the page. Self-contained on purpose: Playwright serialises the
 *  function's source, so it cannot close over anything in this module. */
export function installGlProbe(types) {
  if (window.__ogGlProbe) return;
  const wanted = new Set(types);
  const log = { canvases: [], adapters: [] };
  Object.defineProperty(window, '__ogGlProbe', { value: log, configurable: true });
  const seen = new WeakMap();

  const wrap = (proto, kind) => {
    if (!proto || typeof proto.getContext !== 'function') return;
    const original = proto.getContext;
    proto.getContext = function getContext(type, ...rest) {
      const ctx = original.call(this, type, ...rest);
      const name = String(type);
      if (wanted.has(name)) {
        let rec = seen.get(this);
        if (!rec) {
          rec = { kind, id: '', granted: [], refused: [] };
          seen.set(this, rec);
          log.canvases.push(rec);
        }
        if (!rec.id && this.id) rec.id = this.id;
        const list = ctx ? rec.granted : rec.refused;
        if (!list.includes(name)) list.push(name);
      }
      return ctx;
    };
  };
  wrap(window.HTMLCanvasElement && window.HTMLCanvasElement.prototype, 'canvas');
  wrap(window.OffscreenCanvas && window.OffscreenCanvas.prototype, 'offscreen');

  const gpu = window.GPU && window.GPU.prototype;
  if (gpu && typeof gpu.requestAdapter === 'function') {
    const original = gpu.requestAdapter;
    gpu.requestAdapter = function requestAdapter(...args) {
      const rec = { settled: false, granted: false };
      log.adapters.push(rec);
      return original.apply(this, args).then(
        (adapter) => { rec.settled = true; rec.granted = !!adapter; return adapter; },
        (err) => { rec.settled = true; throw err; },
      );
    };
  }
}

/** Install on a browser context, before its first page.goto. */
export function addGlProbe(context) {
  return context.addInitScript(installGlProbe, GL_TYPES);
}

/** Read what the page asked for. Null when the probe never ran (a page that
 *  navigated somewhere the init script could not reach), which is reported as
 *  "unknown" rather than as a pass. */
export async function readGlProbe(page) {
  return page.evaluate(() => {
    const log = window.__ogGlProbe;
    return log ? JSON.parse(JSON.stringify(log)) : null;
  });
}

const describe = (c) => `${c.kind === 'offscreen' ? 'OffscreenCanvas' : 'canvas'}${c.id ? `#${c.id}` : ''}`;

/** The verdict, pure so the tests can drive it without a browser.
 *
 *  `fallback` is the failure: the page asked for a GPU context and got none at
 *  all, anywhere. That is the clip being its own fallback, and it is the only
 *  thing that stops a recording.
 *
 *  `partial` is a note, not a failure: some canvas was refused while another
 *  was granted. It is what a capability check looks like (a throwaway canvas
 *  asked with failIfMajorPerformanceCaveat, or a webgl2 request that falls
 *  back to webgl on a fresh canvas), and failing on it would make every such
 *  page unrecordable. It is also what a page with two 3D views and one dead
 *  one looks like, which is why it is printed rather than dropped. */
export function glVerdict(log) {
  if (!log) return { status: 'unknown', lines: ['GL probe did not run in this page'] };
  const asked = log.canvases.filter(c => c.granted.length || c.refused.length);
  const granted = asked.filter(c => c.granted.length);
  const refused = asked.filter(c => !c.granted.length);
  const adaptersAsked = log.adapters.filter(a => a.settled);
  const adaptersNull = adaptersAsked.filter(a => !a.granted);
  const anyGranted = granted.length > 0 || adaptersAsked.some(a => a.granted);

  const lines = [];
  for (const c of refused) lines.push(`${describe(c)} asked for ${c.refused.join(', ')} and got null`);
  if (adaptersNull.length) {
    lines.push(`navigator.gpu.requestAdapter() resolved to null ${adaptersNull.length === 1 ? 'once' : `${adaptersNull.length} times`}`);
  }
  if (!lines.length) {
    return { status: asked.length || adaptersAsked.length ? 'ok' : 'none', lines: [] };
  }
  return { status: anyGranted ? 'partial' : 'fallback', lines };
}
