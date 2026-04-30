/**
 * AirForge Studio — Gesture Detector (Simplified)
 * Gestures: POINT, PINCH, PINCH_INDEX, OPEN_PALM, IDLE, NO_HAND
 * Removed: THREE_FINGERS, THREE_FINGER_PINCH, PEACE (per spec update)
 */

import { getExtendedFingers, isPinching } from "./landmarks.js";

export function detectGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { type: "NO_HAND", handPresent: false };
  }

  const fingers = getExtendedFingers(landmarks);
  const pinch = isPinching(landmarks);

  const fingerCount = [fingers.index, fingers.middle, fingers.ring, fingers.pinky].filter(Boolean).length;
  const totalExtended = fingerCount + (fingers.thumb ? 1 : 0);

  let type = "IDLE";

  // PINCH_INDEX — precise pinch with only index finger up
  if (pinch && fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
    type = "PINCH_INDEX";
  }
  // PINCH — any pinch posture
  else if (pinch) {
    type = "PINCH";
  }
  // POINT — index only, middle curled
  else if (fingers.index && !fingers.middle) {
    type = "POINT";
  }
  // OPEN_PALM — 4+ fingers extended
  else if (totalExtended >= 4) {
    type = "OPEN_PALM";
  }

  return {
    type,
    handPresent: true,
    fingers,
    extendedCount: totalExtended,
    isPinching: pinch,
    indexTip: { x: landmarks[8].x, y: landmarks[8].y },
    pinchMidpoint: pinch
      ? {
          x: (landmarks[4].x + landmarks[8].x) / 2,
          y: (landmarks[4].y + landmarks[8].y) / 2,
        }
      : null,
    allTips: {
      thumb: landmarks[4],
      index: landmarks[8],
      middle: landmarks[12],
      ring: landmarks[16],
      pinky: landmarks[20],
    },
    wrist: { x: landmarks[0].x, y: landmarks[0].y },
  };
}
