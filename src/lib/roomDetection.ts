import type { PlanRectPx, PlanState, RoomInfo } from '../types'
import { clamp, loadImage } from './utils'

interface RoomDetectionInput {
  floor: Uint8Array
  wallGrid: Uint8Array
  cols: number
  rows: number
  cellPx: number
  crop: PlanRectPx
  scale: number
}

function dilateCells(mask: Uint8Array, cols: number, rows: number, radius: number): Uint8Array {
  let current = mask
  for (let pass = 0; pass < radius; pass += 1) {
    const next = new Uint8Array(current.length)
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const i = y * cols + x
        if (current[i]) {
          next[i] = 1
          continue
        }
        let found = false
        for (let dy = -1; dy <= 1 && !found; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const ny = y + dy
            const nx = x + dx
            if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && current[ny * cols + nx]) {
              found = true
              break
            }
          }
        }
        if (found) next[i] = 1
      }
    }
    current = next
  }
  return current
}

function erodeCells(mask: Uint8Array, cols: number, rows: number, radius: number): Uint8Array {
  let current = mask
  for (let pass = 0; pass < radius; pass += 1) {
    const next = new Uint8Array(current.length)
    for (let y = 1; y < rows - 1; y += 1) {
      for (let x = 1; x < cols - 1; x += 1) {
        const i = y * cols + x
        if (!current[i]) continue
        let all = true
        for (let dy = -1; dy <= 1 && all; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (!current[(y + dy) * cols + x + dx]) {
              all = false
              break
            }
          }
        }
        if (all) next[i] = 1
      }
    }
    current = next
  }
  return current
}

/**
 * Segment floor areas into rooms. Walls are morphologically closed first so
 * standard door openings become separators, then each remaining floor island
 * is measured and labelled with a default editable name.
 */
export function detectRooms(input: RoomDetectionInput): RoomInfo[] {
  const { floor, wallGrid, cols, rows, cellPx, crop, scale } = input
  const floorGrid = new Uint8Array(cols * rows)

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const startX = x * cellPx
      const startY = y * cellPx
      const endX = Math.min(crop.w, startX + cellPx)
      const endY = Math.min(crop.h, startY + cellPx)
      let count = 0
      let total = 0
      for (let py = startY; py < endY; py += 1) {
        const row = py * crop.w
        for (let px = startX; px < endX; px += 1) {
          total += 1
          count += floor[row + px]
        }
      }
      if (total > 0 && count / total >= 0.45) floorGrid[y * cols + x] = 1
    }
  }

  const cellMeters = cellPx * scale
  const doorRadius = clamp(Math.round(0.42 / Math.max(cellMeters, 0.01)), 2, 12)
  const closedWalls = erodeCells(
    dilateCells(wallGrid, cols, rows, doorRadius),
    cols,
    rows,
    doorRadius,
  )
  const free = new Uint8Array(cols * rows)
  for (let i = 0; i < free.length; i += 1) free[i] = floorGrid[i] && !closedWalls[i] ? 1 : 0

  const visited = new Uint8Array(free.length)
  const stack = new Int32Array(free.length)
  const components: {
    count: number
    minC: number
    maxC: number
    minR: number
    maxR: number
    sumX: number
    sumY: number
  }[] = []

  for (let start = 0; start < free.length; start += 1) {
    if (!free[start] || visited[start]) continue
    let top = 0
    stack[top++] = start
    visited[start] = 1
    let count = 0
    let minC = cols
    let maxC = 0
    let minR = rows
    let maxR = 0
    let sumX = 0
    let sumY = 0

    while (top > 0) {
      const current = stack[--top]
      const y = Math.floor(current / cols)
      const x = current - y * cols
      count += 1
      sumX += x
      sumY += y
      if (x < minC) minC = x
      if (x > maxC) maxC = x
      if (y < minR) minR = y
      if (y > maxR) maxR = y
      if (x > 0) {
        const next = current - 1
        if (free[next] && !visited[next]) {
          visited[next] = 1
          stack[top++] = next
        }
      }
      if (x < cols - 1) {
        const next = current + 1
        if (free[next] && !visited[next]) {
          visited[next] = 1
          stack[top++] = next
        }
      }
      if (y > 0) {
        const next = current - cols
        if (free[next] && !visited[next]) {
          visited[next] = 1
          stack[top++] = next
        }
      }
      if (y < rows - 1) {
        const next = current + cols
        if (free[next] && !visited[next]) {
          visited[next] = 1
          stack[top++] = next
        }
      }
    }

    const area = count * cellMeters * cellMeters
    if (area >= 1.6) components.push({ count, minC, maxC, minR, maxR, sumX, sumY })
  }

  components.sort((a, b) => b.count - a.count)

  return components.slice(0, 12).map((component, index) => {
    const toWorldX = (cellX: number) =>
      (cellX * cellPx - crop.w / 2) * scale
    const toWorldZ = (cellY: number) =>
      (cellY * cellPx - crop.h / 2) * scale
    const minX = toWorldX(component.minC)
    const maxX = toWorldX(component.maxC + 1)
    const minZ = toWorldZ(component.minR)
    const maxZ = toWorldZ(component.maxR + 1)
    const centerX = toWorldX(component.sumX / component.count)
    const centerZ = toWorldZ(component.sumY / component.count)
    return {
      id: `room-${index + 1}`,
      name: `空间 ${index + 1}`,
      area: component.count * cellMeters * cellMeters,
      minX,
      maxX,
      minZ,
      maxZ,
      centerX,
      centerZ,
    }
  })
}


