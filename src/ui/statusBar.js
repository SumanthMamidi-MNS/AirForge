/**
 * AirForge Studio — Status Bar UI
 * Shows current tracking state at bottom center of screen.
 */

import { STATUS } from "../constants.js";

class StatusBar {
  constructor() {
    this.element = document.getElementById("status-bar");
    this._currentState = "initializing";
  }

  /**
   * Update the status bar text and style.
   * @param {'initializing'|'hand-lost'|'hand-detected'|'two-hands'} state
   */
  setState(state) {
    if (state === this._currentState) return; // No change
    this._currentState = state;

    // Remove all state classes
    this.element.classList.remove("hand-lost", "hand-detected");

    switch (state) {
      case "initializing":
        this.element.textContent = STATUS.INITIALIZING_MSG;
        this.element.classList.add("hand-lost");
        break;

      case "hand-lost":
        this.element.textContent = STATUS.HAND_LOST_MSG;
        this.element.classList.add("hand-lost");
        break;

      case "hand-detected":
        this.element.textContent = STATUS.HAND_FOUND_MSG;
        this.element.classList.add("hand-detected");
        break;

      case "two-hands":
        this.element.textContent = STATUS.TWO_HANDS_MSG;
        this.element.classList.add("hand-detected");
        break;

      default:
        break;
    }
  }

  /**
   * Hide the status bar completely.
   */
  hide() {
    this.element.style.display = "none";
  }

  /**
   * Show the status bar.
   */
  show() {
    this.element.style.display = "";
  }
}

// Export a singleton instance
export const statusBar = new StatusBar();
