export type ViewMode = '3d' | 'top'
export type LeftTab = 'plan' | 'decor' | 'furniture'
export type LightingPreset = 'day' | 'dusk' | 'night'
export type FloorPreset = 'oak' | 'walnut' | 'marble' | 'terrazzo' | 'concrete' | 'tile'

export type FurnitureType =
  | 'sofa'
  | 'armchair'
  | 'coffee-table'
  | 'side-table'
  | 'tv-console'
  | 'dining-set'
  | 'desk'
  | 'bed-double'
  | 'bed-single'
  | 'wardrobe'
  | 'bookshelf'
  | 'sideboard'
  | 'floor-lamp'
  | 'plant'
  | 'rug'

export type FurnitureCategory = 'living' | 'bedroom' | 'dining' | 'decor'

export interface FurnitureDefinition {
  type: FurnitureType
  name: string
  englishName: string
  category: FurnitureCategory
  width: number
  depth: number
  height: number
  color: string
  description: string
}

export interface FurnitureItem {
  id: string
  type: FurnitureType
  name: string
  position: [number, number, number]
  rotation: number
  scale: number
  color: string
}

export interface PlanRectPx {
  x: number
  y: number
  w: number
  h: number
}

export interface RoomInfo {
  id: string
  name: string
  area: number
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  centerX: number
  centerZ: number
}

export interface PlanState {
  id: string
  name: string
  imageUrl: string
  underlayUrl: string
  imageWidth: number
  imageHeight: number
  crop: PlanRectPx
  /** Luminance mask of the walkable / floor area, cropped to crop. */
  floorAlphaUrl: string
  wallRectsPx: PlanRectPx[]
  wallCellPx?: number
  rooms?: RoomInfo[]
  widthM: number
  scale: number
  floorAreaM2: number
  wallCount: number
  detectedAt: string
  isSample?: boolean
}

export interface DecorSettings {
  floor: FloorPreset
  wallColor: string
  lighting: LightingPreset
  wallHeight: number
  cutaway: boolean
}

export interface CameraCommand {
  type: 'fit' | 'zoom-in' | 'zoom-out' | 'reset' | 'top' | 'iso'
  nonce: number
}

export interface ToastMessage {
  id: string
  title: string
  detail?: string
  tone?: 'default' | 'success' | 'warning'
}

export interface AnalysisProgress {
  active: boolean
  progress: number
  stage: string
  previewUrl?: string
}

export interface RoomSummary {
  floorArea: number
  wallCount: number
  furnitureCount: number
}

export interface ProjectSnapshot {
  furniture: FurnitureItem[]
  decor: DecorSettings
}

export interface SavedProjectV1 {
  version: 1
  projectName: string
  plan: PlanState | null
  furniture: FurnitureItem[]
  decor: DecorSettings
  savedAt: string
}
