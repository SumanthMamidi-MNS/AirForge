/**
 * AirForge Studio — Orbit Control Panel
 * 3×3 grid of camera preset buttons, positioned below FPS counter (left side).
 *
 * Layout:
 *   [↖] [▲] [↗]
 *   [◄] [⟳] [►]
 *   [↙] [▼] [↘]
 *
 * Center (⟳) = Reset to default view.
 * Smooth camera animation on every click.
 */

import * as THREE from "three";

// Default camera position (matches buildScene initial state)
const DEFAULT_CAM = [8, 6, 10];

class ViewCube {
  constructor(camera) {
    this.camera = camera;
    this.target = new THREE.Vector3(0, 0, 0);
    this.animDuration = 480; // ms
    this.isAnimating = false;
    this.container = null;

    this._createPanel();
  }

  _createPanel() {
    const container = document.createElement("div");
    container.id = "viewcube-container";
    container.style.cssText = `
      position: fixed;
      top: 64px;
      left: 16px;
      width: 96px;
      z-index: 60;
      display: none;
      flex-direction: column;
      gap: 4px;
      user-select: none;
    `;

    // Label
    const label = document.createElement("div");
    label.style.cssText = `
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 1.5px;
      color: rgba(0,255,136,0.6);
      text-align: center;
      text-transform: uppercase;
      margin-bottom: 2px;
      font-family: 'Segoe UI', sans-serif;
    `;
    label.textContent = "View Angle";
    container.appendChild(label);

    // 3×3 grid
    const grid = document.createElement("div");
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 3px;
    `;

    const views = [
      // Row 1: top row
      { pos: [-8, 8, 8],   label: "↖", title: "Front-Left-Top" },
      { pos: [0, 14, 0.001], label: "▲", title: "Top View" },
      { pos: [8, 8, -8],   label: "↗", title: "Front-Right-Top" },
      // Row 2: middle row
      { pos: [-14, 2, 0],  label: "◄", title: "Left View" },
      { pos: DEFAULT_CAM,  label: "⟳", title: "Reset View", isReset: true },
      { pos: [14, 2, 0],   label: "►", title: "Right View" },
      // Row 3: bottom row
      { pos: [-8, -6, 8],  label: "↙", title: "Back-Left" },
      { pos: [0, -12, 3],  label: "▼", title: "Bottom View" },
      { pos: [8, -6, -8],  label: "↘", title: "Back-Right" },
    ];

    views.forEach((view) => {
      const btn = document.createElement("button");
      btn.style.cssText = `
        width: 100%;
        aspect-ratio: 1;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 5px;
        background: rgba(8,8,18,0.82);
        color: rgba(255,255,255,0.7);
        font-size: ${view.isReset ? "13px" : "11px"};
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        font-family: 'Segoe UI', sans-serif;
        padding: 0;
        line-height: 1;
      `;
      btn.textContent = view.label;
      btn.title = view.title;

      // Center reset button gets accent color
      if (view.isReset) {
        btn.style.background = "rgba(0,255,136,0.08)";
        btn.style.borderColor = "rgba(0,255,136,0.3)";
        btn.style.color = "#00ff88";
      }

      btn.addEventListener("mouseenter", () => {
        btn.style.background = "rgba(0,255,136,0.2)";
        btn.style.borderColor = "rgba(0,255,136,0.6)";
        btn.style.color = "#ffffff";
      });
      btn.addEventListener("mouseleave", () => {
        if (view.isReset) {
          btn.style.background = "rgba(0,255,136,0.08)";
          btn.style.borderColor = "rgba(0,255,136,0.3)";
          btn.style.color = "#00ff88";
        } else {
          btn.style.background = "rgba(8,8,18,0.82)";
          btn.style.borderColor = "rgba(255,255,255,0.12)";
          btn.style.color = "rgba(255,255,255,0.7)";
        }
      });

      btn.addEventListener("click", () => this._animateCamera(view.pos));
      grid.appendChild(btn);
    });

    container.appendChild(grid);
    document.body.appendChild(container);
    this.container = container;
  }

  /**
   * Smooth camera animation to a target position using ease-in-out.
   * Doesn't conflict with gesture-based orbit (that moves camera.position directly).
   * @param {number[]} targetPos — [x, y, z]
   */
  _animateCamera(targetPos) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const startPos = this.camera.position.clone();
    const endPos = new THREE.Vector3(...targetPos);
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / this.animDuration);
      // Cubic ease-in-out
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(startPos, endPos, ease);
      this.camera.lookAt(this.target);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.camera.position.copy(endPos);
        this.camera.lookAt(this.target);
        this.isAnimating = false;
      }
    };

    requestAnimationFrame(animate);
  }

  /** No-op — DOM panel doesn't need per-frame updates */
  update() {}

  /** Show or hide the panel. Uses flex when shown. */
  setVisible(visible) {
    if (this.container) {
      this.container.style.display = visible ? "flex" : "none";
    }
  }

  dispose() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

export { ViewCube };
