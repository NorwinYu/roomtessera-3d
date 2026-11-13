import { useCallback, useEffect, useRef, useState } from 'react'
import { Header } from './components/Header'
import { Inspector } from './components/Inspector'
import { ConfirmDialog, HelpModal, Toasts } from './components/Modals'
import { Sidebar } from './components/Sidebar'
import { Viewport } from './components/Viewport'
import { MAX_FILE_BYTES } from './lib/catalog'
import { createDemoFurniture, generateDemoPlanImage } from './lib/demoPlan'
import { analyzeFloorPlan } from './lib/planAnalysis'
import { isSavedProject } from './lib/projectValidation'
import {
  downloadBlob,
  fileToDataUrl,
  formatArea,
  isImageFile,
  safeFilename,
  sleep,
} from './lib/utils'
import { useDesignStore } from './store/designStore'

interface ConfirmState {
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
}

export default function App() {
  const planInputRef = useRef<HTMLInputElement>(null)
  const projectInputRef = useRef<HTMLInputElement>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const setAnalysis = useDesignStore((state) => state.setAnalysis)
  const setPlan = useDesignStore((state) => state.setPlan)
  const setProjectName = useDesignStore((state) => state.setProjectName)
  const loadProject = useDesignStore((state) => state.loadProject)
  const resetProject = useDesignStore((state) => state.resetProject)
  const pushToast = useDesignStore((state) => state.pushToast)
  const setHelpOpen = useDesignStore((state) => state.setHelpOpen)
  const saveLocal = useDesignStore((state) => state.saveLocal)
  const serializeProject = useDesignStore((state) => state.serializeProject)
  const setLeftTab = useDesignStore((state) => state.setLeftTab)
  const selectedId = useDesignStore((state) => state.selectedId)
  const mobilePanel = useDesignStore((state) => state.mobilePanel)
  const setMobilePanel = useDesignStore((state) => state.setMobilePanel)
  const analysisAbortRef = useRef<AbortController | null>(null)

  const runImageImport = useCallback(
    async (file: File) => {
      const controller = new AbortController()
      analysisAbortRef.current?.abort()
      analysisAbortRef.current = controller
      try {
        setMobilePanel(null)
        const dataUrl = await fileToDataUrl(file)
        setAnalysis({ active: true, progress: 0.02, stage: '读取户型图', previewUrl: dataUrl })
        await sleep(220)
        const result = await analyzeFloorPlan(dataUrl, file.name, {
          signal: controller.signal,
          onProgress: (progress, stage) => {
            if (analysisAbortRef.current === controller) setAnalysis({ progress, stage })
          },
        })
        if (controller.signal.aborted) return
        setPlan(result)
        if (
          useDesignStore.getState().projectName === '我的家' ||
          !useDesignStore.getState().projectName.trim()
        ) {
          setProjectName(result.name)
        }
        setAnalysis({ active: false, progress: 1, stage: '' })
        setLeftTab('decor')
        if (analysisAbortRef.current === controller) analysisAbortRef.current = null
        pushToast({
          title: '三维空间已生成',
          detail: `${result.rooms?.length ?? 0} 个空间 · ${formatArea(result.floorAreaM2)} · ${result.wallCount} 段墙体`,
          tone: 'success',
        })
      } catch (error) {
        if (analysisAbortRef.current !== controller) return
        analysisAbortRef.current = null
        setAnalysis({ active: false, progress: 0, stage: '' })
        if (error instanceof Error && error.name === 'AbortError') return
        pushToast({
          title: '户型解析失败',
          detail: error instanceof Error ? error.message : '请尝试更清晰的户型图',
          tone: 'warning',
        })
      }
    },
    [pushToast, setAnalysis, setLeftTab, setMobilePanel, setPlan, setProjectName],
  )

  const cancelAnalysis = useCallback(() => {
    analysisAbortRef.current?.abort()
    analysisAbortRef.current = null
    setAnalysis({ active: false, progress: 0, stage: '' })
    pushToast({ title: '已取消本次识别', tone: 'default' })
  }, [pushToast, setAnalysis])

  const requestImageImport = useCallback(
    (file: File) => {
      if (useDesignStore.getState().analysis.active) {
        pushToast({ title: '正在生成空间', detail: '请稍候再导入新的户型图', tone: 'warning' })
        return
      }
      if (!isImageFile(file)) {
        pushToast({ title: '文件格式不支持', detail: '请选择 JPG、PNG 或 WEBP 图片', tone: 'warning' })
        return
      }
      if (file.size > MAX_FILE_BYTES) {
        pushToast({ title: '图片过大', detail: '请选择不超过 20 MB 的户型图', tone: 'warning' })
        return
      }
      const state = useDesignStore.getState()
      if (state.plan && state.furniture.length > 0) {
        setConfirmState({
          title: '替换当前户型？',
          description: '导入新的户型图会重建空间，并清空当前已布置的家具。当前方案已自动保存在本地。',
          confirmLabel: '导入并重建',
          onConfirm: () => {
            setConfirmState(null)
            void runImageImport(file)
          },
        })
        return
      }
      void runImageImport(file)
    },
    [pushToast, runImageImport],
  )

  const runLoadDemo = useCallback(async () => {
    const controller = new AbortController()
    analysisAbortRef.current?.abort()
    analysisAbortRef.current = controller
    try {
      setMobilePanel(null)
      setAnalysis({ active: true, progress: 0.02, stage: '生成示例户型' })
      const demoImage = generateDemoPlanImage()
      setAnalysis({ progress: 0.08, stage: '绘制示例空间', previewUrl: demoImage })
      await sleep(240)
      const result = await analyzeFloorPlan(demoImage, '云栖公寓 · 示例户型', {
        widthM: 18,
        signal: controller.signal,
        onProgress: (progress, stage) => {
          if (analysisAbortRef.current === controller) setAnalysis({ progress, stage })
        },
      })
      if (controller.signal.aborted) return
      const demoPlan = { ...result, isSample: true }
      const demoFurniture = createDemoFurniture(demoPlan)
      setPlan(demoPlan, { furniture: demoFurniture })
      setProjectName('云栖公寓 · 示例方案')
      setAnalysis({ active: false, progress: 1, stage: '' })
      setLeftTab('decor')
      if (analysisAbortRef.current === controller) analysisAbortRef.current = null
      pushToast({
        title: '示例空间已就绪',
        detail: '试试拖动家具、切换材质或剖切墙体',
        tone: 'success',
      })
    } catch (error) {
      if (analysisAbortRef.current !== controller) return
      analysisAbortRef.current = null
      setAnalysis({ active: false, progress: 0, stage: '' })
      if (error instanceof Error && error.name === 'AbortError') return
      pushToast({
        title: '示例加载失败',
        detail: error instanceof Error ? error.message : '请刷新页面重试',
        tone: 'warning',
      })
    }
  }, [pushToast, setAnalysis, setLeftTab, setMobilePanel, setPlan, setProjectName])

  const requestLoadDemo = useCallback(() => {
    if (useDesignStore.getState().analysis.active) {
      pushToast({ title: '正在生成空间', detail: '请稍候再加载示例', tone: 'warning' })
      return
    }
    const state = useDesignStore.getState()
    if (state.plan && state.furniture.length > 0) {
      setConfirmState({
        title: '打开示例空间？',
        description: '示例会替换当前户型与家具布置。当前方案已自动保存在本地，你也可以先导出方案文件。',
        confirmLabel: '打开示例',
        onConfirm: () => {
          setConfirmState(null)
          void runLoadDemo()
        },
      })
      return
    }
    void runLoadDemo()
  }, [pushToast, runLoadDemo])

  const openImport = useCallback(() => {
    planInputRef.current?.click()
  }, [])

  const openProjectImport = useCallback(() => {
    projectInputRef.current?.click()
  }, [])

  const exportProject = useCallback(() => {
    const state = useDesignStore.getState()
    if (!state.plan) {
      pushToast({ title: '暂无可导出的方案', detail: '请先导入户型图', tone: 'warning' })
      return
    }
    const payload = JSON.stringify(serializeProject(), null, 2)
    downloadBlob(
      new Blob([payload], { type: 'application/json' }),
      `${safeFilename(state.projectName)}.roomtessera.json`,
    )
    pushToast({ title: '方案文件已导出', detail: '包含户型、家具与装修设置', tone: 'success' })
  }, [pushToast, serializeProject])

  const exportImage = useCallback(() => {
    const state = useDesignStore.getState()
    if (!state.plan) {
      pushToast({ title: '暂无可导出的空间', detail: '请先导入户型图', tone: 'warning' })
      return
    }
    window.dispatchEvent(new Event('roomtessera3d:export-image'))
  }, [pushToast])

  const requestReset = useCallback(() => {
    setConfirmState({
      title: '清空当前方案？',
      description: '户型、家具和装修设置都会被移除，本地缓存也会一并清除。该操作无法撤销。',
      confirmLabel: '清空方案',
      destructive: true,
      onConfirm: () => {
        setConfirmState(null)
        resetProject()
        pushToast({ title: '已开始新的空方案', tone: 'default' })
      },
    })
  }, [pushToast, resetProject])

  const handleProjectFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        const parsed: unknown = JSON.parse(text)
        if (!isSavedProject(parsed)) {
          throw new Error('文件不是有效的室演 3D 方案，或数据结构已损坏')
        }
        const apply = () => {
          loadProject(parsed)
          pushToast({
            title: '方案已导入',
            detail: parsed.projectName || '未命名方案',
            tone: 'success',
          })
        }
        if (useDesignStore.getState().plan) {
          setConfirmState({
            title: '导入并覆盖当前方案？',
            description: '当前户型与家具将会被导入的方案替换。',
            confirmLabel: '导入方案',
            onConfirm: () => {
              setConfirmState(null)
              apply()
            },
          })
        } else {
          apply()
        }
      } catch (error) {
        pushToast({
          title: '方案导入失败',
          detail: error instanceof Error ? error.message : '请检查文件是否完整',
          tone: 'warning',
        })
      }
    },
    [loadProject, pushToast],
  )

  useEffect(() => {
    return () => {
      const controller = analysisAbortRef.current
      analysisAbortRef.current = null
      controller?.abort()
    }
  }, [])

  useEffect(() => {
    let timer: number | undefined
    const unsubscribe = useDesignStore.subscribe((state, previous) => {
      if (!state.plan) return
      const relevantChange =
        state.plan !== previous.plan ||
        state.furniture !== previous.furniture ||
        state.decor !== previous.decor ||
        state.projectName !== previous.projectName
      if (!relevantChange) return
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        useDesignStore.getState().saveLocal({ silent: true })
      }, 900)
    })
    return () => {
      window.clearTimeout(timer)
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const persist = () => {
      const state = useDesignStore.getState()
      if (state.plan) state.saveLocal({ silent: true })
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') persist()
    }
    window.addEventListener('beforeunload', persist)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('beforeunload', persist)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    if (!selectedId) return
    if (window.matchMedia('(max-width: 1000px)').matches) {
      useDesignStore.getState().setMobilePanel('right')
    }
  }, [selectedId])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable
      const mod = event.metaKey || event.ctrlKey
      const key = event.key
      const lower = key.toLowerCase()

      if (mod && lower === 's') {
        event.preventDefault()
        saveLocal()
        return
      }
      if (isTyping) return

      if (mod && lower === 'z') {
        event.preventDefault()
        if (event.shiftKey) useDesignStore.getState().redo()
        else useDesignStore.getState().undo()
        return
      }
      if (mod && lower === 'd') {
        event.preventDefault()
        useDesignStore.getState().duplicateSelected()
        return
      }
      if (key === 'Escape') {
        useDesignStore.getState().selectFurniture(null)
        useDesignStore.getState().setHelpOpen(false)
        useDesignStore.getState().setExportMenuOpen(false)
        setConfirmState(null)
        return
      }
      if (key === '?') {
        useDesignStore.getState().setHelpOpen(true)
        return
      }
      const state = useDesignStore.getState()
      if (!state.selectedId) return
      if (lower === 'r') {
        event.preventDefault()
        state.rotateSelected(Math.PI / 12)
        return
      }
      if (key === 'Backspace' || key === 'Delete') {
        event.preventDefault()
        state.removeSelected()
        return
      }
      const step = event.shiftKey ? 0.25 : 0.1
      if (key === 'ArrowLeft') {
        event.preventDefault()
        state.nudgeSelected(-step, 0)
      } else if (key === 'ArrowRight') {
        event.preventDefault()
        state.nudgeSelected(step, 0)
      } else if (key === 'ArrowUp') {
        event.preventDefault()
        state.nudgeSelected(0, -step)
      } else if (key === 'ArrowDown') {
        event.preventDefault()
        state.nudgeSelected(0, step)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saveLocal])

  return (
    <div className="app-shell">
      <Header
        onImport={openImport}
        onImportProject={openProjectImport}
        onExportProject={exportProject}
        onLoadDemo={requestLoadDemo}
        onReset={requestReset}
        onOpenHelp={() => setHelpOpen(true)}
        onExportImage={exportImage}
      />
      <div className="app-body">
        <Sidebar
          onImport={openImport}
          onImportFile={requestImageImport}
          onLoadDemo={requestLoadDemo}
          onOpenHelp={() => setHelpOpen(true)}
        />
        <Viewport
          onImport={openImport}
          onImportFile={requestImageImport}
          onLoadDemo={requestLoadDemo}
          onCancelAnalysis={cancelAnalysis}
        />
        <Inspector />
      </div>

      <input
        ref={planInputRef}
        className="global-plan-input"
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) requestImageImport(file)
          event.target.value = ''
        }}
      />
      <input
        ref={projectInputRef}
        className="global-project-input"
        type="file"
        accept="application/json,.json,.roomtessera.json,.roomtrial.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleProjectFile(file)
          event.target.value = ''
        }}
      />

      {mobilePanel && (
        <button
          className="mobile-panel-backdrop"
          aria-label="关闭侧边面板"
          onClick={() => setMobilePanel(null)}
        />
      )}
      <Toasts />
      <HelpModal />
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? ''}
        description={confirmState?.description ?? ''}
        confirmLabel={confirmState?.confirmLabel}
        destructive={confirmState?.destructive}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  )
}
