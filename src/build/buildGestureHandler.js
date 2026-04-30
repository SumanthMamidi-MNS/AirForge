/**
 * AirForge Studio — Build Space Gesture Handler (Simplified)
 *
 * 🤏 PINCH         → Show ghost block preview
 * ✋ OPEN_PALM     → Place block (if previewing) / cancel
 * 🤲 TWO PALMS    → Orbit camera
 * 🖱️ SCROLL        → Zoom (handled in main.js)
 *
 * Removed: THREE_FINGERS, THREE_FINGER_PINCH, PEACE rotation.
 * Added: placement debounce (prevents accidental multi-placement).
 */

const State = {
  IDLE: "IDLE",
  PINCH_PREVIEWING: "PINCH_PREVIEWING",
  TWO_HAND_ORBIT: "TWO_HAND_ORBIT",
  PLACED: "PLACED", // debounce state after placing
};

const PLACE_COOLDOWN_MS = 600; // prevent duplicate placement

class BuildGestureHandler {
  constructor(buildScene, blockManager, ghostPreview, orbit, gizmo) {
    this.buildScene = buildScene;
    this.blockManager = blockManager;
    this.ghostPreview = ghostPreview;
    this.orbit = orbit;
    this.gizmo = gizmo;

    this.state = State.IDLE;
    this._lastPlaceTime = 0;
    this._pinchActive = false; // track if current pinch is a fresh gesture
  }

  processGestures(hands) {
    if (hands.length === 2) return this._handleTwoHands(hands);
    if (hands.length === 1) return this._handleOneHand(hands[0]);
    return this._handleNoHands();
  }

  // ─── Two-hand orbit ────────────────────────

  _handleTwoHands(hands) {
    const g0 = hands[0].gesture;
    const g1 = hands[1].gesture;

    if (g0.type === "OPEN_PALM" && g1.type === "OPEN_PALM") {
      const midX = (g0.wrist.x + g1.wrist.x) / 2;
      const midY = (g0.wrist.y + g1.wrist.y) / 2;

      if (this.state !== State.TWO_HAND_ORBIT) {
        this.orbit.start(midX, midY);
        this.ghostPreview.hide();
        this.gizmo.hide();
        this.blockManager.selectBlock(null);
        this.state = State.TWO_HAND_ORBIT;
      }

      this.orbit.update(midX, midY);
      return { action: "orbiting", message: "🤲 Two-hand orbit — move to rotate view" };
    }

    if (this.state === State.TWO_HAND_ORBIT) {
      this.orbit.stop();
      this.state = State.IDLE;
    }

    return { action: "idle", message: "" };
  }

  // ─── Single hand ───────────────────────────

  _handleOneHand(hand) {
    const gesture = hand.gesture;

    if (this.state === State.TWO_HAND_ORBIT) {
      this.orbit.stop();
      this.state = State.IDLE;
    }

    switch (gesture.type) {
      case "PINCH":
      case "PINCH_INDEX":
        return this._handlePinch(gesture);

      case "OPEN_PALM":
        return this._handleOpenPalm();

      default:
        // Any other gesture (POINT, IDLE) cancels preview
        return this._handleIdle();
    }
  }

  // ─── Pinch → show ghost preview ────────────

  _handlePinch(gesture) {
    if (!gesture.pinchMidpoint) return { action: "idle", message: "" };

    // Debounce: don't allow new preview immediately after placing
    const now = performance.now();
    if (now - this._lastPlaceTime < PLACE_COOLDOWN_MS) {
      return { action: "idle", message: "" };
    }

    const hitPoint = this.buildScene.raycastToGrid(
      gesture.pinchMidpoint.x,
      gesture.pinchMidpoint.y,
    );

    if (hitPoint) {
      const snapPos = this.blockManager.snapPosition(hitPoint);
      this.ghostPreview.showAt(snapPos);
      this.ghostPreview.setColor(this.blockManager.currentColor);
      this.state = State.PINCH_PREVIEWING;
      return { action: "previewing", message: "🤏 Ghost preview — open palm to place" };
    }

    return { action: "previewing", message: "🤏 Point at the grid to place" };
  }

  // ─── Open palm → place block ────────────────

  _handleOpenPalm() {
    if (this.state === State.PINCH_PREVIEWING && this.ghostPreview.visible) {
      const now = performance.now();
      // Guard: only place once per open-palm event (debounce)
      if (now - this._lastPlaceTime < PLACE_COOLDOWN_MS) {
        this.ghostPreview.hide();
        this.state = State.IDLE;
        return { action: "idle", message: "" };
      }

      const pos = this.ghostPreview.mesh.position.clone();
      this.blockManager.placeBlock(pos);
      this.ghostPreview.hide();
      this._lastPlaceTime = now;
      this.state = State.IDLE;
      return { action: "placed", message: "🧊 Block placed!" };
    }

    this.ghostPreview.hide();
    this.gizmo.hide();
    this.blockManager.selectBlock(null);
    this.state = State.IDLE;
    return { action: "idle", message: "✋ Ready" };
  }

  // ─── Idle / cleanup ────────────────────────

  _handleIdle() {
    if (this.state === State.PINCH_PREVIEWING) {
      this.ghostPreview.hide();
    }
    this.state = State.IDLE;
    return { action: "idle", message: "" };
  }

  _handleNoHands() {
    this.ghostPreview.hide();
    this.orbit.stop();
    this.gizmo.hide();
    this.blockManager.selectBlock(null);
    this.state = State.IDLE;
    return { action: "idle", message: "" };
  }

  reset() {
    this.ghostPreview.hide();
    this.orbit.stop();
    this.gizmo.hide();
    this.blockManager.selectBlock(null);
    this.state = State.IDLE;
  }
}

export { BuildGestureHandler };
