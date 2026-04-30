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
    this._lastPoint = null;
    this._smoothWindow = [];
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
    this._smoothWindow.push({ x, y });
    if (this._smoothWindow.length > this._smoothWindowSize) this._smoothWindow.shift();
    const sx = this._smoothWindow.reduce((s, p) => s + p.x, 0) / this._smoothWindow.length;
    const sy = this._smoothWindow.reduce((s, p) => s + p.y, 0) / this._smoothWindow.length;
    if (this._lastPoint) {
      const dx = sx - this._lastPoint.x;
      const dy = sy - this._lastPoint.y;
      if (Math.sqrt(dx * dx + dy * dy) < this._minPointDist) return;
    }
    strokeManager.addPoint(sx, sy);
    this._lastPoint = { x: sx, y: sy };
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
    strokeManager.moveStroke(
      this.selectedStroke.id,
      normDX * this.inkCanvas.width,
      normDY * this.inkCanvas.height
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
