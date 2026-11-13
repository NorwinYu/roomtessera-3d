import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import {
  Armchair,
  Box,
  BrickWall,
  ChevronRight,
  Check,
  DoorOpen,
  Eraser,
  Grid3X3,
  Image,
  LayoutTemplate,
  Layers,
  LoaderCircle,
  Maximize2,
  SlidersHorizontal,
  Minimize2,
  MousePointer2,
  PencilRuler,
  Ruler,
  ScanLine,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useDesignStore } from '../store/designStore'
import { formatArea, formatNumber } from '../lib/utils'

const Scene = lazy(() =>
  import('../three/Scene').then((module) => ({ default: module.Scene })),
)

function SceneLoading() {
  return (
    <div className="scene-loading">
      <span className="scene-loading-ring" />
      <small>正在准备三维场景</small>
    </div>
  )
}

interface ViewportProps {
  onImport: () => void
  onImportFile: (file: File) => void
  onLoadDemo: () => void
  onCancelAnalysis: () => void
}

function EmptyState({
  onImport,
  onLoadDemo,
}: {
  onImport: () => void
  onLoadDemo: () => void
}) {
  return (
    <div className="empty-overlay">
      <div className="empty-card">
        <div className="empty-copy">
          <span className="eyebrow">
            <span className="eyebrow-dot" />
            FLOOR PLAN → INTERIOR
          </span>
          <h1>
            把一张户型图
            <br />
            变成<span>可以走进去</span>的家
          </h1>
          <p className="empty-subtitle">
            上传户型图，室演 3D 会自动识别墙体与地面，生成可自由布置的实时三维空间。
          </p>

          <div className="empty-actions">
            <button className="primary-button large-button" onClick={onImport}>
              <Upload size={16} />
              上传户型图
            </button>
            <button className="ghost-button large-button" onClick={onLoadDemo}>
              <Sparkles size={16} />
              打开示例空间
            </button>
          </div>

          <div className="empty-drop-hint">
            <Upload size={14} />
            <span>也可以把 JPG / PNG 户型图拖到窗口任意位置</span>
          </div>

          <div className="feature-chips">
            <span>
              <ScanLine size={14} />
              自动识别墙体
            </span>
            <span>
              <Box size={14} />
              实时 3D 空间
            </span>
            <span>
              <Armchair size={14} />
              自由家具布置
            </span>
          </div>
        </div>

        <div className="empty-art" aria-hidden>
          <div className="blueprint-glow" />
          <svg viewBox="0 0 440 430" fill="none" className="isometric-room">
            <defs>
              <linearGradient id="floorGrad" x1="80" y1="230" x2="360" y2="370" gradientUnits="userSpaceOnUse">
                <stop stopColor="#e8c47e" stopOpacity=".95" />
                <stop offset="1" stopColor="#b88d55" stopOpacity=".9" />
              </linearGradient>
              <linearGradient id="wallLeft" x1="80" y1="120" x2="180" y2="290" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f2ede2" />
                <stop offset="1" stopColor="#d8d0c1" />
              </linearGradient>
              <linearGradient id="wallRight" x1="345" y1="110" x2="250" y2="280" gradientUnits="userSpaceOnUse">
                <stop stopColor="#d7d0c3" />
                <stop offset="1" stopColor="#bdb5a7" />
              </linearGradient>
              <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%">
                <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#3f352a" floodOpacity=".32" />
              </filter>
            </defs>
            <ellipse cx="225" cy="368" rx="160" ry="34" fill="#3f352a" opacity=".18" />
            <g filter="url(#shadow)">
              <path d="M62 212 222 122l164 88-164 92L62 212Z" fill="url(#floorGrad)" />
              <path d="M62 212v62l160 90v-52" fill="#8d6b49" opacity=".55" />
              <path d="M386 212v58l-164 94v-50" fill="#6d5139" opacity=".55" />
              <path d="M62 212 222 122v-66L62 144v68Z" fill="url(#wallLeft)" />
              <path d="M386 212 222 122v-66l164 88v68Z" fill="url(#wallRight)" />
            </g>
            <path d="M62 212 222 122l164 88-164 92L62 212Z" stroke="#f5eee2" strokeOpacity=".55" />
            <path d="M62 212 222 300l164-90" stroke="#6f5438" strokeOpacity=".22" />
            <path d="M62 212 222 122l164 88-164 92L62 212Z" stroke="#fff" strokeOpacity=".22" />
            <g opacity=".96">
              <path d="M143 253l54-30 52 29-53 30-53-29Z" fill="#b79a79" />
              <path d="m143 253 53 30v27l-53-30v-27Z" fill="#8e7155" />
              <path d="m196 283 53-30v26l-53 31v-27Z" fill="#a07f5f" />
              <path d="m153 250 44-24 40 22-42 24-42-22Z" fill="#ded0bd" />
              <path d="m256 279 34-20 7 4-34 20-7-4Z" fill="#d9cbb6" />
              <circle cx="303" cy="240" r="21" fill="#d8c4a4" />
              <circle cx="303" cy="240" r="12" fill="#b7c3a6" />
              <path d="M303 231v27M291 240h24" stroke="#6f7e62" strokeWidth="2" />
            </g>
            <g>
              <path d="M294 160v43l-53 31v-43l53-31Z" fill="#c9b8a4" opacity=".92" />
              <path d="m241 234 53-31v-6l-53 31v6Z" fill="#8f7b66" opacity=".8" />
              <path d="M176 150v66l-53-30v-66l53 30Z" fill="#e7dfd2" opacity=".8" />
              <path d="M176 216v31l-53-30v-31l53 30Z" fill="#cfc4b4" opacity=".8" />
            </g>
            <g fill="#f5c981">
              <circle cx="114" cy="190" r="4" />
              <circle cx="348" cy="185" r="4" />
              <circle cx="230" cy="330" r="3" />
            </g>
            <g stroke="#f7d9a5" strokeOpacity=".5">
              <path d="M114 190 230 255 348 185" />
              <path d="M230 255v75" />
            </g>
          </svg>
          <span className="art-float float-one">
            <Ruler size={14} />
            自动比例
          </span>
          <span className="art-float float-two">
            <Layers size={14} />
            实时材质
          </span>
          <span className="art-float float-three">
            <Sparkles size={14} />
            智能空间
          </span>
          <div className="art-caption">
            <span>01</span>
            <div>
              <strong>空间建模预览</strong>
              <small>REAL-TIME 3D INTERIOR</small>
            </div>
          </div>
        </div>
      </div>
      <p className="empty-footnote">
        <ChevronRight size={12} />
        支持 JPG / PNG / WEBP，建议使用清晰的正视角户型图，单张不超过 20 MB
      </p>
    </div>
  )
}

