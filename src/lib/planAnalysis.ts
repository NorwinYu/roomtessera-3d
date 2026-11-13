import type { PlanRectPx, PlanState } from '../types'
import { clamp, loadImage, nextFrame, uid } from './utils'
import { detectRooms } from './roomDetection'

const MAX_WORKING_DIM = 1500
const TARGET_FLOOR_AREA = 125

export interface PlanAnalysisOptions {
  widthM?: number
  onProgress?: (progress: number, stage: string) => void
  signal?: AbortSignal
}

type ProgressReporter = (progress: number, stage: string) => void

function report(onProgress: ProgressReporter | undefined, progress: number, stage: string) {
  onProgress?.(progress, stage)
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('户型解析已取消', 'AbortError')
  }
}

function classifyPixels(data: Uint8ClampedArray, width: number, height: number) {
  const floorMask = new Uint8Array(width * height)
  let floorCount = 0

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const chroma = max - min
      const pixelIndex = y * width + x

      // Warm beige / yellow fill is the typical floor-plan room color.
      const isWarmFloor =
        max > 142 &&
        r >= g - 3 &&
        g > b &&
        r - b > 24 &&
        g - b > 12 &&
        chroma / Math.max(max, 1) > 0.075

      if (isWarmFloor) {
        floorMask[pixelIndex] = 1
        floorCount += 1
      }
    }
  }

  return { floorMask, floorCount }
}

function getMaskBBox(mask: Uint8Array, width: number, height: number): PlanRectPx | null {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (mask[y * width + x]) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX < 0) return null
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

function cropMask(mask: Uint8Array, width: number, crop: PlanRectPx): Uint8Array {
  const out = new Uint8Array(crop.w * crop.h)
  for (let y = 0; y < crop.h; y += 1) {
    const sourceStart = (y + crop.y) * width + crop.x
    out.set(mask.subarray(sourceStart, sourceStart + crop.w), y * crop.w)
  }
  return out
}

/** 3x3 opening, using an integral image for speed. Keeps thick walls, drops text and thin strokes. */
function fillInteriorHoles(mask: Uint8Array, width: number, height: number): Uint8Array {
  const exterior = new Uint8Array(mask.length)
  const stack = new Int32Array(width * height)
  let top = 0

  const push = (index: number) => {
    if (!mask[index] && !exterior[index]) {
      exterior[index] = 1
      stack[top++] = index
    }
  }

  for (let x = 0; x < width; x += 1) {
    push(x)
    push((height - 1) * width + x)
  }
  for (let y = 0; y < height; y += 1) {
    push(y * width)
    push(y * width + width - 1)
  }

  while (top > 0) {
    const current = stack[--top]
    const y = Math.floor(current / width)
    const x = current - y * width
    if (x > 0) push(current - 1)
    if (x < width - 1) push(current + 1)
    if (y > 0) push(current - width)
    if (y < height - 1) push(current + width)
  }

  const filled = new Uint8Array(mask.length)
  for (let i = 0; i < mask.length; i += 1) {
    filled[i] = mask[i] || !exterior[i] ? 1 : 0
  }
  return filled
}

function dilate(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  let current = mask
  for (let r = 0; r < radius; r += 1) {
    const next = new Uint8Array(current.length)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = y * width + x
        if (
          current[i] ||
          (x > 0 && current[i - 1]) ||
          (x < width - 1 && current[i + 1]) ||
          (y > 0 && current[i - width]) ||
          (y < height - 1 && current[i + width])
        ) {
          next[i] = 1
        }
      }
    }
    current = next
  }
  return current
}


function boundaryMask(mask: Uint8Array, width: number, height: number): Uint8Array {
  const boundary = new Uint8Array(mask.length)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x
      if (!mask[i]) continue
      if (
        x === 0 ||
        x === width - 1 ||
        y === 0 ||
        y === height - 1 ||
        !mask[i - 1] ||
        !mask[i + 1] ||
        !mask[i - width] ||
        !mask[i + width]
      ) {
        boundary[i] = 1
      }
    }
  }
  return boundary
}

