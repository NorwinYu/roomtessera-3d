import type { FurnitureItem, PlanState } from '../types'
import { FURNITURE_BY_TYPE } from './catalog'
import { clamp } from './utils'

export interface PlacementFootprint {
  width: number
  depth: number
  offsetX: number
  offsetZ: number
  rotation: number
}

export interface PlacementResult {
  x: number
  z: number
  found: boolean
  collisions: number
}

export interface PlacementBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}


interface Extents {
  hx: number
  hz: number
}

const GRID = 0.2

function extents(width: number, depth: number, rotation: number): Extents {
  const cos = Math.abs(Math.cos(rotation))
  const sin = Math.abs(Math.sin(rotation))
  return {
    hx: (cos * width + sin * depth) / 2,
    hz: (sin * width + cos * depth) / 2,
  }
}

function buildOccupancy(plan: PlanState, existing: FurnitureItem[]) {
  const widthM = plan.widthM
  const depthM = plan.crop.h * plan.scale
  const cols = Math.max(8, Math.ceil(widthM / GRID))
  const rows = Math.max(8, Math.ceil(depthM / GRID))
  const blocked = new Uint8Array(cols * rows)
  const offsetX = widthM / 2
  const offsetZ = depthM / 2

  const markRect = (x0: number, z0: number, x1: number, z1: number) => {
    const c0 = clamp(Math.floor((x0 + offsetX) / GRID), 0, cols - 1)
    const c1 = clamp(Math.ceil((x1 + offsetX) / GRID), c0 + 1, cols)
    const r0 = clamp(Math.floor((z0 + offsetZ) / GRID), 0, rows - 1)
    const r1 = clamp(Math.ceil((z1 + offsetZ) / GRID), r0 + 1, rows)
    for (let row = r0; row < r1; row += 1) {
      blocked.fill(1, row * cols + c0, row * cols + c1)
    }
  }

  // Wall centerlines are stored in source-image pixel coordinates.
  const wallPadding = 0.09
  for (const rect of plan.wallRectsPx) {
    const x0 = (rect.x - plan.crop.w / 2) * plan.scale
    const z0 = (rect.y - plan.crop.h / 2) * plan.scale
    const x1 = (rect.x + rect.w - plan.crop.w / 2) * plan.scale
    const z1 = (rect.y + rect.h - plan.crop.h / 2) * plan.scale
    markRect(x0 - wallPadding, z0 - wallPadding, x1 + wallPadding, z1 + wallPadding)
  }

  for (const item of existing) {
    const definition = FURNITURE_BY_TYPE[item.type]
    if (!definition) continue
    const size = extents(
      definition.width * item.scale,
      definition.depth * item.scale,
      item.rotation,
    )
    const padding = item.type === 'rug' ? 0.02 : 0.1
    markRect(
      item.position[0] - size.hx - padding,
      item.position[2] - size.hz - padding,
      item.position[0] + size.hx + padding,
      item.position[2] + size.hz + padding,
    )
  }

  const integral = new Int32Array((cols + 1) * (rows + 1))
  for (let row = 1; row <= rows; row += 1) {
    let rowSum = 0
    for (let col = 1; col <= cols; col += 1) {
      rowSum += blocked[(row - 1) * cols + (col - 1)]
      integral[row * (cols + 1) + col] =
        integral[(row - 1) * (cols + 1) + col] + rowSum
    }
  }

  const rectSum = (x0: number, z0: number, x1: number, z1: number) => {
    const c0 = clamp(Math.floor((x0 + offsetX) / GRID), 0, cols)
    const c1 = clamp(Math.ceil((x1 + offsetX) / GRID), 0, cols)
    const r0 = clamp(Math.floor((z0 + offsetZ) / GRID), 0, rows)
    const r1 = clamp(Math.ceil((z1 + offsetZ) / GRID), 0, rows)
    if (c1 <= c0 || r1 <= r0) return 0
    return (
      integral[r1 * (cols + 1) + c1] -
      integral[r0 * (cols + 1) + c1] -
      integral[r1 * (cols + 1) + c0] +
      integral[r0 * (cols + 1) + c0]
    )
  }

  return { widthM, depthM, cols, rows, offsetX, offsetZ, rectSum }
}

/**
 * Finds a collision-free anchor for one or more furniture footprints.
 * Walls and already placed furniture are treated as obstacles, while a soft
 * clearance score keeps new pieces out of tight corners.
 */
