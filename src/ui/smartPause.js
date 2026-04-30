/**
 * AirForge Studio — Smart Pause (Arm Rest Detection)
 * Detects when the user's hand drops below shoulder level for 2+ seconds.
 * Shows an overlay and pauses drawing.
 */

class SmartPause {
  constructor() {
    /** Time when hand dropped below threshold */
    this.dropStartTime = 0;

    /** Is currently paused */
    this.paused = false;

    /** Threshold: hand below this fraction of screen height = resting */
    this.threshold = 0.85; // 85% from top = bottom 15% of screen

    /** How long hand must be below threshold to trigger pause (ms) */
    this.pauseDelay = 2000;

    /** Callback when pause state changes */
    this.onChange = null;

    /** Overlay element */
    this.overlay = this._createOverlay();
  }

  _createOverlay() {
    const div = document.createElement("div");
    div.id = "smart-pause-overlay";
    div.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 75;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    `;
    div.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">⏸️</div>
      <div style="font-size: 20px; color: #ffffff; font-weight: 600; letter-spacing: 2px;">
        Arm Rest — Drawing Paused
      </div>
      <div style="font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 8px;">
        Raise your hand to continue
      </div>
    `;
    document.body.appendChild(div);
    return div;
  }

  /**
   * Update pause state based on hand Y position.
   * Call this every frame with the wrist Y coordinate.
   *
   * @param {number} wristY - normalized Y of wrist landmark (0=top, 1=bottom)
   * @param {boolean} handPresent - is a hand detected
   */
  update(wristY, handPresent) {
    const now = performance.now();

    if (!handPresent) {
      // No hand — reset timer, unpause
      this.dropStartTime = 0;
      if (this.paused) {
        this.paused = false;
        this.overlay.style.display = "none";
        if (this.onChange) this.onChange(false);
      }
      return;
    }

    // Check if hand is below threshold
    const isResting = wristY > this.threshold;

    if (isResting && !this.paused) {
      // Hand is resting — start timer if not started
      if (this.dropStartTime === 0) {
        this.dropStartTime = now;
      }

      // Check if timer exceeded delay
      if (now - this.dropStartTime >= this.pauseDelay) {
        this.paused = true;
        this.overlay.style.display = "flex";
        if (this.onChange) this.onChange(true);
      }
    } else if (!isResting) {
      // Hand raised — reset timer
      this.dropStartTime = 0;
      if (this.paused) {
        this.paused = false;
        this.overlay.style.display = "none";
        if (this.onChange) this.onChange(false);
      }
    }
  }

  /**
   * Check if currently paused.
   */
  isPaused() {
    return this.paused;
  }

  /**
   * Manually resume.
   */
  resume() {
    this.dropStartTime = 0;
    this.paused = false;
    this.overlay.style.display = "none";
    if (this.onChange) this.onChange(false);
  }
}

export const smartPause = new SmartPause();
