export function estimatePostureTilt(points: [number, number][]) {
  if (points.length < 2) return 0
  const [left, right] = points
  return Math.atan2(right[1] - left[1], right[0] - left[0])
}
