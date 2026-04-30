/**
 * AirForge Studio — Shape Modes
 * Free, Line, Circle, Rectangle — all with proper isShape flag for straight-line rendering.
 */

import { strokeManager } from "./strokes.js";

export const ShapeMode = {
  FREE: "FREE",
  LINE: "LINE",
  CIRCLE: "CIRCLE",
  RECTANGLE: "RECTANGLE",
};

class ShapeHandler {
  constructor() {
    this.mode = ShapeMode.FREE;
    this.previewStroke = null;
    this.startX = 0;
    this.startY = 0;
  }

  setMode(mode) {
    this.mode = mode;
    this.previewStroke = null;
  }

  getMode() {
    return this.mode;
  }

  startShape(normX, normY, color, size, canvasWidth, canvasHeight) {
    const px = (1 - normX) * canvasWidth;
    const py = normY * canvasHeight;
    this.startX = px;
    this.startY = py;
    this.previewStroke = {
      id: -1,
      color,
      size,
      points: [{ x: px, y: py }],
      isShape: true, // shapes use straight-line rendering
      isPreview: true,
    };
  }

  updateShape(normX, normY, canvasWidth, canvasHeight) {
    if (!this.previewStroke) return;
    const x2 = (1 - normX) * canvasWidth;
    const y2 = normY * canvasHeight;
    const x1 = this.startX;
    const y1 = this.startY;

    this.previewStroke.points = [];

    switch (this.mode) {
      case ShapeMode.LINE:
        this.previewStroke.points = [
          { x: x1, y: y1 },
          { x: x2, y: y2 },
        ];
        break;

      case ShapeMode.CIRCLE: {
        const radius = Math.hypot(x2 - x1, y2 - y1);
        const steps = 64;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          this.previewStroke.points.push({
            x: x1 + Math.cos(angle) * radius,
            y: y1 + Math.sin(angle) * radius,
          });
        }
        break;
      }

      case ShapeMode.RECTANGLE: {
        // 5 points: 4 corners + close back to start
        this.previewStroke.points = [
          { x: x1, y: y1 },
          { x: x2, y: y1 },
          { x: x2, y: y2 },
          { x: x1, y: y2 },
          { x: x1, y: y1 },
        ];
        break;
      }
    }
  }

  finalizeShape(color, size) {
    if (!this.previewStroke || this.previewStroke.points.length < 2) {
      this.previewStroke = null;
      return;
    }
    strokeManager.saveHistory();
    // Start stroke with isShape=true so neon renderer uses straight lines
    strokeManager.startStroke(color, size, true);
    this.previewStroke.points.forEach((p) => strokeManager.addPoint(p.x, p.y));
    this.previewStroke = null;
  }

  cancelShape() {
    this.previewStroke = null;
  }

  getPreview() {
    return this.previewStroke;
  }

  hasPreview() {
    return this.previewStroke !== null && this.previewStroke.points.length > 0;
  }
}

export const shapeHandler = new ShapeHandler();
