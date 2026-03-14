import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import type { FaceLandmarkerRunner, FaceLandmarkResult, EyeBlendshapeSignals, HeadPose } from './landmarkTypes'
import { calculateEyeAspectRatio } from '@renderer/features/monitoring/ear'

const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144] as const
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380] as const
const EMPTY_EYE_SIGNALS: EyeBlendshapeSignals = {
  blinkLeft: 0,
  blinkRight: 0,
  lookDownLeft: 0,
  lookDownRight: 0,
  lookInLeft: 0,
  lookInRight: 0,
  lookOutLeft: 0,
  lookOutRight: 0
}

function resolveRendererAssetPath(relativePath: string) {
  const normalizedPath = relativePath.replace(/^\/+/, '')

  if (window.location.protocol === 'file:') {
    return new URL(`./${normalizedPath}`, window.location.href).toString()
  }

  return `/${normalizedPath}`
}

function projectEye(
  landmarks: Array<{ x: number; y: number }>,
  indices: readonly number[]
): [number, number][] {
  return indices.map((index) => {
    const landmark = landmarks[index]
    return [landmark?.x ?? 0, landmark?.y ?? 0]
  })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
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

function toBlendshapeMap(categories: Array<{ categoryName: string; score: number }> | undefined) {
  const map = new Map<string, number>()
  categories?.forEach((category) => {
    map.set(category.categoryName, category.score)
  })
  return map
}

function getBlendshapeScore(blendshapeMap: Map<string, number>, key: keyof EyeBlendshapeSignals) {
  const categoryKey =
    key === 'blinkLeft'
      ? 'eyeBlinkLeft'
      : key === 'blinkRight'
        ? 'eyeBlinkRight'
        : key === 'lookDownLeft'
          ? 'eyeLookDownLeft'
          : key === 'lookDownRight'
            ? 'eyeLookDownRight'
            : key === 'lookInLeft'
              ? 'eyeLookInLeft'
              : key === 'lookInRight'
                ? 'eyeLookInRight'
                : key === 'lookOutLeft'
                  ? 'eyeLookOutLeft'
                  : 'eyeLookOutRight'

  return Number((blendshapeMap.get(categoryKey) ?? 0).toFixed(3))
}

function deriveHeadPose(matrix: { rows: number; columns: number; data: number[] } | undefined): HeadPose | undefined {
  if (!matrix || matrix.rows < 4 || matrix.columns < 4 || matrix.data.length < 16) {
    return undefined
  }

  const m00 = matrix.data[0]
  const m02 = matrix.data[2]
  const m10 = matrix.data[4]
  const m11 = matrix.data[5]
  const m12 = matrix.data[6]
  const m22 = matrix.data[10]
  const yaw = Math.atan2(m02, m22)
  const pitch = Math.atan2(-m12, Math.sqrt(m00 * m00 + m10 * m10))
  const roll = Math.atan2(m10, m11)

  return {
    yaw: Number(clamp((yaw * 180) / Math.PI, -90, 90).toFixed(1)),
    pitch: Number(clamp((pitch * 180) / Math.PI, -90, 90).toFixed(1)),
    roll: Number(clamp((roll * 180) / Math.PI, -90, 90).toFixed(1))
  }
}

export async function createFaceLandmarker(): Promise<FaceLandmarkerRunner> {
  const vision = await FilesetResolver.forVisionTasks(resolveRendererAssetPath('mediapipe'))
  const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: resolveRendererAssetPath('models/face_landmarker.task')
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true
  })
  const brightnessCanvas = document.createElement('canvas')

  return {
    async detect(video, timestamp): Promise<FaceLandmarkResult> {
      const result = faceLandmarker.detectForVideo(video, timestamp)
      const landmarks = result.faceLandmarks[0]
      const brightnessScore = estimateBrightness(video, brightnessCanvas)

      if (!landmarks) {
        return {
          faceDetected: false,
          brightnessScore,
          leftEar: 0,
          rightEar: 0,
          eyeSignals: EMPTY_EYE_SIGNALS
        }
      }

      const leftEar = calculateEyeAspectRatio(projectEye(landmarks, LEFT_EYE_INDICES))
      const rightEar = calculateEyeAspectRatio(projectEye(landmarks, RIGHT_EYE_INDICES))
      const blendshapeMap = toBlendshapeMap(result.faceBlendshapes[0]?.categories)

      return {
        faceDetected: true,
        brightnessScore,
        leftEar: Number(leftEar.toFixed(3)),
        rightEar: Number(rightEar.toFixed(3)),
        eyeSignals: {
          blinkLeft: getBlendshapeScore(blendshapeMap, 'blinkLeft'),
          blinkRight: getBlendshapeScore(blendshapeMap, 'blinkRight'),
          lookDownLeft: getBlendshapeScore(blendshapeMap, 'lookDownLeft'),
          lookDownRight: getBlendshapeScore(blendshapeMap, 'lookDownRight'),
          lookInLeft: getBlendshapeScore(blendshapeMap, 'lookInLeft'),
          lookInRight: getBlendshapeScore(blendshapeMap, 'lookInRight'),
          lookOutLeft: getBlendshapeScore(blendshapeMap, 'lookOutLeft'),
          lookOutRight: getBlendshapeScore(blendshapeMap, 'lookOutRight')
        },
        headPose: deriveHeadPose(result.facialTransformationMatrixes[0])
      }
    },
    close() {
      faceLandmarker.close()
    }
  }
}
