/**
 * AirForge Studio — Main Entry Point
 * Phase 4: Dual-mode (Ink Space + Build Space) with all polish
 */

import * as THREE from "three";

import { SKELETON, FPS, BRUSH } from "./constants.js";
import { startCamera, initHands } from "./camera.js";
import { toPixelCoords, toScreenNormCoords } from "./gestures/landmarks.js";
import { detectGesture } from "./gestures/detector.js";
import { inkCanvas } from "./ink/inkCanvas.js";
import { gestureHandler } from "./ink/gestureHandler.js";
import { sidebar } from "./ui/sidebar.js";
import { statusBar } from "./ui/statusBar.js";
import { helpModal } from "./ui/helpModal.js";
import { Onboarding } from "./ui/onboarding.js";

import { buildScene } from "./build/buildScene.js";
import { Grid } from "./build/grid.js";
import { BlockManager } from "./build/blocks.js";
import { GhostPreview } from "./build/preview.js";
import { ViewCube } from "./build/viewcube.js";
import { Gizmo } from "./build/gizmo.js";
import { TwoHandOrbit } from "./build/orbit.js";
import { BuildGestureHandler } from "./build/buildGestureHandler.js";

// ─── DOM Elements ──────────────────────────
const video = document.getElementById("webcam-video");
const skeletonCanvas = document.getElementById("skeleton-canvas");
const skeletonCtx = skeletonCanvas.getContext("2d");
const fpsElement = document.getElementById("fps-counter");
const loadingOverlay = document.getElementById("loading-overlay");

// ─── State ─────────────────────────────────
let handsInstance = null;
let latestHandData = [];
let frameTimestamps = [];
let currentHandCount = 0;
let gestureActionMessage = "";
let currentMode = "ink";

let grid = null;
let blockManager = null;
let ghostPreview = null;
let viewcube = null;
let gizmo = null;
let twoHandOrbit = null;
let buildGestureHandler = null;
let buildInitialized = false;

// ─── Canvas Resize ─────────────────────────
function resizeSkeletonCanvas() {
  skeletonCanvas.width = window.innerWidth;
  skeletonCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeSkeletonCanvas);
resizeSkeletonCanvas();

// ─── FPS Calculation ───────────────────────
function updateFPS(now) {
  frameTimestamps.push(now);
  while (frameTimestamps.length > 0 && frameTimestamps[0] < now - 1000) {
    frameTimestamps.shift();
  }
  if (frameTimestamps.length > 1) {
    const elapsed =
      frameTimestamps[frameTimestamps.length - 1] - frameTimestamps[0];
    const fps = Math.round((frameTimestamps.length - 1) / (elapsed / 1000));
    fpsElement.textContent = `FPS: ${fps}`;
  }
}

/**
 * Filter out false positives (e.g., mouth, nose, mustache, or tiny background noise).
 * A genuine hand interacting with the webcam has a minimum bounding box and palm span.
 */
function isValidHand(rawLandmarks, score = 1.0) {
  if (score < 0.7) return false;

  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  for (let i = 0; i < rawLandmarks.length; i++) {
    const lm = rawLandmarks[i];
    if (lm.x < minX) minX = lm.x;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.y > maxY) maxY = lm.y;
  }
  const w = maxX - minX;
  const h = maxY - minY;

  // Real interacting hand spans at least 8% of camera width or height
  if (w < 0.08 && h < 0.08) return false;

  // Anatomical check: wrist to middle knuckle span
  const wrist = rawLandmarks[0];
  const middleMcp = rawLandmarks[9];
  const palmSpan = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y);
  if (palmSpan < 0.04) return false;

  return true;
}

