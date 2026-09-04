/**
 * AirForge Studio — Smart Script Stroke Beautifier
 * Transforms wobbly, tremorous mid-air handwriting into sleek,
 * elegant calligraphic curves using Ramer-Douglas-Peucker (RDP)
 * noise reduction and Chaikin subdivision smoothing.
 */

/**
 * Perpendicular distance from a point to a line segment.
 */
function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const mag = Math.hypot(dx, dy);

  if (mag === 0) {
    return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  }

  const u = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (mag * mag);
  const clampedU = Math.max(0, Math.min(1, u));
  const projX = lineStart.x + clampedU * dx;
  const projY = lineStart.y + clampedU * dy;

  return Math.hypot(point.x - projX, point.y - projY);
}

/**
 * Ramer-Douglas-Peucker simplification to remove camera sensor noise and tremor.
 * @param {Array<{x: number, y: number}>} points
 * @param {number} epsilon - Threshold in pixels
 * @returns {Array<{x: number, y: number}>}
 */
export function rdpSimplify(points, epsilon = 2.5) {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let index = 0;
  const end = points.length - 1;

  for (let i = 1; i < end; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[end]);
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, index + 1), epsilon);
    const right = rdpSimplify(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }

  return [points[0], points[end]];
}

/**
 * Chaikin's corner-cutting algorithm for smooth, organic curvature.
 * @param {Array<{x: number, y: number}>} points
 * @param {number} iterations - Number of smoothing passes (default 2)
 * @returns {Array<{x: number, y: number}>}
 */
export function chaikinSmooth(points, iterations = 2) {
  if (points.length <= 2) return points;

  let current = points;

  for (let it = 0; it < iterations; it++) {
    const smoothed = [current[0]];

    for (let i = 0; i < current.length - 1; i++) {
      const p0 = current[i];
      const p1 = current[i + 1];

      // Q = 0.75 p0 + 0.25 p1
      const q = {
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y,
      };

      // R = 0.25 p0 + 0.75 p1
      const r = {
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y,
      };

      smoothed.push(q);
      smoothed.push(r);
    }

    smoothed.push(current[current.length - 1]);
    current = smoothed;
  }

  return current;
}

/**
 * Master beautify function for a completed stroke.
 * Combines RDP noise elimination with Chaikin smoothing.
 *
 * @param {Array<{x: number, y: number}>} points
 * @param {boolean} isShape
 * @returns {Array<{x: number, y: number}>}
 */
export function beautifyStroke(points, isShape = false) {
  if (!points || points.length < 3 || isShape) return points;

  // Step 1: Strip out micro-tremor with gentle RDP
  const simplified = rdpSimplify(points, 2.2);

  // Step 2: Smooth out handwriting curves with Chaikin subdivision
  const smoothed = chaikinSmooth(simplified, 2);

  return smoothed;
}
