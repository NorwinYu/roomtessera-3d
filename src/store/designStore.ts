import { create } from 'zustand'
import type {
  AnalysisProgress,
  CameraCommand,
  DecorSettings,
  FloorPreset,
  FurnitureCategory,
  FurnitureItem,
  FurnitureType,
  LeftTab,
  LightingPreset,
  PlanRectPx,
  PlanState,
  ProjectSnapshot,
  SavedProjectV1,
  ToastMessage,
  ViewMode,
} from '../types'
import { FURNITURE_BY_TYPE, FURNITURE_SETS } from '../lib/catalog'
import { resizePlanWidth } from '../lib/planAnalysis'
import { detectRoomsFromPlan } from '../lib/roomDetection'
import { findFreePlacement } from '../lib/placement'
import { isSavedProject, normalizeDecor } from '../lib/projectValidation'
import { removeWallRectsNear, snapWallPoint, wallRectFromPoints } from '../lib/wallEditing'
import { uid } from '../lib/utils'

const STORAGE_KEY = 'roomtessera3d.project.v1'
const LEGACY_STORAGE_KEYS = ['roomtrial3d.project.v1', 'haven3d.project.v1']
const MAX_HISTORY = 40

export const DEFAULT_DECOR: DecorSettings = {
  floor: 'oak',
  wallColor: '#eeeae1',
  lighting: 'day',
  wallHeight: 2.8,
  cutaway: true,
}

interface PersistedShape {
  projectName: string
  plan: PlanState | null
  furniture: FurnitureItem[]
  decor: DecorSettings
  savedAt: string | null
}

function cloneSnapshot(furniture: FurnitureItem[], decor: DecorSettings): ProjectSnapshot {
  return {
    furniture: furniture.map((item) => ({
      ...item,
      position: [...item.position] as [number, number, number],
    })),
    decor: { ...decor },
  }
}

function readSavedProject(): PersistedShape | null {
  try {
    let raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        raw = localStorage.getItem(legacyKey)
        if (raw) break
      }
    }
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isSavedProject(parsed)) return null
    return {
      projectName: parsed.projectName || '我的家',
      plan: parsed.plan,
      furniture: Array.isArray(parsed.furniture) ? parsed.furniture : [],
      decor: normalizeDecor(parsed.decor),
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : null,
    }
  } catch {
    return null
  }
}

const saved = readSavedProject()

interface DesignStore {
  projectName: string
  plan: PlanState | null
  furniture: FurnitureItem[]
  decor: DecorSettings
  selectedId: string | null
  viewMode: ViewMode
  showWalls: boolean
  showGrid: boolean
  showUnderlay: boolean
  showFurniture: boolean
  leftTab: LeftTab
  furnitureCategory: FurnitureCategory | 'all'
  analysis: AnalysisProgress
  toasts: ToastMessage[]
  cameraCommand: CameraCommand
  past: ProjectSnapshot[]
  future: ProjectSnapshot[]
  isTransacting: boolean
  mobilePanel: 'left' | 'right' | null
  measureMode: boolean
  measurePoints: [number, number][]
  wallEditMode: 'add' | 'erase' | null
  wallDraft: { start: [number, number]; end: [number, number] } | null
  wallEditHistory: PlanRectPx[][]
  lastSavedAt: string | null
  isHelpOpen: boolean
  isExportMenuOpen: boolean
  setProjectName: (name: string) => void
  setPlan: (plan: PlanState, options?: { furniture?: FurnitureItem[]; clearHistory?: boolean }) => void
  loadProject: (project: SavedProjectV1) => void
  clearPlan: () => void
  updatePlanWidth: (widthM: number) => void
  updateRoomName: (roomId: string, name: string) => void
  setAnalysis: (patch: Partial<AnalysisProgress>) => void
  selectFurniture: (id: string | null) => void
  addFurniture: (
    type: FurnitureType,
    options?: { position?: [number, number, number]; rotation?: number; color?: string; silent?: boolean },
  ) => string | null
  addFurnitureSet: (setId: string) => void
  updateFurniture: (id: string, patch: Partial<FurnitureItem>) => void
  removeFurniture: (id: string) => void
  removeSelected: () => void
  duplicateSelected: () => void
  rotateSelected: (delta: number) => void
  nudgeSelected: (dx: number, dz: number) => void
  setDecor: (patch: Partial<DecorSettings>, record?: boolean) => void
  setFloorPreset: (floor: FloorPreset) => void
  setLighting: (lighting: LightingPreset) => void
  setViewMode: (mode: ViewMode) => void
  setLeftTab: (tab: LeftTab) => void
  setFurnitureCategory: (category: FurnitureCategory | 'all') => void
  toggleWalls: () => void
  toggleGrid: () => void
  toggleUnderlay: () => void
  toggleFurniture: () => void
  triggerCamera: (type: CameraCommand['type']) => void
  beginTransaction: () => void
  endTransaction: () => void
  cancelTransaction: () => void
  undo: () => void
  redo: () => void
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void
  dismissToast: (id: string) => void
  setHelpOpen: (open: boolean) => void
  setExportMenuOpen: (open: boolean) => void
  setMobilePanel: (panel: 'left' | 'right' | null) => void
  setMeasureMode: (enabled: boolean) => void
  addMeasurePoint: (x: number, z: number) => void
  clearMeasurements: () => void
  setWallEditMode: (mode: 'add' | 'erase' | null) => void
  startWallDraft: (x: number, z: number) => void
  updateWallDraft: (x: number, z: number) => void
  commitWallDraft: () => void
  cancelWallDraft: () => void
  beginWallErase: () => void
  eraseWallAt: (x: number, z: number, continuous?: boolean) => void
  clearAllWalls: () => void
  undoWallEdit: () => void
  refreshRooms: () => Promise<void>
  saveLocal: (options?: { silent?: boolean }) => void
  resetProject: () => void
  serializeProject: () => SavedProjectV1
}

