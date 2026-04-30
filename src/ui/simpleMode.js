/**
 * AirForge Studio — Simple Mode Toggle
 * Hides advanced controls from the sidebar for a cleaner UI.
 */

class SimpleMode {
  constructor() {
    /** @type {boolean} */
    this.enabled = false;
  }

  /**
   * Toggle simple mode on/off.
   * @returns {boolean} new state
   */
  toggle() {
    this.enabled = !this.enabled;
    this._apply();
    return this.enabled;
  }

  /**
   * Set simple mode explicitly.
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this._apply();
  }

  /**
   * Apply visibility to advanced sections.
   * Queries DOM each time (always fresh).
   */
  _apply() {
    const sections = document.querySelectorAll('[data-advanced="true"]');
    sections.forEach((section) => {
      section.style.display = this.enabled ? "none" : "";
    });

    const btn = document.getElementById("btn-simple-mode");
    if (btn) {
      btn.textContent = this.enabled
        ? "🔰 Simple Mode: ON"
        : "🔰 Simple Mode: OFF";
    }
  }

  /**
   * Check if simple mode is active.
   */
  isEnabled() {
    return this.enabled;
  }
}

export const simpleMode = new SimpleMode();
