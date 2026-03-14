export interface FaceLandmarkResult {
  faceDetected: boolean
  brightnessScore: number
  leftEye: [number, number][]
  rightEye: [number, number][]
}

export interface FaceLandmarkerRunner {
  detect(video: HTMLVideoElement, timestamp: number): Promise<FaceLandmarkResult>
  close(): void
}
