import type {
  FurnitureCategory,
  FurnitureDefinition,
  FurnitureType,
  LightingPreset,
  FloorPreset,
} from '../types'

export const FURNITURE_CATALOG: FurnitureDefinition[] = [
  {
    type: 'sofa',
    name: '云朵三人沙发',
    englishName: 'Cloud Sofa',
    category: 'living',
    width: 2.35,
    depth: 0.95,
    height: 0.86,
    color: '#c9b7a2',
    description: '柔软织物的三人沙发',
  },
  {
    type: 'armchair',
    name: '弧背单椅',
    englishName: 'Arc Chair',
    category: 'living',
    width: 0.9,
    depth: 0.86,
    height: 0.82,
    color: '#a9755c',
    description: '阅读角里的舒适单椅',
  },
  {
    type: 'coffee-table',
    name: '原木茶几',
    englishName: 'Coffee Table',
    category: 'living',
    width: 1.25,
    depth: 0.68,
    height: 0.38,
    color: '#8d684c',
    description: '低矮温润的原木茶几',
  },
  {
    type: 'side-table',
    name: '边几 / 床头柜',
    englishName: 'Side Table',
    category: 'living',
    width: 0.52,
    depth: 0.46,
    height: 0.52,
    color: '#9b7b5e',
    description: '沙发与床边都适合的边几',
  },
  {
    type: 'tv-console',
    name: '悬浮电视柜',
    englishName: 'TV Console',
    category: 'living',
    width: 1.9,
    depth: 0.42,
    height: 0.48,
    color: '#6c5a49',
    description: '带电视的纤薄电视柜',
  },
  {
    type: 'dining-set',
    name: '圆角餐桌组合',
    englishName: 'Dining Set',
    category: 'dining',
    width: 1.9,
    depth: 1.55,
    height: 0.78,
    color: '#98775a',
    description: '四人餐桌与餐椅',
  },
  {
    type: 'desk',
    name: '工作书桌',
    englishName: 'Writing Desk',
    category: 'bedroom',
    width: 1.45,
    depth: 0.72,
    height: 0.76,
    color: '#86694f',
    description: '带抽屉与座椅的书桌',
  },
  {
    type: 'bed-double',
    name: '双人软床',
    englishName: 'Double Bed',
    category: 'bedroom',
    width: 1.86,
    depth: 2.18,
    height: 0.98,
    color: '#d8cbbb',
    description: '1.8 米双人床',
  },
  {
    type: 'bed-single',
    name: '单人床',
    englishName: 'Single Bed',
    category: 'bedroom',
    width: 1.25,
    depth: 2.08,
    height: 0.9,
    color: '#c7c1b5',
    description: '1.2 米单人床',
  },
  {
    type: 'wardrobe',
    name: '通顶衣柜',
    englishName: 'Wardrobe',
    category: 'bedroom',
    width: 2.05,
    depth: 0.62,
    height: 2.25,
    color: '#d2c5b2',
    description: '简洁无拉手通顶衣柜',
  },
  {
    type: 'bookshelf',
    name: '开放书架',
    englishName: 'Bookshelf',
    category: 'dining',
    width: 1.22,
    depth: 0.4,
    height: 1.85,
    color: '#7d6249',
    description: '陈列书与器物的开放书架',
  },
  {
    type: 'sideboard',
    name: '藤编餐边柜',
    englishName: 'Sideboard',
    category: 'dining',
    width: 1.55,
    depth: 0.45,
    height: 0.82,
    color: '#a98564',
    description: '餐厅收纳与展示',
  },
  {
    type: 'floor-lamp',
    name: '宣纸落地灯',
    englishName: 'Floor Lamp',
    category: 'decor',
    width: 0.52,
    depth: 0.52,
    height: 1.68,
    color: '#f1e3c8',
    description: '柔光纸罩落地灯',
  },
  {
    type: 'plant',
    name: '琴叶榕',
    englishName: 'Fiddle Fig',
    category: 'decor',
    width: 0.72,
    depth: 0.72,
    height: 1.5,
    color: '#566a4d',
    description: '给空间一点自然呼吸',
  },
  {
    type: 'rug',
    name: '手织地毯',
    englishName: 'Woven Rug',
    category: 'decor',
    width: 2.8,
    depth: 2.0,
    height: 0.025,
    color: '#cbbca9',
    description: '柔软的手织肌理地毯',
  },
]

export const FURNITURE_BY_TYPE = Object.fromEntries(
  FURNITURE_CATALOG.map((item) => [item.type, item]),
) as Record<FurnitureType, FurnitureDefinition>

export const FURNITURE_CATEGORIES: { id: FurnitureCategory | 'all'; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'living', label: '客厅' },
  { id: 'bedroom', label: '卧室' },
  { id: 'dining', label: '餐厅' },
  { id: 'decor', label: '软装' },
]

export interface PaletteOption {
  id: string
  name: string
  color: string
  secondary: string
}

