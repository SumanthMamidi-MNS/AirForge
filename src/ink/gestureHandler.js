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

const PINCH_SELECT_MS = 1000; // 1 second hold to select

class GestureHandler {
  constructor() {
    this.state = State.IDLE;
    this.timerStart = 0;
    this.lastPinchX = 0;
    this.lastPinchY = 0;
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

      const near = inkCanvas.findStrokeAt(gesture.pinchMidpoint.x, gesture.pinchMidpoint.y, 40);
      if (near) {
        this.state = State.PINCH_WAITING;
        this.timerStart = performance.now();
        this.lastPinchX = gesture.pinchMidpoint.x;
        this.lastPinchY = gesture.pinchMidpoint.y;
        inkCanvas.setHighlight(near);
        return { action: "selecting", message: "🤏 Hold 1s to select stroke..." };
      }

      return { action: "idle", message: "🤏 Pinch near a stroke to select" };
    }

    return { action: "idle", message: "" };
  }

  // ─── DRAWING ──────────────────────────────

  _handleDrawing(gesture) {
    if (gesture.type === "POINT") {
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

    // Any non-POINT gesture stops drawing
    if (gesture.type === "OPEN_PALM" || gesture.type === "IDLE" || gesture.type === "NO_HAND" ||
        gesture.type === "PINCH" || gesture.type === "PINCH_INDEX") {
      const mode = shapeHandler.getMode();
      if (mode !== ShapeMode.FREE) {
        shapeHandler.finalizeShape(inkCanvas.currentColor, inkCanvas.currentSize);
      }
      this.state = State.IDLE;
      return { action: "idle", message: "✋ Drawing stopped" };
    }

    return { action: "drawing", message: "✍️ Drawing..." };
  }

  // ─── PINCH WAITING (selection hold) ───────

  _handlePinchWaiting(gesture) {
    const elapsed = performance.now() - this.timerStart;

    // Cancelled — gesture changed away from pinch
    if (gesture.type === "OPEN_PALM" || gesture.type === "IDLE" ||
        gesture.type === "NO_HAND" || gesture.type === "POINT") {
      inkCanvas.setHighlight(null);
      this.state = State.IDLE;
      return { action: "idle", message: "Selection cancelled" };
    }

    if (gesture.type === "PINCH" || gesture.type === "PINCH_INDEX") {
      if (elapsed >= PINCH_SELECT_MS) {
        if (!gesture.pinchMidpoint) {
          this.state = State.IDLE;
          return { action: "idle", message: "" };
        }

        const near = inkCanvas.findStrokeAt(gesture.pinchMidpoint.x, gesture.pinchMidpoint.y, 40);
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

    inkCanvas.setHighlight(null);
    this.state = State.IDLE;
    return { action: "idle", message: "" };
  }

  // ─── MOVING ───────────────────────────────

  _handleMoving(gesture) {
    if (gesture.type === "OPEN_PALM" || gesture.type === "IDLE" || gesture.type === "NO_HAND") {
      inkCanvas.setSelection(null);
      this.state = State.IDLE;
      return { action: "idle", message: "✅ Stroke placed" };
    }

    if (gesture.type === "PINCH" || gesture.type === "PINCH_INDEX") {
      if (!gesture.pinchMidpoint) return { action: "moving", message: "🤏 Moving..." };
      const dx = gesture.pinchMidpoint.x - this.lastPinchX;
      const dy = gesture.pinchMidpoint.y - this.lastPinchY;
      inkCanvas.moveSelection(dx, dy);
      this.lastPinchX = gesture.pinchMidpoint.x;
      this.lastPinchY = gesture.pinchMidpoint.y;
      return { action: "moving", message: "🤏 Moving — open palm to drop" };
    }

    return { action: "moving", message: "🤏 Release to drop" };
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
