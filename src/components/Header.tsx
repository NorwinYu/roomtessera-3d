import { useEffect, useRef, useState } from 'react'
import {
  Camera,
  Check,
  Cloud,
  Download,
  FolderOpen,
  HelpCircle,
  ImagePlus,
  MoreHorizontal,
  Redo2,
  Save,
  Scissors,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
} from 'lucide-react'
import { useDesignStore } from '../store/designStore'
import { formatDate } from '../lib/utils'

interface HeaderProps {
  onImport: () => void
  onImportProject: () => void
  onExportProject: () => void
  onLoadDemo: () => void
  onReset: () => void
  onOpenHelp: () => void
  onExportImage: () => void
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden>
      <svg viewBox="0 0 40 40" fill="none">
        <path
          d="M7 14.2 20 7l13 7.2v12.6L20 34 7 26.8V14.2Z"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity=".55"
        />
        <path d="m7 14.2 13 7.2 13-7.2" stroke="currentColor" strokeWidth="1.4" opacity=".7" />
        <path d="M20 21.4V34" stroke="currentColor" strokeWidth="1.4" opacity=".7" />
        <path d="m13.2 17.7 6.8 3.7 6.8-3.7v7.1L20 28.5l-6.8-3.7v-7.1Z" fill="currentColor" opacity=".92" />
      </svg>
    </span>
  )
}

export function Header({
  onImport,
  onImportProject,
  onExportProject,
  onLoadDemo,
  onReset,
  onOpenHelp,
  onExportImage,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const projectName = useDesignStore((state) => state.projectName)
  const setProjectName = useDesignStore((state) => state.setProjectName)
  const plan = useDesignStore((state) => state.plan)
  const viewMode = useDesignStore((state) => state.viewMode)
  const setViewMode = useDesignStore((state) => state.setViewMode)
  const decor = useDesignStore((state) => state.decor)
  const setDecor = useDesignStore((state) => state.setDecor)
  const undo = useDesignStore((state) => state.undo)
  const redo = useDesignStore((state) => state.redo)
  const pastCount = useDesignStore((state) => state.past.length)
  const futureCount = useDesignStore((state) => state.future.length)
  const saveLocal = useDesignStore((state) => state.saveLocal)
  const lastSavedAt = useDesignStore((state) => state.lastSavedAt)

  useEffect(() => {
    if (!menuOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="app-header">
      <div className="brand">
        <BrandMark />
        <div className="brand-copy">
          <div className="brand-name">
            室演 <span>3D</span>
          </div>
          <div className="brand-tagline">ROOMTESSERA · 3D 家装规划</div>
        </div>
        <span className="brand-beta">BETA</span>
      </div>

      <div className="project-block">
        <div className="project-label">当前方案</div>
        <div className="project-title-row">
          <input
            className="project-name-input"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            aria-label="方案名称"
            spellCheck={false}
          />
          <span className={`save-state ${lastSavedAt ? 'is-saved' : ''}`}>
            {lastSavedAt ? <Check size={12} /> : <Cloud size={12} />}
            {lastSavedAt ? `已保存 ${formatDate(new Date(lastSavedAt))}` : '自动保存'}
          </span>
        </div>
      </div>

      <div className="header-actions">
        <div className="segmented view-segment" role="group" aria-label="视图模式">
          <button
            className={viewMode === '3d' ? 'is-active' : ''}
            onClick={() => setViewMode('3d')}
            title="三维视图"
          >
            <BoxIcon />
            <span>3D</span>
          </button>
          <button
            className={viewMode === 'top' ? 'is-active' : ''}
            onClick={() => setViewMode('top')}
            title="平面视图"
          >
            <PlanIcon />
            <span>平面</span>
          </button>
        </div>

        <div className="header-divider" />

        <div className="icon-button-group">
          <button className="icon-button" onClick={undo} disabled={pastCount === 0} title="撤销 ⌘Z">
            <Undo2 size={16} />
          </button>
          <button className="icon-button" onClick={redo} disabled={futureCount === 0} title="重做 ⌘⇧Z">
            <Redo2 size={16} />
          </button>
        </div>

        <button
          className={`toolbar-text-button ${decor.cutaway ? 'is-active' : ''}`}
          onClick={() => setDecor({ cutaway: !decor.cutaway })}
          title="剖切墙体，查看完整平面"
          disabled={!plan}
        >
          <Scissors size={15} />
          <span>剖切</span>
        </button>

        <div className="header-divider" />

        <button
          className="toolbar-text-button"
          onClick={() => saveLocal()}
          title="保存方案到本地"
          disabled={!plan}
        >
          <Save size={15} />
          <span>保存</span>
        </button>

        <button className="primary-button header-export" onClick={onExportImage} disabled={!plan}>
          <Download size={15} />
          <span>导出效果图</span>
        </button>

        <button className="icon-button" onClick={onOpenHelp} title="帮助与快捷键">
          <HelpCircle size={17} />
        </button>

        <div className="menu-wrap" ref={menuRef}>
          <button
            className={`icon-button ${menuOpen ? 'is-active' : ''}`}
            onClick={() => setMenuOpen((value) => !value)}
            title="更多操作"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen && (
            <div className="dropdown-menu" role="menu">
              <div className="dropdown-heading">方案</div>
              <button
                role="menuitem"
                onClick={() => {
                  closeMenu()
                  onImport()
                }}
              >
                <ImagePlus size={15} />
                导入户型图
                <span className="menu-shortcut">JPG / PNG</span>
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  closeMenu()
                  onLoadDemo()
                }}
              >
                <Sparkles size={15} />
                打开示例空间
              </button>
              <div className="dropdown-separator" />
              <div className="dropdown-heading">文件</div>
              <button
                role="menuitem"
                onClick={() => {
                  closeMenu()
                  onImportProject()
                }}
              >
                <FolderOpen size={15} />
                导入方案
                <span className="menu-shortcut">.json</span>
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  closeMenu()
                  onExportProject()
                }}
                disabled={!plan}
              >
                <Upload size={15} />
                导出方案
                <span className="menu-shortcut">.json</span>
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  closeMenu()
                  saveLocal()
                }}
                disabled={!plan}
              >
                <Save size={15} />
                保存到本地
                <span className="menu-shortcut">⌘S</span>
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  closeMenu()
                  onExportImage()
                }}
                disabled={!plan}
              >
                <Camera size={15} />
                导出效果图
                <span className="menu-shortcut">PNG</span>
              </button>
              <div className="dropdown-separator" />
              <button
                role="menuitem"
                className="danger-item"
                onClick={() => {
                  closeMenu()
                  onReset()
                }}
                disabled={!plan}
              >
                <Trash2 size={15} />
                清空当前方案
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function BoxIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="m8 1.7 5.4 3v6.6L8 14.3l-5.4-3V4.7L8 1.7Z"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity=".85"
      />
      <path d="m2.6 4.7 5.4 3 5.4-3M8 7.7v6.6" stroke="currentColor" strokeWidth="1.1" opacity=".65" />
    </svg>
  )
}

function PlanIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.7" y="1.7" width="12.6" height="12.6" rx="1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M6 1.9v4.2h4V1.9M9.9 6.1v7.9M6 8.9h-4" stroke="currentColor" strokeWidth="1.1" opacity=".7" />
    </svg>
  )
}
