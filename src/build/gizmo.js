/**
 * AirForge Studio — 3D Axis Gizmo
 * Shows neon rings on the selected block (X=red, Y=green, Z=blue).
 */

import * as THREE from "three";

class Gizmo {
  constructor(scene) {
    /** @type {THREE.Scene} */
    this.scene = scene;

    /** @type {THREE.Group|null} */
    this.group = null;

    this._create();
  }

  _create() {
    this.group = new THREE.Group();
    this.group.visible = false;

    const ringRadius = 0.75;
    const tubeRadius = 0.03;
    const segments = 48;

    // X-axis ring (red) — in YZ plane
    const xRingGeo = new THREE.TorusGeometry(
      ringRadius,
      tubeRadius,
      16,
      segments,
    );
    const xRing = new THREE.Mesh(
      xRingGeo,
      new THREE.MeshStandardMaterial({
        color: "#ff4444",
        emissive: "#ff0000",
        emissiveIntensity: 0.8,
        roughness: 0.2,
      }),
    );
    xRing.rotation.y = Math.PI / 2; // Rotate to YZ plane
    this.group.add(xRing);

    // Y-axis ring (green) — in XZ plane
    const yRingGeo = new THREE.TorusGeometry(
      ringRadius,
      tubeRadius,
      16,
      segments,
    );
    const yRing = new THREE.Mesh(
      yRingGeo,
      new THREE.MeshStandardMaterial({
        color: "#44ff44",
        emissive: "#00ff00",
        emissiveIntensity: 0.8,
        roughness: 0.2,
      }),
    );
    yRing.rotation.x = Math.PI / 2; // Rotate to XZ plane
    this.group.add(yRing);

    // Z-axis ring (blue) — in XY plane
    const zRingGeo = new THREE.TorusGeometry(
      ringRadius,
      tubeRadius,
      16,
      segments,
    );
    const zRing = new THREE.Mesh(
      zRingGeo,
      new THREE.MeshStandardMaterial({
        color: "#4444ff",
        emissive: "#0000ff",
        emissiveIntensity: 0.8,
        roughness: 0.2,
      }),
    );
    // Already in XY plane by default
    this.group.add(zRing);

    this.scene.add(this.group);
  }

  /**
   * Show the gizmo at a block's position.
   * @param {THREE.Vector3} position
   */
  showAt(position) {
    if (!this.group) return;
    this.group.position.copy(position);
    this.group.visible = true;
  }

  /**
   * Hide the gizmo.
   */
  hide() {
    if (!this.group) return;
    this.group.visible = false;
  }
}

export { Gizmo };