/** Zhang–Suen thinning: turns the boundary ribbon into thin wall centerlines. */
function thinGrid(input: Uint8Array, width: number, height: number): Uint8Array {
  const grid = new Uint8Array(input)
  if (width < 3 || height < 3) return grid
  let changed = true
  let guard = 0

  while (changed && guard < 40) {
    guard += 1
    changed = false
    for (let pass = 0; pass < 2; pass += 1) {
      const remove: number[] = []
      for (let y = 1; y < height - 1; y += 1) {
        for (let x = 1; x < width - 1; x += 1) {
          const i = y * width + x
          if (!grid[i]) continue
          const p2 = grid[i - width]
          const p3 = grid[i - width + 1]
          const p4 = grid[i + 1]
          const p5 = grid[i + width + 1]
          const p6 = grid[i + width]
          const p7 = grid[i + width - 1]
          const p8 = grid[i - 1]
          const p9 = grid[i - width - 1]
          const neighbours = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9
          if (neighbours < 2 || neighbours > 6) continue
          const sequence = [p2, p3, p4, p5, p6, p7, p8, p9, p2]
          let transitions = 0
          for (let k = 0; k < 8; k += 1) {
            if (!sequence[k] && sequence[k + 1]) transitions += 1
          }
          if (transitions !== 1) continue
          if (pass === 0) {
            if (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) continue
          } else if (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) {
            continue
          }
          remove.push(i)
        }
      }
      for (const index of remove) grid[index] = 0
      if (remove.length > 0) changed = true
    }
  }
  return grid
}

function buildBoundaryWallGrid(
  floor: Uint8Array,
  width: number,
  height: number,
): { cols: number; rows: number; cellPx: number; grid: Uint8Array; boundary: Uint8Array } {
  const boundary = boundaryMask(floor, width, height)
  const cellPx = clamp(Math.round(Math.min(width, height) / 190), 3, 5)
  const cols = Math.ceil(width / cellPx)
  const rows = Math.ceil(height / cellPx)
  const seed = new Uint8Array(cols * rows)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (boundary[y * width + x]) {
        seed[Math.floor(y / cellPx) * cols + Math.floor(x / cellPx)] = 1
      }
    }
  }

  // One grid-cell dilation gives walls a believable ~10-16 cm thickness and
  // closes the single-pixel seams where two rooms share a partition line.
  const grid = new Uint8Array(seed.length)
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const i = y * cols + x
      if (
        seed[i] ||
        (x > 0 && seed[i - 1]) ||
        (x < cols - 1 && seed[i + 1]) ||
        (y > 0 && seed[i - cols]) ||
        (y < rows - 1 && seed[i + cols])
      ) {
        grid[i] = 1
      }
    }
  }

  return { cols, rows, cellPx, grid, boundary }
}

/** Greedy maximal-rectangle decomposition. Keeps the wall render to a compact set of boxes. */
function decomposeGrid(grid: Uint8Array, cols: number, rows: number): PlanRectPx[] {
  const rects: PlanRectPx[] = []

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!grid[y * cols + x]) continue

      let width = 0
      while (x + width < cols && grid[y * cols + x + width]) width += 1

      let bestWidth = width
      let bestHeight = 1
      let minWidth = width

      for (let h = 1; y + h < rows; h += 1) {
        let rowWidth = 0
        while (
          rowWidth < minWidth &&
          grid[(y + h) * cols + x + rowWidth]
        ) {
          rowWidth += 1
        }
        if (rowWidth === 0) break
        minWidth = rowWidth
        const area = minWidth * (h + 1)
        if (area > bestWidth * bestHeight) {
          bestWidth = minWidth
          bestHeight = h + 1
        }
      }

      for (let yy = y; yy < y + bestHeight; yy += 1) {
        for (let xx = x; xx < x + bestWidth; xx += 1) {
          grid[yy * cols + xx] = 0
        }
      }

      rects.push({ x, y, w: bestWidth, h: bestHeight })
    }
  }

  return rects
}

