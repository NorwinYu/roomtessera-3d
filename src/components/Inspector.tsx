import { useEffect, useState } from 'react'
import {
  Box,
  Camera,
  CircleHelp,
  Copy,
  Info,
  Lamp,
  Maximize,
  MousePointer2,
  Move,
  Palette,
  RotateCcw,
  RotateCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import type { FurnitureType } from '../types'
import { FLOOR_PRESETS, FURNITURE_BY_TYPE, LIGHTING_PRESETS, WALL_COLORS } from '../lib/catalog'
import { formatArea, formatNumber } from '../lib/utils'
import { useDesignStore, useSelectedFurniture } from '../store/designStore'
import { FurnitureIcon } from './FurnitureIcon'

const ITEM_COLORS = [
  '#d5c7b6',
  '#c3ad95',
  '#9d6b55',
  '#b7bda9',
  '#a9b5ba',
  '#d8cbbb',
  '#72533c',
  '#5c615d',
]

function PositionField({
  label,
  axis,
  value,
  onChange,
  onFocus,
  onBlur,
}: {
  label: string
  axis: string
  value: number
  onChange: (value: number) => void
  onFocus: () => void
  onBlur: () => void
}) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState(value.toFixed(2))

  useEffect(() => {
    if (!focused) setDraft(value.toFixed(2))
  }, [focused, value])

  const commit = (raw: string) => {
    const parsed = Number.parseFloat(raw)
    if (Number.isFinite(parsed)) {
      onChange(parsed)
      setDraft(parsed.toFixed(2))
    } else {
      setDraft(value.toFixed(2))
    }
  }

  return (
    <label className="position-field">
      <span className="axis-badge">{axis}</span>
      <span className="position-copy">
        <small>{label}</small>
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          onFocus={() => {
            setFocused(true)
            onFocus()
          }}
          onBlur={() => {
            setFocused(false)
            commit(draft)
            onBlur()
          }}
          onChange={(event) => {
            setDraft(event.target.value)
            const parsed = Number.parseFloat(event.target.value)
            if (Number.isFinite(parsed)) onChange(parsed)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
            if (event.key === 'Escape') {
              setDraft(value.toFixed(2))
              event.currentTarget.blur()
            }
          }}
        />
      </span>
      <span className="unit">m</span>
    </label>
  )
}

