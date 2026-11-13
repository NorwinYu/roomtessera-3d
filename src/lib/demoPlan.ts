import type { FurnitureItem, PlanState } from '../types'
import { uid } from './utils'

const WIDTH = 1200
const HEIGHT = 840

interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
}

function wallSegment(
  context: CanvasRenderingContext2D,
  segment: Segment,
  color = '#25261f',
  thickness = 11,
) {
  context.strokeStyle = color
  context.lineWidth = thickness
  context.lineCap = 'square'
  context.beginPath()
  context.moveTo(segment.x1, segment.y1)
  context.lineTo(segment.x2, segment.y2)
  context.stroke()
}

function label(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size = 25,
  color = '#6c624d',
) {
  context.fillStyle = color
  context.font = `500 ${size}px "PingFang SC", "Noto Sans SC", sans-serif`
  context.textAlign = 'center'
  context.fillText(text, x, y)
}

function doorArc(context: CanvasRenderingContext2D, x: number, y: number, radius = 42, rotation = 0) {
  context.save()
  context.translate(x, y)
  context.rotate(rotation)
  context.strokeStyle = '#9b927f'
  context.lineWidth = 2
  context.beginPath()
  context.arc(0, 0, radius, 0, Math.PI / 2)
  context.stroke()
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(radius, 0)
  context.stroke()
  context.restore()
}

function windowLine(context: CanvasRenderingContext2D, segment: Segment) {
  context.strokeStyle = '#758c91'
  context.lineWidth = 3
  context.beginPath()
  context.moveTo(segment.x1, segment.y1)
  context.lineTo(segment.x2, segment.y2)
  context.stroke()
  context.strokeStyle = '#ffffff'
  context.lineWidth = 1
}