function AnalysisOverlay({ onCancel }: { onCancel: () => void }) {
  const analysis = useDesignStore((state) => state.analysis)
  if (!analysis.active) return null
  const progress = Math.round(analysis.progress * 100)
  const stages = [
    { label: '读取图像', threshold: 0.12 },
    { label: '识别空间边界', threshold: 0.34 },
    { label: '提取墙体结构', threshold: 0.62 },
    { label: '生成三维空间', threshold: 1.01 },
  ]

  return (
    <div className="analysis-overlay">
      <div className="analysis-card">
        <div className="analysis-preview">
          {analysis.previewUrl ? (
            <img src={analysis.previewUrl} alt="正在解析的户型图" />
          ) : (
            <div className="analysis-placeholder">
              <ScanLine size={40} />
            </div>
          )}
          <div className="scan-line" />
          <div className="analysis-grid" />
          <span className="analysis-tag">
            <LoaderCircle size={12} className="spin" />
            ANALYSING
          </span>
        </div>
        <div className="analysis-body">
          <span className="eyebrow">AUTO RECOGNITION</span>
          <h2>正在构建你的空间</h2>
          <p>{analysis.stage || '正在读取户型结构…'}</p>
          <div className="progress-block">
            <div className="progress-meta">
              <span>空间解析进度</span>
              <strong>{progress}%</strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${Math.max(4, progress)}%` }} />
            </div>
          </div>
          <div className="analysis-steps">
            {stages.map((stage) => {
              const done = analysis.progress >= Math.min(stage.threshold, 0.99)
              return (
                <div key={stage.label} className={done ? 'is-done' : ''}>
                  <span>{done ? '✓' : ''}</span>
                  {stage.label}
                </div>
              )
            })}
          </div>
          <div className="analysis-footer">
            <small className="analysis-note">通常需要 2–5 秒，请勿关闭页面</small>
            <button className="analysis-cancel" onClick={onCancel}>
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SceneTools() {
  const showWalls = useDesignStore((state) => state.showWalls)
  const showGrid = useDesignStore((state) => state.showGrid)
  const showUnderlay = useDesignStore((state) => state.showUnderlay)
  const showFurniture = useDesignStore((state) => state.showFurniture)
  const toggleWalls = useDesignStore((state) => state.toggleWalls)
  const toggleGrid = useDesignStore((state) => state.toggleGrid)
  const toggleUnderlay = useDesignStore((state) => state.toggleUnderlay)
  const toggleFurniture = useDesignStore((state) => state.toggleFurniture)
  const triggerCamera = useDesignStore((state) => state.triggerCamera)
  const measureMode = useDesignStore((state) => state.measureMode)
  const setMeasureMode = useDesignStore((state) => state.setMeasureMode)
  const wallEditMode = useDesignStore((state) => state.wallEditMode)
  const setWallEditMode = useDesignStore((state) => state.setWallEditMode)

  return (
    <div className="scene-tools">
      <div className="tool-group">
        <button
          className={`scene-tool ${showWalls ? 'is-active' : ''}`}
          onClick={toggleWalls}
          title={showWalls ? '隐藏墙体' : '显示墙体'}
          aria-label={showWalls ? '隐藏墙体' : '显示墙体'}
        >
          <DoorOpen size={17} />
        </button>
        <button
          className={`scene-tool ${showGrid ? 'is-active' : ''}`}
          onClick={toggleGrid}
          title="辅助网格"
          aria-label="显示或隐藏辅助网格"
        >
          <Grid3X3 size={17} />
        </button>
        <button
          className={`scene-tool ${showUnderlay ? 'is-active' : ''}`}
          onClick={toggleUnderlay}
          title="原始户型底图"
          aria-label="显示或隐藏原始户型底图"
        >
          <Image size={17} />
        </button>
        <button
          className={`scene-tool ${showFurniture ? 'is-active' : ''}`}
          onClick={toggleFurniture}
          title={showFurniture ? '隐藏家具' : '显示家具'}
          aria-label={showFurniture ? '隐藏家具' : '显示家具'}
        >
          <Armchair size={17} />
        </button>
        <button
          className={`scene-tool ${measureMode ? 'is-active' : ''}`}
          onClick={() => setMeasureMode(!measureMode)}
          title="地面测距"
          aria-label="打开或关闭地面测距"
        >
          <Ruler size={17} />
        </button>
        <button
          className={`scene-tool ${wallEditMode ? 'is-active' : ''}`}
          onClick={() => setWallEditMode(wallEditMode ? null : 'add')}
          title="手动修正墙体"
          aria-label="打开或关闭墙体修正"
        >
          <PencilRuler size={17} />
        </button>
      </div>
      <div className="tool-separator" />
      <div className="tool-group">
        <button className="scene-tool" onClick={() => triggerCamera('zoom-in')} title="放大" aria-label="放大视图">
          <ZoomIn size={17} />
        </button>
        <button className="scene-tool" onClick={() => triggerCamera('zoom-out')} title="缩小" aria-label="缩小视图">
          <ZoomOut size={17} />
        </button>
        <button className="scene-tool" onClick={() => triggerCamera('fit')} title="适应窗口" aria-label="适应窗口">
          <Maximize2 size={17} />
        </button>
      </div>
    </div>
  )
}

function MeasurementHud() {
  const measureMode = useDesignStore((state) => state.measureMode)
  const points = useDesignStore((state) => state.measurePoints)
  const clearMeasurements = useDesignStore((state) => state.clearMeasurements)
  const setMeasureMode = useDesignStore((state) => state.setMeasureMode)
  if (!measureMode) return null
  const distance =
    points.length === 2
      ? Math.hypot(points[1][0] - points[0][0], points[1][1] - points[0][1])
      : null

  return (
    <div className="measure-hud">
      <span className="measure-hud-icon">
        <Ruler size={15} />
      </span>
      <div className="measure-hud-copy">
        <strong>
          {points.length === 0
            ? '点击地面选择起点'
            : points.length === 1
              ? '再点击终点完成测距'
              : '测距结果'}
        </strong>
        <small>
          {distance !== null ? `${distance.toFixed(2)} m` : '沿地面量取空间实际距离'}
        </small>
      </div>
      {points.length > 0 && (
        <button className="measure-clear" onClick={clearMeasurements}>
          清除
        </button>
      )}
      <button
        className="measure-close"
        onClick={() => setMeasureMode(false)}
        aria-label="退出测距"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function WallEditHud() {
  const mode = useDesignStore((state) => state.wallEditMode)
  const draft = useDesignStore((state) => state.wallDraft)
  const wallCount = useDesignStore((state) => state.plan?.wallRectsPx.length ?? 0)
  const historyCount = useDesignStore((state) => state.wallEditHistory.length)
  const setWallEditMode = useDesignStore((state) => state.setWallEditMode)
  const clearAllWalls = useDesignStore((state) => state.clearAllWalls)
  const undoWallEdit = useDesignStore((state) => state.undoWallEdit)
  if (!mode) return null

  const draftLength = draft
    ? Math.hypot(draft.end[0] - draft.start[0], draft.end[1] - draft.start[1])
    : 0
  const instruction =
    mode === 'add'
      ? draft
        ? `${draftLength.toFixed(2)} m · 再点击终点完成`
        : '点击起点，再点击终点；自动吸附墙线和 10cm 网格'
      : '按住拖动，连续擦除墙段'

  const handleClear = () => {
    if (wallCount === 0) return
    if (window.confirm('清空全部墙体？清空后可以直接手动画墙，也可以撤销恢复。')) {
      clearAllWalls()
    }
  }

  return (
    <div className="wall-edit-hud">
      <span className="wall-edit-icon">
        <BrickWall size={16} />
      </span>
      <div className="wall-edit-copy">
        <strong>墙体修正 <em>自动识别草稿</em></strong>
        <small>{instruction}</small>
      </div>
      <div className="wall-edit-tabs">
        <button
          className={mode === 'add' ? 'is-active' : ''}
          onClick={() => setWallEditMode('add')}
        >
          <PencilRuler size={12} />
          补墙
        </button>
        <button
          className={mode === 'erase' ? 'is-active' : ''}
          onClick={() => setWallEditMode('erase')}
        >
          <Eraser size={12} />
          擦除
        </button>
      </div>
      <button
        className="wall-edit-action wall-edit-clear"
        onClick={handleClear}
        disabled={wallCount === 0}
        title="清空全部墙体，可撤销"
      >
        <Trash2 size={14} />
        清空
      </button>
      <button
        className="wall-edit-action"
        onClick={undoWallEdit}
        disabled={historyCount === 0}
        title="撤销上一次墙体修改"
      >
        <Undo2 size={14} />
        撤销
      </button>
      <button className="wall-edit-done" onClick={() => setWallEditMode(null)}>
        <Check size={14} />
        完成
      </button>
    </div>
  )
}

function ViewHud() {
  const plan = useDesignStore((state) => state.plan)
  const viewMode = useDesignStore((state) => state.viewMode)
  const furnitureCount = useDesignStore((state) => state.furniture.length)
  const triggerCamera = useDesignStore((state) => state.triggerCamera)
  if (!plan) return null

  return (
    <>
      <div className="view-hud">
        <span className="view-hud-dot" />
        <span>{viewMode === '3d' ? '实时三维空间' : '平面布局视图'}</span>
        <small>{plan.name}</small>
        {plan.isSample && <span className="hud-sample">示例</span>}
      </div>

      <div className="scene-stats">
        <div>
          <span>识别面积</span>
          <strong>{formatArea(plan.floorAreaM2)}</strong>
        </div>
        <i />
        <div>
          <span>空间尺寸</span>
          <strong>
            {formatNumber(plan.widthM)} × {formatNumber(plan.crop.h * plan.scale)} m
          </strong>
        </div>
        <i />
        <div>
          <span>家具</span>
          <strong>{furnitureCount} 件</strong>
        </div>
        <button onClick={() => triggerCamera('top')} title="切换平面视图">
          <Layers size={13} />
        </button>
      </div>

      <div className="scene-hint">
        <MousePointer2 size={13} />
        <span>拖动家具自由摆放</span>
        <kbd>R</kbd>
        <span>旋转</span>
        <kbd>⌘Z</kbd>
        <span>撤销</span>
      </div>
    </>
  )
}

function MobileDock() {
  const plan = useDesignStore((state) => state.plan)
  const active = useDesignStore((state) => state.analysis.active)
  const setMobilePanel = useDesignStore((state) => state.setMobilePanel)
  const setLeftTab = useDesignStore((state) => state.setLeftTab)
  if (!plan || active) return null

  return (
    <div className="mobile-dock">
      <button
        onClick={() => {
          setLeftTab('plan')
          setMobilePanel('left')
        }}
      >
        <LayoutTemplate size={16} />
        户型
      </button>
      <button
        onClick={() => {
          setLeftTab('furniture')
          setMobilePanel('left')
        }}
      >
        <Armchair size={16} />
        家具
      </button>
      <button
        onClick={() => {
          setLeftTab('decor')
          setMobilePanel('left')
        }}
      >
        <Layers size={16} />
        装修
      </button>
      <button onClick={() => setMobilePanel('right')}>
        <SlidersHorizontal size={16} />
        属性
      </button>
    </div>
  )
}

export function Viewport({ onImport, onImportFile, onLoadDemo, onCancelAnalysis }: ViewportProps) {
  const plan = useDesignStore((state) => state.plan)
  const lighting = useDesignStore((state) => state.decor.lighting)
  const analysisActive = useDesignStore((state) => state.analysis.active)
  const measureMode = useDesignStore((state) => state.measureMode)
  const wallEditMode = useDesignStore((state) => state.wallEditMode)
  const workbenchRef = useRef<HTMLElement>(null)
  const dragCounter = useRef(0)
  const [fileDragActive, setFileDragActive] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import('../three/Scene')
    }, 900)
    return () => window.clearTimeout(timer)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await workbenchRef.current?.requestFullscreen()
        setFullscreen(true)
      } else {
        await document.exitFullscreen()
        setFullscreen(false)
      }
    } catch {
      setFullscreen(false)
    }
  }

  return (
    <main
      className={`workbench lighting-${lighting} ${measureMode ? 'is-measuring' : ''} ${wallEditMode ? 'is-wall-editing' : ''}`}
      ref={workbenchRef}
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes('Files')) return
        event.preventDefault()
        dragCounter.current += 1
        setFileDragActive(true)
      }}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes('Files')) event.preventDefault()
      }}
      onDragLeave={() => {
        dragCounter.current = Math.max(0, dragCounter.current - 1)
        if (dragCounter.current === 0) setFileDragActive(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        dragCounter.current = 0
        setFileDragActive(false)
        const file = event.dataTransfer.files[0]
        if (file) onImportFile(file)
      }}
    >
      <div className="scene-canvas-layer">
        <Suspense fallback={<SceneLoading />}>
          <Scene />
        </Suspense>
      </div>
      <div className="scene-paper-grain" />
      <div className="scene-vignette" />

      {plan && !analysisActive && <ViewHud />}
      {plan && !analysisActive && <SceneTools />}
      {plan && !analysisActive && (
        <button className="fullscreen-button" onClick={toggleFullscreen} title="全屏查看" aria-label="全屏查看">
          {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      )}

      {!plan && !analysisActive && (
        <EmptyState onImport={onImport} onLoadDemo={onLoadDemo} />
      )}
      {analysisActive && <AnalysisOverlay onCancel={onCancelAnalysis} />}
      {plan && !analysisActive && <MeasurementHud />}
      {plan && !analysisActive && <WallEditHud />}
      <MobileDock />

      {fileDragActive && (
        <div className="file-drop-overlay">
          <div>
            <span className="drop-icon">
              <Upload size={27} />
            </span>
            <strong>松开鼠标导入户型图</strong>
            <small>将自动生成三维空间</small>
          </div>
        </div>
      )}
    </main>
  )
}
