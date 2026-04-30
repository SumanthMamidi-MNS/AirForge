/**
 * AirForge Studio — Grid Floor
 * A neon grid on the XZ plane for spatial reference.
 */

import * as THREE from "three";

class Grid {
  constructor(scene) {
    /** @type {THREE.GridHelper} */
    this.helper = null;

    /** @type {boolean} */
    this.visible = true;

    this._create(scene);
  }

  _create(scene) {
    const size = 20;
    const divisions = 20;

    // Main grid
    this.helper = new THREE.GridHelper(size, divisions, "#00ff88", "#1a3a2a");
    this.helper.position.y = 0.01; // Slightly above Y=0 to avoid z-fighting
    scene.add(this.helper);

    // Thin center cross
    const crossGeo = new THREE.BufferGeometry();
    const crossVerts = new Float32Array([
      -size,
      0.02,
      0,
      size,
      0.02,
      0,
      0,
      0.02,
      -size,
      0,
      0.02,
      size,
    ]);
    crossGeo.setAttribute("position", new THREE.BufferAttribute(crossVerts, 3));
    const crossLine = new THREE.LineSegments(
      crossGeo,
      new THREE.LineBasicMaterial({
        color: "#00ff88",
        transparent: true,
        opacity: 0.5,
      }),
    );
    scene.add(crossLine);
  }

  /**
   * Toggle grid visibility.
   */
  toggle() {
    this.visible = !this.visible;
    this.helper.visible = this.visible;
  }

  /**
   * Check if grid is visible.
   */
  isVisible() {
    return this.visible;
  }
}

export { Grid };
