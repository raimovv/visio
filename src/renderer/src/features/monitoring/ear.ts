function distance(a: [number, number], b: [number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

export function calculateEyeAspectRatio(points: [number, number][]) {
  if (points.length !== 6) {
    return 0
  }

  const vertical = distance(points[1], points[5]) + distance(points[2], points[4])
  const horizontal = 2 * distance(points[0], points[3])
  if (horizontal === 0) return 0
  return vertical / horizontal
}
