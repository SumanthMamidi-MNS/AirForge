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

  getCurrentStroke() {
    if (this.strokes.length === 0) return null;
    return this.strokes[this.strokes.length - 1];
  }

  /**
   * Trim abrupt exit flings (e.g. dropping hand after writing a word).
   * Detects abnormal acceleration on the final 1-2 points.
   */
  trimExitTail(stroke) {
    if (!stroke || stroke.isShape || !stroke.points || stroke.points.length < 5) return;
    const pts = stroke.points;
    const dists = [];
    for (let i = 1; i < pts.length; i++) {
      dists.push(Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }

    // Median step distance of the handwriting body (excluding the final 2 points)
    const sample = dists.slice(0, Math.max(1, dists.length - 2)).sort((a, b) => a - b);
    const medianDist = sample[Math.floor(sample.length / 2)] || 10;
    const threshold = Math.max(30, medianDist * 2.5);

    // Pop runaway hand-drop tail points
    if (dists[dists.length - 1] > threshold) {
      pts.pop();
      if (pts.length >= 4) {
        const secondLastDist = Math.hypot(
          pts[pts.length - 1].x - pts[pts.length - 2].x,
          pts[pts.length - 1].y - pts[pts.length - 2].y
        );
        if (secondLastDist > threshold) {
          pts.pop();
        }
      }
    }
  }

  /**
   * Gentle Laplacian/Gaussian filter to eliminate webcam micro-jitter and smooth cursive loops.
   */
  refineStrokeCurvature(stroke) {
    if (!stroke || stroke.isShape || !stroke.points || stroke.points.length < 4) return;
    const pts = stroke.points;
    const n = pts.length;

    const smoothed = [{ x: pts[0].x, y: pts[0].y }];
    for (let i = 1; i < n - 1; i++) {
      smoothed.push({
        x: 0.25 * pts[i - 1].x + 0.5 * pts[i].x + 0.25 * pts[i + 1].x,
        y: 0.25 * pts[i - 1].y + 0.5 * pts[i].y + 0.25 * pts[i + 1].y,
      });
    }
    smoothed.push({ x: pts[n - 1].x, y: pts[n - 1].y });
    stroke.points = smoothed;
  }

  /**
   * Finalize the active stroke: clean exit tail and smooth cursive curvature.
   */
  finishCurrentStroke() {
    const stroke = this.getCurrentStroke();
    if (!stroke) return;
    this.trimExitTail(stroke);
    this.refineStrokeCurvature(stroke);
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
