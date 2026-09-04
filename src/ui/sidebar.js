/**
 * AirForge Studio — Sidebar UI Controller
 * Premium sidebar with undo/redo, shape controls, build controls.
 */

import { inkCanvas } from "../ink/inkCanvas.js";
import { shapeHandler } from "../ink/shapes.js";
import { background } from "../ink/background.js";
import { simpleMode } from "./simpleMode.js";
import { gestureHandler } from "../ink/gestureHandler.js";

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
      <div class="section-label">Shape & Text</div>
      <div class="shape-grid" style="grid-template-columns: repeat(3, 1fr);">
        <button class="shape-btn active" data-shape="FREE">🖊️ Free</button>
        <button class="shape-btn" data-shape="LINE">📏 Line</button>
        <button class="shape-btn" data-shape="CIRCLE">⭕ Circle</button>
        <button class="shape-btn" data-shape="RECTANGLE">⬜ Rect</button>
        <button class="shape-btn" id="btn-text-tool" data-shape="TEXT" style="grid-column: span 2; border-color: rgba(56,189,248,0.35); color: #38bdf8;">🔤 Neon Text</button>
      </div>

      <div class="section-label" style="margin-top: 12px;">Pen Trigger</div>
      <div class="shape-grid" style="grid-template-columns: 1fr 1fr;">
        <button class="trigger-btn active" data-trigger="PINCH" title="Pinch thumb & index to write, release to lift pen">🤏 Air-Pen</button>
        <button class="trigger-btn" data-trigger="POINT" title="Point index finger to draw continuously">☝️ Laser</button>
      </div>

      <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; color: #94a3b8;">
        <span>✨ Smart Script Smoothing</span>
        <input type="checkbox" id="toggle-beautify" checked style="accent-color: #06b6d4; cursor: pointer; width: 15px; height: 15px;" />
      </div>
    `;
    content.appendChild(section);

    this.shapeBtns = section.querySelectorAll(".shape-btn");
    this.shapeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.shape === "TEXT") {
          this._openTextModal();
          return;
        }
        this.shapeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        shapeHandler.setMode(btn.dataset.shape);
      });
    });

    const triggerBtns = section.querySelectorAll(".trigger-btn");
    triggerBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        triggerBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        gestureHandler.setPenTrigger(btn.dataset.trigger);
      });
    });

    const beautifyCheckbox = section.querySelector("#toggle-beautify");
    if (beautifyCheckbox) {
      beautifyCheckbox.addEventListener("change", (e) => {
        inkCanvas.autoBeautify = e.target.checked;
      });
    }
  }

  _openTextModal() {
    let modal = document.getElementById("neon-text-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "neon-text-modal";
      modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(2, 6, 23, 0.78);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        display: flex; align-items: center; justify-content: center;
        z-index: 1000;
      `;
      modal.innerHTML = `
        <div style="
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(6, 182, 212, 0.4);
          box-shadow: 0 0 40px rgba(6, 182, 212, 0.25);
          border-radius: 16px;
          padding: 24px 28px;
          max-width: 380px;
          width: 90%;
          text-align: center;
          font-family: 'Inter', system-ui, sans-serif;
          color: #f8fafc;
        ">
          <div style="font-size: 20px; font-weight: 700; margin-bottom: 6px; color: #38bdf8;">🔤 Neon Typography</div>
          <div style="font-size: 13px; color: #94a3b8; margin-bottom: 18px;">Type your name or title to place glowing text:</div>
          <input type="text" id="neon-modal-input" placeholder="e.g. Sumanth" value="Sumanth" style="
            width: 100%;
            box-sizing: border-box;
            background: rgba(2, 6, 23, 0.85);
            border: 1px solid rgba(56, 189, 248, 0.4);
            border-radius: 8px;
            padding: 11px 14px;
            color: #ffffff;
            font-size: 17px;
            font-weight: 600;
            outline: none;
            margin-bottom: 18px;
            text-align: center;
          " />
          <div style="display: flex; gap: 10px;">
            <button id="neon-modal-cancel" style="
              flex: 1;
              background: rgba(51, 65, 85, 0.6);
              border: 1px solid rgba(148, 163, 184, 0.2);
              border-radius: 8px;
              color: #cbd5e1;
              padding: 10px;
              font-weight: 600;
              cursor: pointer;
            ">Cancel</button>
            <button id="neon-modal-confirm" style="
              flex: 1;
              background: linear-gradient(135deg, #06b6d4, #3b82f6);
              border: none;
              border-radius: 8px;
              color: #ffffff;
              padding: 10px;
              font-weight: 600;
              cursor: pointer;
              box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
            ">Insert Text</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const cancelBtn = modal.querySelector("#neon-modal-cancel");
      const confirmBtn = modal.querySelector("#neon-modal-confirm");
      const input = modal.querySelector("#neon-modal-input");

      cancelBtn.addEventListener("click", () => {
        modal.style.display = "none";
      });

      const doInsert = () => {
        const txt = input.value.trim();
        if (txt) {
          inkCanvas.addText(txt, 0.5, 0.35, 48);
        }
        modal.style.display = "none";
      };

      confirmBtn.addEventListener("click", doInsert);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") doInsert();
        if (e.key === "Escape") modal.style.display = "none";
      });
    }

    modal.style.display = "flex";
    const input = modal.querySelector("#neon-modal-input");
    if (input) {
      input.focus();
      input.select();
    }
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