// ─── MediaPipe Results Callback ────────────
function onHandResults(results) {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const videoW = video.videoWidth || 1280;
    const videoH = video.videoHeight || 720;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const validHands = [];
    results.multiHandLandmarks.forEach((landmarks, i) => {
      const score = results.multiHandedness?.[i]?.score ?? 1.0;
      if (!isValidHand(landmarks, score)) return;

      // Map raw video coordinates to screen coordinates compensating for object-fit: cover
      const screenLandmarks = landmarks.map((lm) =>
        toScreenNormCoords(lm, screenW, screenH, videoW, videoH),
      );

      validHands.push({
        handIndex: validHands.length,
        landmarks: screenLandmarks,
        rawLandmarks: landmarks,
        handedness: results.multiHandedness?.[i]?.label || "Unknown",
      });
    });

    latestHandData = validHands;
  } else {
    latestHandData = [];
  }

  if (latestHandData.length > 0) {
    if (currentMode === "ink") {
      const gesture = detectGesture(latestHandData[0].landmarks);
      const result = gestureHandler.processGesture(gesture);
      if (result.message) gestureActionMessage = result.message;
    } else if (currentMode === "build" && buildGestureHandler) {
      const hands = latestHandData.map((h) => ({
        gesture: detectGesture(h.landmarks),
        handData: h,
      }));
      const result = buildGestureHandler.processGestures(hands);
      if (result.message) gestureActionMessage = result.message;
    }
  } else {
    if (currentMode === "ink") {
      gestureHandler.reset();
    } else if (buildGestureHandler) {
      buildGestureHandler.reset();
    }
    gestureActionMessage = "";
  }
}

// ─── Draw Skeleton ─────────────────────────
function drawSkeleton(hands) {
  skeletonCtx.clearRect(0, 0, skeletonCanvas.width, skeletonCanvas.height);
  skeletonCtx.save();
  skeletonCtx.translate(skeletonCanvas.width, 0);
  skeletonCtx.scale(-1, 1);

  hands.forEach((hand, handIndex) => {
    const colorScheme = SKELETON.COLORS[handIndex] || SKELETON.COLORS[0];
    const landmarks = hand.landmarks;
    skeletonCtx.save();
    skeletonCtx.shadowColor = SKELETON.GLOW_COLOR;
    skeletonCtx.shadowBlur = SKELETON.GLOW_BLUR;

    SKELETON.CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = toPixelCoords(
        landmarks[startIdx],
        skeletonCanvas.width,
        skeletonCanvas.height,
      );
      const end = toPixelCoords(
        landmarks[endIdx],
        skeletonCanvas.width,
        skeletonCanvas.height,
      );
      skeletonCtx.beginPath();
      skeletonCtx.moveTo(start.x, start.y);
      skeletonCtx.lineTo(end.x, end.y);
      skeletonCtx.strokeStyle = colorScheme.line;
      skeletonCtx.lineWidth = SKELETON.LINE_WIDTH;
      skeletonCtx.lineCap = "round";
      skeletonCtx.stroke();
    });

    landmarks.forEach((landmark) => {
      const pos = toPixelCoords(
        landmark,
        skeletonCanvas.width,
        skeletonCanvas.height,
      );
      skeletonCtx.beginPath();
      skeletonCtx.arc(pos.x, pos.y, SKELETON.NODE_RADIUS, 0, Math.PI * 2);
      skeletonCtx.fillStyle = colorScheme.node;
      skeletonCtx.fill();
    });
    skeletonCtx.restore();
  });

  // Precision hover reticle for Ink Space
  if (currentMode === "ink" && hands.length > 0 && hands[0]?.landmarks?.[8]) {
    const tip = toPixelCoords(hands[0].landmarks[8], skeletonCanvas.width, skeletonCanvas.height);
    const color = inkCanvas.currentColor || "#00ff88";

    skeletonCtx.save();
    skeletonCtx.translate(skeletonCanvas.width, 0);
    skeletonCtx.scale(-1, 1);

    // Outer neon ring
    skeletonCtx.beginPath();
    skeletonCtx.arc(tip.x, tip.y, 8, 0, Math.PI * 2);
    skeletonCtx.strokeStyle = color;
    skeletonCtx.lineWidth = 2;
    skeletonCtx.shadowColor = color;
    skeletonCtx.shadowBlur = 12;
    skeletonCtx.stroke();

    // Center bright dot
    skeletonCtx.beginPath();
    skeletonCtx.arc(tip.x, tip.y, 2.5, 0, Math.PI * 2);
    skeletonCtx.fillStyle = "#ffffff";
    skeletonCtx.fill();

    skeletonCtx.shadowBlur = 0;
    skeletonCtx.restore();
  }

  skeletonCtx.restore();
}

// ─── Status Bar Update ─────────────────────
function updateStatus(handCount) {
  if (handCount !== currentHandCount) {
    currentHandCount = handCount;
    if (handCount === 0) {
      statusBar.setState("hand-lost");
      gestureActionMessage = "";
    } else if (handCount === 1) {
      statusBar.setState("hand-detected");
    } else {
      statusBar.setState("two-hands");
    }
  }

  if (
    handCount > 0 &&
    gestureActionMessage &&
    gestureActionMessage.length > 0
  ) {
    statusBar.element.textContent = gestureActionMessage;
  }
}

