/**
 * AirForge Studio — Constants
 * All configurable values in one place.
 */

// ─── Webcam ───────────────────────────────
export const WEBCAM = {
  WIDTH: 640,
  HEIGHT: 480,
  TARGET_FPS: 30,
};

// ─── MediaPipe ────────────────────────────
export const MEDIAPIPE = {
  // Latest CDN version of @mediapipe/tasks-vision
  CDN_BASE: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18",
  WASM_PATH:
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm",
  MODEL_PATH:
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
  MAX_HANDS: 2,
  CONFIDENCE_THRESHOLD: 0.5,
};

// ─── Skeleton Drawing ─────────────────────
export const SKELETON = {
  // MediaPipe hand landmark connections
  CONNECTIONS: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4], // Thumb
    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8], // Index
    [0, 9],
    [9, 10],
    [10, 11],
    [11, 12], // Middle
    [0, 13],
    [13, 14],
    [14, 15],
    [15, 16], // Ring
    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20], // Pinky
    [5, 9],
    [9, 13],
    [13, 17], // Palm connections
  ],
  // Neon colors for each hand (index 0, index 1)
  COLORS: [
    { node: "#00ffff", line: "rgba(0, 255, 255, 0.7)" }, // Cyan
    { node: "#ff00ff", line: "rgba(255, 0, 255, 0.7)" }, // Magenta
  ],
  NODE_RADIUS: 5,
  LINE_WIDTH: 2.5,
  GLOW_BLUR: 10,
  GLOW_COLOR: "rgba(0, 255, 255, 0.4)",
};

// ─── FPS Counter ──────────────────────────
export const FPS = {
  UPDATE_INTERVAL_MS: 250, // Update FPS display every 250ms
  SAMPLE_SIZE: 30, // Rolling average over last 30 frames
};

// ─── Status Bar ───────────────────────────
export const STATUS = {
  HAND_LOST_MSG: "🖐️ No hand detected — show your hand to the camera",
  HAND_FOUND_MSG: "✋ Hand detected — ready",
  TWO_HANDS_MSG: "🤲 Two hands detected",
  INITIALIZING_MSG: "⏳ Initializing hand tracking...",
};
// ─── Brush Colors ──────────────────────────
export const BRUSH = {
  COLORS: ["#00ff88", "#ff6ec7", "#00d4ff", "#ff8c42", "#da70ff"],
  DEFAULT_COLOR: "#00ff88",
  DEFAULT_SIZE: 6,
  MIN_SIZE: 2,
  MAX_SIZE: 20,
  SMOOTHING: 0.4, // Line smoothing factor (0-1, higher = smoother)
  MIN_POINT_DISTANCE: 2, // Minimum px between points to add
};

// ─── Gesture Thresholds ────────────────────
export const GESTURE = {
  PINCH_DISTANCE: 0.08, // Max normalized distance for pinch
  THREE_FINGER_MIN: 3, // Min extended fingers for 3-finger gesture
  SELECT_HOVER_RADIUS: 30, // Pixels - how close to a stroke to select it
  SELECT_HOLD_TIME: 800, // Milliseconds to hold pinch before selecting
  UNDO_COOLDOWN: 500, // Milliseconds between undo actions
};
