/**
 * AirForge Studio — Sidebar UI Controller
 * Premium sidebar with undo/redo, shape controls, build controls.
 */

import { inkCanvas } from "../ink/inkCanvas.js";
import { shapeHandler } from "../ink/shapes.js";
import { background } from "../ink/background.js";
import { simpleMode } from "./simpleMode.js";

let blockManager = null;
let grid = null;
let buildSceneRef = null; // reference to buildScene for screenshot

class Sidebar {
  constructor() {
    this.colorButtons = document.querySelectorAll(".color-btn");
    this.brushSlider  = document.getElementById("brush-slider");
    this.brushSizeValue = document.getElementById("brush-size-value");
    this.btnClear = document.getElementById("btn-clear");
    this.btnUndo  = document.getElementById("btn-undo");
    this.btnRedo  = document.getElementById("btn-redo");
    this.btnSave  = document.getElementById("btn-save");

    this.shapeBtns = null;
    this.bgBtns    = null;
    this.btnSimple = null;
    this.btnModeSwitch = null;

    this.currentMode = "ink";

    this._init();
    this._addShapeControls();
    this._addBackgroundControls();
    this._addBuildControls();
    this._addSimpleModeToggle();
    this._addModeSwitch();
    this._addBranding();
  }

  _init() {
    // Color palette
    this.colorButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this._setActiveColor(btn);
        const color = btn.dataset.color;
        inkCanvas.setColor(color);
        if (blockManager) blockManager.setColor(color);
      });
    });

    // Brush slider
    this.brushSlider.addEventListener("input", () => {
      const size = parseInt(this.brushSlider.value);
      this.brushSizeValue.textContent = size;
      inkCanvas.setSize(size);
    });

    // Clear
    this.btnClear.addEventListener("click", () => {
      if (confirm("Clear everything?")) {
        if (this.currentMode === "ink") inkCanvas.clearAll();
        else if (blockManager) blockManager.clearAll();
      }
    });

    // Undo
    this.btnUndo.addEventListener("click", () => {
      if (this.currentMode === "ink") inkCanvas.undo();
      else if (blockManager) blockManager.undo();
    });

    // Redo — works in both ink and build modes
    if (this.btnRedo) {
      this.btnRedo.addEventListener("click", () => {
        if (this.currentMode === "ink") inkCanvas.redo();
        else if (blockManager) blockManager.redo();
      });
    }

    // Save as PNG — professional filename with ISO date
    this.btnSave.addEventListener("click", () => {
      // ISO date e.g. 2026-04-30
      const date = new Date().toISOString().split("T")[0];

      if (this.currentMode === "ink") {
        const dataURL = inkCanvas.savePNG();
        const link = document.createElement("a");
        link.download = `Airforge_Ink_${date}.png`;
        link.href = dataURL;
        link.click();
      } else if (buildSceneRef) {
        const dataURL = buildSceneRef.screenshot();
        const link = document.createElement("a");
        link.download = `Airforge_Build_${date}.png`;
        link.href = dataURL;
        link.click();
      }
    });
  }

  _addShapeControls() {
    const content = document.getElementById("sidebar-content");
    if (!content) return;

    const section = document.createElement("div");
    section.className = "sidebar-section";
    section.setAttribute("data-advanced", "true");
    section.id = "ink-controls";
    section.innerHTML = `
      <div class="section-label">Shape Mode</div>
      <div class="shape-grid">
        <button class="shape-btn active" data-shape="FREE">🖊️ Free</button>
        <button class="shape-btn" data-shape="LINE">📏 Line</button>
        <button class="shape-btn" data-shape="CIRCLE">⭕ Circle</button>
        <button class="shape-btn" data-shape="RECTANGLE">⬜ Rect</button>
      </div>
    `;
    content.appendChild(section);

    this.shapeBtns = section.querySelectorAll(".shape-btn");
    this.shapeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.shapeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        shapeHandler.setMode(btn.dataset.shape);
      });
    });
  }

  _addBackgroundControls() {
    const content = document.getElementById("sidebar-content");
    if (!content) return;

    const section = document.createElement("div");
    section.className = "sidebar-section";
    section.setAttribute("data-advanced", "true");
    section.id = "bg-controls";
    section.innerHTML = `
      <div class="section-label">Background</div>
      <div class="shape-grid">
        <button class="bg-btn active" data-bg="blank">⬛ Blank</button>
        <button class="bg-btn" data-bg="lined">📝 Lined</button>
        <button class="bg-btn" data-bg="grid">📐 Grid</button>
        <button class="bg-btn" data-bg="dotted">🔵 Dots</button>
      </div>
    `;
    content.appendChild(section);

    this.bgBtns = section.querySelectorAll(".bg-btn");
    this.bgBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.bgBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        background.setType(btn.dataset.bg);
      });
    });
  }

  _addBuildControls() {
    const content = document.getElementById("sidebar-content");
    if (!content) return;

    const section = document.createElement("div");
    section.className = "sidebar-section";
    section.id = "build-controls";
    section.style.display = "none";
    section.innerHTML = `
      <div class="section-label">Build Controls</div>
      <button class="sidebar-btn" id="btn-grid-toggle">📐 Toggle Grid</button>
      <div class="gesture-hint">
        <span>🤏 Pinch</span> → Preview block<br>
        <span>✋ Open palm</span> → Place block<br>
        <span>🤲 Both palms</span> → Orbit camera<br>
        <span>🖱️ Scroll</span> → Zoom
      </div>
    `;
    content.appendChild(section);

    const btnGridToggle = document.getElementById("btn-grid-toggle");
    if (btnGridToggle) {
      btnGridToggle.addEventListener("click", () => {
        if (grid) {
          grid.toggle();
          btnGridToggle.textContent = grid.isVisible() ? "📐 Hide Grid" : "📐 Show Grid";
        }
      });
    }
  }

  _addSimpleModeToggle() {
    const content = document.getElementById("sidebar-content");
    if (!content) return;

    const section = document.createElement("div");
    section.className = "sidebar-section";
    section.innerHTML = `<button id="btn-simple-mode" class="sidebar-btn">🔰 Simple Mode: OFF</button>`;
    content.appendChild(section);

    this.btnSimple = document.getElementById("btn-simple-mode");
    if (this.btnSimple) {
      this.btnSimple.addEventListener("click", () => simpleMode.toggle());
    }
  }

  _addModeSwitch() {
    const header = document.getElementById("sidebar-header");
    if (!header) return;

    this.btnModeSwitch = document.createElement("button");
    this.btnModeSwitch.id = "btn-mode-switch";
    this.btnModeSwitch.className = "mode-switch-btn";
    this.btnModeSwitch.textContent = "🧊 Switch to Build Space";
    this.btnModeSwitch.addEventListener("click", () => this._toggleMode());

    const title = document.getElementById("sidebar-title");
    if (title) title.parentNode.insertBefore(this.btnModeSwitch, title.nextSibling);

    window.addEventListener("mode-switch", (e) => {
      const inkCtrls   = document.getElementById("ink-controls");
      const bgCtrls    = document.getElementById("bg-controls");
      const buildCtrls = document.getElementById("build-controls");
      // Redo button only relevant in ink space
      const redoBtn    = document.getElementById("btn-redo");

      if (e.detail === "build") {
        if (inkCtrls)   inkCtrls.style.display   = "none";
        if (bgCtrls)    bgCtrls.style.display    = "none";
        if (buildCtrls) buildCtrls.style.display = "";
        // Redo is useful in build too — keep it visible
      } else {
        if (inkCtrls)   inkCtrls.style.display   = "";
        if (bgCtrls)    bgCtrls.style.display    = "";
        if (buildCtrls) buildCtrls.style.display = "none";
      }
    });
  }

  _toggleMode() {
    if (this.currentMode === "ink") {
      this.currentMode = "build";
      this.btnModeSwitch.textContent = "✍️ Switch to Ink Space";
      document.getElementById("sidebar-title").textContent = "🧊 Build Space";
      this.btnSave.textContent = "💾 Save as PNG";
      window.dispatchEvent(new CustomEvent("mode-switch", { detail: "build" }));
    } else {
      this.currentMode = "ink";
      this.btnModeSwitch.textContent = "🧊 Switch to Build Space";
      document.getElementById("sidebar-title").textContent = "✍️ Ink Space";
      this.btnSave.textContent = "💾 Save as PNG";
      window.dispatchEvent(new CustomEvent("mode-switch", { detail: "ink" }));
    }
  }

  _setActiveColor(activeBtn) {
    this.colorButtons.forEach((b) => b.classList.remove("active"));
    activeBtn.classList.add("active");
  }

  setBuildReferences(bm, g, scene = null) {
    blockManager = bm;
    grid = g;
    buildSceneRef = scene;
  }

  getMode() {
    return this.currentMode;
  }

  /**
   * Append developer credit at the very bottom of the sidebar.
   * Subtle — small text, low opacity, separated by a thin rule.
   */
  _addBranding() {
    const sidebarEl = document.getElementById("sidebar");
    if (!sidebarEl) return;

    const brand = document.createElement("div");
    brand.id = "sidebar-branding";
    brand.textContent = "Developed by Sumanth Mamidi";
    brand.style.cssText = [
      "padding: 14px 16px 12px",
      "text-align: center",
      "font-size: 11px",
      "font-weight: 400",
      "letter-spacing: 0.6px",
      "color: rgba(255,255,255,0.38)",
      "border-top: 1px solid rgba(255,255,255,0.06)",
      "font-family: 'Segoe UI', system-ui, sans-serif",
      "user-select: none",
      "-webkit-user-select: none",
      "flex-shrink: 0",
    ].join(";");
    sidebarEl.appendChild(brand);
  }
}

export const sidebar = new Sidebar();
