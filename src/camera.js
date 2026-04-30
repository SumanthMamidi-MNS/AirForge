/**
 * AirForge Studio — Camera & MediaPipe Manager (Legacy API)
 * Uses the stable @mediapipe/hands pipeline.
 */

import { WEBCAM } from "./constants.js";

/**
 * Request webcam access and start the video stream.
 * @returns {Promise<HTMLVideoElement>}
 */
export async function startCamera() {
  const video = document.getElementById("webcam-video");

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: WEBCAM.WIDTH },
      height: { ideal: WEBCAM.HEIGHT },
      facingMode: "user",
    },
    audio: false,
  });

  video.srcObject = stream;

  return new Promise((resolve) => {
    video.addEventListener(
      "loadedmetadata",
      () => {
        video.play();
        resolve(video);
      },
      { once: true },
    );
  });
}

/**
 * Initialize MediaPipe Hands using the legacy CDN globals.
 * This is more stable and doesn't hang on WASM loading.
 *
 * @param {HTMLVideoElement} video
 * @param {Function} onResults - callback receiving hand landmarks
 * @returns {Promise<Hands>}
 */
export function initHands(video, onResults) {
  return new Promise((resolve, reject) => {
    // The legacy CDN exposes window.Hands
    const Hands = window.Hands;

    if (!Hands) {
      reject(
        new Error(
          "MediaPipe Hands not loaded. Check CDN script tags in index.html." +
            "\nAvailable globals: " +
            Object.keys(window)
              .filter((k) => k.includes("mediapipe") || k === "Hands")
              .join(", "),
        ),
      );
      return;
    }

    console.log("✅ MediaPipe Hands global found, initializing...");

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    // Start processing
    hands
      .initialize()
      .then(() => {
        console.log("✅ MediaPipe Hands initialized");
        resolve(hands);
      })
      .catch(reject);
  });
}

/**
 * Start the camera processing loop using MediaPipe's built-in camera utility.
 * This handles the per-frame detection automatically.
 *
 * @param {HTMLVideoElement} video
 * @param {Hands} hands
 * @returns {Promise<void>}
 */
export function startCameraLoop(video, hands) {
  return new Promise((resolve) => {
    const Camera = window.Camera;

    if (!Camera) {
      // Fallback: manual requestAnimationFrame loop (more reliable anyway)
      console.log("Camera utility not found, using manual RAF loop");
      resolve();
      return;
    }

    const cameraUtils = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: WEBCAM.WIDTH,
      height: WEBCAM.HEIGHT,
    });

    cameraUtils.start().then(() => {
      console.log("✅ Camera loop started");
      resolve();
    });
  });
}
