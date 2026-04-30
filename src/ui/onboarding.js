/**
 * AirForge Studio — First-Time Onboarding
 * Shows a gentle welcome card on first visit.
 * Dismissed permanently via localStorage.
 */

class Onboarding {
  constructor(helpModal) {
    this.helpModal = helpModal;
    this.storageKey = "airforge-onboarding-seen";
    this.card = null;
  }

  /**
   * Check if this is the user's first visit.
   * If yes, show the welcome card.
   */
  check() {
    const seen = localStorage.getItem(this.storageKey);
    if (seen === "true") return;

    // First visit — show card after a short delay
    setTimeout(() => this._show(), 1500);
  }

  _show() {
    this.card = document.createElement("div");
    this.card.id = "onboarding-card";
    this.card.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(20, 20, 35, 0.95);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(0, 255, 136, 0.4);
      border-radius: 16px;
      padding: 24px 28px;
      max-width: 380px;
      width: 90%;
      z-index: 150;
      color: #ffffff;
      font-family: 'Segoe UI', system-ui, sans-serif;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 30px rgba(0,255,136,0.1);
      animation: onboarding-in 0.5s ease;
      text-align: center;
    `;

    this.card.innerHTML = `
      <div style="font-size: 36px; margin-bottom: 12px;">🎨🧊</div>
      <h3 style="margin: 0 0 8px; font-size: 18px; letter-spacing: 0.5px;">
        Welcome to AirForge Studio
      </h3>
      <p style="margin: 0 0 16px; font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5;">
        Draw in 2D and build in 3D — all with hand gestures.<br>
        No mouse, no stylus, just your hands.
      </p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="onboarding-guide-btn" style="
          padding: 10px 20px;
          border: 1px solid rgba(0,255,136,0.4);
          border-radius: 10px;
          background: rgba(0,255,136,0.15);
          color: #00ff88;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s;
        ">📖 See Gesture Guide</button>
        <button id="onboarding-dismiss-btn" style="
          padding: 10px 20px;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          color: #fff;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s;
        ">👍 Got it!</button>
      </div>
    `;

    // Add animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes onboarding-in {
        from { opacity: 0; transform: translateX(-50%) translateY(30px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(this.card);

    // Button events
    document
      .getElementById("onboarding-guide-btn")
      .addEventListener("click", () => {
        this.helpModal.show();
        this._dismiss();
      });

    document
      .getElementById("onboarding-dismiss-btn")
      .addEventListener("click", () => {
        this._dismiss();
      });
  }

  _dismiss() {
    localStorage.setItem(this.storageKey, "true");
    if (this.card) {
      this.card.style.opacity = "0";
      this.card.style.transition = "opacity 0.3s ease";
      setTimeout(() => {
        if (this.card) this.card.remove();
        this.card = null;
      }, 300);
    }
  }
}

export { Onboarding };
