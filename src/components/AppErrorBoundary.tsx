import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
  message: string
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return {
      failed: true,
      message: error instanceof Error ? error.message : '未知错误',
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('RoomTessera 3D UI error:', error, info.componentStack)
  }

  private reload = () => {
    window.location.reload()
  }

  private reset = () => {
    try {
      localStorage.removeItem('roomtessera3d.project.v1')
      localStorage.removeItem('haven3d.project.v1')
    } catch {
      // ignore storage access errors
    }
    window.location.reload()
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="app-crash" role="alert">
        <div className="app-crash-card">
          <span className="app-crash-icon">
            <AlertTriangle size={24} />
          </span>
          <span className="eyebrow">APPLICATION RECOVERY</span>
          <h1>页面遇到了一点问题</h1>
          <p>
            已经保留浏览器中的方案数据。可以先尝试重新加载；如果问题持续，重置本地缓存后再打开。
          </p>
          <code>{this.state.message}</code>
          <div className="app-crash-actions">
            <button className="primary-button" onClick={this.reload}>
              <RefreshCw size={15} />
              重新加载
            </button>
            <button className="secondary-button" onClick={this.reset}>
              <Trash2 size={15} />
              重置本地缓存
            </button>
          </div>
        </div>
      </div>
    )
  }
}
