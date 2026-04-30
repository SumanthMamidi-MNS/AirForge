/**
 * AirForge Studio — Help Modal (Simplified Gesture Guide)
 * Only shows the 5 essential gestures. Beginner-friendly.
 */

class HelpModal {
  constructor() {
    this.visible = false;
    this.overlay = null;
    this._create();
  }

  _create() {
    this.overlay = document.createElement("div");
    this.overlay.id = "help-overlay";
    this.overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.82);backdrop-filter:blur(10px);
      -webkit-backdrop-filter:blur(10px);z-index:200;
      display:none;align-items:center;justify-content:center;
    `;
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.hide();
    });

    const card = document.createElement("div");
    card.style.cssText = `
      background:rgba(14,14,26,0.97);
      border:1px solid rgba(0,255,136,0.25);
      border-radius:20px;padding:32px;
      max-width:480px;width:90%;max-height:80vh;overflow-y:auto;
      color:#fff;font-family:'Segoe UI',system-ui,sans-serif;
      box-shadow:0 24px 64px rgba(0,0,0,0.7),0 0 40px rgba(0,255,136,0.08);
    `;

    const gestures = [
      {
        icon: "☝️",
        title: "Point Index Finger",
        desc: "Draw smooth neon lines. Works with Free, Line, Circle, and Rectangle modes.",
        color: "#00ff88",
      },
      {
        icon: "🤏",
        title: "Pinch (Thumb + Index)",
        desc: "Hold pinch near a stroke for <b>1 second</b> to select it. Then move your hand to drag. Open palm to drop.",
        color: "#00ff88",
      },
      {
        icon: "✋",
        title: "Open Palm",
        desc: "Stop drawing. Drop a moved stroke. Cancel any action.",
        color: "#00ff88",
      },
      {
        icon: "🤲",
        title: "Two Open Palms",
        desc: "<b>Build Space only:</b> Orbit the camera around the scene by moving both hands.",
        color: "#00d4ff",
      },
      {
        icon: "🖱️",
        title: "Mouse Scroll Wheel",
        desc: "<b>Build Space only:</b> Zoom in and out.",
        color: "#00d4ff",
      },
    ];

    const rows = gestures.map((g) => `
      <div style="display:flex;align-items:center;gap:14px;padding:12px 10px;
                  background:rgba(255,255,255,0.03);border-radius:10px;
                  border:1px solid rgba(255,255,255,0.05);">
        <span style="font-size:30px;flex-shrink:0;">${g.icon}</span>
        <div>
          <div style="font-weight:700;color:${g.color};margin-bottom:3px;">${g.title}</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.5;">${g.desc}</div>
        </div>
      </div>
    `).join("");

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
        <h2 style="margin:0;font-size:20px;letter-spacing:1px;
                   background:linear-gradient(135deg,#00ff88,#00d4ff);
                   -webkit-background-clip:text;background-clip:text;
                   -webkit-text-fill-color:transparent;">
          🎓 Gesture Guide
        </h2>
        <button id="help-close-btn" style="
          background:none;border:1px solid rgba(255,255,255,0.2);color:#fff;
          width:34px;height:34px;border-radius:50%;cursor:pointer;
          font-size:16px;transition:all 0.2s;display:flex;align-items:center;justify-content:center;
        ">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">${rows}</div>
      <div style="margin-top:20px;padding:12px;background:rgba(0,255,136,0.05);
                  border:1px solid rgba(0,255,136,0.15);border-radius:10px;
                  font-size:12px;color:rgba(255,255,255,0.45);text-align:center;">
        Use the sidebar buttons for Undo, Redo, Save, and Clear.
      </div>
    `;

    this.overlay.appendChild(card);
    document.body.appendChild(this.overlay);

    document.getElementById("help-close-btn").addEventListener("click", () => this.hide());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.visible) this.hide();
    });
  }

  show()   { this.overlay.style.display = "flex"; this.visible = true; }
  hide()   { this.overlay.style.display = "none"; this.visible = false; }
  toggle() { if (this.visible) this.hide(); else this.show(); }
}

export const helpModal = new HelpModal();
