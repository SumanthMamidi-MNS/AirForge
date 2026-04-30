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
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  if (stroke.isShape || stroke.points.length <= 2) {
    // Straight lines — shapes need crisp corners, not bezier curves
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
  } else {
    // Smooth quadratic curves for freehand strokes
    for (let i = 1; i < stroke.points.length - 1; i++) {
      const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
      const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
    }
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
  }
}

/**
 * Draw a neon stroke with glow aura + white core.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} stroke - { points, color, size, isShape }
 */
export function drawNeonStroke(ctx, stroke) {
  if (stroke.points.length < 2) return;

  const { color, size } = stroke;

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
  // Explicitly reset shadow so it doesn't bleed into next save/restore cycle
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  ctx.restore();

  // Layer 2: Thin bright white core
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
