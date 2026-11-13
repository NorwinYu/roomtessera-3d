import type { PlanState } from '../types'

export interface WallContour {
  points: [number, number][]
  holes: [number, number][][]
}

interface CellEdge {
  from: string
  to: string
  fx: number
  fy: number
  tx: number
  ty: number
  dx: number
  dy: number
  used: boolean
}

const keyOf = (x: number, y: number) => `${x},${y}`

function pointInPolygon(x: number, y: number, polygon: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-12) + xi) {
      inside = !inside
    }
  }
  return inside
}

function signedArea(points: [number, number][]): number {
  let area = 0
  for (let i = 0; i < points.length; i += 1) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    area += x1 * y2 - x2 * y1
  }
  return area / 2
}

function simplifyCollinear(points: [number, number][]): [number, number][] {
  if (points.length < 4) return points
  const out: [number, number][] = []
  for (let i = 0; i < points.length; i += 1) {
    const prev = out[out.length - 1] ?? points[(i - 1 + points.length) % points.length]
    const curr = points[i]
    const next = points[(i + 1) % points.length]
    const cross = (curr[0] - prev[0]) * (next[1] - curr[1]) - (curr[1] - prev[1]) * (next[0] - curr[0])
    if (Math.abs(cross) > 1e-9) out.push(curr)
  }
  return out
}

/** Ramer–Douglas–Peucker simplification. */
function snapOrthogonal(
  points: [number, number][],
  tolerance: number,
): [number, number][] {
  if (points.length < 4) return points
  const n = points.length
  const horizontal: { index: number; next: number; coord: number; weight: number }[] = []
  const vertical: { index: number; next: number; coord: number; weight: number }[] = []
  for (let i = 0; i < n; i += 1) {
    const current = points[i]
    const next = points[(i + 1) % n]
    if (Math.abs(current[1] - next[1]) < 1e-6) {
      horizontal.push({ index: i, next: (i + 1) % n, coord: current[1], weight: Math.abs(next[0] - current[0]) })
    } else if (Math.abs(current[0] - next[0]) < 1e-6) {
      vertical.push({ index: i, next: (i + 1) % n, coord: current[0], weight: Math.abs(next[1] - current[1]) })
    }
  }

  const cluster = (edges: { coord: number; weight: number }[]) => {
    const sorted = [...edges].sort((a, b) => a.coord - b.coord)
    const centers = new Map<number, number>()
    let current: typeof sorted = []
    let anchor = 0
    const flush = () => {
      if (current.length === 0) return
      const total = current.reduce((sum, edge) => sum + Math.max(0.01, edge.weight), 0)
      const center =
        current.reduce((sum, edge) => sum + edge.coord * Math.max(0.01, edge.weight), 0) / total
      for (const edge of current) centers.set(edge.coord, center)
      current = []
    }
    for (const edge of sorted) {
      if (current.length === 0) {
        anchor = edge.coord
        current.push(edge)
      } else if (edge.coord - anchor <= tolerance) {
        current.push(edge)
      } else {
        flush()
        anchor = edge.coord
        current.push(edge)
      }
    }
    flush()
    return centers
  }

  const yCenters = cluster(horizontal)
  const xCenters = cluster(vertical)
  const result: [number, number][] = points.map((point) => [point[0], point[1]])
  for (const edge of horizontal) {
    const y = yCenters.get(edge.coord)
    if (y === undefined) continue
    result[edge.index][1] = y
    result[edge.next][1] = y
  }
  for (const edge of vertical) {
    const x = xCenters.get(edge.coord)
    if (x === undefined) continue
    result[edge.index][0] = x
    result[edge.next][0] = x
  }

  const cleaned: [number, number][] = []
  for (const point of result) {
    const last = cleaned[cleaned.length - 1]
    if (!last || last[0] !== point[0] || last[1] !== point[1]) cleaned.push(point)
  }
  if (cleaned.length > 1) {
    const first = cleaned[0]
    const last = cleaned[cleaned.length - 1]
    if (first[0] === last[0] && first[1] === last[1]) cleaned.pop()
  }
  return simplifyCollinear(cleaned)
}

