/**
 * AirForge Studio — Stroke Data Model
 * Proper undo/redo with separate stacks.
 * Supports isShape flag for straight-line rendering.
 */

class StrokeManager {
  constructor() {
    this.strokes = [];
    this.history = [];   // stack of previous states for undo
    this.redoStack = []; // stack of undone states for redo
    this.maxHistory = 50;
  }

  // ─── Internal snapshot helpers ───────────

  _snapshot() {
    return this.strokes.map((s) => ({
      id: s.id,
      color: s.color,
      size: s.size,
      points: s.points.map((p) => ({ x: p.x, y: p.y })),
      selected: false,
      isShape: s.isShape || false,
    }));
  }

  _restore(snapshot) {
    return snapshot.map((s) => ({
      id: s.id,
      color: s.color,
      size: s.size,
      points: s.points.map((p) => ({ x: p.x, y: p.y })),
      selected: false,
      isShape: s.isShape || false,
    }));
  }

  // ─── History management ──────────────────

  /**
   * Save current state before an action. Clears redo stack.
   */
  saveHistory() {
    this.history.push(this._snapshot()); // always save, even if empty
    if (this.history.length > this.maxHistory) this.history.shift();
    this.redoStack = []; // new action breaks redo chain
  }

  // ─── Stroke operations ───────────────────

  /**
   * Start a new stroke.
   * @param {string} color
   * @param {number} size
   * @param {boolean} isShape - if true, renders with straight lines
   */
  startStroke(color, size, isShape = false) {
    const stroke = {
      id: Date.now() + Math.random(),
      color,
      size,
      points: [],
      selected: false,
      isShape,
    };
    this.strokes.push(stroke);
    return stroke;
  }

  addPoint(x, y) {
    if (this.strokes.length === 0) return;
    this.strokes[this.strokes.length - 1].points.push({ x, y });
  }

  removeStroke(id) {
    const idx = this.strokes.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.saveHistory();
    this.strokes.splice(idx, 1);
    return true;
  }

  findNearestStroke(x, y, threshold = 30) {
    let nearest = null;
    let min = threshold;
    for (const s of this.strokes) {
      for (const p of s.points) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < min) {
          min = d;
          nearest = s;
        }
      }
    }
    return nearest;
  }

  moveStroke(id, dx, dy) {
    const s = this.strokes.find((s) => s.id === id);
    if (!s) return;
    s.points.forEach((p) => {
      p.x += dx;
      p.y += dy;
    });
  }

  clearAll() {
    this.saveHistory();
    this.strokes = [];
  }

  getAll() {
    return this.strokes;
  }

  setSelected(id, sel) {
    const s = this.strokes.find((s) => s.id === id);
    if (s) s.selected = sel;
  }

  clearSelection() {
    this.strokes.forEach((s) => (s.selected = false));
  }

  // ─── Undo / Redo ──────────────────────────

  undo() {
    if (this.history.length === 0) return false;
    // Push current state to redo stack before undoing
    this.redoStack.push(this._snapshot());
    this.strokes = this._restore(this.history.pop());
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    // Push current state to history before redoing
    this.history.push(this._snapshot());
    this.strokes = this._restore(this.redoStack.pop());
    return true;
  }

  canUndo() {
    return this.history.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }
}

export const strokeManager = new StrokeManager();