function drawDemoPlan(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const context = canvas.getContext('2d')!

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, WIDTH, HEIGHT)

  // Apartment envelope.
  context.fillStyle = '#f5e4a1'
  context.fillRect(64, 56, 1072, 724)

  // Subtle room-by-room tone shifts.
  context.fillStyle = '#f7e9b5'
  context.fillRect(64, 56, 356, 244)
  context.fillRect(64, 430, 356, 350)
  context.fillStyle = '#f1dda0'
  context.fillRect(850, 290, 286, 490)
  context.fillStyle = '#f3e2a7'
  context.fillRect(600, 290, 250, 180)
  context.fillStyle = '#e9dfbe'
  context.fillRect(430, 720, 400, 60)

  // Elevator / service shaft.
  context.fillStyle = '#ebe8df'
  context.fillRect(982, 58, 152, 150)
  context.strokeStyle = '#b8b1a2'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(982, 58)
  context.lineTo(1134, 208)
  context.moveTo(1134, 58)
  context.lineTo(982, 208)
  context.stroke()

  // Exterior walls (door opening on the right for the entry).
  wallSegment(context, { x1: 64, y1: 56, x2: 1136, y2: 56 }, '#25261f', 13)
  wallSegment(context, { x1: 64, y1: 56, x2: 64, y2: 780 }, '#25261f', 13)
  wallSegment(context, { x1: 64, y1: 780, x2: 523, y2: 780 }, '#25261f', 13)
  wallSegment(context, { x1: 686, y1: 780, x2: 1136, y2: 780 }, '#25261f', 13)
  wallSegment(context, { x1: 1136, y1: 56, x2: 1136, y2: 238 }, '#25261f', 13)
  wallSegment(context, { x1: 1136, y1: 306, x2: 1136, y2: 780 }, '#25261f', 13)

  // Interior partitions with door gaps.
  wallSegment(context, { x1: 420, y1: 56, x2: 420, y2: 238 })
  wallSegment(context, { x1: 420, y1: 292, x2: 420, y2: 300 })
  wallSegment(context, { x1: 64, y1: 300, x2: 300, y2: 300 })
  wallSegment(context, { x1: 354, y1: 300, x2: 420, y2: 300 })
  wallSegment(context, { x1: 64, y1: 430, x2: 355, y2: 430 })
  wallSegment(context, { x1: 408, y1: 430, x2: 420, y2: 430 })
  wallSegment(context, { x1: 240, y1: 300, x2: 240, y2: 358 })
  wallSegment(context, { x1: 240, y1: 404, x2: 240, y2: 430 })
  wallSegment(context, { x1: 420, y1: 430, x2: 420, y2: 540 })
  wallSegment(context, { x1: 420, y1: 600, x2: 420, y2: 720 })
  wallSegment(context, { x1: 420, y1: 720, x2: 600, y2: 720 })
  wallSegment(context, { x1: 670, y1: 720, x2: 830, y2: 720 })
  wallSegment(context, { x1: 600, y1: 56, x2: 600, y2: 250 })
  wallSegment(context, { x1: 600, y1: 304, x2: 600, y2: 400 })
  wallSegment(context, { x1: 420, y1: 210, x2: 520, y2: 210 })
  wallSegment(context, { x1: 574, y1: 210, x2: 600, y2: 210 })
  wallSegment(context, { x1: 600, y1: 290, x2: 690, y2: 290 })
  wallSegment(context, { x1: 744, y1: 290, x2: 850, y2: 290 })
  wallSegment(context, { x1: 600, y1: 470, x2: 760, y2: 470 })
  wallSegment(context, { x1: 814, y1: 470, x2: 850, y2: 470 })
  wallSegment(context, { x1: 850, y1: 290, x2: 850, y2: 500 })
  wallSegment(context, { x1: 850, y1: 556, x2: 850, y2: 780 })
  wallSegment(context, { x1: 982, y1: 208, x2: 1136, y2: 208 }, '#25261f', 9)
  wallSegment(context, { x1: 982, y1: 208, x2: 982, y2: 290 }, '#25261f', 9)

  // Windows (thin, non-structural lines).
  windowLine(context, { x1: 120, y1: 56, x2: 310, y2: 56 })
  windowLine(context, { x1: 900, y1: 56, x2: 960, y2: 56 })
  windowLine(context, { x1: 64, y1: 490, x2: 64, y2: 700 })
  windowLine(context, { x1: 900, y1: 780, x2: 1090, y2: 780 })
  windowLine(context, { x1: 523, y1: 780, x2: 686, y2: 780 })

  // Door swings.
  doorArc(context, 420, 238, 44, Math.PI / 2)
  doorArc(context, 300, 300, 42, 0)
  doorArc(context, 355, 430, 42, Math.PI)
  doorArc(context, 240, 358, 38, Math.PI / 2)
  doorArc(context, 420, 540, 45, Math.PI / 2)
  doorArc(context, 690, 290, 44, 0)
  doorArc(context, 850, 500, 44, Math.PI / 2)
  doorArc(context, 760, 470, 44, 0)
  doorArc(context, 600, 250, 42, Math.PI / 2)
  doorArc(context, 1136, 238, 45, Math.PI / 2)

  // Room labels and dimensions.
  label(context, '书房', 232, 176, 24)
  label(context, '8.9 m²', 232, 208, 17, '#8b816c')
  label(context, '厨房', 720, 175, 24)
  label(context, '7.2 m²', 720, 205, 17, '#8b816c')
  label(context, '家政间', 510, 130, 21)
  label(context, '餐厅', 712, 378, 25)
  label(context, '10.4 m²', 712, 410, 17, '#8b816c')
  label(context, '客厅', 650, 610, 27)
  label(context, '26.8 m²', 650, 643, 17, '#8b816c')
  label(context, '主卧', 218, 570, 26)
  label(context, '17.4 m²', 218, 602, 17, '#8b816c')
  label(context, '次卧', 986, 565, 26)
  label(context, '14.2 m²', 986, 597, 17, '#8b816c')
  label(context, '主卫', 152, 350, 19)
  label(context, '衣帽间', 330, 350, 18)
  label(context, '公卫', 510, 310, 18)
  label(context, '玄关', 1040, 250, 19)
  label(context, '阳台', 630, 758, 19)

  // A few 2D furniture hints, intentionally light so they do not affect wall detection.
  context.strokeStyle = '#b7a988'
  context.lineWidth = 2
  context.strokeRect(130, 535, 176, 208)
  context.strokeRect(905, 398, 176, 208)
  context.beginPath()
  context.arc(650, 570, 70, 0, Math.PI * 2)
  context.stroke()
  context.strokeRect(582, 330, 258, 118)
  context.strokeRect(175, 120, 130, 66)

  // Draw a scale bar.
  context.fillStyle = '#7e7564'
  context.fillRect(72, 806, 120, 3)
  context.fillRect(72, 801, 3, 12)
  context.fillRect(189, 801, 3, 12)
  context.font = '12px "PingFang SC", sans-serif'
  context.textAlign = 'left'
  context.fillText('0          3 m', 72, 833)

  return canvas
}

