/**
 * AirForge Studio — Build Space Scene Manager
 * Raycast uses DIRECT coordinates to match hand position on screen.
 */

import * as THREE from "three";

class BuildScene {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.canvas = null;
    this.active = false;

    this._init();
  }

  _init() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "build-canvas";
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 3;
      display: none;
      pointer-events: auto;
    `;
    document.body.appendChild(this.canvas);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#0a0a0a");
    this.scene.fog = new THREE.Fog("#0a0a0a", 10, 50);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    // Top-down starting view — camera above the scene looking straight down.
    // Tiny Z offset (0.01) prevents gimbal lock when position is on the Y axis.
    this.camera.position.set(0, 14, 0.01);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, // required for screenshot / toDataURL()
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambientLight = new THREE.AmbientLight("#404060", 1.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight("#ffffff", 1.2);
    directionalLight.position.set(10, 15, 10);
    this.scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight("#8888ff", 0.6);
    fillLight.position.set(-5, 2, -5);
    this.scene.add(fillLight);

    window.addEventListener("resize", () => this._resize());
  }

  _resize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  show() {
    this.canvas.style.display = "block";
    this.active = true;
  }

  hide() {
    this.canvas.style.display = "none";
    this.active = false;
  }

  render() {
    if (!this.active) return;
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Capture the current 3D scene as a PNG data URL.
   * preserveDrawingBuffer must be true for this to work.
   * @returns {string} data URL
   */
  screenshot() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const origRatio = this.renderer.getPixelRatio();

    // Temporarily boost to 2x for high-quality export
    const exportRatio = Math.max(2, origRatio);
    this.renderer.setPixelRatio(exportRatio);
    this.renderer.setSize(w, h);
    this.renderer.render(this.scene, this.camera);

    const dataURL = this.canvas.toDataURL("image/png");

    // Restore original render settings
    this.renderer.setPixelRatio(origRatio);
    this.renderer.setSize(w, h);

    return dataURL;
  }

  getCamera() {
    return this.camera;
  }

  getScene() {
    return this.scene;
  }

  getCanvas() {
    return this.canvas;
  }

  raycastToGrid(normX, normY) {
    // Mirror X to match webcam scaleX(-1)
    const mirroredX = 1 - normX;
    const mouse = new THREE.Vector2(mirroredX * 2 - 1, -(normY * 2) + 1);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(plane, intersection);

    return hit ? intersection : null;
  }
}

export const buildScene = new BuildScene();
