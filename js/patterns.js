import { W, H, gradientPresets, layoutPresets, logoPositions, brandingPositions } from './state.js';
import { mulberry32, clamp, wrapText } from './utils.js';

/* ── Pattern: Constellation ──────────────────────────────────────── */
export function drawConstellation(ctx, rng, accent, count) {
  const pts = [];
  for (let i = 0; i < count; i++) {
    pts.push({ x: rng() * W, y: rng() * H, r: 2 + rng() * 4 });
  }
  ctx.lineWidth = 1.4;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 220) {
        const alpha = Math.round((1 - dist / 220) * 55);
        ctx.strokeStyle = accent + alpha.toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[j].x, pts[j].y);
        ctx.stroke();
      }
    }
  }
  for (const p of pts) {
    const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
    grd.addColorStop(0, accent + '55');
    grd.addColorStop(1, accent + '00');
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = accent + '90';
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

/* ── Background gradient / solid ─────────────────────────────────── */
export function drawGradientBg(ctx, bg) {
  if (Array.isArray(bg)) {
    bg = { type: 'gradient', angle: 135, stops: bg };
  }
  if (bg.type === 'solid') {
    ctx.fillStyle = bg.solidColor || '#000';
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const angle = ((bg.angle ?? 135) - 90) * Math.PI / 180;
  const len = Math.sqrt(W * W + H * H) / 2;
  const x1 = W / 2 - Math.cos(angle) * len;
  const y1 = H / 2 - Math.sin(angle) * len;
  const x2 = W / 2 + Math.cos(angle) * len;
  const y2 = H / 2 + Math.sin(angle) * len;
  const grd = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const s of bg.stops) grd.addColorStop(s.pos, s.color);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
}

/* ── Vignette ────────────────────────────────────────────────────── */
export function drawVignette(ctx, strength = 0.35) {
  if (strength <= 0) return;
  const alpha = clamp(strength, 0, 1) * 0.65;
  const grd = ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.75);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, `rgba(0,0,0,${alpha.toFixed(3)})`);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
}

/* ── Grain overlay ───────────────────────────────────────────────── */
export function drawGrain(ctx, intensity = 0) {
  if (intensity <= 0) return;
  const imageData = ctx.getImageData(0, 0, W, H);
  const data = imageData.data;
  const strength = clamp(intensity, 0, 1) * 22;
  for (let i = 0; i < data.length; i += 8) {
    const noise = (Math.random() - 0.5) * strength;
    data[i] = clamp(data[i] + noise, 0, 255);
    data[i + 1] = clamp(data[i + 1] + noise, 0, 255);
    data[i + 2] = clamp(data[i + 2] + noise, 0, 255);
  }
  ctx.putImageData(imageData, 0, 0);
}

/* ── Glass panel ─────────────────────────────────────────────────── */
export function drawGlassPanel(ctx, x, y, w, h, r = 20) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/* ── Text rendering with layouts, wrapping, alignment ────────────── */
const fontFamily = '"Avenir Next", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function measureTextLines(ctx, lines, fontSize, weight, letterSpacing) {
  ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
  ctx.letterSpacing = `${letterSpacing}px`;
  let maxW = 0;
  for (const line of lines) {
    maxW = Math.max(maxW, ctx.measureText(line).width);
  }
  return maxW;
}