function orientation(a: [number, number], b: [number, number], c: [number, number]): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

function onSegment(a: [number, number], b: [number, number], c: [number, number]): boolean {
  return (
    Math.min(a[0], b[0]) - 1e-9 <= c[0] &&
    c[0] <= Math.max(a[0], b[0]) + 1e-9 &&
    Math.min(a[1], b[1]) - 1e-9 <= c[1] &&
    c[1] <= Math.max(a[1], b[1]) + 1e-9
  )
}

function segmentsCross(
  a: [number, number],
  b: [number, number],
  c: [number, number],
  d: [number, number],
): boolean {
  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)
  if (o1 * o2 < -1e-9 && o3 * o4 < -1e-9) return true
  if (Math.abs(o1) <= 1e-9 && onSegment(a, b, c)) return true
  if (Math.abs(o2) <= 1e-9 && onSegment(a, b, d)) return true
  if (Math.abs(o3) <= 1e-9 && onSegment(c, d, a)) return true
  if (Math.abs(o4) <= 1e-9 && onSegment(c, d, b)) return true
  return false
}

function isSimpleLoop(points: [number, number][]): boolean {
  const n = points.length
  if (n < 4) return true
  for (let i = 0; i < n; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % n]
    for (let j = i + 1; j < n; j += 1) {
      if (j === i || j === (i + 1) % n || (j + 1) % n === i) continue
      const c = points[j]
      const d = points[(j + 1) % n]
      if (segmentsCross(a, b, c, d)) return false
    }
  }
  return true
}

function isOrthogonalLoop(points: [number, number][]): boolean {
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i]
    const next = points[(i + 1) % points.length]
    if (Math.abs(current[0] - next[0]) > 1e-6 && Math.abs(current[1] - next[1]) > 1e-6) {
      return false
    }
  }
  return true
}

function chooseNextEdge(incoming: CellEdge, candidates: CellEdge[]): CellEdge {
  // Prefer a right turn (keeping the filled region on the right), then straight,
  // then left. This resolves diagonal-touch vertices consistently.
  const order = [
    { dx: -incoming.dy, dy: incoming.dx }, // right turn
    { dx: incoming.dx, dy: incoming.dy },
    { dx: incoming.dy, dy: -incoming.dx },
  ]
  for (const direction of order) {
    const found = candidates.find(
      (edge) => !edge.used && edge.dx === direction.dx && edge.dy === direction.dy,
    )
    if (found) return found
  }
  return candidates.find((edge) => !edge.used) ?? candidates[0]
}

/**
 * Extracts the continuous footprint of the wall mask as simplified polygons.
 * The result is extruded as a single solid, so walls cannot separate into
 * isolated sticks even for noisy or thick load-bearing wall regions.
 */
interface WallMask {
  mask: Uint8Array
  cols: number
  rows: number
  cellPx: number
}

function buildWallMask(plan: PlanState): WallMask {
  const cellPx = Math.max(2, plan.wallCellPx ?? 3)
  const cols = Math.ceil(plan.crop.w / cellPx)
  const rows = Math.ceil(plan.crop.h / cellPx)
  const seed = new Uint8Array(cols * rows)

  for (const rect of plan.wallRectsPx) {
    const sx = Math.max(0, Math.floor(rect.x / cellPx))
    const ex = Math.min(cols, Math.ceil((rect.x + rect.w) / cellPx))
    const sy = Math.max(0, Math.floor(rect.y / cellPx))
    const ey = Math.min(rows, Math.ceil((rect.y + rect.h) / cellPx))
    for (let y = sy; y < ey; y += 1) {
      for (let x = sx; x < ex; x += 1) seed[y * cols + x] = 1
    }
  }

  let mask = new Uint8Array(seed.length)
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      let count = 0
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) count += seed[ny * cols + nx]
        }
      }
      mask[y * cols + x] = count >= 3 ? 1 : 0
    }
  }
  const grown = new Uint8Array(mask.length)
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const i = y * cols + x
      grown[i] =
        mask[i] ||
        (x > 0 && mask[i - 1]) ||
        (x < cols - 1 && mask[i + 1]) ||
        (y > 0 && mask[i - cols]) ||
        (y < rows - 1 && mask[i + cols])
          ? 1
          : 0
    }
  }
  return { mask: grown, cols, rows, cellPx }
}

