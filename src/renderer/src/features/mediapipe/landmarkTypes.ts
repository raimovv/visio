export interface EyeBlendshapeSignals {
  blinkLeft: number
  blinkRight: number
  lookDownLeft: number
  lookDownRight: number
  lookInLeft: number
  lookInRight: number
  lookOutLeft: number
  lookOutRight: number
}

export interface HeadPose {
  yaw: number
  pitch: number
  roll: number
}

export interface FaceLandmarkResult {
  faceDetected: boolean
  brightnessScore: number
  leftEar: number
  rightEar: number
  eyeSignals: EyeBlendshapeSignals
  headPose?: HeadPose
}

export interface FaceLandmarkerRunner {
  detect(video: HTMLVideoElement, timestamp: number): Promise<FaceLandmarkResult>
  close(): void
}
