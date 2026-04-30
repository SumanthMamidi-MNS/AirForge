/**
 * AirForge Studio — Block Manager
 * Handles block creation, deletion, selection, coloring, undo and redo.
 */

import * as THREE from "three";
import { BRUSH } from "../constants.js";

// Grid unit size — one block = exactly 1 unit
const UNIT = 1;

class BlockManager {
  constructor(scene) {
    /** @type {THREE.Scene} */
    this.scene = scene;

    /** @type {Array<Object>} */
    this.blocks = [];

    /** @type {Array<Array<Object>>} */
    this.history = [];

    /** @type {Array<Array<Object>>} — redo stack, cleared on any new action */
    this.redoStack = [];

    /** @type {number} */
    this.maxHistory = 50;

    /** @type {Object|null} */
    this.selectedBlock = null;

    /** @type {string} */
    this.currentColor = BRUSH.COLORS[0];

    // Shared geometry (all cubes are same size)
    this.cubeGeometry = new THREE.BoxGeometry(
      UNIT * 0.94,
      UNIT * 0.94,
      UNIT * 0.94,
    );

    // Edge geometry for wireframe
    this.edgeGeometry = new THREE.EdgesGeometry(this.cubeGeometry);
  }

  /**
   * Snap a 3D position to the grid.
   * @param {THREE.Vector3} position
   * @returns {THREE.Vector3}
   */
  snapToGrid(position) {
    return new THREE.Vector3(
      Math.round(position.x / UNIT) * UNIT,
      Math.round(position.y / UNIT) * UNIT,
      Math.round(position.z / UNIT) * UNIT,
    );
  }

  /**
   * Snap to grid AND adjacent faces of existing blocks.
   * @param {THREE.Vector3} position
   * @returns {THREE.Vector3}
   */
  snapPosition(position) {
    // First snap to base grid
    let snapped = this.snapToGrid(position);

    // Check adjacent positions to existing blocks
    const offsets = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];

    // If position is close to an adjacent face, snap there
    // Simple implementation: just use grid snap for now
    // Face snapping can be refined in polish phase

