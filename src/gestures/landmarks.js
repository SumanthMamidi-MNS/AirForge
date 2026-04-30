/**
 * AirForge Studio — Landmark Math Utilities
 *
 * MediaPipe provides 21 landmarks per hand (0-20):
 *   0: Wrist
 *   1-4: Thumb (CMC, MCP, IP, TIP)
 *   5-8: Index (MCP, PIP, DIP, TIP)
 *   9-12: Middle (MCP, PIP, DIP, TIP)
 *   13-16: Ring (MCP, PIP, DIP, TIP)
 *   17-20: Pinky (MCP, PIP, DIP, TIP)
 *
 * All positions normalized 0-1 (relative to image dimensions).
 * x=0 is left of image, y=0 is top of image.
 */

/**
 * Calculate Euclidean distance between two landmarks.
 * @param {Object} a - {x, y, z}
 * @param {Object} b - {x, y, z}
 * @returns {number} Distance in normalized coordinates
 */
export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate 3D distance between two landmarks.
 * @param {Object} a - {x, y, z}
 * @param {Object} b - {x, y, z}
 * @returns {number}
 */
export function distance3D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if a finger is extended (straight) or curled.
 * Compares distance from fingertip to wrist vs pip-to-wrist.
 *
 * @param {Array} landmarks - All 21 landmarks for one hand
 * @param {number} tipIdx - Index of fingertip landmark
 * @param {number} pipIdx - Index of PIP joint landmark
 * @param {number} mcpIdx - Index of MCP joint landmark
 * @returns {boolean} true if finger is extended
 */
export function isFingerExtended(landmarks, tipIdx, pipIdx, mcpIdx) {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];
  const wrist = landmarks[0];

  const tipToWrist = distance(tip, wrist);
  const pipToWrist = distance(pip, wrist);

  // If tip is farther from wrist than pip, finger is extended
  return tipToWrist > pipToWrist * 1.02; // Small threshold to avoid flicker
}

/**
 * Get which fingers are extended for a hand.
 * @param {Array} landmarks - 21 landmarks
 * @returns {Object} { thumb, index, middle, ring, pinky } each boolean
 */
export function getExtendedFingers(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return {
      thumb: false,
      index: false,
      middle: false,
      ring: false,
      pinky: false,
    };
  }

  return {
    thumb: isFingerExtended(landmarks, 4, 2, 1),
    index: isFingerExtended(landmarks, 8, 6, 5),
    middle: isFingerExtended(landmarks, 12, 10, 9),
    ring: isFingerExtended(landmarks, 16, 14, 13),
    pinky: isFingerExtended(landmarks, 20, 18, 17),
  };
}

/**
 * Check if thumb and index fingertip are close together (pinch).
 * @param {Array} landmarks - 21 landmarks
 * @returns {boolean}
 */
export function isPinching(landmarks) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const dist = distance(thumbTip, indexTip);

  // Threshold for pinch detection
  // Normalized at typical arm's length from camera
  return dist < 0.08;
}

/**
 * Calculate the center point between two landmarks.
 * @param {Object} a - {x, y}
 * @param {Object} b - {x, y}
 * @returns {Object} {x, y}
 */
export function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

/**
 * Map normalized landmark coordinates to canvas pixel coordinates.
 * @param {Object} landmark - {x, y}
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @returns {Object} {x, y}
 */
export function toPixelCoords(landmark, canvasWidth, canvasHeight) {
  return {
    x: landmark.x * canvasWidth,
    y: landmark.y * canvasHeight,
  };
}
