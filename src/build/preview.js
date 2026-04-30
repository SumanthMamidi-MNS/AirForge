/**
 * AirForge Studio — Ghost Block Preview
 * Shows a semi-transparent ghost block at the placement position.
 */

import * as THREE from "three";

class GhostPreview {
  constructor(scene) {
    /** @type {THREE.Scene} */
    this.scene = scene;

    /** @type {THREE.Mesh|null} */
    this.mesh = null;

    /** @type {boolean} */
    this.visible = false;

    this._create();
  }

  _create() {
    const geometry = new THREE.BoxGeometry(0.94, 0.94, 0.94);
    const material = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#ffffff",
      emissiveIntensity: 0.6,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.visible = false;

    // Wireframe edges
    const edgeGeo = new THREE.EdgesGeometry(geometry);
    const edgeMat = new THREE.LineBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.7,
      depthTest: true,
      depthWrite: false,
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    this.mesh.add(edges);

    this.scene.add(this.mesh);
  }

  /**
   * Show the ghost preview at a position.
   * @param {THREE.Vector3} position
   */
  showAt(position) {
    if (!this.mesh) return;
    this.mesh.position.copy(position);
    this.mesh.visible = true;
    this.visible = true;
  }

  /**
   * Hide the ghost preview.
   */
  hide() {
    if (!this.mesh) return;
    this.mesh.visible = false;
    this.visible = false;
  }

  /**
   * Update preview color.
   * @param {string} colorHex
   */
  setColor(colorHex) {
    if (!this.mesh) return;
    this.mesh.material.color.set(colorHex);
    this.mesh.material.emissive.set(colorHex);
  }
}

export { GhostPreview };