function SelectedInspector({ item }: { item: NonNullable<ReturnType<typeof useSelectedFurniture>> }) {
  const definition = FURNITURE_BY_TYPE[item.type]
  const selectFurniture = useDesignStore((state) => state.selectFurniture)
  const updateFurniture = useDesignStore((state) => state.updateFurniture)
  const removeSelected = useDesignStore((state) => state.removeSelected)
  const duplicateSelected = useDesignStore((state) => state.duplicateSelected)
  const rotateSelected = useDesignStore((state) => state.rotateSelected)
  const beginTransaction = useDesignStore((state) => state.beginTransaction)
  const endTransaction = useDesignStore((state) => state.endTransaction)
  const setMobilePanel = useDesignStore((state) => state.setMobilePanel)
  const mobilePanel = useDesignStore((state) => state.mobilePanel)

  const rotationDegrees = Math.round((item.rotation * 180) / Math.PI)

  const setColor = (color: string) => {
    beginTransaction()
    updateFurniture(item.id, { color })
    endTransaction()
  }

  return (
    <aside className={`sidebar right-sidebar inspector ${mobilePanel === 'right' ? 'is-open' : ''}`}>
      <div className="mobile-panel-bar">
        <span>家具属性</span>
        <button onClick={() => setMobilePanel(null)} aria-label="关闭属性面板">
          <X size={16} />
        </button>
      </div>
      <div className="inspector-head">
        <div>
          <span className="eyebrow">SELECTED OBJECT</span>
          <h2>{item.name}</h2>
        </div>
        <button className="icon-button" onClick={() => selectFurniture(null)} title="取消选择">
          <X size={16} />
        </button>
      </div>

      <div className="sidebar-scroll">
        <div className="selected-hero">
          <span
            className="selected-icon"
            style={{ color: item.color, background: `linear-gradient(145deg, ${item.color}33, ${item.color}0d)` }}
          >
            <FurnitureIcon type={item.type} size={42} strokeWidth={1.2} />
          </span>
          <div>
            <strong>{definition.englishName}</strong>
            <p>{definition.description}</p>
          </div>
        </div>

        <div className="dimension-strip">
          <div>
            <small>宽</small>
            <strong>{formatNumber(definition.width, 2)}</strong>
            <span>m</span>
          </div>
          <div>
            <small>深</small>
            <strong>{formatNumber(definition.depth, 2)}</strong>
            <span>m</span>
          </div>
          <div>
            <small>高</small>
            <strong>{formatNumber(definition.height, 2)}</strong>
            <span>m</span>
          </div>
        </div>

        <section className="panel-section inspector-section">
          <div className="section-title">
            <span>
              <Move size={14} />
              位置
            </span>
            <small>拖拽可移动</small>
          </div>
          <div className="position-grid">
            <PositionField
              label="横向"
              axis="X"
              value={item.position[0]}
              onFocus={beginTransaction}
              onBlur={endTransaction}
              onChange={(value) =>
                updateFurniture(item.id, {
                  position: [value, 0, item.position[2]],
                })
              }
            />
            <PositionField
              label="纵向"
              axis="Z"
              value={item.position[2]}
              onFocus={beginTransaction}
              onBlur={endTransaction}
              onChange={(value) =>
                updateFurniture(item.id, {
                  position: [item.position[0], 0, value],
                })
              }
            />
          </div>
          <button
            className="mini-action-row"
            onClick={() => {
              beginTransaction()
              updateFurniture(item.id, { position: [0, 0, 0] })
              endTransaction()
            }}
          >
            <MousePointer2 size={13} />
            移到空间中心
          </button>
        </section>

        <section className="panel-section inspector-section">
          <div className="section-title">
            <span>
              <RotateCw size={14} />
              朝向
            </span>
            <strong className="section-value">{((rotationDegrees % 360) + 360) % 360}°</strong>
          </div>
          <div className="rotation-row">
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={((rotationDegrees % 360) + 360) % 360}
              onPointerDown={beginTransaction}
              onPointerUp={endTransaction}
              onBlur={endTransaction}
              onChange={(event) =>
                updateFurniture(item.id, {
                  rotation: (Number(event.target.value) * Math.PI) / 180,
                })
              }
            />
          </div>
          <div className="button-row two">
            <button className="small-button" onClick={() => rotateSelected(-Math.PI / 4)}>
              <RotateCcw size={13} />
              -45°
            </button>
            <button className="small-button" onClick={() => rotateSelected(Math.PI / 4)}>
              <RotateCw size={13} />
              +45°
            </button>
          </div>
        </section>

        <section className="panel-section inspector-section">
          <div className="section-title">
            <span>
              <Maximize size={14} />
              缩放
            </span>
            <strong className="section-value">{item.scale.toFixed(2)}×</strong>
          </div>
          <input
            type="range"
            min={0.6}
            max={1.5}
            step={0.01}
            value={item.scale}
            onPointerDown={beginTransaction}
            onPointerUp={endTransaction}
            onBlur={endTransaction}
            onChange={(event) =>
              updateFurniture(item.id, { scale: Number(event.target.value) })
            }
          />
          <div className="range-scale">
            <span>0.6×</span>
            <span>保持家具真实感</span>
            <span>1.5×</span>
          </div>
        </section>

        <section className="panel-section inspector-section">
          <div className="section-title">
            <span>
              <Palette size={14} />
              面料 / 木色
            </span>
            <small>即时预览</small>
          </div>
          <div className="color-palette">
            {ITEM_COLORS.map((color) => (
              <button
                key={color}
                className={item.color.toLowerCase() === color.toLowerCase() ? 'is-active' : ''}
                style={{ background: color }}
                onClick={() => setColor(color)}
                aria-label={`颜色 ${color}`}
              />
            ))}
            <label className="custom-color" title="自定义颜色">
              <input type="color" value={item.color} onChange={(event) => setColor(event.target.value)} />
              <span>+</span>
            </label>
          </div>
        </section>

        <div className="inspector-actions">
          <button className="secondary-button" onClick={duplicateSelected}>
            <Copy size={14} />
            复制
          </button>
          <button className="danger-button" onClick={removeSelected}>
            <Trash2 size={14} />
            删除
          </button>
        </div>

        <div className="inspector-hint">
          <Info size={13} />
          <span>按住家具拖动即可自由摆放，按 R 旋转 15°</span>
        </div>
      </div>
    </aside>
  )
}

