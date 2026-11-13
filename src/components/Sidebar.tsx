import { useMemo, useState } from 'react'
import {
  Armchair,
  Boxes,
  Check,
  ChevronRight,
  CircleHelp,
  CloudUpload,
  DoorOpen,
  Grid3X3,
  ImagePlus,
  Info,
  Layers,
  LayoutTemplate,
  Paintbrush,
  PencilRuler,
  Plus,
  RotateCcw,
  Ruler,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Moon,
  Sunset,
  Upload,
  Wand2,
  X,
} from 'lucide-react'
import {
  FLOOR_PRESETS,
  FURNITURE_CATALOG,
  FURNITURE_CATEGORIES,
  FURNITURE_SETS,
  LIGHTING_PRESETS,
  STYLE_PRESETS,
  WALL_COLORS,
} from '../lib/catalog'
import type { FloorPreset, FurnitureCategory } from '../types'
import { formatArea, formatNumber } from '../lib/utils'
import { useDesignStore } from '../store/designStore'
import { FurnitureIcon } from './FurnitureIcon'

interface SidebarProps {
  onImport: () => void
  onImportFile: (file: File) => void
  onLoadDemo: () => void
  onOpenHelp: () => void
}

const TABS = [
  { id: 'plan' as const, label: '户型', icon: LayoutTemplate },
  { id: 'decor' as const, label: '装修', icon: Paintbrush },
  { id: 'furniture' as const, label: '家具', icon: Armchair },
]

function FloorSwatch({ preset, color }: { preset: FloorPreset; color: string }) {
  const styles: Record<FloorPreset, React.CSSProperties> = {
    oak: {
      backgroundImage:
        'repeating-linear-gradient(90deg, rgba(80,52,30,.16) 0 1px, transparent 1px 22px), repeating-linear-gradient(0deg, rgba(255,255,255,.12) 0 1px, transparent 1px 44px), linear-gradient(135deg, #c7a77f, #b48e65)',
    },
    walnut: {
      backgroundImage:
        'repeating-linear-gradient(90deg, rgba(20,10,5,.24) 0 1px, transparent 1px 20px), linear-gradient(135deg, #79563e, #4d3425)',
    },
    marble: {
      backgroundImage:
        'radial-gradient(ellipse at 20% 35%, transparent 0 38%, rgba(96,96,92,.25) 39%, transparent 41%), radial-gradient(ellipse at 70% 15%, transparent 0 24%, rgba(110,110,104,.18) 25%, transparent 27%), linear-gradient(120deg, #ece9e2, #c8c4bb)',
    },
    terrazzo: {
      backgroundImage:
        'radial-gradient(circle at 25% 30%, #9b9284 0 2px, transparent 2.5px), radial-gradient(circle at 68% 20%, #b58f78 0 1.6px, transparent 2.1px), radial-gradient(circle at 40% 75%, #7f8a80 0 2px, transparent 2.5px), radial-gradient(circle at 82% 67%, #a7a092 0 1.4px, transparent 1.9px), #ddd8cc',
    },
    concrete: {
      backgroundImage:
        'radial-gradient(ellipse at 40% 30%, rgba(255,255,255,.18), transparent 45%), radial-gradient(ellipse at 70% 75%, rgba(65,65,60,.12), transparent 45%), linear-gradient(125deg, #b1aea5, #97948c)',
    },
    tile: {
      backgroundImage:
        'linear-gradient(rgba(60,58,53,.22) 2px, transparent 2px), linear-gradient(90deg, rgba(60,58,53,.22) 2px, transparent 2px), linear-gradient(120deg, #c0b9ad, #aaa296)',
      backgroundSize: '32px 32px, 32px 32px, 100% 100%',
    },
  }
  return <span className="floor-swatch" style={{ backgroundColor: color, ...styles[preset] }} />
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  icon,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: () => void
  icon?: React.ReactNode
}) {
  return (
    <button className="toggle-row" onClick={onChange} role="switch" aria-checked={checked}>
      <span className="toggle-copy">
        {icon && <span className="toggle-icon">{icon}</span>}
        <span>
          <strong>{label}</strong>
          {hint && <small>{hint}</small>}
        </span>
      </span>
      <span className={`switch ${checked ? 'is-on' : ''}`} aria-hidden>
        <span />
      </span>
    </button>
  )
}

