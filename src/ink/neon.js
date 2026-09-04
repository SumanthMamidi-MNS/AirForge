/**
 * AirForge Studio — Neon Glow Renderer
 * Fixed: straight-line paths for shape strokes (no rounded corners).
 * Fixed: shadow state fully reset after each draw to prevent glow stacking.
 */

/**
 * Draw the path for a stroke. Shapes use lineTo; freehand uses quadratic curves.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} stroke
 */
function drawPath(ctx, stroke) {
  const pts = stroke.points;
  if (!pts || pts.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  if (stroke.isShape || pts.length <= 2) {
    // Straight lines for geometric shapes or 2-point stubs
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    return;
  }

  // Smooth Catmull-Rom spline converted to cubic Bezier curves.
  // Produces continuous, organic curvature without sharp elbow spikes.
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i < n - 2 ? pts[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
}

/**
 * Calculate dynamic calligraphic line weights along the stroke.
 * Weights downstrokes, lightens upstrokes/ligatures, and tapers endpoints.
 * @param {Array} pts - [{x, y}]
 * @param {number} baseSize - stroke base width
 * @returns {Float32Array}
 */
function computeCalligraphicWidths(pts, baseSize) {
  const n = pts.length;
  const widths = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    let dx, dy;
    if (i === 0) {
      dx = pts[1].x - pts[0].x;
      dy = pts[1].y - pts[0].y;
    } else if (i === n - 1) {
      dx = pts[n - 1].x - pts[n - 2].x;
      dy = pts[n - 1].y - pts[n - 2].y;
    } else {
      dx = pts[i + 1].x - pts[i - 1].x;
      dy = pts[i + 1].y - pts[i - 1].y;
    }

    const angle = Math.atan2(dy, dx);
    // Calligraphic nib angle (~45 deg) gives classic penmanship weight:
    // Downward & down-right strokes are fuller; ascending loops & cross strokes are slender.
    const nibAngle = Math.PI / 4;
    const calliWeight = 0.85 + 0.35 * Math.sin(angle + nibAngle);

    // Smooth entry and exit feathering
    const tIn = Math.min(1.0, (i + 0.6) / 3.2);
    const tOut = Math.min(1.0, (n - 1 - i + 0.6) / 3.8);
    const taper = Math.max(0.28, tIn * tOut);

    widths[i] = Math.max(1.5, baseSize * calliWeight * taper);
  }
  return widths;
}

/**
 * Draw a neon stroke with glow aura + calligraphic cursive core.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} stroke - { points, color, size, isShape }
 */
export function drawNeonStroke(ctx, stroke) {
  const pts = stroke.points;
  if (!pts || pts.length < 2) return;

  const { color, size, isShape } = stroke;

  // Layer 1: Wide blurry glow (the neon aura)
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 3;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawPath(ctx, stroke);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.restore();

  // For shapes or very short stubs, render uniform core
  if (isShape || pts.length <= 2) {
    ctx.save();
    ctx.shadowColor = "rgba(255,255,255,0.6)";
    ctx.shadowBlur = size * 0.5;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = Math.max(1, size * 0.35);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    drawPath(ctx, stroke);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    ctx.restore();
    return;
  }

  // Cursive Handwriting: Render calligraphic tube and specular core
  const n = pts.length;
  const widths = computeCalligraphicWidths(pts, size);

  // Precalculate cubic Bezier curve control points
  const segments = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i < n - 2 ? pts[i + 2] : p2;
    segments.push({
      p1,
      p2,
      cp1x: p1.x + (p2.x - p0.x) / 6,
      cp1y: p1.y + (p2.y - p0.y) / 6,
      cp2x: p2.x - (p3.x - p1.x) / 6,
      cp2y: p2.y - (p3.y - p1.y) / 6,
      w: (widths[i] + widths[i + 1]) * 0.5,
    });
  }

  // Layer 2: Vibrant Colored Ink Body with Calligraphic Weight
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.95;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    ctx.lineWidth = s.w;
    ctx.beginPath();
    ctx.moveTo(s.p1.x, s.p1.y);
    ctx.bezierCurveTo(s.cp1x, s.cp1y, s.cp2x, s.cp2y, s.p2.x, s.p2.y);
    ctx.stroke();
  }
  ctx.restore();

  // Layer 3: Brilliant White Specular Core
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    ctx.lineWidth = Math.max(1, s.w * 0.35);
    ctx.beginPath();
    ctx.moveTo(s.p1.x, s.p1.y);
    ctx.bezierCurveTo(s.cp1x, s.cp1y, s.cp2x, s.cp2y, s.p2.x, s.p2.y);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw a dashed selection box around a stroke's bounding box.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} stroke
 */
export function drawSelectionBox(ctx, stroke) {
  if (stroke.points.length === 0) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  stroke.points.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  });

  const pad = 12;
  ctx.save();
  ctx.setLineDash([8, 4]);
  ctx.lineDashOffset = -performance.now() / 100;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 8;
  ctx.strokeRect(minX - pad, minY - pad, maxX - minX + pad * 2, maxY - minY + pad * 2);
  ctx.shadowBlur = 0;
  ctx.restore();
}

/**
 * Render all strokes to the glow canvas each frame.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} strokes
 * @param {Object|null} highlightedStroke
 * @param {Object|null} selectedStroke
 */
export function renderGlow(ctx, strokes, highlightedStroke = null, selectedStroke = null) {
  // Full clear every frame — prevents glow accumulation
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  strokes.forEach((stroke) => {
    if (stroke === highlightedStroke) {
      // Highlight in red-orange for selection feedback
      ctx.save();
      ctx.strokeStyle = "#ff4444";
      ctx.lineWidth = stroke.size + 4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "#ff0000";
      ctx.shadowBlur = 16;
      ctx.globalAlpha = 0.75;
      drawPath(ctx, stroke);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();
    } else {
      drawNeonStroke(ctx, stroke);
    }
  });

  if (selectedStroke && selectedStroke !== highlightedStroke) {
    drawSelectionBox(ctx, selectedStroke);
  }
}

/**
 * Draw a ghost preview stroke (dashed, semi-transparent).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} previewStroke
 */
export function drawPreviewStroke(ctx, previewStroke) {
  if (!previewStroke || previewStroke.points.length < 2) return;

  ctx.save();
  ctx.setLineDash([10, 6]);
  ctx.lineDashOffset = -performance.now() / 50;
  ctx.strokeStyle = previewStroke.color;
  ctx.lineWidth = previewStroke.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = previewStroke.color;
  ctx.shadowBlur = 8;
  ctx.globalAlpha = 0.55;
  drawPath(ctx, previewStroke);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}
