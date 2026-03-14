import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import type { FaceLandmarkerRunner, FaceLandmarkResult } from './landmarkTypes'

const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144] as const
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380] as const
const WASM_ROOT = '/mediapipe'
const MODEL_PATH = '/models/face_landmarker.task'

function projectEye(
  landmarks: Array<{ x: number; y: number }>,
  indices: readonly number[]
): [number, number][] {
  return indices.map((index) => {
    const landmark = landmarks[index]
    return [landmark?.x ?? 0, landmark?.y ?? 0]
  })
}

function estimateBrightness(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const width = 64
  const height = 36
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    return 0
  }

  context.drawImage(video, 0, 0, width, height)
  const { data } = context.getImageData(0, 0, width, height)
  let total = 0

  for (let index = 0; index < data.length; index += 4) {
    total += 0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]
  }

  return total / (width * height * 255)
}

export async function createFaceLandmarker(): Promise<FaceLandmarkerRunner> {
  const vision = await FilesetResolver.forVisionTasks(WASM_ROOT)
  const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_PATH
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false
  })
  const brightnessCanvas = document.createElement('canvas')

  return {
    async detect(video, timestamp): Promise<FaceLandmarkResult> {
      const result = faceLandmarker.detectForVideo(video, timestamp)
      const landmarks = result.faceLandmarks[0]

      if (!landmarks) {
        return {
          faceDetected: false,
          brightnessScore: estimateBrightness(video, brightnessCanvas),
          leftEye: [],
          rightEye: []
        }
      }

      return {
        faceDetected: true,
        brightnessScore: estimateBrightness(video, brightnessCanvas),
        leftEye: projectEye(landmarks, LEFT_EYE_INDICES),
        rightEye: projectEye(landmarks, RIGHT_EYE_INDICES)
      }
    },
    close() {
      faceLandmarker.close()
    }
  }
}
