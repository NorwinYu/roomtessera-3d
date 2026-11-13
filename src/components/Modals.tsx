import { useEffect } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Info,
  Keyboard,
  Layers,
  Move3D,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useDesignStore } from '../store/designStore'
import { KEYBOARD_HINTS } from '../lib/catalog'
import { cn } from '../lib/utils'

export function Toasts() {
  const toasts = useDesignStore((state) => state.toasts)
  const dismissToast = useDesignStore((state) => state.dismissToast)

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div className={cn('toast', toast.tone && `tone-${toast.tone}`)} key={toast.id}>
          <span className="toast-icon">
            {toast.tone === 'success' ? (
              <CheckCircle2 size={16} />
            ) : toast.tone === 'warning' ? (
              <AlertTriangle size={16} />
            ) : (
              <Info size={16} />
            )}
          </span>
          <span className="toast-copy">
            <strong>{toast.title}</strong>
            {toast.detail && <small>{toast.detail}</small>}
          </span>
          <button onClick={() => dismissToast(toast.id)} aria-label="关闭提示">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}

export function HelpModal() {
  const open = useDesignStore((state) => state.isHelpOpen)
  const setOpen = useDesignStore((state) => state.setHelpOpen)

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div className="modal-backdrop" onPointerDown={() => setOpen(false)}>
      <div className="modal help-modal" onPointerDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={() => setOpen(false)} aria-label="关闭">
          <X size={17} />
        </button>
        <span className="modal-eyebrow">
          <CircleHelp size={13} />
          ROOMTESSERA 3D GUIDE
        </span>
        <h2>从户型图，到你的理想空间</h2>
        <p className="modal-lead">
          三步完成空间生成与布置。所有数据都保存在本地浏览器，不会上传到服务器。
        </p>

        <div className="workflow-grid">
          <div className="workflow-card">
            <span className="workflow-number">01</span>
            <span className="workflow-icon">
              <Sparkles size={19} />
            </span>
            <strong>导入户型图</strong>
            <p>上传正视角的 JPG / PNG。系统自动识别地面、墙体和空间比例。</p>
          </div>
          <div className="workflow-card">
            <span className="workflow-number">02</span>
            <span className="workflow-icon">
              <Layers size={19} />
            </span>
            <strong>装修空间</strong>
            <p>切换地面材质、墙面色彩与光影氛围，也可一键套用风格方案。</p>
          </div>
          <div className="workflow-card">
            <span className="workflow-number">03</span>
            <span className="workflow-icon">
              <Move3D size={19} />
            </span>
            <strong>布置家具</strong>
            <p>从家具库添加，直接在三维空间拖动；右侧面板可精确调整。</p>
          </div>
        </div>

        <div className="modal-two-col">
          <section className="shortcut-panel">
            <h3>
              <Keyboard size={15} />
              快捷键
            </h3>
            <div className="keyboard-grid">
              {KEYBOARD_HINTS.map((hint) => (
                <div key={hint.label}>
                  <span>{hint.label}</span>
                  <span className="keys">
                    {hint.keys.map((key) => (
                      <kbd key={key}>{key}</kbd>
                    ))}
                  </span>
                </div>
              ))}
              <div>
                <span>方向键微调</span>
                <span className="keys">
                  <kbd>↑</kbd>
                  <kbd>↓</kbd>
                  <kbd>←</kbd>
                  <kbd>→</kbd>
                </span>
              </div>
              <div>
                <span>保存</span>
                <span className="keys">
                  <kbd>⌘</kbd>
                  <kbd>S</kbd>
                </span>
              </div>
            </div>
          </section>
          <section className="tips-panel">
            <h3>
              <Info size={15} />
              小贴士
            </h3>
            <ul>
              <li>自动墙体只作草稿；可在「户型」里清空后手动画墙，或用墙体修正擦除/补墙。</li>
              <li>若整体尺寸不准确，可在「户型」面板调整总宽。</li>
              <li>拖动家具时自动吸附到 5 cm 网格，便于对齐。</li>
              <li>使用「剖切」可以降低墙体高度，查看全屋布局。</li>
            </ul>
          </section>
        </div>

        <div className="modal-footer">
          <span>室演 3D · 本地优先的 3D 家装规划工具</span>
          <button className="secondary-button" onClick={() => setOpen(false)}>
            开始设计
          </button>
        </div>
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '继续',
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="modal-backdrop is-front" onPointerDown={onCancel}>
      <div className="modal confirm-modal" onPointerDown={(event) => event.stopPropagation()}>
        <span className={cn('confirm-icon', destructive && 'is-destructive')}>
          {destructive ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
        </span>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="confirm-actions">
          <button className="secondary-button" onClick={onCancel}>
            取消
          </button>
          <button className={destructive ? 'danger-button filled' : 'primary-button'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