export const FLOOR_PRESETS: (PaletteOption & { id: FloorPreset; note: string })[] = [
  { id: 'oak', name: '自然橡木', color: '#c7a77f', secondary: '#9b7b56', note: '温暖 · 人字拼' },
  { id: 'walnut', name: '深色胡桃', color: '#75513a', secondary: '#523827', note: '沉静 · 直板' },
  { id: 'marble', name: '鱼肚白石材', color: '#e6e3dc', secondary: '#bcb8af', note: '明亮 · 大板' },
  { id: 'terrazzo', name: '水磨石', color: '#d9d4c7', secondary: '#aaa194', note: '细腻 · 颗粒' },
  { id: 'concrete', name: '微水泥', color: '#aaa79e', secondary: '#85837b', note: '克制 · 无缝' },
  { id: 'tile', name: '暖灰岩板', color: '#bbb4a8', secondary: '#999186', note: '耐用 · 大砖' },
]

export const WALL_COLORS = [
  { name: '奶油白', color: '#eeeae1' },
  { name: '羊皮纸', color: '#e5dccb' },
  { name: '鼠尾草', color: '#b7bda9' },
  { name: '雾霾蓝', color: '#a9b5ba' },
  { name: '陶土粉', color: '#cba99a' },
  { name: '炭灰', color: '#6d706c' },
]

export const LIGHTING_PRESETS: {
  id: LightingPreset
  name: string
  hint: string
  swatch: string
}[] = [
  { id: 'day', name: '上午自然光', hint: '清透 / 柔和阴影', swatch: '#e8e2d4' },
  { id: 'dusk', name: '黄昏暖光', hint: '金色 / 长阴影', swatch: '#d49563' },
  { id: 'night', name: '入夜氛围', hint: '低照度 / 灯光重点', swatch: '#38475e' },
]

export interface FurnitureSet {
  id: string
  name: string
  description: string
  accent: string
  items: { type: FurnitureType; offset: [number, number]; rotation: number; color?: string }[]
}

export const FURNITURE_SETS: FurnitureSet[] = [
  {
    id: 'living',
    name: '客厅会客组',
    description: '沙发 · 茶几 · 地毯 · 绿植',
    accent: '#d8b48d',
    items: [
      { type: 'rug', offset: [0, 0.2], rotation: 0 },
      { type: 'sofa', offset: [0, -0.75], rotation: 0 },
      { type: 'coffee-table', offset: [0, 0.35], rotation: 0 },
      { type: 'armchair', offset: [1.45, 0.45], rotation: -0.5 },
      { type: 'plant', offset: [-1.7, 0.65], rotation: 0.3 },
    ],
  },
  {
    id: 'bedroom',
    name: '静谧卧室组',
    description: '双人床 · 边几 · 衣柜',
    accent: '#b9b9c8',
    items: [
      { type: 'bed-double', offset: [0, 0], rotation: 0 },
      { type: 'side-table', offset: [-1.22, -0.62], rotation: 0 },
      { type: 'floor-lamp', offset: [1.3, -0.62], rotation: 0 },
      { type: 'wardrobe', offset: [-1.5, 1.2], rotation: Math.PI / 2 },
    ],
  },
  {
    id: 'dining',
    name: '餐厅用餐组',
    description: '餐桌 · 餐边柜 · 灯光',
    accent: '#a7b89b',
    items: [
      { type: 'dining-set', offset: [0, 0], rotation: 0 },
      { type: 'sideboard', offset: [0, 1.35], rotation: 0 },
      { type: 'plant', offset: [1.85, 0.8], rotation: 0.5 },
    ],
  },
]

export const MAX_FILE_BYTES = 20 * 1024 * 1024

export const KEYBOARD_HINTS = [
  { keys: ['⌘', 'Z'], label: '撤销' },
  { keys: ['⌘', '⇧', 'Z'], label: '重做' },
  { keys: ['R'], label: '旋转家具 15°' },
  { keys: ['⌫'], label: '删除选中家具' },
  { keys: ['Esc'], label: '取消选择' },
]


export interface StylePreset {
  id: string
  name: string
  description: string
  floor: FloorPreset
  wallColor: string
  lighting: LightingPreset
  swatches: string[]
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'wabi',
    name: '侘寂原木',
    description: '自然材质 · 温柔留白',
    floor: 'oak',
    wallColor: '#e5dccb',
    lighting: 'day',
    swatches: ['#c7a77f', '#e5dccb', '#8f7c68'],
  },
  {
    id: 'modern',
    name: '现代极简',
    description: '清水混凝土 · 利落线条',
    floor: 'concrete',
    wallColor: '#eeeae1',
    lighting: 'day',
    swatches: ['#aaa79e', '#eeeae1', '#5f6461'],
  },
  {
    id: 'cream',
    name: '法式奶油',
    description: '鱼肚白 · 暖调日光',
    floor: 'marble',
    wallColor: '#e8dccd',
    lighting: 'dusk',
    swatches: ['#e6e3dc', '#e8dccd', '#c49572'],
  },
  {
    id: 'midnight',
    name: '静夜胡桃',
    description: '深木色 · 低照度氛围',
    floor: 'walnut',
    wallColor: '#b7bda9',
    lighting: 'night',
    swatches: ['#75513a', '#b7bda9', '#2f4050'],
  },
]
