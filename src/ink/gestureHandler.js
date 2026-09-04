/**
 * AirForge Studio — Ink Space Gesture Handler (Simplified)
 *
 * ☝️ POINT      → Draw (free or shape mode)
 * 🤏 PINCH      → Select stroke (1 second hold) then drag to move
 * ✋ OPEN_PALM  → Stop drawing / drop selected stroke
 *
 * Removed: three-finger erase, peace sign.
 * Timer: 1 second for pinch select (was 2 seconds).
 */

import { inkCanvas } from "./inkCanvas.js";
import { shapeHandler, ShapeMode } from "./shapes.js";

const State = {
  IDLE: "IDLE",
  DRAWING: "DRAWING",
  PINCH_WAITING: "PINCH_WAITING",
  MOVING: "MOVING",
};

const PINCH_SELECT_MS = 800; // Snappy 800ms hold to select
const DRAW_GRACE_FRAMES = 7;   // Tolerate up to ~200ms tracking micro-drops without breaking strokes
const PINCH_GRACE_FRAMES = 7;  // Tolerate tracking flicker without dropping selected strokes

class GestureHandler {
  constructor() {
    this.state = State.IDLE;
    this.timerStart = 0;
    this.lastPinchX = 0;
    this.lastPinchY = 0;
    this.drawGraceCount = 0;
    this.pinchGraceCount = 0;
  }

  processGesture(gesture) {
    switch (this.state) {
      case State.IDLE:           return this._handleIdle(gesture);
      case State.DRAWING:        return this._handleDrawing(gesture);
      case State.PINCH_WAITING:  return this._handlePinchWaiting(gesture);
      case State.MOVING:         return this._handleMoving(gesture);
      default:
        this.state = State.IDLE;
        return { action: "idle", message: "" };
    }
  }

  // ─── IDLE ─────────────────────────────────

  _handleIdle(gesture) {
    // ☝️ POINT → start drawing
    if (gesture.type === "POINT") {
      this.state = State.DRAWING;
      this.drawGraceCount = 0;
      const mode = shapeHandler.getMode();

      if (mode === ShapeMode.FREE) {
        inkCanvas.startDrawing(gesture.indexTip.x, gesture.indexTip.y);
      } else {
        const cw = inkCanvas.glowCanvas.width;
        const ch = inkCanvas.glowCanvas.height;
        shapeHandler.startShape(gesture.indexTip.x, gesture.indexTip.y, inkCanvas.currentColor, inkCanvas.currentSize, cw, ch);
      }

      const modeName = mode === ShapeMode.FREE ? "Drawing" : `Drawing ${mode.toLowerCase()}`;
      return { action: "drawing", message: `✍️ ${modeName} — open palm to stop` };
    }

    // 🤏 PINCH → begin selection hold timer
    if (gesture.type === "PINCH" || gesture.type === "PINCH_INDEX") {
      if (!gesture.pinchMidpoint) return { action: "idle", message: "" };

      const near = inkCanvas.findStrokeAt(gesture.pinchMidpoint.x, gesture.pinchMidpoint.y, 45);
      if (near) {
        this.state = State.PINCH_WAITING;
        this.timerStart = performance.now();
        this.lastPinchX = gesture.pinchMidpoint.x;
        this.lastPinchY = gesture.pinchMidpoint.y;
        this.pinchGraceCount = 0;
        inkCanvas.setHighlight(near);
        return { action: "selecting", message: "🤏 Hold to select stroke..." };
      }

      return { action: "idle", message: "🤏 Pinch near a stroke to select" };
    }

    return { action: "idle", message: "" };
  }

  // ─── DRAWING ──────────────────────────────

  _handleDrawing(gesture) {
    // Deliberate stop: OPEN_PALM terminates drawing immediately
    if (gesture.type === "OPEN_PALM") {
      const mode = shapeHandler.getMode();
      if (mode !== ShapeMode.FREE) {
        shapeHandler.finalizeShape(inkCanvas.currentColor, inkCanvas.currentSize);
      }
      this.state = State.IDLE;
      this.drawGraceCount = 0;
      return { action: "idle", message: "✋ Drawing stopped" };
    }

    // Active pointing: continue stroke
    if (gesture.type === "POINT") {
      this.drawGraceCount = 0;
      const mode = shapeHandler.getMode();
      if (mode === ShapeMode.FREE) {
        inkCanvas.continueDrawing(gesture.indexTip.x, gesture.indexTip.y);
      } else {
        const cw = inkCanvas.glowCanvas.width;
        const ch = inkCanvas.glowCanvas.height;
        shapeHandler.updateShape(gesture.indexTip.x, gesture.indexTip.y, cw, ch);
      }
      return { action: "drawing", message: "✍️ Drawing..." };
    }

    // Temporary tracking flicker (IDLE, brief NO_HAND during handwriting):
    // Bridge across micro-drops instead of instantly breaking the stroke
    this.drawGraceCount = (this.drawGraceCount || 0) + 1;
    if (this.drawGraceCount < DRAW_GRACE_FRAMES) {
      return { action: "drawing", message: "✍️ Drawing..." };
    }

    // Sustained loss: finalize stroke
    const mode = shapeHandler.getMode();
    if (mode !== ShapeMode.FREE) {
      shapeHandler.finalizeShape(inkCanvas.currentColor, inkCanvas.currentSize);
    }
    this.state = State.IDLE;
    this.drawGraceCount = 0;
    return { action: "idle", message: "✋ Drawing stopped" };
  }

