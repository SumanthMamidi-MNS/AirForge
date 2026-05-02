/**
 * AirForge Studio — Two-Hand Orbit Controller
 * Uses the midpoint of two hands and their movement delta to orbit the camera.
 */

import * as THREE from "three";

class TwoHandOrbit {
  constructor(camera) {
    /** @type {THREE.Camera} */
    this.camera = camera;

    /** @type {THREE.Vector2} */
    this.previousMidpoint = null;

    /** @type {boolean} */
    this.active = false;

    /** Sensitivity */
    this.rotateSpeed = 3.0;

    /** Target point (orbit center) */
    this.target = new THREE.Vector3(0, 0, 0);
  }

  /**
   * Start orbiting — record initial midpoint.
   * @param {number} normX - midpoint normalized X
   * @param {number} normY - midpoint normalized Y
   */
  start(normX, normY) {
    this.previousMidpoint = new THREE.Vector2(normX, normY);
    this.active = true;
  }

  /**
   * Update orbit based on new midpoint.
   * @param {number} normX
   * @param {number} normY
   */
  update(normX, normY) {
    if (!this.active || !this.previousMidpoint) return;

    const currentMidpoint = new THREE.Vector2(normX, normY);
    const delta = new THREE.Vector2(
      currentMidpoint.x - this.previousMidpoint.x,
      currentMidpoint.y - this.previousMidpoint.y,
    );

    if (Math.abs(delta.x) < 0.001 && Math.abs(delta.y) < 0.001) return;

    // Convert delta to spherical coordinates
    const spherical = new THREE.Spherical();
    const offset = new THREE.Vector3()
      .copy(this.camera.position)
      .sub(this.target);
    spherical.setFromVector3(offset);

    // Apply rotation.
    // theta: += because the webcam is CSS-mirrored (scaleX(-1)).
    //   Moving the hand RIGHT on screen → normX decreases → delta.x < 0
    //   += (negative) decreases theta → camera moves right → scene rotates right ✅
    // phi: unchanged — Y axis is never mirrored.
    spherical.theta += delta.x * this.rotateSpeed;
    spherical.phi   -= delta.y * this.rotateSpeed;

    // Clamp phi to avoid flipping
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

    // Convert back
    offset.setFromSpherical(spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);

    this.previousMidpoint.copy(currentMidpoint);
  }

  /**
   * Stop orbiting.
   */
  stop() {
    this.active = false;
    this.previousMidpoint = null;
  }

  /**
   * Check if orbiting is active.
   */
  isActive() {
    return this.active;
  }
}

export { TwoHandOrbit };