function drawTextBlock(ctx, lines, anchorX, anchorY, fontSize, weight, align, letterSpacing, lineHeight, color, glowColor, glowIntensity) {
  const lh = fontSize * lineHeight;
  const totalH = lines.length * lh;
  ctx.font = `${weight} ${fontSize}px ${fontFamily}`;
  ctx.letterSpacing = `${letterSpacing}px`;
  ctx.textBaseline = 'top';

  let startY = anchorY - totalH / 2;

  if (glowIntensity > 0) {
    ctx.save();
    ctx.shadowColor = glowColor || 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 80 * clamp(glowIntensity, 0, 1);
    ctx.fillStyle = color;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const w = ctx.measureText(line).width;
      let x = anchorX;
      if (align === 'center') x -= w / 2;
      else if (align === 'right') x -= w;
      ctx.fillText(line, x, startY + i * lh);
    }
    ctx.restore();
  }

  ctx.fillStyle = color;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const w = ctx.measureText(line).width;
    let x = anchorX;
    if (align === 'center') x -= w / 2;
    else if (align === 'right') x -= w;
    ctx.fillText(line, x, startY + i * lh);
  }

  return { x: anchorX, y: startY, w: measureTextLines(ctx, lines, fontSize, weight, letterSpacing), h: totalH };
}

export function drawText(ctx, title, subtitle, accent, options = {}) {
  const {
    layout = 'center',
    fontSize = 96,
    textAlign = 'center',
    titleWeight = 700,
    subtitleWeight = 500,
    letterSpacing = 0,
    lineHeight = 1.22,
    glowIntensity = 0.5,
    effects = {},
  } = options;

  const layoutDef = layoutPresets[layout] || layoutPresets.center;
  const titleCfg = { ...layoutDef.title, align: textAlign || layoutDef.title.align };
  const subCfg = { ...layoutDef.subtitle, align: textAlign || layoutDef.subtitle.align };

  let titleSize = Math.round(fontSize);
  if (layoutDef.fontSizeMultiplier) titleSize = Math.round(titleSize * layoutDef.fontSizeMultiplier);
  const subSize = Math.round(fontSize * 0.38);

  ctx.save();

  const titleLines = wrapText(ctx, title, titleCfg.maxWidth);
  const subLines = wrapText(ctx, subtitle, subCfg.maxWidth);

  // Pre-set fonts for measurement
  ctx.font = `${titleWeight} ${titleSize}px ${fontFamily}`;
  const titleBoxW = measureTextLines(ctx, titleLines, titleSize, titleWeight, letterSpacing);
  const titleBoxH = titleLines.length * titleSize * lineHeight;

  ctx.font = `${subtitleWeight} ${subSize}px ${fontFamily}`;
  const subBoxW = measureTextLines(ctx, subLines, subSize, subtitleWeight, letterSpacing);
  const subBoxH = subLines.length * subSize * lineHeight;

  let minX = titleCfg.x;
  let maxX = titleCfg.x;
  let minY = titleCfg.y - titleBoxH / 2;
  let maxY = titleCfg.y + titleBoxH / 2;

  if (subCfg.align === 'left') {
    minX = Math.min(minX, subCfg.x);
    maxX = Math.max(maxX, subCfg.x + subBoxW);
  } else if (subCfg.align === 'right') {
    minX = Math.min(minX, subCfg.x - subBoxW);
    maxX = Math.max(maxX, subCfg.x);
  } else {
    minX = Math.min(minX, subCfg.x - subBoxW / 2);
    maxX = Math.max(maxX, subCfg.x + subBoxW / 2);
  }
  minY = Math.min(minY, subCfg.y - subBoxH / 2);
  maxY = Math.max(maxY, subCfg.y + subBoxH / 2);

  if (effects.glassPanel || layoutDef.glassPanel) {
    const panel = layoutDef.glassPanel;
    if (panel) drawGlassPanel(ctx, panel.x, panel.y, panel.w, panel.h, panel.r);
    else drawGlassPanel(ctx, minX - 40, minY - 30, maxX - minX + 80, maxY - minY + 60, 22);
  }

  drawTextBlock(ctx, titleLines, titleCfg.x, titleCfg.y, titleSize, titleWeight, titleCfg.align, letterSpacing, lineHeight, '#ffffff', accent + '80', glowIntensity);
  drawTextBlock(ctx, subLines, subCfg.x, subCfg.y, subSize, subtitleWeight, subCfg.align, letterSpacing, lineHeight, 'rgba(255,255,255,.65)', accent + '55', glowIntensity * 0.7);

  // Accent line
  if (layoutDef.showLine) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (layoutDef.lineX !== undefined && layoutDef.lineW !== undefined) {
      ctx.moveTo(layoutDef.lineX, layoutDef.lineY);
      ctx.lineTo(layoutDef.lineX + layoutDef.lineW, layoutDef.lineY);
    } else if (layoutDef.lineY1 !== undefined) {
      ctx.moveTo(layoutDef.lineX, layoutDef.lineY1);
      ctx.lineTo(layoutDef.lineX, layoutDef.lineY2);
    } else {
      ctx.moveTo(W / 2 - 55, layoutDef.lineY);
      ctx.lineTo(W / 2 + 55, layoutDef.lineY);
    }
    ctx.stroke();
  }

  ctx.restore();
}