function UploadZone({
  compact = false,
  onImport,
  onImportFile,
}: {
  compact?: boolean
  onImport: () => void
  onImportFile: (file: File) => void
}) {
  const [dragging, setDragging] = useState(false)
  return (
    <div
      className={`upload-zone ${compact ? 'is-compact' : ''} ${dragging ? 'is-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        const file = event.dataTransfer.files[0]
        if (file) onImportFile(file)
      }}
      onClick={onImport}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onImport()
      }}
    >
      <span className="upload-icon">
        <CloudUpload size={compact ? 18 : 22} />
      </span>
      <span className="upload-copy">
        <strong>{dragging ? '松开以导入' : '导入户型图'}</strong>
        <small>拖入 JPG / PNG，或点击选择</small>
      </span>
      <span className="upload-action">
        <Upload size={13} />
      </span>
    </div>
  )
}

function PlanPanel({ onImport }: { onImport: () => void }) {
  const plan = useDesignStore((state) => state.plan)
  const furnitureCount = useDesignStore((state) => state.furniture.length)
  const updatePlanWidth = useDesignStore((state) => state.updatePlanWidth)
  const updateRoomName = useDesignStore((state) => state.updateRoomName)
  const setWallEditMode = useDesignStore((state) => state.setWallEditMode)
  const clearAllWalls = useDesignStore((state) => state.clearAllWalls)
  const decor = useDesignStore((state) => state.decor)
  const setDecor = useDesignStore((state) => state.setDecor)
  const beginTransaction = useDesignStore((state) => state.beginTransaction)
  const endTransaction = useDesignStore((state) => state.endTransaction)
  const showWalls = useDesignStore((state) => state.showWalls)
  const showGrid = useDesignStore((state) => state.showGrid)
  const showUnderlay = useDesignStore((state) => state.showUnderlay)
  const showFurniture = useDesignStore((state) => state.showFurniture)
  const toggleWalls = useDesignStore((state) => state.toggleWalls)
  const toggleGrid = useDesignStore((state) => state.toggleGrid)
  const toggleUnderlay = useDesignStore((state) => state.toggleUnderlay)
  const toggleFurniture = useDesignStore((state) => state.toggleFurniture)
  const triggerCamera = useDesignStore((state) => state.triggerCamera)

  if (!plan) return null

  const depthM = plan.crop.h * plan.scale

  return (
    <div className="panel-stack">
      <div className="plan-preview-card">
        <img src={plan.imageUrl} alt={`${plan.name} 户型底图`} />
        <div className="plan-preview-shade" />
        <div className="plan-preview-top">
          <span className="recognition-badge">
            <span className="status-dot" />
            自动识别完成
          </span>
          {plan.isSample && <span className="sample-badge">示例</span>}
        </div>
        <div className="plan-preview-bottom">
          <div>
            <strong>{plan.name}</strong>
            <span>
              {formatNumber(plan.widthM)} × {formatNumber(depthM)} m
            </span>
          </div>
          <button
            className="ghost-icon-on-image"
            title="重置视角"
            onClick={() => triggerCamera('fit')}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <div>
          <span>识别面积</span>
          <strong>{formatArea(plan.floorAreaM2)}</strong>
        </div>
        <div>
          <span>结构墙体</span>
          <strong>{plan.wallCount} 段</strong>
        </div>
        <div>
          <span>已布置</span>
          <strong>{furnitureCount} 件</strong>
        </div>
      </div>

      {plan.rooms && plan.rooms.length > 0 && (
        <section className="panel-section">
          <div className="section-title">
            <span>
              <DoorOpen size={14} />
              识别空间
            </span>
            <small>{plan.rooms.length} 个 · 可重命名</small>
          </div>
          <div className="room-list">
            {plan.rooms.map((room, index) => (
              <div className="room-row" key={room.id}>
                <span className="room-index">{String(index + 1).padStart(2, '0')}</span>
                <input
                  value={room.name}
                  aria-label={`空间 ${index + 1} 名称`}
                  onChange={(event) => updateRoomName(room.id, event.target.value)}
                  onBlur={() => {
                    if (!room.name.trim()) updateRoomName(room.id, `空间 ${index + 1}`)
                  }}
                  placeholder={`空间 ${index + 1}`}
                />
                <small>{formatArea(room.area)}</small>
              </div>
            ))}
          </div>
          <div className="hint-row">
            <Info size={13} />
            点击名称即可重命名，平面视图会同步显示房间标签
          </div>
        </section>
      )}

      <section className="panel-section">
        <button className="secondary-button full-width" onClick={() => setWallEditMode('add')}>
          <PencilRuler size={15} />
          手动修正墙体
        </button>
        <button
          className="wall-reset-link"
          disabled={!plan || plan.wallRectsPx.length === 0}
          onClick={() => {
            if (window.confirm('清空全部自动墙体？清空后可以直接手动画墙，也可以撤销恢复。')) {
              clearAllWalls()
              setWallEditMode('add')
            }
          }}
        >
          <Trash2 size={12} />
          清空自动墙体，重新手动画
        </button>
        <div className="hint-row">
          <Info size={13} />
          自动墙体只作草稿。可清空后手动画墙；擦除支持按住拖动，最多撤销 20 步
        </div>
      </section>

      <section className="panel-section">
        <div className="section-title">
          <span>
            <Ruler size={14} />
            空间比例
          </span>
          <small>用于家具真实尺寸</small>
        </div>
        <div className="range-field">
          <div className="range-label">
            <span>户型总宽</span>
            <strong>{formatNumber(plan.widthM)} m</strong>
          </div>
          <input
            type="range"
            min={6}
            max={36}
            step={0.5}
            value={plan.widthM}
            onChange={(event) => updatePlanWidth(Number(event.target.value))}
          />
          <div className="range-scale">
            <span>6 m</span>
            <span>缩放后面积 {formatArea(plan.floorAreaM2)}</span>
            <span>36 m</span>
          </div>
        </div>

        <div className="range-field">
          <div className="range-label">
            <span>墙体高度</span>
            <strong>{formatNumber(decor.wallHeight, 2)} m</strong>
          </div>
          <input
            type="range"
            min={2.2}
            max={3.4}
            step={0.05}
            value={decor.wallHeight}
            onPointerDown={beginTransaction}
            onPointerUp={endTransaction}
            onBlur={endTransaction}
            onChange={(event) => setDecor({ wallHeight: Number(event.target.value) }, false)}
          />
          <div className="range-scale">
            <span>2.2 m</span>
            <span>层高</span>
            <span>3.4 m</span>
          </div>
        </div>
      </section>

      <section className="panel-section">
        <div className="section-title">
          <span>
            <Layers size={14} />
            场景图层
          </span>
        </div>
        <div className="toggle-list">
          <ToggleRow
            label="显示墙体"
            hint="可切换无墙视图"
            icon={<DoorOpen size={14} />}
            checked={showWalls}
            onChange={toggleWalls}
          />
          <ToggleRow
            label="原始底图"
            hint="叠加户型扫描图"
            icon={<ImagePlus size={14} />}
            checked={showUnderlay}
            onChange={toggleUnderlay}
          />
          <ToggleRow
            label="结构网格"
            hint="50 cm 辅助网格"
            icon={<Grid3X3 size={14} />}
            checked={showGrid}
            onChange={toggleGrid}
          />
          <ToggleRow
            label="家具图层"
            hint="暂时隐藏所有家具"
            icon={<Armchair size={14} />}
            checked={showFurniture}
            onChange={toggleFurniture}
          />
        </div>
      </section>

      <section className="panel-section">
        <button className="secondary-button full-width" onClick={onImport}>
          <ImagePlus size={15} />
          重新导入户型图
        </button>
        <div className="hint-row">
          <Info size={13} />
          自动识别基于图像色彩与结构分析，可手动调整比例
        </div>
      </section>

    </div>
  )
}

function EmptyPlanPanel({
  onImport,
  onImportFile,
  onLoadDemo,
}: {
  onImport: () => void
  onImportFile: (file: File) => void
  onLoadDemo: () => void
}) {
  return (
    <div className="panel-stack">
      <UploadZone onImport={onImport} onImportFile={onImportFile} />
      <button className="demo-button" onClick={onLoadDemo}>
        <span className="demo-icon">
          <Sparkles size={16} />
        </span>
        <span>
          <strong>打开示例空间</strong>
          <small>先体验完整的三维布置流程</small>
        </span>
        <ChevronRight size={16} />
      </button>
      <section className="panel-section onboarding-notes">
        <div className="note-item">
          <span>01</span>
          <div>
            <strong>自动识别户型</strong>
            <small>提取地面轮廓、墙体与空间比例</small>
          </div>
        </div>
        <div className="note-item">
          <span>02</span>
          <div>
            <strong>实时 3D 建模</strong>
            <small>一键生成可环绕查看的三维空间</small>
          </div>
        </div>
        <div className="note-item">
          <span>03</span>
          <div>
            <strong>自由布置与装修</strong>
            <small>家具拖放、材质替换、灯光氛围</small>
          </div>
        </div>
      </section>
      <div className="sidebar-tip">
        <Wand2 size={15} />
        <span>支持常见彩色户型图，识别效果与图纸质量相关</span>
      </div>
    </div>
  )
}

function DecorPanel() {
  const decor = useDesignStore((state) => state.decor)
  const setDecor = useDesignStore((state) => state.setDecor)
  const setFloorPreset = useDesignStore((state) => state.setFloorPreset)
  const setLighting = useDesignStore((state) => state.setLighting)
  const plan = useDesignStore((state) => state.plan)
  const beginTransaction = useDesignStore((state) => state.beginTransaction)
  const endTransaction = useDesignStore((state) => state.endTransaction)

  return (
    <div className="panel-stack">
      <section className="panel-section no-padding">
        <div className="section-title">
          <span>
            <Wand2 size={14} />
            全屋风格
          </span>
          <small>一键套用</small>
        </div>
        <div className="style-preset-grid">
          {STYLE_PRESETS.map((style) => {
            const active =
              decor.floor === style.floor &&
              decor.wallColor === style.wallColor &&
              decor.lighting === style.lighting
            return (
              <button
                key={style.id}
                className={`style-preset ${active ? 'is-active' : ''}`}
                onClick={() =>
                  setDecor({
                    floor: style.floor,
                    wallColor: style.wallColor,
                    lighting: style.lighting,
                  })
                }
              >
                <span className="style-swatch">
                  {style.swatches.map((swatch) => (
                    <i key={swatch} style={{ background: swatch }} />
                  ))}
                </span>
                <span className="style-copy">
                  <strong>{style.name}</strong>
                  <small>{style.description}</small>
                </span>
                {active && (
                  <span className="style-check">
                    <Check size={11} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel-section">
        <div className="section-title">
          <span>
            <Layers size={14} />
            地面材质
          </span>
          <small>{FLOOR_PRESETS.find((item) => item.id === decor.floor)?.name}</small>
        </div>
        <div className="floor-grid">
          {FLOOR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`floor-card ${decor.floor === preset.id ? 'is-active' : ''}`}
              onClick={() => setFloorPreset(preset.id)}
            >
              <FloorSwatch preset={preset.id} color={preset.color} />
              <span className="floor-copy">
                <strong>{preset.name}</strong>
                <small>{preset.note}</small>
              </span>
              {decor.floor === preset.id && (
                <span className="card-check">
                  <Check size={10} />
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <div className="section-title">
          <span>
            <Paintbrush size={14} />
            墙面色彩
          </span>
          <small>全屋墙面</small>
        </div>
        <div className="wall-color-grid">
          {WALL_COLORS.map((color) => (
            <button
              key={color.color}
              className={`wall-color ${decor.wallColor === color.color ? 'is-active' : ''}`}
              onClick={() => setDecor({ wallColor: color.color })}
              title={color.name}
            >
              <span style={{ background: color.color }} />
              <small>{color.name}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <div className="section-title">
          <span>
            {decor.lighting === 'day' ? (
              <Sun size={14} />
            ) : decor.lighting === 'dusk' ? (
              <Sunset size={14} />
            ) : (
              <Moon size={14} />
            )}
            光影氛围
          </span>
          <small>{LIGHTING_PRESETS.find((item) => item.id === decor.lighting)?.name}</small>
        </div>
        <div className="lighting-list">
          {LIGHTING_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`lighting-card ${decor.lighting === preset.id ? 'is-active' : ''}`}
              onClick={() => setLighting(preset.id)}
            >
              <span className="lighting-swatch" style={{ background: preset.swatch }} />
              <span>
                <strong>{preset.name}</strong>
                <small>{preset.hint}</small>
              </span>
              {decor.lighting === preset.id && <Check size={13} />}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-section">
        <div className="section-title">
          <span>
            <SlidersHorizontal size={14} />
            墙体
          </span>
        </div>
        <div className="range-field">
          <div className="range-label">
            <span>墙体高度</span>
            <strong>{formatNumber(decor.wallHeight, 2)} m</strong>
          </div>
          <input
            type="range"
            min={2.2}
            max={3.4}
            step={0.05}
            value={decor.wallHeight}
            onPointerDown={beginTransaction}
            onPointerUp={endTransaction}
            onBlur={endTransaction}
            onChange={(event) => setDecor({ wallHeight: Number(event.target.value) }, false)}
          />
        </div>
        <button
          className={`toggle-row ${decor.cutaway ? 'is-highlighted' : ''}`}
          onClick={() => setDecor({ cutaway: !decor.cutaway })}
          role="switch"
          aria-checked={decor.cutaway}
        >
          <span className="toggle-copy">
            <span className="toggle-icon">
              <Boxes size={14} />
            </span>
            <span>
              <strong>剖切墙体</strong>
              <small>降低墙高，俯瞰空间布局</small>
            </span>
          </span>
          <span className={`switch ${decor.cutaway ? 'is-on' : ''}`}>
            <span />
          </span>
        </button>
        {!plan && <div className="inline-warning">导入户型图后可调整空间材质</div>}
      </section>
    </div>
  )
}

function FurniturePanel() {
  const category = useDesignStore((state) => state.furnitureCategory)
  const setCategory = useDesignStore((state) => state.setFurnitureCategory)
  const addFurniture = useDesignStore((state) => state.addFurniture)
  const addFurnitureSet = useDesignStore((state) => state.addFurnitureSet)
  const plan = useDesignStore((state) => state.plan)
  const furnitureCount = useDesignStore((state) => state.furniture.length)

  const filtered = useMemo(
    () =>
      category === 'all'
        ? FURNITURE_CATALOG
        : FURNITURE_CATALOG.filter((item) => item.category === category),
    [category],
  )

  return (
    <div className="panel-stack">
      <div className="furniture-intro">
        <div>
          <span className="eyebrow">FURNITURE LIBRARY</span>
          <strong>{furnitureCount} 件家具在场景中</strong>
        </div>
        <span className="tiny-badge">点击添加</span>
      </div>

      <section className="panel-section no-padding">
        <div className="section-title">
          <span>
            <Sparkles size={14} />
            灵感套装
          </span>
          <small>一键摆放组合</small>
        </div>
        <div className="furniture-sets">
          {FURNITURE_SETS.map((set) => (
            <button
              key={set.id}
              className="furniture-set-card"
              onClick={() => addFurnitureSet(set.id)}
              disabled={!plan}
            >
              <span className="set-art" style={{ background: set.accent }}>
                <span />
                <span />
                <span />
              </span>
              <span className="set-copy">
                <strong>{set.name}</strong>
                <small>{set.description}</small>
              </span>
              <span className="set-add">
                <Plus size={13} />
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="category-chips">
        {FURNITURE_CATEGORIES.map((item) => (
          <button
            key={item.id}
            className={category === item.id ? 'is-active' : ''}
            onClick={() => setCategory(item.id as FurnitureCategory | 'all')}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="furniture-grid">
        {filtered.map((item) => (
          <button
            key={item.type}
            className="furniture-card"
            onClick={() => addFurniture(item.type)}
            title={`添加 ${item.name}`}
          >
            <span
              className="furniture-thumb"
              style={{
                background: `linear-gradient(145deg, ${item.color}22, ${item.color}0a)`,
                color: item.color,
              }}
            >
              <FurnitureIcon type={item.type} size={30} strokeWidth={1.35} />
              <span className="furniture-add">
                <Plus size={12} />
              </span>
            </span>
            <span className="furniture-copy">
              <strong>{item.name}</strong>
              <small>
                {formatNumber(item.width, 2)} × {formatNumber(item.depth, 2)} m
              </small>
            </span>
          </button>
        ))}
      </div>

      <div className="sidebar-tip">
        <Sparkles size={15} />
        <span>添加后在场景中按住家具拖动，即可自由摆放</span>
      </div>
    </div>
  )
}

export function Sidebar({ onImport, onImportFile, onLoadDemo, onOpenHelp }: SidebarProps) {
  const leftTab = useDesignStore((state) => state.leftTab)
  const setLeftTab = useDesignStore((state) => state.setLeftTab)
  const plan = useDesignStore((state) => state.plan)
  const mobilePanel = useDesignStore((state) => state.mobilePanel)
  const setMobilePanel = useDesignStore((state) => state.setMobilePanel)

  return (
    <aside className={`sidebar left-sidebar ${mobilePanel === 'left' ? 'is-open' : ''}`}>
      <div className="mobile-panel-bar">
        <span>设计面板</span>
        <button onClick={() => setMobilePanel(null)} aria-label="关闭设计面板">
          <X size={16} />
        </button>
      </div>
      <div className="sidebar-tabs" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={leftTab === tab.id ? 'is-active' : ''}
              onClick={() => setLeftTab(tab.id)}
              role="tab"
              aria-selected={leftTab === tab.id}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="sidebar-scroll">
        {leftTab === 'plan' &&
          (plan ? (
            <PlanPanel onImport={onImport} />
          ) : (
            <EmptyPlanPanel onImport={onImport} onImportFile={onImportFile} onLoadDemo={onLoadDemo} />
          ))}
        {leftTab === 'decor' && <DecorPanel />}
        {leftTab === 'furniture' && <FurniturePanel />}
      </div>
      <div className="sidebar-footer">
        <button onClick={onOpenHelp}>
          <CircleHelp size={14} />
          使用指南与快捷键
        </button>
        <span>室演 3D v0.1</span>
      </div>
    </aside>
  )
}
