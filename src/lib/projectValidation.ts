import type { DecorSettings, FurnitureItem, PlanState, RoomInfo, SavedProjectV1 } from '../types'
import {
  FLOOR_PRESETS,
  FURNITURE_BY_TYPE,
  LIGHTING_PRESETS,
  WALL_COLORS,
} from './catalog'
import { clamp } from './utils'

const FLOOR_IDS = new Set(FLOOR_PRESETS.map((item) => item.id))
const LIGHTING_IDS = new Set(LIGHTING_PRESETS.map((item) => item.id))
const WALL_HEX = /^#[0-9a-f]{6}$/i
const FALLBACK_WALL = WALL_COLORS[0].color

function number(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function normalizeDecor(input: Partial<DecorSettings> | undefined): DecorSettings {
  const floor = typeof input?.floor === 'string' && FLOOR_IDS.has(input.floor) ? input.floor : 'oak'
  const lighting =
    typeof input?.lighting === 'string' && LIGHTING_IDS.has(input.lighting)
      ? input.lighting
      : 'day'
  const wallColor =
    typeof input?.wallColor === 'string' && WALL_HEX.test(input.wallColor)
      ? input.wallColor
      : FALLBACK_WALL
  const wallHeight = number(input?.wallHeight) ? clamp(input.wallHeight, 2.2, 3.4) : 2.8
  return {
    floor: floor as DecorSettings['floor'],
    lighting: lighting as DecorSettings['lighting'],
    wallColor,
    wallHeight,
    cutaway: input?.cutaway !== false,
  }
}

function isRoom(value: unknown): value is RoomInfo {
  if (!value || typeof value !== 'object') return false
  const room = value as Partial<RoomInfo>
  return (
    typeof room.id === 'string' &&
    typeof room.name === 'string' &&
    ['area', 'minX', 'maxX', 'minZ', 'maxZ', 'centerX', 'centerZ'].every((key) =>
      number(room[key as keyof RoomInfo]),
    )
  )
}

function isPlan(value: unknown): value is PlanState {
  if (!value || typeof value !== 'object') return false
  const plan = value as Partial<PlanState>
  const crop = plan.crop
  return (
    typeof plan.imageUrl === 'string' &&
    typeof plan.underlayUrl === 'string' &&
    typeof plan.floorAlphaUrl === 'string' &&
    number(plan.widthM) &&
    plan.widthM > 0 &&
    number(plan.scale) &&
    plan.scale > 0 &&
    number(plan.floorAreaM2) &&
    Boolean(crop) &&
    number(crop?.x) &&
    number(crop?.y) &&
    number(crop?.w) &&
    number(crop?.h) &&
    crop.w > 0 &&
    crop.h > 0 &&
    Array.isArray(plan.wallRectsPx) &&
    plan.wallRectsPx.every(
      (rect) => rect && number(rect.x) && number(rect.y) && number(rect.w) && number(rect.h),
    ) &&
    (!plan.rooms || (Array.isArray(plan.rooms) && plan.rooms.every(isRoom)))
  )
}

function isFurniture(value: unknown): value is FurnitureItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<FurnitureItem>
  return (
    typeof item.id === 'string' &&
    typeof item.type === 'string' &&
    item.type in FURNITURE_BY_TYPE &&
    typeof item.name === 'string' &&
    Array.isArray(item.position) &&
    item.position.length === 3 &&
    item.position.every((coordinate) => number(coordinate)) &&
    number(item.rotation) &&
    number(item.scale) &&
    typeof item.color === 'string'
  )
}

export function isSavedProject(value: unknown): value is SavedProjectV1 {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<SavedProjectV1>
  return (
    project.version === 1 &&
    typeof project.projectName === 'string' &&
    isPlan(project.plan) &&
    Array.isArray(project.furniture) &&
    project.furniture.every(isFurniture) &&
    Boolean(project.decor) &&
    typeof project.decor === 'object'
  )
}