  // ─── PINCH WAITING (selection hold) ───────

  _handlePinchWaiting(gesture) {
    // Deliberate cancellation: OPEN_PALM
    if (gesture.type === "OPEN_PALM") {
      inkCanvas.setHighlight(null);
      this.state = State.IDLE;
      this.pinchGraceCount = 0;
      return { action: "idle", message: "Selection cancelled" };
    }

    if (gesture.type === "PINCH" || gesture.type === "PINCH_INDEX") {
      this.pinchGraceCount = 0;
      const elapsed = performance.now() - this.timerStart;

      if (elapsed >= PINCH_SELECT_MS) {
        if (!gesture.pinchMidpoint) {
          this.state = State.IDLE;
          return { action: "idle", message: "" };
        }

        const near = inkCanvas.findStrokeAt(gesture.pinchMidpoint.x, gesture.pinchMidpoint.y, 45);
        if (near) {
          inkCanvas.setHighlight(null);
          inkCanvas.setSelection(near);
          this.state = State.MOVING;
          this.lastPinchX = gesture.pinchMidpoint.x;
          this.lastPinchY = gesture.pinchMidpoint.y;
          return { action: "moving", message: "🤏 Selected! Move hand, open palm to drop" };
        }

        inkCanvas.setHighlight(null);
        this.state = State.IDLE;
        return { action: "idle", message: "Stroke lost — try again" };
      }

      const pct = Math.min(100, Math.round((elapsed / PINCH_SELECT_MS) * 100));
      return { action: "selecting", message: `🤏 Selecting... ${pct}%` };
    }

    // Micro-flicker during selection wait: maintain timer
    this.pinchGraceCount = (this.pinchGraceCount || 0) + 1;
    if (this.pinchGraceCount < PINCH_GRACE_FRAMES) {
      return { action: "selecting", message: "🤏 Selecting..." };
    }

    inkCanvas.setHighlight(null);
    this.state = State.IDLE;
    this.pinchGraceCount = 0;
    return { action: "idle", message: "Selection cancelled" };
  }

  // ─── MOVING ───────────────────────────────

  _handleMoving(gesture) {
    // Deliberate drop: OPEN_PALM commits placement
    if (gesture.type === "OPEN_PALM") {
      inkCanvas.setSelection(null);
      this.state = State.IDLE;
      this.pinchGraceCount = 0;
      return { action: "idle", message: "✅ Stroke placed" };
    }

    if (gesture.type === "PINCH" || gesture.type === "PINCH_INDEX") {
      this.pinchGraceCount = 0;
      if (!gesture.pinchMidpoint) return { action: "moving", message: "🤏 Moving..." };
      const dx = gesture.pinchMidpoint.x - this.lastPinchX;
      const dy = gesture.pinchMidpoint.y - this.lastPinchY;
      inkCanvas.moveSelection(dx, dy);
      this.lastPinchX = gesture.pinchMidpoint.x;
      this.lastPinchY = gesture.pinchMidpoint.y;
      return { action: "moving", message: "🤏 Moving — open palm to drop" };
    }

    // Tracking flicker during drag: keep selection held, do NOT drop in mid-air
    this.pinchGraceCount = (this.pinchGraceCount || 0) + 1;
    if (this.pinchGraceCount < PINCH_GRACE_FRAMES) {
      return { action: "moving", message: "🤏 Moving..." };
    }

    // Sustained loss: place stroke
    inkCanvas.setSelection(null);
    this.state = State.IDLE;
    this.pinchGraceCount = 0;
    return { action: "idle", message: "✅ Stroke placed" };
  }

  reset() {
    inkCanvas.setSelection(null);
    inkCanvas.setHighlight(null);
    this.state = State.IDLE;
  }

  getState() {
    return this.state;
  }
}

export const gestureHandler = new GestureHandler();