    return snapped;
  }

  /**
   * Create a block material with neon-like emissive.
   * @param {string} colorHex
   * @returns {THREE.MeshStandardMaterial}
   */
  createMaterial(colorHex) {
    return new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.4,
      roughness: 0.3,
      metalness: 0.1,
    });
  }

  /**
   * Create edge material.
   * @param {string} colorHex
   * @returns {THREE.LineBasicMaterial}
   */
  createEdgeMaterial(colorHex) {
    return new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.5,
    });
  }

  /**
   * Place a block at the given position.
   * @param {THREE.Vector3} position
   * @param {string} color - optional, uses currentColor if not provided
   * @returns {Object} block data
   */
  placeBlock(position, color = null) {
    const blockColor = color || this.currentColor;
    const snapPos = this.snapPosition(position);

    this.saveHistory();

    // Create mesh
    const material = this.createMaterial(blockColor);
    const mesh = new THREE.Mesh(this.cubeGeometry, material);
    mesh.position.copy(snapPos);
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    // Create wireframe edges
    const edgeMat = this.createEdgeMaterial("#ffffff");
    const edges = new THREE.LineSegments(this.edgeGeometry, edgeMat);
    mesh.add(edges);

    this.scene.add(mesh);

    const blockData = {
      id: Date.now() + Math.random(),
      mesh,
      position: snapPos.clone(),
      color: blockColor,
      rotation: 0, // Y-axis rotation in degrees
    };

    this.blocks.push(blockData);
    return blockData;
  }

  /**
   * Remove a block by its data object.
   * @param {Object} blockData
   */
  removeBlock(blockData) {
    this.saveHistory();
    this.scene.remove(blockData.mesh);
    // Dispose materials
    blockData.mesh.material.dispose();
    blockData.mesh.children[0]?.material?.dispose();
    this.blocks = this.blocks.filter((b) => b.id !== blockData.id);
    if (this.selectedBlock === blockData) {
      this.selectedBlock = null;
    }
  }

  /**
   * Rotate a block by 45° around Y-axis.
   * @param {Object} blockData
   */
  rotateBlock(blockData) {
    this.saveHistory();
    blockData.rotation = (blockData.rotation + 45) % 360;
    blockData.mesh.rotation.y = THREE.MathUtils.degToRad(blockData.rotation);
  }

  /**
   * Find the nearest block to a 3D position.
   * @param {THREE.Vector3} position
   * @param {number} maxDistance
   * @returns {Object|null}
   */
  findNearestBlock(position, maxDistance = 1.5) {
    let nearest = null;
    let minDist = maxDistance;

    for (const block of this.blocks) {
      const dist = block.position.distanceTo(position);
      if (dist < minDist) {
        minDist = dist;
        nearest = block;
      }
    }

    return nearest;
  }

  /**
   * Select a block.
   * @param {Object|null} blockData
   */
  selectBlock(blockData) {
    // Deselect previous
    if (this.selectedBlock && this.selectedBlock !== blockData) {
      this.selectedBlock.mesh.children[0].material.color.set("#ffffff");
      this.selectedBlock.mesh.children[0].material.opacity = 0.5;
    }

    this.selectedBlock = blockData;

    if (blockData) {
      // Highlight edges
      blockData.mesh.children[0].material.color.set("#ffff00");
      blockData.mesh.children[0].material.opacity = 1;
    }
  }

  /**
   * Get the selected block.
   */
  getSelected() {
    return this.selectedBlock;
  }

  /**
   * Set current block color.
   * @param {string} color
   */
  setColor(color) {
    this.currentColor = color;
  }

  /**
   * Save current state to history.
   */
  saveHistory() {
    const snapshot = this.blocks.map((b) => ({
      id: b.id,
      position: b.position.clone(),
      color: b.color,
      rotation: b.rotation,
    }));
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) this.history.shift();
    // Any new action breaks the redo chain
    this.redoStack = [];
  }

  /**
   * Undo last action.
   * @returns {boolean}
   */
  undo() {
    if (this.history.length === 0) return false;

    // Save current blocks to redo stack before restoring
    const currentSnap = this.blocks.map((b) => ({
      id: b.id,
      position: b.position.clone(),
      color: b.color,
      rotation: b.rotation,
    }));
    this.redoStack.push(currentSnap);

    // Remove current blocks from scene
    this.blocks.forEach((b) => {
      this.scene.remove(b.mesh);
      b.mesh.material?.dispose();
      b.mesh.children[0]?.material?.dispose();
    });

    // Restore from history
    const snapshot = this.history.pop();
    this.blocks = [];
    this._restoreSnapshot(snapshot);
    this.selectedBlock = null;
    return true;
  }

  /**
   * Redo last undone action.
   * @returns {boolean}
   */
  redo() {
    if (this.redoStack.length === 0) return false;

    // Save current state to history before redoing
    const currentSnap = this.blocks.map((b) => ({
      id: b.id,
      position: b.position.clone(),
      color: b.color,
      rotation: b.rotation,
    }));
    this.history.push(currentSnap);

    // Remove current blocks from scene
    this.blocks.forEach((b) => {
      this.scene.remove(b.mesh);
      b.mesh.material?.dispose();
      b.mesh.children[0]?.material?.dispose();
    });

    // Restore from redo stack
    const snapshot = this.redoStack.pop();
    this.blocks = [];
    this._restoreSnapshot(snapshot);
    this.selectedBlock = null;
    return true;
  }

  /**
   * Internal: rebuild meshes from a snapshot array.
   * @param {Array} snapshot
   */
  _restoreSnapshot(snapshot) {
    snapshot.forEach((data) => {
      const material = this.createMaterial(data.color);
      const mesh = new THREE.Mesh(this.cubeGeometry, material);
      mesh.position.copy(data.position);
      mesh.rotation.y = THREE.MathUtils.degToRad(data.rotation);

      const edgeMat = this.createEdgeMaterial("#ffffff");
      const edges = new THREE.LineSegments(this.edgeGeometry, edgeMat);
      mesh.add(edges);

      this.scene.add(mesh);

      this.blocks.push({
        id: data.id,
        mesh,
        position: data.position.clone(),
        color: data.color,
        rotation: data.rotation,
      });
    });
  }

  /**
   * Clear all blocks.
   */
  clearAll() {
    this.saveHistory();
    this.blocks.forEach((b) => {
      this.scene.remove(b.mesh);
      b.mesh.material?.dispose();
      b.mesh.children[0]?.material?.dispose();
    });
    this.blocks = [];
    this.selectedBlock = null;
  }

  /**
   * Get all blocks.
   */
  getAll() {
    return this.blocks;
  }
}

export { BlockManager };