function makeId(): string {
  return uid('item')
}

function defaultPlacement(count: number): [number, number, number] {
  if (count === 0) return [0, 0, 0]
  const angle = count * 2.39996
  const radius = 0.45 + Math.min(count, 12) * 0.08
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
}

export const useDesignStore = create<DesignStore>((set, get) => ({
  projectName: saved?.projectName ?? '我的家',
  plan: saved?.plan ?? null,
  furniture: saved?.furniture ?? [],
  decor: saved?.decor ?? { ...DEFAULT_DECOR },
  selectedId: null,
  viewMode: '3d',
  showWalls: true,
  showGrid: false,
  showUnderlay: false,
  showFurniture: true,
  leftTab: saved?.plan ? 'decor' : 'plan',
  furnitureCategory: 'all',
  analysis: { active: false, progress: 0, stage: '' },
  toasts: [],
  cameraCommand: { type: 'fit', nonce: 0 },
  past: [],
  future: [],
  isTransacting: false,
  mobilePanel: null,
  measureMode: false,
  measurePoints: [],
  wallEditMode: null,
  wallDraft: null,
  wallEditHistory: [],
  lastSavedAt: saved?.savedAt ?? null,
  isHelpOpen: false,
  isExportMenuOpen: false,

  setProjectName: (name) => set({ projectName: name.trim() || '我的家' }),

  setPlan: (plan, options = {}) =>
    set({
      plan,
      furniture: options.furniture ?? [],
      selectedId: null,
      past: [],
      future: [],
      cameraCommand: { type: 'fit', nonce: get().cameraCommand.nonce + 1 },
      leftTab: 'decor',
      measureMode: false,
      measurePoints: [],
      wallEditMode: null,
      wallDraft: null,
      wallEditHistory: [],
    }),

  loadProject: (project) =>
    set({
      projectName: project.projectName || '我的家',
      plan: project.plan,
      furniture: Array.isArray(project.furniture) ? project.furniture : [],
      decor: normalizeDecor(project.decor),
      selectedId: null,
      past: [],
      future: [],
      leftTab: project.plan ? 'decor' : 'plan',
      viewMode: '3d',
      cameraCommand: { type: 'fit', nonce: get().cameraCommand.nonce + 1 },
      measureMode: false,
      measurePoints: [],
      wallEditMode: null,
      wallDraft: null,
      wallEditHistory: [],
    }),

  clearPlan: () =>
    set({
      plan: null,
      furniture: [],
      selectedId: null,
      past: [],
      future: [],
      leftTab: 'plan',
      analysis: { active: false, progress: 0, stage: '' },
      measureMode: false,
      measurePoints: [],
      wallEditMode: null,
      wallDraft: null,
      wallEditHistory: [],
    }),

  updateRoomName: (roomId, name) => {
    const plan = get().plan
    if (!plan?.rooms) return
    set({
      plan: {
        ...plan,
        rooms: plan.rooms.map((room) =>
          room.id === roomId ? { ...room, name: name.slice(0, 24) } : room,
        ),
      },
    })
  },

  updatePlanWidth: (widthM) => {
    const state = get()
    const plan = state.plan
    if (!plan) return
    const nextPlan = resizePlanWidth(plan, widthM)
    if (Math.abs(nextPlan.widthM - plan.widthM) < 0.001) return
    const factor = nextPlan.widthM / plan.widthM
    set({
      plan: nextPlan,
      furniture: state.furniture.map((item) => ({
        ...item,
        position: [item.position[0] * factor, 0, item.position[2] * factor],
      })),
      measurePoints: state.measurePoints.map(([x, z]) => [x * factor, z * factor]),
    })
  },

  setAnalysis: (patch) => set((state) => ({ analysis: { ...state.analysis, ...patch } })),

  selectFurniture: (id) => set({ selectedId: id }),

  addFurniture: (type, options = {}) => {
    const state = get()
    if (!state.plan) {
      state.pushToast({ title: '先导入一张户型图', detail: '生成空间后即可摆放家具', tone: 'warning' })
      return null
    }
    const definition = FURNITURE_BY_TYPE[type]
    if (!definition) return null
    const rotation = options.rotation ?? 0
    const placement = options.position
      ? null
      : findFreePlacement(
          state.plan,
          state.furniture,
          [
            {
              width: definition.width,
              depth: definition.depth,
              offsetX: 0,
              offsetZ: 0,
              rotation,
            },
          ],
          { x: 0, z: 0 },
        )
    const item: FurnitureItem = {
      id: makeId(),
      type,
      name: definition.name,
      position: options.position ?? [
        placement?.x ?? defaultPlacement(state.furniture.length)[0],
        0,
        placement?.z ?? defaultPlacement(state.furniture.length)[2],
      ],
      rotation,
      scale: 1,
      color: options.color ?? definition.color,
    }
    const snapshot = cloneSnapshot(state.furniture, state.decor)
    set({
      furniture: [...state.furniture, item],
      selectedId: item.id,
      past: [...state.past, snapshot].slice(-MAX_HISTORY),
      future: [],
    })
    if (!options.silent) {
      state.pushToast({
        title: `已添加「${item.name}」`,
        detail:
          placement && !placement.found
            ? '空间较紧凑，拖动家具可继续调整位置'
            : '已自动避让墙体，拖动家具可自由调整位置',
        tone: placement && !placement.found ? 'warning' : 'success',
      })
    }
    return item.id
  },

  addFurnitureSet: (setId) => {
    const state = get()
    if (!state.plan) {
      state.pushToast({ title: '先导入一张户型图', detail: '生成空间后即可摆放组合家具', tone: 'warning' })
      return
    }
    const setDefinition = FURNITURE_SETS.find((item) => item.id === setId)
    if (!setDefinition) return
    const footprints = setDefinition.items.map((entry) => {
      const definition = FURNITURE_BY_TYPE[entry.type]
      return {
        width: definition.width,
        depth: definition.depth,
        offsetX: entry.offset[0],
        offsetZ: entry.offset[1],
        rotation: entry.rotation,
      }
    })
    const placement = findFreePlacement(state.plan, state.furniture, footprints, { x: 0, z: 0 })
    const center = [placement.x, placement.z] as const
    const items: FurnitureItem[] = setDefinition.items.map((entry) => {
      const definition = FURNITURE_BY_TYPE[entry.type]
      return {
        id: makeId(),
        type: entry.type,
        name: definition.name,
        position: [
          center[0] + entry.offset[0],
          0,
          center[1] + entry.offset[1],
        ] as [number, number, number],
        rotation: entry.rotation,
        scale: 1,
        color: entry.color ?? definition.color,
      }
    })
    const snapshot = cloneSnapshot(state.furniture, state.decor)
    const primary =
      items.find((item) => !['rug', 'plant', 'floor-lamp'].includes(item.type)) ?? items[0]
    set({
      furniture: [...state.furniture, ...items],
      selectedId: primary?.id ?? null,
      past: [...state.past, snapshot].slice(-MAX_HISTORY),
      future: [],
    })
    state.pushToast({
      title: `已布置「${setDefinition.name}」`,
      detail: placement.found
        ? '已自动避开墙体，组合中的家具仍可单独移动'
        : '空间较紧凑，已选择碰撞最少的位置',
      tone: placement.found ? 'success' : 'warning',
    })
  },

  updateFurniture: (id, patch) =>
    set((state) => ({
      furniture: state.furniture.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              position: patch.position
                ? ([patch.position[0], 0, patch.position[2]] as [number, number, number])
                : item.position,
            }
          : item,
      ),
    })),

  removeFurniture: (id) => {
    const state = get()
    const target = state.furniture.find((item) => item.id === id)
    if (!target) return
    const snapshot = cloneSnapshot(state.furniture, state.decor)
    set({
      furniture: state.furniture.filter((item) => item.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      past: [...state.past, snapshot].slice(-MAX_HISTORY),
      future: [],
    })
    state.pushToast({ title: `已移除「${target.name}」`, tone: 'default' })
  },

  removeSelected: () => {
    const id = get().selectedId
    if (id) get().removeFurniture(id)
  },

  duplicateSelected: () => {
    const state = get()
    const selected = state.furniture.find((item) => item.id === state.selectedId)
    if (!selected) return
    const snapshot = cloneSnapshot(state.furniture, state.decor)
    const copy: FurnitureItem = {
      ...selected,
      id: makeId(),
      position: [selected.position[0] + 0.55, 0, selected.position[2] + 0.55],
    }
    set({
      furniture: [...state.furniture, copy],
      selectedId: copy.id,
      past: [...state.past, snapshot].slice(-MAX_HISTORY),
      future: [],
    })
    state.pushToast({ title: '已复制家具', detail: '按 ⌘D 可再次复制', tone: 'success' })
  },

  rotateSelected: (delta) => {
    const state = get()
    const selected = state.furniture.find((item) => item.id === state.selectedId)
    if (!selected) return
    const snapshot = cloneSnapshot(state.furniture, state.decor)
    set({
      furniture: state.furniture.map((item) =>
        item.id === selected.id
          ? { ...item, rotation: normalizeAngle(item.rotation + delta) }
          : item,
      ),
      past: [...state.past, snapshot].slice(-MAX_HISTORY),
      future: [],
    })
  },

  nudgeSelected: (dx, dz) => {
    const state = get()
    const selected = state.furniture.find((item) => item.id === state.selectedId)
    if (!selected) return
    const snapshot = cloneSnapshot(state.furniture, state.decor)
    set({
      furniture: state.furniture.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              position: [item.position[0] + dx, 0, item.position[2] + dz],
            }
          : item,
      ),
      past: [...state.past, snapshot].slice(-MAX_HISTORY),
      future: [],
    })
  },

  setDecor: (patch, record = true) => {
    const state = get()
    const snapshot = record ? cloneSnapshot(state.furniture, state.decor) : null
    set({
      decor: { ...state.decor, ...patch },
      ...(snapshot
        ? { past: [...state.past, snapshot].slice(-MAX_HISTORY), future: [] }
        : {}),
    })
  },

  setFloorPreset: (floor) => get().setDecor({ floor }),

  setLighting: (lighting) => get().setDecor({ lighting }),

  setViewMode: (mode) =>
    set({
      viewMode: mode,
      cameraCommand: {
        type: mode === 'top' ? 'top' : 'iso',
        nonce: get().cameraCommand.nonce + 1,
      },
    }),

  setLeftTab: (tab) => set({ leftTab: tab }),
  setFurnitureCategory: (category) => set({ furnitureCategory: category }),
  toggleWalls: () => set((state) => ({ showWalls: !state.showWalls })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleUnderlay: () => set((state) => ({ showUnderlay: !state.showUnderlay })),
  toggleFurniture: () => set((state) => ({ showFurniture: !state.showFurniture })),

  triggerCamera: (type) =>
    set((state) => ({
      cameraCommand: { type, nonce: state.cameraCommand.nonce + 1 },
    })),

  beginTransaction: () => {
    const state = get()
    if (state.isTransacting) return
    const snapshot = cloneSnapshot(state.furniture, state.decor)
    set({
      isTransacting: true,
      past: [...state.past, snapshot].slice(-MAX_HISTORY),
      future: [],
    })
  },

  endTransaction: () => set({ isTransacting: false }),

  cancelTransaction: () => {
    const state = get()
    if (!state.isTransacting) return
    set({
      isTransacting: false,
      past: state.past.slice(0, -1),
      future: [],
    })
  },

  undo: () => {
    const state = get()
    const previous = state.past[state.past.length - 1]
    if (!previous) return
    const current = cloneSnapshot(state.furniture, state.decor)
    set({
      furniture: previous.furniture,
      decor: previous.decor,
      selectedId: previous.furniture.some((item) => item.id === state.selectedId)
        ? state.selectedId
        : null,
      past: state.past.slice(0, -1),
      future: [current, ...state.future].slice(0, MAX_HISTORY),
    })
  },

  redo: () => {
    const state = get()
    const next = state.future[0]
    if (!next) return
    const current = cloneSnapshot(state.furniture, state.decor)
    set({
      furniture: next.furniture,
      decor: next.decor,
      selectedId: next.furniture.some((item) => item.id === state.selectedId)
        ? state.selectedId
        : null,
      past: [...state.past, current].slice(-MAX_HISTORY),
      future: state.future.slice(1),
    })
  },

  pushToast: (toast) => {
    const id = uid('toast')
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }].slice(-4) }))
    setTimeout(() => get().dismissToast(id), 3200)
  },

  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  setHelpOpen: (open) => set({ isHelpOpen: open }),
  setExportMenuOpen: (open) => set({ isExportMenuOpen: open }),
  setMobilePanel: (panel) => set({ mobilePanel: panel }),

  setMeasureMode: (enabled) =>
    set({
      measureMode: enabled,
      measurePoints: [],
      selectedId: enabled ? null : get().selectedId,
      wallEditMode: enabled ? null : get().wallEditMode,
      wallDraft: null,
    }),

  addMeasurePoint: (x, z) =>
    set((state) => ({
      measurePoints:
        state.measurePoints.length >= 2 ? [[x, z]] : [...state.measurePoints, [x, z]],
    })),

  clearMeasurements: () => set({ measurePoints: [] }),

  setWallEditMode: (mode) =>
    set((state) => ({
      wallEditMode: mode,
      wallDraft: null,
      measureMode: mode ? false : state.measureMode,
      measurePoints: mode ? [] : state.measurePoints,
      selectedId: mode ? null : state.selectedId,
      showWalls: true,
      ...(mode
        ? {
            viewMode: 'top' as const,
            cameraCommand: {
              type: 'top' as const,
              nonce: state.cameraCommand.nonce + 1,
            },
          }
        : {}),
    })),

  startWallDraft: (x, z) => {
    const state = get()
    if (state.wallEditMode !== 'add' || !state.plan) return
    const point = snapWallPoint(state.plan, x, z)
    set({ wallDraft: { start: point, end: point } })
  },

  updateWallDraft: (x, z) => {
    const state = get()
    const draft = state.wallDraft
    if (!draft || state.wallEditMode !== 'add' || !state.plan) return
    set({ wallDraft: { ...draft, end: snapWallPoint(state.plan, x, z) } })
  },

  commitWallDraft: () => {
    const state = get()
    const plan = state.plan
    const draft = state.wallDraft
    if (!plan || !draft) return
    const rect = wallRectFromPoints(plan, draft.start, draft.end)
    if (!rect) {
      state.pushToast({
        title: '墙体太短',
        detail: '请至少拖出 25 cm 的墙体',
        tone: 'warning',
      })
      return
    }
    const nextRects = [...plan.wallRectsPx, rect]
    set({
      plan: { ...plan, wallRectsPx: nextRects, wallCount: nextRects.length },
      wallDraft: null,
      wallEditHistory: [...state.wallEditHistory, plan.wallRectsPx].slice(-20),
    })
    void get().refreshRooms()
  },

  cancelWallDraft: () => set({ wallDraft: null }),

  beginWallErase: () => {
    const state = get()
    const plan = state.plan
    if (!plan) return
    set({
      wallEditHistory: [...state.wallEditHistory, plan.wallRectsPx].slice(-20),
    })
  },

  eraseWallAt: (x, z, continuous = false) => {
    const state = get()
    const plan = state.plan
    if (!plan) return
    const nextRects = removeWallRectsNear(plan, x, z)
    if (nextRects.length === plan.wallRectsPx.length) {
      if (!continuous) {
        state.pushToast({
          title: '没有命中墙体',
          detail: '请点击更靠近墙体的位置',
          tone: 'warning',
        })
      }
      return
    }
    set({
      plan: { ...plan, wallRectsPx: nextRects, wallCount: nextRects.length },
      ...(continuous
        ? {}
        : { wallEditHistory: [...state.wallEditHistory, plan.wallRectsPx].slice(-20) }),
    })
    if (!continuous) void get().refreshRooms()
  },

  clearAllWalls: () => {
    const state = get()
    const plan = state.plan
    if (!plan || plan.wallRectsPx.length === 0) return
    set({
      plan: { ...plan, wallRectsPx: [], wallCount: 0 },
      wallDraft: null,
      wallEditHistory: [...state.wallEditHistory, plan.wallRectsPx].slice(-20),
    })
    state.pushToast({
      title: '已清空墙体',
      detail: '现在可以直接手动画墙，或点撤销恢复',
      tone: 'success',
    })
    void get().refreshRooms()
  },

  undoWallEdit: () => {
    const state = get()
    const plan = state.plan
    if (!plan || state.wallEditHistory.length === 0) return
    const previous = state.wallEditHistory[state.wallEditHistory.length - 1]
    set({
      plan: { ...plan, wallRectsPx: previous, wallCount: previous.length },
      wallEditHistory: state.wallEditHistory.slice(0, -1),
      wallDraft: null,
    })
    void get().refreshRooms()
  },

  refreshRooms: async () => {
    const plan = get().plan
    if (!plan) return
    const sourceRects = plan.wallRectsPx
    try {
      const rooms = await detectRoomsFromPlan(plan)
      const current = get().plan
      if (!current || current.id !== plan.id || current.wallRectsPx !== sourceRects) return
      const previousRooms = plan.rooms ?? []
      const usedPrevious = new Set<number>()
      const usedNames = new Set<string>()
      const namedRooms = rooms.map((room, index) => {
        let matchIndex = -1
        let nearestDistance = 2.2
        for (let i = 0; i < previousRooms.length; i += 1) {
          if (usedPrevious.has(i)) continue
          const previous = previousRooms[i]
          if (!previous.name.trim()) continue
          const distance = Math.hypot(room.centerX - previous.centerX, room.centerZ - previous.centerZ)
          if (distance < nearestDistance) {
            matchIndex = i
            nearestDistance = distance
          }
        }
        let name = matchIndex >= 0 ? previousRooms[matchIndex].name : `空间 ${index + 1}`
        if (matchIndex >= 0) usedPrevious.add(matchIndex)
        let uniqueName = name
        let suffix = 2
        while (usedNames.has(uniqueName)) {
          uniqueName = `${name} · ${suffix}`
          suffix += 1
        }
        usedNames.add(uniqueName)
        return { ...room, name: uniqueName }
      })
      set({ plan: { ...current, rooms: namedRooms } })
    } catch {
      // Room detection is an enhancement; keep the previous labels on failure.
    }
  },

  serializeProject: () => {
    const state = get()
    return {
      version: 1,
      projectName: state.projectName,
      plan: state.plan,
      furniture: state.furniture,
      decor: state.decor,
      savedAt: new Date().toISOString(),
    }
  },

  saveLocal: (options = {}) => {
    try {
      const project = get().serializeProject()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
      set({ lastSavedAt: new Date().toISOString() })
      if (!options.silent) {
        get().pushToast({
          title: '方案已保存到本地',
          detail: '下次打开会自动恢复',
          tone: 'success',
        })
      }
    } catch {
      get().pushToast({
        title: '保存失败',
        detail: '图片可能较大，请尝试导出方案文件',
        tone: 'warning',
      })
    }
  },

  resetProject: () => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    set({
      projectName: '我的家',
      plan: null,
      furniture: [],
      decor: { ...DEFAULT_DECOR },
      selectedId: null,
      past: [],
      future: [],
      leftTab: 'plan',
      viewMode: '3d',
      mobilePanel: null,
      measureMode: false,
      measurePoints: [],
      wallEditMode: null,
      wallDraft: null,
      wallEditHistory: [],
      lastSavedAt: null,
      isHelpOpen: false,
      isExportMenuOpen: false,
    })
  },
}))

function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2
  return ((angle % twoPi) + twoPi) % twoPi
}

export function useSelectedFurniture(): FurnitureItem | null {
  return useDesignStore((state) =>
    state.furniture.find((item) => item.id === state.selectedId) ?? null,
  )
}

export { STORAGE_KEY }