function OverviewInspector() {
  const plan = useDesignStore((state) => state.plan)
  const furniture = useDesignStore((state) => state.furniture)
  const decor = useDesignStore((state) => state.decor)
  const selectFurniture = useDesignStore((state) => state.selectFurniture)
  const setHelpOpen = useDesignStore((state) => state.setHelpOpen)
  const setMobilePanel = useDesignStore((state) => state.setMobilePanel)
  const mobilePanel = useDesignStore((state) => state.mobilePanel)
  const floor = FLOOR_PRESETS.find((item) => item.id === decor.floor)
  const lighting = LIGHTING_PRESETS.find((item) => item.id === decor.lighting)
  const wall = WALL_COLORS.find((item) => item.color === decor.wallColor)

  return (
    <aside className={`sidebar right-sidebar inspector ${mobilePanel === 'right' ? 'is-open' : ''}`}>
      <div className="mobile-panel-bar">
        <span>家具属性</span>
        <button onClick={() => setMobilePanel(null)} aria-label="关闭属性面板">
          <X size={16} />
        </button>
      </div>
      <div className="inspector-head">
        <div>
          <span className="eyebrow">SPACE OVERVIEW</span>
          <h2>空间概览</h2>
        </div>
        <span className="live-badge">
          <span />
          LIVE
        </span>
      </div>

      <div className="sidebar-scroll">
        {plan ? (
          <>
            <div className="overview-hero">
              <span className="overview-area-label">识别空间面积</span>
              <div className="overview-area">
                {formatArea(plan.floorAreaM2)}
              </div>
              <div className="overview-meta">
                <span>{formatNumber(plan.widthM)} × {formatNumber(plan.crop.h * plan.scale)} m</span>
                <span>{plan.rooms?.length ?? 0} 个空间</span>
                <span>{plan.wallCount} 段墙体</span>
                <span>{furniture.length} 件家具</span>
              </div>
            </div>

            <section className="panel-section inspector-section">
              <div className="section-title">
                <span>
                  <Sparkles size={14} />
                  当前方案
                </span>
              </div>
              <div className="summary-list">
                <div>
                  <span className="summary-dot" style={{ background: floor?.color }} />
                  <div>
                    <small>地面</small>
                    <strong>{floor?.name}</strong>
                  </div>
                </div>
                <div>
                  <span className="summary-dot" style={{ background: decor.wallColor }} />
                  <div>
                    <small>墙面</small>
                    <strong>{wall?.name ?? '自定义'}</strong>
                  </div>
                </div>
                <div>
                  <span className="summary-dot" style={{ background: lighting?.swatch }} />
                  <div>
                    <small>光照</small>
                    <strong>{lighting?.name}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="panel-section inspector-section">
              <div className="section-title">
                <span>
                  <Box size={14} />
                  场景家具
                </span>
                <small>{furniture.length} 件</small>
              </div>
              {furniture.length === 0 ? (
                <div className="empty-inline">
                  <FurnitureIcon type={'sofa' as FurnitureType} size={24} />
                  <span>还没有家具，试试从左侧家具库添加</span>
                </div>
              ) : (
                <div className="object-list">
                  {furniture.slice(0, 8).map((item) => (
                    <button key={item.id} onClick={() => selectFurniture(item.id)}>
                      <span className="object-icon" style={{ color: item.color }}>
                        <FurnitureIcon type={item.type} size={16} />
                      </span>
                      <span>{item.name}</span>
                      <small>
                        {formatNumber(item.position[0], 1)}, {formatNumber(item.position[2], 1)}
                      </small>
                    </button>
                  ))}
                  {furniture.length > 8 && (
                    <div className="object-more">以及另外 {furniture.length - 8} 件家具</div>
                  )}
                </div>
              )}
            </section>

            <section className="panel-section inspector-section">
              <div className="section-title">
                <span>
                  <MousePointer2 size={14} />
                  场景操作
                </span>
              </div>
              <div className="shortcut-list">
                <div>
                  <span>旋转视角</span>
                  <kbd>左键拖拽</kbd>
                </div>
                <div>
                  <span>平移视角</span>
                  <kbd>右键拖拽</kbd>
                </div>
                <div>
                  <span>缩放视角</span>
                  <kbd>滚轮</kbd>
                </div>
                <div>
                  <span>移动家具</span>
                  <kbd>按住拖动</kbd>
                </div>
                <div>
                  <span>旋转家具</span>
                  <kbd>R</kbd>
                </div>
              </div>
            </section>

            <button className="help-card" onClick={() => setHelpOpen(true)}>
              <span className="help-icon">
                <CircleHelp size={18} />
              </span>
              <span>
                <strong>第一次使用？</strong>
                <small>查看完整功能与操作指南</small>
              </span>
            </button>
          </>
        ) : (
          <>
            <div className="empty-inspector-art">
              <span className="empty-room-line" />
              <span className="empty-room-line" />
              <span className="empty-room-line" />
              <Camera size={34} />
            </div>
            <div className="empty-inspector">
              <h3>等待你的空间</h3>
              <p>导入户型图后，这里会显示空间面积、家具清单和实时操作信息。</p>
              <button className="help-card" onClick={() => setHelpOpen(true)}>
                <span className="help-icon">
                  <CircleHelp size={18} />
                </span>
                <span>
                  <strong>了解工作流程</strong>
                  <small>从户型图到 3D 布置</small>
                </span>
              </button>
            </div>
          </>
        )}

        <div className="inspector-footer-note">
          <Lamp size={13} />
          <span>所有修改自动保存于本地浏览器</span>
        </div>
      </div>
    </aside>
  )
}

export function Inspector() {
  const selected = useSelectedFurniture()
  return selected ? <SelectedInspector item={selected} /> : <OverviewInspector />
}