/** Rebuild room labels from the saved floor mask and the current edited walls. */
export async function detectRoomsFromPlan(plan: PlanState): Promise<RoomInfo[]> {
  const image = await loadImage(plan.floorAlphaUrl)
  const canvas = document.createElement('canvas')
  canvas.width = plan.crop.w
  canvas.height = plan.crop.h
  const context = canvas.getContext('2d')
  if (!context) return plan.rooms ?? []
  context.drawImage(image, 0, 0, plan.crop.w, plan.crop.h)
  const pixels = context.getImageData(0, 0, plan.crop.w, plan.crop.h).data
  const floor = new Uint8Array(plan.crop.w * plan.crop.h)
  for (let i = 0; i < floor.length; i += 1) {
    if (pixels[i * 4 + 3] > 120 && pixels[i * 4] > 120) floor[i] = 1
  }

  const cellPx = Math.max(2, plan.wallCellPx ?? 3)
  const cols = Math.ceil(plan.crop.w / cellPx)
  const rows = Math.ceil(plan.crop.h / cellPx)
  const seedWalls = new Uint8Array(cols * rows)
  for (const rect of plan.wallRectsPx) {
    const startX = clamp(Math.floor(rect.x / cellPx), 0, cols - 1)
    const endX = clamp(Math.ceil((rect.x + rect.w) / cellPx), startX + 1, cols)
    const startY = clamp(Math.floor(rect.y / cellPx), 0, rows - 1)
    const endY = clamp(Math.ceil((rect.y + rect.h) / cellPx), startY + 1, rows)
    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) seedWalls[y * cols + x] = 1
    }
  }

  // Stored wall rects are thinned centerlines. Re-inflate them to the same
  // thickness used by the 3D mesh so room flood fill cannot leak through
  // one-cell corner seams.
  let wallGrid = seedWalls
  for (let pass = 0; pass < 2; pass += 1) {
    const grown = new Uint8Array(wallGrid.length)
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const i = y * cols + x
        if (wallGrid[i]) {
          grown[i] = 1
          continue
        }
        if (
          (x > 0 && wallGrid[i - 1]) ||
          (x < cols - 1 && wallGrid[i + 1]) ||
          (y > 0 && wallGrid[i - cols]) ||
          (y < rows - 1 && wallGrid[i + cols])
        ) {
          grown[i] = 1
        }
      }
    }
    wallGrid = grown
  }

  return detectRooms({
    floor,
    wallGrid,
    cols,
    rows,
    cellPx,
    crop: plan.crop,
    scale: plan.scale,
  })
}