/* ── Logo / watermark ────────────────────────────────────────────── */
const logoCache = new Map();

export async function getLogoImage(src) {
  if (!src) return null;
  if (logoCache.has(src)) {
    const img = logoCache.get(src);
    if (img.complete && img.naturalWidth) return img;
  }
  const img = new Image();
  if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
  img.src = src;
  try {
    await img.decode();
    logoCache.set(src, img);
    return img;
  } catch (e) {
    console.warn('Logo load failed', src);
    return null;
  }
}

export async function drawLogo(ctx, logo, accent) {
  if (!logo || !logo.src) return;
  const img = await getLogoImage(logo.src);
  if (!img || !img.naturalWidth) return;

  const preset = logoPositions.find(p => p.id === logo.position) || logoPositions[8];
  let x = logo.x ?? preset.x;
  let y = logo.y ?? preset.y;
  if (logo.position && logo.position !== 'custom') {
    x = preset.x;
    y = preset.y;
  }

  const baseScale = 120 / img.naturalWidth;
  const w = img.naturalWidth * baseScale * clamp(logo.scale ?? 0.75, 0.1, 3);
  const h = img.naturalHeight * baseScale * clamp(logo.scale ?? 0.75, 0.1, 3);

  ctx.save();
  ctx.globalAlpha = clamp(logo.opacity ?? 0.7, 0, 1);
  ctx.translate(x, y);
  ctx.rotate((logo.rotation ?? 0) * Math.PI / 180);

  if (logo.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;
  }

  ctx.drawImage(img, -w / 2, -h / 2, w, h);

  if (logo.tint) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }

  ctx.restore();
}

/* ── Branding text ───────────────────────────────────────────────── */
export function drawBranding(ctx, text = 'neorgon.com', position = 'bottom-right') {
  const pos = brandingPositions.find(p => p.id === position) || brandingPositions[0];
  let x = W - 32, y = H - 24, align = 'right';
  switch (pos.id) {
    case 'bottom-left':   x = 32; y = H - 24; align = 'left'; break;
    case 'bottom-center': x = W / 2; y = H - 24; align = 'center'; break;
    case 'top-right':     x = W - 32; y = 30; align = 'right'; break;
    case 'top-left':      x = 32; y = 30; align = 'left'; break;
    case 'top-center':    x = W / 2; y = 30; align = 'center'; break;
  }
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  ctx.font = `500 16px ${fontFamily}`;
  ctx.textAlign = align;
  ctx.textBaseline = pos.id.startsWith('top') ? 'top' : 'alphabetic';
  ctx.fillText(text, x, y);
}

/* ── Made-with badge ─────────────────────────────────────────────── */
export function drawBadge(ctx, show = true) {
  if (!show) return;
  const text = 'Made with OG Studio';
  const pad = { x: 14, y: 8 };
  ctx.font = `600 13px ${fontFamily}`;
  const metrics = ctx.measureText(text);
  const bw = metrics.width + pad.x * 2;
  const bh = 22 + pad.y * 2 - 8;
  const x = 24;
  const y = H - 24 - bh;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, bw, bh, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + pad.x, y + bh / 2);
  ctx.restore();
}
