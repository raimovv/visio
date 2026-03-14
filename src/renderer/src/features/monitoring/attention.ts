import type { EyeBlendshapeSignals, HeadPose } from '@renderer/features/mediapipe/landmarkTypes'

interface ScreenAttention {
  screenFacing: boolean
  awayScore: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function deriveScreenAttention(
  faceDetected: boolean,
  eyeSignals: EyeBlendshapeSignals,
  headPose?: HeadPose
): ScreenAttention {
  if (!faceDetected) {
    return { screenFacing: false, awayScore: 1 }
  }

  const horizontalLook = Math.max(
    eyeSignals.lookOutLeft,
    eyeSignals.lookOutRight,
    eyeSignals.lookInLeft,
    eyeSignals.lookInRight
  )
  const downwardLook = Math.max(eyeSignals.lookDownLeft, eyeSignals.lookDownRight)
  const yawScore = headPose ? clamp(Math.abs(headPose.yaw) / 22, 0, 1) : 0
  const pitchScore = headPose ? clamp(Math.abs(headPose.pitch) / 18, 0, 1) : 0
  const awayScore = Number(Math.max(horizontalLook, downwardLook, yawScore * 0.8, pitchScore * 0.65).toFixed(2))

  return {
    screenFacing: awayScore < 0.46,
    awayScore
  }
}
