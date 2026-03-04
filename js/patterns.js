import { W, H } from './state.js';
import { mulberry32 } from './utils.js';

/* ── Pattern: Constellation ──────────────────────────────────────── */
export function drawConstellation(ctx, rng, accent, count) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    pts.push({ x: rng() * W, y: rng() * H, r: 1 + rng() * 2.5 });
  }
  ctx.lineWidth = 0.8;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 160) {
        const alpha = Math.round((1 - dist / 160) * 25);
        ctx.strokeStyle = accent + alpha.toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }
  }
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = accent + '30';
    ctx.fill();
  }
}

/* ── Pattern: Dot Grid ───────────────────────────────────────────── */
export function drawDotGrid(ctx, accent, spacing) {
  ctx.fillStyle = accent + '18';
  for (let x = spacing / 2; x < W; x += spacing) {
    for (let y = spacing / 2; y < H; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ── Pattern: Circuit Lines ──────────────────────────────────────── */
export function drawCircuits(ctx, rng, accent, count) {
  ctx.strokeStyle = accent + '15';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    let x = rng() * W, y = rng() * H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    const segs = 3 + Math.floor(rng() * 5);
    for (let s = 0; s < segs; s++) {
      if (rng() > 0.5) x += (rng() > 0.5 ? 1 : -1) * (30 + rng() * 80);
      else              y += (rng() > 0.5 ? 1 : -1) * (30 + rng() * 80);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = accent + '25';
    ctx.fill();
  }
}

/* ── Pattern: Waves ──────────────────────────────────────────────── */
export function drawWaves(ctx, rng, accent, count) {
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  const waveCount = Math.round(count / 5);
  for (let w = 0; w < waveCount; w++) {
    const yBase = (H / (waveCount + 1)) * (w + 1) + (rng() - 0.5) * 40;
    const amplitude = 15 + rng() * 30;
    const freq = 0.003 + rng() * 0.006;
    const phase = rng() * Math.PI * 2;
    const alpha = Math.round(8 + rng() * 14);
    ctx.strokeStyle = accent + alpha.toString(16).padStart(2, '0');
    ctx.beginPath();
    for (let x = 0; x <= W; x += 3) {
      const y = yBase + Math.sin(x * freq + phase) * amplitude;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

/* ── Pattern: Hex Grid ───────────────────────────────────────────── */
export function drawHexGrid(ctx, accent, size) {
  ctx.strokeStyle = accent + '10';
  ctx.lineWidth = 0.8;
  const h = size * Math.sqrt(3);
  for (let row = -1; row < H / h + 1; row++) {
    for (let col = -1; col < W / (size * 1.5) + 1; col++) {
      const cx = col * size * 1.5;
      const cy = row * h + (col % 2 ? h / 2 : 0);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i - Math.PI / 6;
        const px = cx + size * 0.8 * Math.cos(angle);
        const py = cy + size * 0.8 * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
}

/* ── Pattern: Diagonal Lines ─────────────────────────────────────── */
export function drawDiagonal(ctx, accent, spacing) {
  ctx.strokeStyle = accent + '0c';
  ctx.lineWidth = 0.8;
  const total = W + H;
  for (let d = -H; d < total; d += spacing) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + H, H);
    ctx.stroke();
  }
}

/* ── Pattern: Radial Burst ───────────────────────────────────────── */
export function drawRadial(ctx, rng, accent, count) {
  const cx = W / 2, cy = H / 2;
  ctx.lineWidth = 0.6;
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const innerR = 50 + rng() * 100;
    const outerR = innerR + 100 + rng() * 250;
    const alpha = Math.round(6 + rng() * 12);
    ctx.strokeStyle = accent + alpha.toString(16).padStart(2, '0');
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.stroke();
  }
  // center glow
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
  grd.addColorStop(0, accent + '12');
  grd.addColorStop(1, accent + '00');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, 120, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Pattern: Noise / Grain ──────────────────────────────────────── */
export function drawNoise(ctx, rng, accent, intensity) {
  const imageData = ctx.getImageData(0, 0, W, H);
  const data = imageData.data;
  const strength = intensity * 12;
  for (let i = 0; i < data.length; i += 16) {
    const noise = (rng() - 0.5) * strength;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

/* ── Dispatch ────────────────────────────────────────────────────── */
const densityMap = { low: 0.5, medium: 1, high: 1.8 };

export function drawPattern(ctx, seedStr, accent, pattern, density) {
  const rng = mulberry32(hashStrLocal(seedStr));
  const d = densityMap[density] || 1;

  switch (pattern) {
    case 'constellation': drawConstellation(ctx, rng, accent, Math.round(80 * d)); break;
    case 'dots':          drawDotGrid(ctx, accent, Math.round(40 / d)); break;
    case 'circuits':      drawCircuits(ctx, rng, accent, Math.round(30 * d)); break;
    case 'waves':         drawWaves(ctx, rng, accent, Math.round(60 * d)); break;
    case 'hexgrid':       drawHexGrid(ctx, accent, Math.round(45 / d)); break;
    case 'diagonal':      drawDiagonal(ctx, accent, Math.round(28 / d)); break;
    case 'radial':        drawRadial(ctx, rng, accent, Math.round(60 * d)); break;
    case 'noise':         drawNoise(ctx, rng, accent, d); break;
    case 'none': break;
  }
}

function hashStrLocal(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

/* ── Background gradient ─────────────────────────────────────────── */
export function drawGradientBg(ctx, stops) {
  const grd = ctx.createLinearGradient(0, 0, W, H);
  for (const s of stops) grd.addColorStop(s.pos, s.color);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
}

/* ── Vignette ────────────────────────────────────────────────────── */
export function drawVignette(ctx) {
  const grd = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.7);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
}

/* ── Text ────────────────────────────────────────────────────────── */
export function drawText(ctx, title, subtitle, accent, fontSize = 64) {
  const cx = W / 2, cy = H / 2;
  const font = '"Avenir Next", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  // glow
  ctx.save();
  ctx.shadowColor = accent + '60';
  ctx.shadowBlur = 60;
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${fontSize}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, cx, cy - 20);
  ctx.restore();

  // crisp title
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${fontSize}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, cx, cy - 20);

  // accent line
  const lineW = 80;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - lineW / 2, cy + 24);
  ctx.lineTo(cx + lineW / 2, cy + 24);
  ctx.stroke();

  // subtitle
  const subSize = Math.round(fontSize * 0.375);
  ctx.fillStyle = 'rgba(255,255,255,.65)';
  ctx.font = `500 ${subSize}px ${font}`;
  ctx.fillText(subtitle, cx, cy + 60);
}

/* ── Branding ────────────────────────────────────────────────────── */
export function drawBranding(ctx, text = 'neorgon.com') {
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  ctx.font = '500 16px "Avenir Next", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, W - 32, H - 24);
}
