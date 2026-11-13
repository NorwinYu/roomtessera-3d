import {
  CanvasTexture,
  LinearFilter,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from 'three'
import type { FloorPreset } from '../types'
import { mixHex } from './utils'

const SIZE = 1024

interface FloorMaterialConfig {
  roughness: number
  metalness: number
  textureScale: number
}

const FLOOR_CONFIG: Record<FloorPreset, FloorMaterialConfig> = {
  oak: { roughness: 0.68, metalness: 0.01, textureScale: 3.4 },
  walnut: { roughness: 0.6, metalness: 0.01, textureScale: 3.4 },
  marble: { roughness: 0.3, metalness: 0.03, textureScale: 4.2 },
  terrazzo: { roughness: 0.72, metalness: 0.01, textureScale: 3 },
  concrete: { roughness: 0.86, metalness: 0.02, textureScale: 4.8 },
  tile: { roughness: 0.48, metalness: 0.02, textureScale: 2.4 },
}

const cache = new Map<FloorPreset, Texture>()

function mulberry32(seed: number) {
  let value = seed
  return () => {
    value |= 0
    value = (value + 0x6d2b79f5) | 0
    let t = Math.imul(value ^ (value >>> 15), 1 | value)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function baseCanvas() {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const context = canvas.getContext('2d')!
  return { canvas, context }
}

function drawWood(base: string, dark: string, light: string, seed: number) {
  const { canvas, context } = baseCanvas()
  const random = mulberry32(seed)
  context.fillStyle = base
  context.fillRect(0, 0, SIZE, SIZE)

  const plankCount = 6
  const plankWidth = SIZE / plankCount
  for (let i = 0; i < plankCount; i += 1) {
    const x = i * plankWidth
    const tone = random()
    context.fillStyle = mixHex(base, tone > 0.5 ? light : dark, 0.08 + random() * 0.14)
    context.fillRect(x + 1, 0, plankWidth - 2, SIZE)

    // Long grain lines.
    for (let line = 0; line < 24; line += 1) {
      const offset = x + 8 + random() * (plankWidth - 16)
      context.strokeStyle = `rgba(70, 44, 25, ${0.035 + random() * 0.05})`
      context.lineWidth = 0.7 + random() * 1.2
      context.beginPath()
      context.moveTo(offset, 0)
      let y = 0
      let cx = offset
      while (y < SIZE) {
        y += 60 + random() * 100
        cx += (random() - 0.5) * 13
        context.lineTo(cx, Math.min(y, SIZE))
      }
      context.stroke()
    }

    // Occasional knots.
    if (random() > 0.45) {
      const knotX = x + plankWidth * (0.25 + random() * 0.5)
      const knotY = random() * SIZE
      context.strokeStyle = 'rgba(77, 50, 30, 0.15)'
      context.lineWidth = 1.4
      for (let ring = 1; ring < 4; ring += 1) {
        context.beginPath()
        context.ellipse(knotX, knotY, ring * 4, ring * 11, 0.2, 0, Math.PI * 2)
        context.stroke()
      }
    }

    // Seam shadow.
    const gradient = context.createLinearGradient(x, 0, x + 12, 0)
    gradient.addColorStop(0, 'rgba(38, 24, 15, 0.2)')
    gradient.addColorStop(1, 'rgba(38, 24, 15, 0)')
    context.fillStyle = gradient
    context.fillRect(x, 0, 14, SIZE)
  }

  // Staggered horizontal joints.
  for (let row = 0; row < 3; row += 1) {
    const y = (row + 1) * (SIZE / 3) + (random() - 0.5) * 50
    context.strokeStyle = 'rgba(48, 30, 18, 0.12)'
    context.lineWidth = 1.2
    for (let i = 0; i < plankCount; i += 1) {
      const start = i * plankWidth + (i % 2 === 0 ? 0 : plankWidth / 2)
      context.beginPath()
      context.moveTo(start, y)
      context.lineTo(Math.min(start + plankWidth, SIZE), y)
      context.stroke()
    }
  }
  return canvas
}

function drawMarble() {
  const { canvas, context } = baseCanvas()
  const random = mulberry32(901)
  const gradient = context.createLinearGradient(0, 0, SIZE, SIZE)
  gradient.addColorStop(0, '#f3f1ec')
  gradient.addColorStop(0.45, '#e7e3db')
  gradient.addColorStop(1, '#f5f3ee')
  context.fillStyle = gradient
  context.fillRect(0, 0, SIZE, SIZE)

  for (let i = 0; i < 90; i += 1) {
    context.fillStyle = `rgba(120, 116, 108, ${0.012 + random() * 0.025})`
    context.beginPath()
    context.ellipse(
      random() * SIZE,
      random() * SIZE,
      10 + random() * 90,
      2 + random() * 16,
      random() * Math.PI,
      0,
      Math.PI * 2,
    )
    context.fill()
  }

  for (let vein = 0; vein < 12; vein += 1) {
    const startX = random() * SIZE
    const startY = random() * SIZE
    context.strokeStyle = `rgba(90, 94, 96, ${0.08 + random() * 0.14})`
    context.lineWidth = 0.5 + random() * 1.8
    context.beginPath()
    context.moveTo(startX, startY)
    let x = startX
    let y = startY
    for (let step = 0; step < 7; step += 1) {
      x += (random() - 0.35) * 160
      y += (random() - 0.2) * 120
      context.quadraticCurveTo(
        x + (random() - 0.5) * 80,
        y + (random() - 0.5) * 80,
        x,
        y,
      )
    }
    context.stroke()

    if (random() > 0.55) {
      context.strokeStyle = 'rgba(120, 120, 115, 0.05)'
      context.lineWidth = 7 + random() * 8
      context.stroke()
    }
  }
  return canvas
}

function drawTerrazzo() {
  const { canvas, context } = baseCanvas()
  const random = mulberry32(442)
  context.fillStyle = '#dfdbd0'
  context.fillRect(0, 0, SIZE, SIZE)
  const colors = ['#a7a092', '#c0b8a8', '#7f8a80', '#b78f75', '#e8e2d8', '#938b7d']

  for (let i = 0; i < 1300; i += 1) {
    const radius = 1.2 + random() * 8
    context.fillStyle = colors[Math.floor(random() * colors.length)]
    context.globalAlpha = 0.28 + random() * 0.48
    context.beginPath()
    const x = random() * SIZE
    const y = random() * SIZE
    const points = 5 + Math.floor(random() * 4)
    for (let p = 0; p < points; p += 1) {
      const angle = (p / points) * Math.PI * 2
      const r = radius * (0.55 + random() * 0.7)
      const px = x + Math.cos(angle) * r
      const py = y + Math.sin(angle) * r
      if (p === 0) context.moveTo(px, py)
      else context.lineTo(px, py)
    }
    context.closePath()
    context.fill()
  }
  context.globalAlpha = 1
  return canvas
}

function drawConcrete() {
  const { canvas, context } = baseCanvas()
  const random = mulberry32(778)
  context.fillStyle = '#aaa79e'
  context.fillRect(0, 0, SIZE, SIZE)

  for (let i = 0; i < 6000; i += 1) {
    const alpha = 0.015 + random() * 0.045
    context.fillStyle = random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(40,40,36,${alpha})`
    const size = 0.5 + random() * 2.4
    context.fillRect(random() * SIZE, random() * SIZE, size, size)
  }

  for (let i = 0; i < 20; i += 1) {
    const gradient = context.createRadialGradient(
      random() * SIZE,
      random() * SIZE,
      2,
      random() * SIZE,
      random() * SIZE,
      80 + random() * 280,
    )
    gradient.addColorStop(0, 'rgba(255,255,255,0.04)')
    gradient.addColorStop(1, 'rgba(60,60,55,0.03)')
    context.fillStyle = gradient
    context.fillRect(0, 0, SIZE, SIZE)
  }
  return canvas
}

function drawTile() {
  const { canvas, context } = baseCanvas()
  const random = mulberry32(213)
  context.fillStyle = '#b7b0a4'
  context.fillRect(0, 0, SIZE, SIZE)
  const cols = 4
  const rows = 4
  const gap = 5
  const tileW = SIZE / cols
  const tileH = SIZE / rows

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const tone = random()
      context.fillStyle = mixHex('#bbb4a8', tone > 0.5 ? '#d4cec3' : '#a49d91', 0.28)
      context.fillRect(
        col * tileW + gap,
        row * tileH + gap,
        tileW - gap * 2,
        tileH - gap * 2,
      )
      context.strokeStyle = 'rgba(255,255,255,0.12)'
      context.lineWidth = 1
      context.strokeRect(
        col * tileW + gap + 2,
        row * tileH + gap + 2,
        tileW - gap * 2 - 4,
        tileH - gap * 2 - 4,
      )

      for (let i = 0; i < 70; i += 1) {
        context.fillStyle = `rgba(${random() > 0.5 ? '255,255,255' : '70,68,63'},${random() * 0.035})`
        context.fillRect(
          col * tileW + gap + random() * (tileW - gap * 2),
          row * tileH + gap + random() * (tileH - gap * 2),
          1 + random() * 5,
          1 + random() * 2,
        )
      }
    }
  }
  return canvas
}

export function getFloorTexture(preset: FloorPreset): Texture {
  const cached = cache.get(preset)
  if (cached) return cached

  let canvas: HTMLCanvasElement
  switch (preset) {
    case 'walnut':
      canvas = drawWood('#6f4d37', '#3f2a1c', '#997357', 23)
      break
    case 'marble':
      canvas = drawMarble()
      break
    case 'terrazzo':
      canvas = drawTerrazzo()
      break
    case 'concrete':
      canvas = drawConcrete()
      break
    case 'tile':
      canvas = drawTile()
      break
    case 'oak':
    default:
      canvas = drawWood('#c3a077', '#7d5a3d', '#dfc09a', 19)
      break
  }

  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8
  texture.needsUpdate = true
  cache.set(preset, texture)
  return texture
}

export function getFloorConfig(preset: FloorPreset): FloorMaterialConfig {
  return FLOOR_CONFIG[preset]
}

export function prepareFloorMap(texture: Texture, width: number, depth: number, preset: FloorPreset): Texture {
  const config = FLOOR_CONFIG[preset]
  const map = texture.clone()
  map.wrapS = RepeatWrapping
  map.wrapT = RepeatWrapping
  map.colorSpace = SRGBColorSpace
  map.anisotropy = 8
  map.repeat.set(
    Math.max(1, width / config.textureScale),
    Math.max(1, depth / config.textureScale),
  )
  map.needsUpdate = true
  return map
}

export function prepareAlphaTexture(texture: Texture): Texture {
  const alpha = texture.clone()
  alpha.colorSpace = NoColorSpace
  alpha.wrapS = RepeatWrapping
  alpha.wrapT = RepeatWrapping
  alpha.minFilter = LinearFilter
  alpha.magFilter = LinearFilter
  alpha.needsUpdate = true
  return alpha
}
