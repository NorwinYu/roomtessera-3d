import type { PlanRectPx, PlanState } from '../types'
import { clamp } from './utils'

export const MANUAL_WALL_THICKNESS = 0.14
export const MIN_WALL_LENGTH = 0.25

/** Snaps a drawing point to nearby wall centerlines, then to a 10 cm grid. */
export function snapWallPoint(plan: PlanState, x: number, z: number): [number, number] {
  const halfW = (plan.crop.w * plan.scale) / 2
  const halfH = (plan.crop.h * plan.scale) / 2
  const grid = 0.1
  const threshold = 0.24
  const sx = clamp(x, -halfW + 0.05, halfW - 0.05)
  const sz = clamp(z, -halfH + 0.05, halfH - 0.05)
  let bestX = sx
  let bestZ = sz
  let bestDistance = threshold

  for (const rect of plan.wallRectsPx) {
    const minX = (rect.x - plan.crop.w / 2) * plan.scale
    const maxX = (rect.x + rect.w - plan.crop.w / 2) * plan.scale
    const minZ = (rect.y - plan.crop.h / 2) * plan.scale
    const maxZ = (rect.y + rect.h - plan.crop.h / 2) * plan.scale
    if (rect.w >= rect.h) {
      const centerZ = (minZ + maxZ) / 2
      const px = clamp(sx, minX, maxX)
      const distance = Math.hypot(sx - px, sz - centerZ)
      if (distance < bestDistance) {
        bestDistance = distance
        bestX = px
        bestZ = centerZ
      }
    } else {
      const centerX = (minX + maxX) / 2
      const pz = clamp(sz, minZ, maxZ)
      const distance = Math.hypot(sx - centerX, sz - pz)
      if (distance < bestDistance) {
        bestDistance = distance
        bestX = centerX
        bestZ = pz
      }
    }
  }

  if (bestDistance < threshold) {
    return [
      clamp(bestX, -halfW + 0.05, halfW - 0.05),
      clamp(bestZ, -halfH + 0.05, halfH - 0.05),
    ]
  }
  return [
    clamp(Math.round(sx / grid) * grid, -halfW, halfW),
    clamp(Math.round(sz / grid) * grid, -halfH, halfH),
  ]
}

/**
 * Creates an axis-aligned wall rectangle from two world-space points.
 * Interior walls are snapped to the dominant horizontal / vertical axis.
 */
export function wallRectFromPoints(
  plan: PlanState,
  start: [number, number],
  end: [number, number],
): PlanRectPx | null {
  const dx = end[0] - start[0]
  const dz = end[1] - start[1]
  if (Math.hypot(dx, dz) < MIN_WALL_LENGTH) return null

  const thicknessPx = Math.max(2, Math.round(MANUAL_WALL_THICKNESS / plan.scale))
  const toPixelX = (x: number) => x / plan.scale + plan.crop.w / 2
  const toPixelZ = (z: number) => z / plan.scale + plan.crop.h / 2

  if (Math.abs(dx) >= Math.abs(dz)) {
    const x0 = Math.min(toPixelX(start[0]), toPixelX(end[0]))
    const x1 = Math.max(toPixelX(start[0]), toPixelX(end[0]))
    const centerZ = toPixelZ((start[1] + end[1]) / 2)
    const y0 = clamp(centerZ - thicknessPx / 2, 0, plan.crop.h - thicknessPx)
    const y1 = Math.min(plan.crop.h, y0 + thicknessPx)
    return {
      x: clamp(x0, 0, plan.crop.w - 2),
      y: y0,
      w: clamp(x1 - x0, 2, plan.crop.w),
      h: Math.max(2, y1 - y0),
    }
  }

  const z0 = Math.min(toPixelZ(start[1]), toPixelZ(end[1]))
  const z1 = Math.max(toPixelZ(start[1]), toPixelZ(end[1]))
  const centerX = toPixelX((start[0] + end[0]) / 2)
  const x0 = clamp(centerX - thicknessPx / 2, 0, plan.crop.w - thicknessPx)
  const x1 = Math.min(plan.crop.w, x0 + thicknessPx)
  return {
    x: x0,
    y: clamp(z0, 0, plan.crop.h - 2),
    w: Math.max(2, x1 - x0),
    h: clamp(z1 - z0, 2, plan.crop.h),
  }
}

function distanceToRect(
  x: number,
  z: number,
  rectWorld: { minX: number; maxX: number; minZ: number; maxZ: number },
): number {
  const dx = Math.max(rectWorld.minX - x, 0, x - rectWorld.maxX)
  const dz = Math.max(rectWorld.minZ - z, 0, z - rectWorld.maxZ)
  return Math.hypot(dx, dz)
}

/** Removes wall rectangles intersecting a small circular eraser brush. */
export function removeWallRectsNear(
  plan: PlanState,
  x: number,
  z: number,
  radius = 0.32,
): PlanRectPx[] {
  return plan.wallRectsPx.filter((rect) => {
    const minX = (rect.x - plan.crop.w / 2) * plan.scale - 0.08
    const maxX = (rect.x + rect.w - plan.crop.w / 2) * plan.scale + 0.08
    const minZ = (rect.y - plan.crop.h / 2) * plan.scale - 0.08
    const maxZ = (rect.y + rect.h - plan.crop.h / 2) * plan.scale + 0.08
    return distanceToRect(x, z, { minX, maxX, minZ, maxZ }) > radius
  })
}
