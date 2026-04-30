/**
 * AirForge Studio — Background Templates
 * Renders lined, grid, or dotted backgrounds behind the ink canvas.
 */

export const BackgroundType = {
  BLANK: "blank",
  LINED: "lined",
  GRID: "grid",
  DOTTED: "dotted",
};

class Background {
  constructor() {
    /** @type {string} */
    this.type = BackgroundType.BLANK;

    /** @type {HTMLCanvasElement} */
    this.canvas = null;

    /** @type {CanvasRenderingContext2D} */
    this.ctx = null;

    this._createCanvas();
  }

  _createCanvas() {
    // Create background canvas
    this.canvas = document.createElement("canvas");
    this.canvas.id = "background-canvas";
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: none;
    `;
    document.body.insertBefore(
      this.canvas,
      document.getElementById("ink-canvas"),
    );
    this.ctx = this.canvas.getContext("2d");
    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  _resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.render();
  }

  /**
   * Set the background type and re-render.
   * @param {string} type - from BackgroundType
   */
  setType(type) {
    this.type = type;
    this.render();
  }

  /**
   * Get current background type.
   */
  getType() {
    return this.type;
  }

  /**
   * Render the current background.
   */
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    switch (this.type) {
      case BackgroundType.BLANK:
        // Nothing — transparent
        break;

      case BackgroundType.LINED:
        this._drawLined(ctx, w, h);
        break;

      case BackgroundType.GRID:
        this._drawGrid(ctx, w, h);
        break;

      case BackgroundType.DOTTED:
        this._drawDotted(ctx, w, h);
        break;
    }
  }

  _drawLined(ctx, w, h) {
    const spacing = 30;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;

    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  _drawGrid(ctx, w, h) {
    const spacing = 40;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 0.5;

    // Vertical lines
    for (let x = spacing; x < w; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = spacing; y < h; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  _drawDotted(ctx, w, h) {
    const spacing = 25;
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";

    for (let x = spacing; x < w; x += spacing) {
      for (let y = spacing; y < h; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export const background = new Background();