function maskToAlphaCanvas(
  mask: Uint8Array,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')!
  const imageData = context.createImageData(width, height)
  for (let i = 0; i < mask.length; i += 1) {
    const value = mask[i] ? 255 : 0
    const pointer = i * 4
    imageData.data[pointer] = value
    imageData.data[pointer + 1] = value
    imageData.data[pointer + 2] = value
    imageData.data[pointer + 3] = 255
  }
  context.putImageData(imageData, 0, 0)
  return canvas
}

function fallbackCrop(width: number, height: number): PlanRectPx {
  const marginX = Math.round(width * 0.03)
  const marginY = Math.round(height * 0.03)
  return {
    x: marginX,
    y: marginY,
    w: width - marginX * 2,
    h: height - marginY * 2,
  }
}

export async function analyzeFloorPlan(
  dataUrl: string,
  sourceName: string,
  options: PlanAnalysisOptions = {},
): Promise<PlanState> {
  const progress = options.onProgress
  report(progress, 0.04, '读取户型图')
  await nextFrame()
  throwIfAborted(options.signal)

  const image = await loadImage(dataUrl)
  const ratio = Math.min(1, MAX_WORKING_DIM / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * ratio))
  const height = Math.max(1, Math.round(image.naturalHeight * ratio))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })!
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)
  const data = context.getImageData(0, 0, width, height).data

  report(progress, 0.18, '分析空间色彩')
  await nextFrame()
  throwIfAborted(options.signal)
  const { floorMask, floorCount: initialFloorCount } = classifyPixels(data, width, height)
  let floorCount = initialFloorCount

  report(progress, 0.32, '定位户型边界')
  await nextFrame()
  throwIfAborted(options.signal)

  let crop = getMaskBBox(floorMask, width, height)
  const floorRatio = floorCount / (width * height)
  if (!crop || floorRatio < 0.005) {
    // Fallback for monochrome plans: use all non-background content.
    const content = new Uint8Array(width * height)
    for (let i = 0; i < width * height; i += 1) {
      const p = i * 4
      const r = data[p]
      const g = data[p + 1]
      const b = data[p + 2]
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722
      if (max < 246 || max - min > 12 || luminance < 238) content[i] = 1
    }
    crop = getMaskBBox(content, width, height) ?? fallbackCrop(width, height)
    floorMask.set(content)
    floorCount = content.reduce((sum, value) => sum + value, 0)
  }

  const padding = Math.max(6, Math.round(Math.min(crop.w, crop.h) * 0.014))
  crop = {
    x: clamp(crop.x - padding, 0, width - 1),
    y: clamp(crop.y - padding, 0, height - 1),
    w: clamp(crop.w + padding * 2, 1, width),
    h: clamp(crop.h + padding * 2, 1, height),
  }
  crop.w = Math.min(crop.w, width - crop.x)
  crop.h = Math.min(crop.h, height - crop.y)

  report(progress, 0.46, '提取墙体结构')
  await nextFrame()
  throwIfAborted(options.signal)
  const croppedFloor = cropMask(floorMask, width, crop)
  let croppedFloorCount = 0
  for (let i = 0; i < croppedFloor.length; i += 1) croppedFloorCount += croppedFloor[i]
  if (croppedFloorCount > 0) floorCount = croppedFloorCount

  // Floor boundaries are the most stable wall signal in stylized floor plans:
  // even a one-pixel partition line is preserved, while labels and furniture
  // symbols are absorbed by hole filling before boundary tracing.
  const filledFloor = fillInteriorHoles(croppedFloor, crop.w, crop.h)
  const wallGrid = buildBoundaryWallGrid(filledFloor, crop.w, crop.h)

  report(progress, 0.6, '重建墙体几何')
  await nextFrame()
  throwIfAborted(options.signal)
  const skeleton = thinGrid(wallGrid.grid, wallGrid.cols, wallGrid.rows)
  const wallRectsCells = decomposeGrid(skeleton, wallGrid.cols, wallGrid.rows)
  const wallRectsPx: PlanRectPx[] = wallRectsCells
    .map((rect) => ({
      x: rect.x * wallGrid.cellPx,
      y: rect.y * wallGrid.cellPx,
      w: Math.min(rect.w * wallGrid.cellPx, crop.w - rect.x * wallGrid.cellPx),
      h: Math.min(rect.h * wallGrid.cellPx, crop.h - rect.y * wallGrid.cellPx),
    }))
    .filter((rect) => rect.w >= 2 && rect.h >= 2)

  report(progress, 0.74, '生成可通行地面')
  await nextFrame()
  throwIfAborted(options.signal)
  let footprint = filledFloor
  // Push the floor under walls so no gap appears at wall bases.
  footprint = dilate(footprint, crop.w, crop.h, Math.max(4, Math.round(wallGrid.cellPx * 1.6)))
  footprint = fillInteriorHoles(footprint, crop.w, crop.h)

  const alphaCanvas = maskToAlphaCanvas(footprint, crop.w, crop.h)
  const floorAlphaUrl = alphaCanvas.toDataURL('image/png')
  const imageUrl = canvas.toDataURL('image/jpeg', 0.9)
  const underlayCanvas = document.createElement('canvas')
  underlayCanvas.width = crop.w
  underlayCanvas.height = crop.h
  underlayCanvas
    .getContext('2d')!
    .drawImage(canvas, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h)
  const underlayUrl = underlayCanvas.toDataURL('image/jpeg', 0.86)

  const floorPixels = Math.max(1, floorCount)
  const inferredScale = Math.sqrt(TARGET_FLOOR_AREA / floorPixels)
  const widthM = options.widthM ?? clamp(crop.w * inferredScale, 9, 28)
  const scale = widthM / crop.w
  const floorAreaM2 = floorPixels * scale * scale
  const rooms = detectRooms({
    floor: filledFloor,
    wallGrid: wallGrid.grid,
    cols: wallGrid.cols,
    rows: wallGrid.rows,
    cellPx: wallGrid.cellPx,
    crop,
    scale,
  })

  report(progress, 0.9, '布置三维场景')
  await nextFrame()
  throwIfAborted(options.signal)

  const plan: PlanState = {
    id: uid('plan'),
    name: sourceName.replace(/\.[^.]+$/, '') || '未命名户型',
    imageUrl,
    underlayUrl,
    imageWidth: width,
    imageHeight: height,
    crop,
    floorAlphaUrl,
    wallRectsPx,
    wallCellPx: wallGrid.cellPx,
    widthM,
    scale,
    floorAreaM2,
    wallCount: wallRectsPx.length,
    rooms,
    detectedAt: new Date().toISOString(),
  }

  report(progress, 1, '空间生成完成')
  await nextFrame()
  throwIfAborted(options.signal)
  return plan
}

export function resizePlanWidth(plan: PlanState, widthM: number): PlanState {
  const nextWidth = clamp(widthM, 5, 60)
  const nextScale = nextWidth / plan.crop.w
  const previousArea = Math.max(plan.floorAreaM2, 0.1)
  const areaFactor = (nextWidth / Math.max(plan.widthM, 0.1)) ** 2
  const roomFactor = nextWidth / Math.max(plan.widthM, 0.1)
  return {
    ...plan,
    widthM: nextWidth,
    scale: nextScale,
    floorAreaM2: previousArea * areaFactor,
    rooms: plan.rooms?.map((room) => ({
      ...room,
      area: room.area * areaFactor,
      minX: room.minX * roomFactor,
      maxX: room.maxX * roomFactor,
      minZ: room.minZ * roomFactor,
      maxZ: room.maxZ * roomFactor,
      centerX: room.centerX * roomFactor,
      centerZ: room.centerZ * roomFactor,
    })),
  }
}