// ─── Init Build Space ──────────────────────
function initBuildSpace() {
  if (buildInitialized) return;

  const scene = buildScene.getScene();
  const camera = buildScene.getCamera();
  const renderer = buildScene.renderer;

  grid = new Grid(scene);
  blockManager = new BlockManager(scene);
  ghostPreview = new GhostPreview(scene);
  viewcube = new ViewCube(camera); // orbit panel - no renderer needed
  gizmo = new Gizmo(scene);
  twoHandOrbit = new TwoHandOrbit(camera);
  buildGestureHandler = new BuildGestureHandler(
    buildScene,
    blockManager,
    ghostPreview,
    twoHandOrbit,
    gizmo,
  );

  sidebar.setBuildReferences(blockManager, grid, buildScene);

  buildInitialized = true;
  console.log("✅ Build Space initialized");
}

// ─── Mode Switch Handler ───────────────────
window.addEventListener("mode-switch", (e) => {
  currentMode = e.detail;

  if (currentMode === "build") {
    initBuildSpace();
    buildScene.show();
    document.getElementById("webcam-container").style.display = "block";
    document.getElementById("ink-canvas").style.display = "none";
    document.getElementById("glow-canvas").style.display = "none";
    if (viewcube) viewcube.setVisible(true);
    gestureHandler.reset();
  } else {
    buildScene.hide();
    document.getElementById("ink-canvas").style.display = "";
    document.getElementById("glow-canvas").style.display = "";
    if (viewcube) viewcube.setVisible(false);
    if (buildGestureHandler) buildGestureHandler.reset();
  }

  gestureActionMessage = "";
});

// ─── Scroll Zoom (Build Space) ─────────────
window.addEventListener(
  "wheel",
  (e) => {
    if (currentMode === "build" && buildScene.active) {
      const camera = buildScene.getCamera();
      const zoomSpeed = 0.5;
      const target = new THREE.Vector3(0, 0, 0);
      const offset = camera.position.clone().sub(target);
      const distance = offset.length();

      const newDistance = Math.max(
        2,
        Math.min(30, distance + e.deltaY * 0.01 * zoomSpeed),
      );
      offset.normalize().multiplyScalar(newDistance);
      camera.position.copy(target).add(offset);
      camera.lookAt(target);
    }
  },
  { passive: true },
);

// ─── Render Loop ───────────────────────────
function render(now) {
  requestAnimationFrame(render);

  drawSkeleton(latestHandData);

  if (currentMode === "ink") {
    inkCanvas.render();
  } else if (currentMode === "build") {
    buildScene.render();
    if (viewcube && viewcube.update) {
      viewcube.update();
    }
  }

  updateStatus(latestHandData.length);
  updateFPS(now);
}

// ─── Initialize ────────────────────────────
async function init() {
  try {
    statusBar.setState("initializing");

    await startCamera();
    console.log("✅ Camera started");

    handsInstance = await initHands(video, onHandResults);
    console.log("✅ MediaPipe Hands ready");

    async function processFrame() {
      if (handsInstance && video.readyState >= 2) {
        try {
          await handsInstance.send({ image: video });
        } catch (err) {
          // Silently handle frame errors
        }
      }
      requestAnimationFrame(() => processFrame());
    }
    processFrame();
    console.log("✅ Frame processing started");

    loadingOverlay.classList.add("hidden");
    setTimeout(() => loadingOverlay.remove(), 600);

    const helpBtn = document.getElementById("help-btn");
    if (helpBtn) {
      helpBtn.addEventListener("click", () => helpModal.toggle());
    }

    const onboarding = new Onboarding(helpModal);
    onboarding.check();

    console.log("✅ UI fully initialized");
    console.log("✅ AirForge Studio live! 🎨🧊");

    statusBar.setState("hand-lost");
    requestAnimationFrame(render);
    console.log("✅ Render loop started");
  } catch (err) {
    console.error("❌ Init failed:", err);
    loadingOverlay.innerHTML = `
      <div style="color: #ff4444; font-size: 18px; text-align: center; padding: 20px; max-width: 500px;">
        ❌ Failed to start<br>
        <span style="font-size: 14px; color: #ff8888;">
          ${err.message}<br><br>
          Check console (F12) for details.
        </span>
      </div>
    `;
  }
}

init();
