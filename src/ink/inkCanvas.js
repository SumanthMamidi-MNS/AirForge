/**
 * AirForge Studio — Ink Canvas Manager
 * Mirrored X to match webcam scaleX(-1).
 * Supports undo/redo via strokeManager.
 */

import { strokeManager } from "./strokes.js";
import { renderGlow, drawPreviewStroke } from "./neon.js";
import { shapeHandler } from "./shapes.js";

class InkCanvas {
  constructor() {
    this.inkCanvas = document.getElementById("ink-canvas");
    this.inkCtx = this.inkCanvas.getContext("2d");

    this.glowCanvas = document.getElementById("glow-canvas");
    this.glowCtx = this.glowCanvas.getContext("2d");

    this.currentColor = "#00ff88";
    this.currentSize = 6;

    this.highlightedStroke = null;
    this.selectedStroke = null;

    this._lastPoint = null;
    this._smoothWindow = [];
    this._smoothWindowSize = 3;
    this._minPointDist = 2;

    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  _resize() {
    if (!this.inkCanvas || !this.glowCanvas) return;
    this.inkCanvas.width = window.innerWidth;
    this.inkCanvas.height = window.innerHeight;
    this.glowCanvas.width = window.innerWidth;
    this.glowCanvas.height = window.innerHeight;
  }

  _normToPixel(normX, normY) {
    return {
      x: (1 - normX) * this.inkCanvas.width,
      y: normY * this.inkCanvas.height,
    };
  }

  setColor(color) { this.currentColor = color; }
  setSize(size)  { this.currentSize = size; }

  startDrawing(normX, normY) {
    const { x, y } = this._normToPixel(normX, normY);
    strokeManager.saveHistory();
    strokeManager.startStroke(this.currentColor, this.currentSize, false);
    strokeManager.addPoint(x, y);
    this._lastPoint = { x, y };
    this.highlightedStroke = null;
    this.selectedStroke = null;
    strokeManager.clearSelection();
  }

  continueDrawing(normX, normY) {
    const { x, y } = this._normToPixel(normX, normY);
    if (!this._lastPoint) {
      this._lastPoint = { x, y };
      strokeManager.addPoint(x, y);
      return;
    }

    const dist = Math.hypot(x - this._lastPoint.x, y - this._lastPoint.y);
    if (dist < 3) return; // ignore micro-jitter
    if (dist > 250) return; // ignore tracking teleport glitches

    // Cursive stabilizer: smooths hand tremor while following the finger closely
    const alpha = Math.min(0.70, Math.max(0.40, dist / 30));
    const sx = this._lastPoint.x + alpha * (x - this._lastPoint.x);
    const sy = this._lastPoint.y + alpha * (y - this._lastPoint.y);

    strokeManager.addPoint(sx, sy);
    this._lastPoint = { x: sx, y: sy };
  }

  finishDrawing() {
    strokeManager.finishCurrentStroke();
    this._lastPoint = null;
  }

  findStrokeAt(normX, normY, threshold = 30) {
    const { x, y } = this._normToPixel(normX, normY);
    return strokeManager.findNearestStroke(x, y, threshold);
  }

  setHighlight(stroke) {
    this.highlightedStroke = stroke;
    this.selectedStroke = null;
    strokeManager.clearSelection();
  }

  setSelection(stroke) {
    this.selectedStroke = stroke;
    this.highlightedStroke = null;
    strokeManager.clearSelection();
    if (stroke) strokeManager.setSelected(stroke.id, true);
  }

  eraseHighlighted() {
    if (!this.highlightedStroke) return false;
    const r = strokeManager.removeStroke(this.highlightedStroke.id);
    this.highlightedStroke = null;
    return r;
  }

  moveSelection(normDX, normDY) {
    if (!this.selectedStroke) return;
    // Strokes are stored in mirrored pixel space: x = (1 - normX) * width.
    // A positive normDX (hand moving right) means the mirrored pixel X
    // decreases, so we negate dx to keep movement direction natural.
    strokeManager.moveStroke(
      this.selectedStroke.id,
      -normDX * this.inkCanvas.width, // ← negated: mirrors the X delta
       normDY * this.inkCanvas.height  // ← unchanged: Y is never mirrored
    );
  }

  clearAll() {
    strokeManager.clearAll();
    this.highlightedStroke = null;
    this.selectedStroke = null;
  }

  undo() {
    const r = strokeManager.undo();
    this.highlightedStroke = null;
    this.selectedStroke = null;
    strokeManager.clearSelection();
    return r;
  }

  redo() {
    const r = strokeManager.redo();
    this.highlightedStroke = null;
    this.selectedStroke = null;
    strokeManager.clearSelection();
    return r;
  }

  render() {
    const strokes = strokeManager.getAll();
    renderGlow(this.glowCtx, strokes, this.highlightedStroke, this.selectedStroke);
    const preview = shapeHandler.getPreview();
    if (preview && preview.points.length > 0) {
      drawPreviewStroke(this.glowCtx, preview);
    }
  }

  savePNG() {
    // Render at 2x screen resolution for high-quality export
    const scale = 2;
    const c = document.createElement("canvas");
    c.width  = this.glowCanvas.width  * scale;
    c.height = this.glowCanvas.height * scale;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, c.width, c.height);
    // Scale up the glow canvas (all strokes) into the larger canvas
    ctx.drawImage(this.glowCanvas, 0, 0, c.width, c.height);
    return c.toDataURL("image/png");
  }
}

export const inkCanvas = new InkCanvas();