export function findFreePlacement(
  plan: PlanState,
  existing: FurnitureItem[],
  items: PlacementFootprint[],
  preferred: { x: number; z: number } = { x: 0, z: 0 },
  bounds?: PlacementBounds,
): PlacementResult {
  if (items.length === 0) return { x: preferred.x, z: preferred.z, found: true, collisions: 0 }
  const grid = buildOccupancy(plan, existing)
  const prepared = items.map((item) => ({
    ...item,
    size: extents(item.width, item.depth, item.rotation),
  }))

  let extentX = 0
  let extentZ = 0
  for (const item of prepared) {
    extentX = Math.max(extentX, Math.abs(item.offsetX) + item.size.hx)
    extentZ = Math.max(extentZ, Math.abs(item.offsetZ) + item.size.hz)
  }

  const margin = 0.12
  const minX = Math.max(-grid.offsetX + extentX + margin, bounds?.minX ?? -Infinity)
  const maxX = Math.min(grid.offsetX - extentX - margin, bounds?.maxX ?? Infinity)
  const minZ = Math.max(-grid.offsetZ + extentZ + margin, bounds?.minZ ?? -Infinity)
  const maxZ = Math.min(grid.offsetZ - extentZ - margin, bounds?.maxZ ?? Infinity)
  if (minX > maxX || minZ > maxZ) {
    return { x: preferred.x, z: preferred.z, found: false, collisions: 1 }
  }

  const step = GRID
  let best = { x: preferred.x, z: preferred.z, score: Number.POSITIVE_INFINITY, collisions: Number.POSITIVE_INFINITY }

  for (let z = minZ; z <= maxZ + 0.001; z += step) {
    for (let x = minX; x <= maxX + 0.001; x += step) {
      let collisions = 0
      let clearance = 0

      for (const item of prepared) {
        const cx = x + item.offsetX
        const cz = z + item.offsetZ
        const { hx, hz } = item.size
        collisions += grid.rectSum(cx - hx - 0.02, cz - hz - 0.02, cx + hx + 0.02, cz + hz + 0.02)
        clearance += grid.rectSum(cx - hx - 0.24, cz - hz - 0.24, cx + hx + 0.24, cz + hz + 0.24)
      }

      const distance = Math.hypot(x - preferred.x, z - preferred.z)
      const score = collisions * 10000 + clearance * 3.2 + distance
      if (
        score < best.score - 0.0001 ||
        (Math.abs(score - best.score) <= 0.0001 && collisions < best.collisions)
      ) {
        best = { x, z, score, collisions }
      }
    }
  }

  return {
    x: Math.round(best.x * 100) / 100,
    z: Math.round(best.z * 100) / 100,
    found: best.collisions === 0 && Number.isFinite(best.score),
    collisions: Number.isFinite(best.collisions) ? best.collisions : 1,
  }
}


export interface FurnitureCollisionReport {
  wall: boolean
  furniture: boolean
  outside: boolean
  total: number
}

function rectsOverlap(
  aMinX: number,
  aMaxX: number,
  aMinZ: number,
  aMaxZ: number,
  bMinX: number,
  bMaxX: number,
  bMinZ: number,
  bMaxZ: number,
  padding = 0,
): boolean {
  return (
    aMaxX + padding > bMinX &&
    aMinX - padding < bMaxX &&
    aMaxZ + padding > bMinZ &&
    aMinZ - padding < bMaxZ
  )
}

/** Runtime collision report used for drag feedback. Rugs are allowed to overlap furniture. */
export function getFurnitureCollision(
  plan: PlanState,
  furniture: FurnitureItem[],
  candidate: FurnitureItem,
): FurnitureCollisionReport {
  const definition = FURNITURE_BY_TYPE[candidate.type]
  if (!definition) return { wall: false, furniture: false, outside: false, total: 0 }
  const size = extents(
    definition.width * candidate.scale,
    definition.depth * candidate.scale,
    candidate.rotation,
  )
  const cx = candidate.position[0]
  const cz = candidate.position[2]
  const minX = cx - size.hx
  const maxX = cx + size.hx
  const minZ = cz - size.hz
  const maxZ = cz + size.hz
  const planWidth = plan.widthM
  const planDepth = plan.crop.h * plan.scale

  let wall = false
  for (const rect of plan.wallRectsPx) {
    const x0 = (rect.x - plan.crop.w / 2) * plan.scale
    const z0 = (rect.y - plan.crop.h / 2) * plan.scale
    const x1 = (rect.x + rect.w - plan.crop.w / 2) * plan.scale
    const z1 = (rect.y + rect.h - plan.crop.h / 2) * plan.scale
    if (rectsOverlap(minX, maxX, minZ, maxZ, x0, x1, z0, z1, 0.055)) {
      wall = true
      break
    }
  }

  let overlapsFurniture = false
  if (candidate.type !== 'rug') {
    for (const other of furniture) {
      if (other.id === candidate.id || other.type === 'rug') continue
      const otherDefinition = FURNITURE_BY_TYPE[other.type]
      if (!otherDefinition) continue
      const otherSize = extents(
        otherDefinition.width * other.scale,
        otherDefinition.depth * other.scale,
        other.rotation,
      )
      if (
        rectsOverlap(
          minX,
          maxX,
          minZ,
          maxZ,
          other.position[0] - otherSize.hx,
          other.position[0] + otherSize.hx,
          other.position[2] - otherSize.hz,
          other.position[2] + otherSize.hz,
          0.015,
        )
      ) {
        overlapsFurniture = true
        break
      }
    }
  }

  const outside =
    minX < -planWidth / 2 + 0.08 ||
    maxX > planWidth / 2 - 0.08 ||
    minZ < -planDepth / 2 + 0.08 ||
    maxZ > planDepth / 2 - 0.08

  return {
    wall,
    furniture: overlapsFurniture,
    outside,
    total: (wall ? 1 : 0) + (overlapsFurniture ? 1 : 0) + (outside ? 1 : 0),
  }
}