export function buildWallFootprints(plan: PlanState): WallContour[] {
  const { mask, cols, rows, cellPx } = buildWallMask(plan)

  // Directed cell edges: top, right, bottom, left. Fill stays on the right.
  const outgoing = new Map<string, CellEdge[]>()
  const addEdge = (fx: number, fy: number, tx: number, ty: number) => {
    const edge: CellEdge = {
      from: keyOf(fx, fy),
      to: keyOf(tx, ty),
      fx,
      fy,
      tx,
      ty,
      dx: tx - fx,
      dy: ty - fy,
      used: false,
    }
    const list = outgoing.get(edge.from)
    if (list) list.push(edge)
    else outgoing.set(edge.from, [edge])
  }

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      if (!mask[y * cols + x]) continue
      if (y === 0 || !mask[(y - 1) * cols + x]) addEdge(x, y, x + 1, y)
      if (x === cols - 1 || !mask[y * cols + x + 1]) addEdge(x + 1, y, x + 1, y + 1)
      if (y === rows - 1 || !mask[(y + 1) * cols + x]) addEdge(x + 1, y + 1, x, y + 1)
      if (x === 0 || !mask[y * cols + x - 1]) addEdge(x, y + 1, x, y)
    }
  }

  const loops: [number, number][][] = []
  for (const edges of outgoing.values()) {
    for (const startEdge of edges) {
      if (startEdge.used) continue
      const loop: [number, number][] = []
      let edge: CellEdge = startEdge
      const startKey = edge.from
      let guard = 0
      while (guard < 200000) {
        guard += 1
        edge.used = true
        loop.push([edge.fx, edge.fy])
        if (edge.to === startKey) break
        const candidates = outgoing.get(edge.to)
        if (!candidates || candidates.length === 0) break
        const next = chooseNextEdge(edge, candidates)
        if (next.used) break
        edge = next
      }
      if (loop.length >= 4) loops.push(loop)
    }
  }

  const contours: { points: [number, number][]; area: number }[] = []
  for (const loop of loops) {
    const simplifiedLoop = simplifyCollinear(loop)
    if (simplifiedLoop.length < 3) continue
    const tolerances = [0.3, 0.22, 0.15]
    let simplified = simplifyCollinear(loop)
    for (const meters of tolerances) {
      const candidate = snapOrthogonal(
        simplifiedLoop,
        Math.max(1.2, meters / (cellPx * plan.scale)),
      )
      if (
        candidate.length >= 3 &&
        isOrthogonalLoop(candidate) &&
        isSimpleLoop(candidate)
      ) {
        simplified = candidate
        break
      }
    }
    if (simplified.length < 3) continue
    const world: [number, number][] = simplified.map(([x, y]) => [
      (x * cellPx - plan.crop.w / 2) * plan.scale,
      (y * cellPx - plan.crop.h / 2) * plan.scale,
    ])
    if (world.length < 3) continue
    const area = signedArea(world)
    if (Math.abs(area) < 0.02) continue
    contours.push({ points: world, area })
  }

  const outer = contours
    .filter((contour) => contour.area > 0)
    .map((contour) => ({ ...contour, holes: [] as [number, number][][] }))
  const holes = contours.filter((contour) => contour.area < 0)

  for (const hole of holes) {
    const cx = hole.points.reduce((sum, point) => sum + point[0], 0) / hole.points.length
    const cy = hole.points.reduce((sum, point) => sum + point[1], 0) / hole.points.length
    const containers = outer
      .filter((candidate) => pointInPolygon(cx, cy, candidate.points))
      .sort((a, b) => a.area - b.area)
    const parent = containers[0]
    if (parent) parent.holes.push(hole.points)
  }

  return outer.map((contour) => ({ points: contour.points, holes: contour.holes }))
}