export function generateDemoPlanImage(): string {
  return drawDemoPlan().toDataURL('image/jpeg', 0.92)
}

function toWorld(plan: PlanState, x: number, y: number): [number, number] {
  return [
    (x - (plan.crop.x + plan.crop.w / 2)) * plan.scale,
    (y - (plan.crop.y + plan.crop.h / 2)) * plan.scale,
  ]
}

export function createDemoFurniture(plan: PlanState): FurnitureItem[] {
  const entries: Array<{
    type: FurnitureItem['type']
    name: string
    x: number
    y: number
    rotation: number
    color: string
  }> = [
    { type: 'rug', name: '手织地毯', x: 640, y: 595, rotation: 0, color: '#c9b89f' },
    { type: 'sofa', name: '云朵三人沙发', x: 640, y: 660, rotation: Math.PI, color: '#c3ad95' },
    { type: 'coffee-table', name: '原木茶几', x: 640, y: 572, rotation: 0, color: '#8d684c' },
    { type: 'armchair', name: '弧背单椅', x: 800, y: 595, rotation: -1.1, color: '#9d6b55' },
    { type: 'tv-console', name: '悬浮电视柜', x: 640, y: 500, rotation: 0, color: '#675344' },
    { type: 'floor-lamp', name: '宣纸落地灯', x: 785, y: 670, rotation: 0, color: '#f0e1c5' },
    { type: 'plant', name: '琴叶榕', x: 505, y: 682, rotation: 0.4, color: '#526849' },
    { type: 'dining-set', name: '圆角餐桌组合', x: 712, y: 375, rotation: 0, color: '#92745a' },
    { type: 'sideboard', name: '藤编餐边柜', x: 690, y: 440, rotation: Math.PI, color: '#a58362' },
    { type: 'bed-double', name: '双人软床', x: 235, y: 615, rotation: 0, color: '#d5c7b6' },
    { type: 'side-table', name: '边几 / 床头柜', x: 108, y: 490, rotation: 0, color: '#96765a' },
    { type: 'wardrobe', name: '通顶衣柜', x: 350, y: 472, rotation: 0, color: '#cfc2ae' },
    { type: 'bed-single', name: '单人床', x: 988, y: 585, rotation: 0, color: '#c5beb0' },
    { type: 'desk', name: '工作书桌', x: 218, y: 150, rotation: 0, color: '#83664b' },
    { type: 'plant', name: '琴叶榕', x: 960, y: 695, rotation: 0.2, color: '#5f7453' },
  ]

  return entries.map((entry) => {
    const [x, z] = toWorld(plan, entry.x, entry.y)
    return {
      id: uid('furniture'),
      type: entry.type,
      name: entry.name,
      position: [x, 0, z] as [number, number, number],
      rotation: entry.rotation,
      scale: 1,
      color: entry.color,
    }
  })
}
