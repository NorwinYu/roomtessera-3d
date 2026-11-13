import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Html, OrbitControls, RoundedBox, useTexture } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  ACESFilmicToneMapping,
  BufferGeometry,
  ExtrudeGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PCFSoftShadowMap,
  Path,
  Plane,
  Raycaster,
  Shape,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type Camera,
  type Texture,
  type PerspectiveCamera,
} from 'three'
import type { FurnitureItem, LightingPreset, PlanState } from '../types'
import { FURNITURE_BY_TYPE } from '../lib/catalog'
import {
  getFloorConfig,
  getFloorTexture,
  prepareAlphaTexture,
  prepareFloorMap,
} from '../lib/materials'
import { getFurnitureCollision } from '../lib/placement'
import { buildWallFootprints } from '../lib/wallFootprint'
import { clamp, downloadDataUrl, formatArea, mixHex, safeFilename } from '../lib/utils'
import { useDesignStore } from '../store/designStore'
import { FurnitureModel } from './FurnitureModels'

interface OrbitControlsLike {
  enabled: boolean
  target: Vector3
  update: () => void
}

interface LightingConfig {
  background: string
  ambient: number
  hemisphere: number
  key: number
  keyColor: string
  fill: number
  fillColor: string
  exposure: number
  nightLights: number
}

const LIGHTING: Record<LightingPreset, LightingConfig> = {
  day: {
    background: '#d8d4ca',
    ambient: 0.38,
    hemisphere: 0.52,
    key: 1.65,
    keyColor: '#fff1db',
    fill: 0.28,
    fillColor: '#c8d5dc',
    exposure: 0.96,
    nightLights: 0,
  },
  dusk: {
    background: '#a49687',
    ambient: 0.3,
    hemisphere: 0.4,
    key: 2.1,
    keyColor: '#ffb36a',
    fill: 0.22,
    fillColor: '#796f88',
    exposure: 1.02,
    nightLights: 0.4,
  },
  night: {
    background: '#171e24',
    ambient: 0.13,
    hemisphere: 0.2,
    key: 0.32,
    keyColor: '#8fa8c6',
    fill: 0.1,
    fillColor: '#50627d',
    exposure: 1.1,
    nightLights: 1.4,
  },
}

function PlanFloor({ plan }: { plan: PlanState }) {
  const floorPreset = useDesignStore((state) => state.decor.floor)
  const showUnderlay = useDesignStore((state) => state.showUnderlay)
  const measureMode = useDesignStore((state) => state.measureMode)
  const wallEditMode = useDesignStore((state) => state.wallEditMode)
  const [alphaTexture, underlayTexture] = useTexture([
    plan.floorAlphaUrl,
    plan.underlayUrl,
  ]) as [Texture, Texture]
  const width = plan.crop.w * plan.scale
  const depth = plan.crop.h * plan.scale
  const config = getFloorConfig(floorPreset)

  const map = useMemo(() => {
    return prepareFloorMap(getFloorTexture(floorPreset), width, depth, floorPreset)
  }, [floorPreset, width, depth])

  const alpha = useMemo(() => prepareAlphaTexture(alphaTexture), [alphaTexture])

  useEffect(() => {
    return () => {
      map.dispose()
      alpha.dispose()
    }
  }, [map, alpha])

  useEffect(() => {
    underlayTexture.colorSpace = SRGBColorSpace
    underlayTexture.needsUpdate = true
  }, [underlayTexture])

  return (
    <group>
      <RoundedBox
        args={[width + 1.25, 0.2, depth + 1.25]}
        radius={0.055}
        smoothness={4}
        position={[0, -0.115, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#c9c3b6" roughness={0.9} metalness={0.01} />
      </RoundedBox>
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[width + 0.96, 0.02, depth + 0.96]} />
        <meshStandardMaterial color="#d7d1c5" roughness={0.86} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.014, 0]}
        receiveShadow
        onPointerDown={(event) => {
          if (event.button === 0 && !measureMode && !wallEditMode) {
            useDesignStore.getState().selectFurniture(null)
          }
        }}
        onPointerMove={(event) => {
          if (wallEditMode !== 'add') return
          const state = useDesignStore.getState()
          if (state.wallDraft) state.updateWallDraft(event.point.x, event.point.z)
        }}
        onClick={(event) => {
          if (event.delta > 3) return
          if (wallEditMode === 'add') {
            event.stopPropagation()
            const state = useDesignStore.getState()
            if (!state.wallDraft) {
              state.startWallDraft(event.point.x, event.point.z)
            } else {
              state.updateWallDraft(event.point.x, event.point.z)
              state.commitWallDraft()
            }
            return
          }
          if (!measureMode) return
          event.stopPropagation()
          useDesignStore.getState().addMeasurePoint(event.point.x, event.point.z)
        }}
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          map={map}
          alphaMap={alpha}
          alphaTest={0.02}
          transparent
          roughness={config.roughness}
          metalness={config.metalness}
          side={DoubleSide}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      {showUnderlay && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, 0]} renderOrder={2}>
          <planeGeometry args={[width, depth]} />
          <meshBasicMaterial
            map={underlayTexture}
            transparent
            opacity={0.62}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  )
}

function WallMesh({ plan }: { plan: PlanState }) {
  const wallColor = useDesignStore((state) => state.decor.wallColor)
  const wallHeight = useDesignStore((state) => state.decor.wallHeight)
  const cutaway = useDesignStore((state) => state.decor.cutaway)
  const showWalls = useDesignStore((state) => state.showWalls)
  const wallEditMode = useDesignStore((state) => state.wallEditMode)
  const effectiveHeight = cutaway ? Math.min(wallHeight, 1.18) : wallHeight
  const trimHeight = Math.min(0.105, Math.max(0.04, effectiveHeight * 0.2))

  const geometry = useMemo(() => {
    const footprints = buildWallFootprints(plan)
    const wallParts: BufferGeometry[] = []
    const trimParts: BufferGeometry[] = []
    const bottom = 0.014
    const wallDepth = Math.max(0.01, effectiveHeight - bottom - trimHeight)

    for (const footprint of footprints) {
      const makeShape = () => {
        const shape = new Shape()
        footprint.points.forEach(([x, z], index) => {
          if (index === 0) shape.moveTo(x, -z)
          else shape.lineTo(x, -z)
        })
        shape.closePath()
        for (const hole of footprint.holes) {
          const path = new Path()
          hole.forEach(([x, z], index) => {
            if (index === 0) path.moveTo(x, -z)
            else path.lineTo(x, -z)
          })
          path.closePath()
          shape.holes.push(path)
        }
        return shape
      }

      const wall = new ExtrudeGeometry(makeShape(), {
        depth: wallDepth,
        bevelEnabled: false,
        steps: 1,
        curveSegments: 1,
      })
      wall.rotateX(-Math.PI / 2)
      wall.translate(0, bottom + trimHeight, 0)
      wallParts.push(wall)

      const trim = new ExtrudeGeometry(makeShape(), {
        depth: trimHeight,
        bevelEnabled: false,
        steps: 1,
        curveSegments: 1,
      })
      trim.rotateX(-Math.PI / 2)
      trim.translate(0, bottom, 0)
      trimParts.push(trim)
    }

    const walls = wallParts.length ? mergeGeometries(wallParts, false) ?? new BufferGeometry() : new BufferGeometry()
    const trims = trimParts.length ? mergeGeometries(trimParts, false) ?? new BufferGeometry() : new BufferGeometry()
    wallParts.forEach((part) => part.dispose())
    trimParts.forEach((part) => part.dispose())
    walls.computeBoundingSphere()
    trims.computeBoundingSphere()
    return { walls, baseboards: trims }
  }, [plan, effectiveHeight, trimHeight])

  useEffect(() => {
    return () => {
      geometry.walls.dispose()
      geometry.baseboards.dispose()
    }
  }, [geometry])

  const erasingRef = useRef(false)
  const lastEraseRef = useRef(0)
  const suppressClickRef = useRef(false)
  const lastHistoryAtRef = useRef(0)

  if (!showWalls) return null

  const finishErase = () => {
    if (!erasingRef.current) return
    erasingRef.current = false
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 450)
    void useDesignStore.getState().refreshRooms()
  }

  const startEraseHistory = () => {
    const now = performance.now()
    if (now - lastHistoryAtRef.current < 800) return
    lastHistoryAtRef.current = now
    useDesignStore.getState().beginWallErase()
  }

  const handleEraseClick = (event: ThreeEvent<MouseEvent>) => {
    if (wallEditMode !== 'erase') return
    if (suppressClickRef.current || performance.now() - lastEraseRef.current < 260) return
    event.stopPropagation()
    const state = useDesignStore.getState()
    startEraseHistory()
    state.eraseWallAt(event.point.x, event.point.z, true)
    lastEraseRef.current = performance.now()
    void state.refreshRooms()
  }

  const handleEraseMove = (event: ThreeEvent<PointerEvent>) => {
    if (wallEditMode !== 'erase') return
    if (event.buttons !== 1) {
      finishErase()
      return
    }
    const now = performance.now()
    if (!erasingRef.current) {
      erasingRef.current = true
      suppressClickRef.current = true
      lastEraseRef.current = now
      const state = useDesignStore.getState()
      startEraseHistory()
      state.eraseWallAt(event.point.x, event.point.z, true)
      return
    }
    if (now - lastEraseRef.current < 45) return
    lastEraseRef.current = now
    event.stopPropagation()
    useDesignStore.getState().eraseWallAt(event.point.x, event.point.z, true)
  }

  const eraseHandlers = {
    onClick: handleEraseClick,
    onPointerMove: handleEraseMove,
    onPointerUp: finishErase,
    onPointerLeave: finishErase,
  }
  return (
    <group>
      <mesh geometry={geometry.walls} castShadow receiveShadow {...eraseHandlers}>
        <meshStandardMaterial color={wallColor} roughness={0.88} metalness={0} />
      </mesh>
      <mesh geometry={geometry.baseboards} receiveShadow {...eraseHandlers}>
        <meshStandardMaterial
          color={mixHex(wallColor, '#5e5548', 0.32)}
          roughness={0.82}
          metalness={0}
        />
      </mesh>
    </group>
  )
}

function SelectionMarker({ item, warning }: { item: FurnitureItem; warning: boolean }) {
  const definition = FURNITURE_BY_TYPE[item.type]
  const outer = Math.max(definition.width, definition.depth) * 0.64 * item.scale + 0.12
  const materialRef = useRef<MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.opacity = 0.5 + Math.sin(clock.elapsedTime * 2.6) * 0.15
    }
  })

  return (
    <group position={[item.position[0], 0.032, item.position[2]]} rotation={[0, item.rotation, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[outer * 0.94, outer, 72]} />
        <meshBasicMaterial
          ref={materialRef}
          color={warning ? '#e07a67' : '#f2c27d'}
          transparent
          opacity={0.65}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} raycast={() => null}>
        <circleGeometry args={[outer * 0.94, 64]} />
        <meshBasicMaterial
          color={warning ? '#e07a67' : '#f2c27d'}
          transparent
          opacity={0.075}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function WallDraftPreview() {
  const mode = useDesignStore((state) => state.wallEditMode)
  const draft = useDesignStore((state) => state.wallDraft)
  if (mode !== 'add' || !draft) return null
  const [start, end] = [draft.start, draft.end]
  const vertical = Math.abs(end[1] - start[1]) > Math.abs(end[0] - start[0])
  const snappedEnd: [number, number] = vertical
    ? [start[0], end[1]]
    : [end[0], start[1]]
  const dx = snappedEnd[0] - start[0]
  const dz = snappedEnd[1] - start[1]
  const length = Math.hypot(dx, dz)
  if (length < 0.05) {
    return (
      <mesh position={[start[0], 0.11, start[1]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.22, 24]} />
        <meshBasicMaterial color="#f2c27d" transparent opacity={0.8} depthWrite={false} />
      </mesh>
    )
  }
  const angle = -Math.atan2(dz, dx)
  return (
    <group>
      <mesh
        position={[(start[0] + snappedEnd[0]) / 2, 0.24, (start[1] + snappedEnd[1]) / 2]}
        rotation={[0, angle, 0]}
      >
        <boxGeometry args={[length, 0.24, 0.08]} />
        <meshBasicMaterial color="#f2c27d" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh position={[start[0], 0.12, start[1]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.13, 20]} />
        <meshBasicMaterial color="#f2c27d" depthWrite={false} />
      </mesh>
      <Html
        position={[(start[0] + snappedEnd[0]) / 2, 0.58, (start[1] + snappedEnd[1]) / 2]}
        center
        style={{ pointerEvents: 'none' }}
        zIndexRange={[25, 0]}
      >
        <div className="wall-draft-label">{length.toFixed(2)} m</div>
      </Html>
    </group>
  )
}

function MeasurementLayer() {
  const measureMode = useDesignStore((state) => state.measureMode)
  const points = useDesignStore((state) => state.measurePoints)
  if (!measureMode || points.length === 0) return null
  const [start, end] = points
  const distance = end ? Math.hypot(end[0] - start[0], end[1] - start[1]) : 0

  return (
    <group>
      {points.map(([x, z], index) => (
        <group key={`${x}-${z}-${index}`} position={[x, 0.09, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.13, 24]} />
            <meshBasicMaterial color="#f2c27d" transparent opacity={0.9} depthWrite={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
            <ringGeometry args={[0.18, 0.22, 28]} />
            <meshBasicMaterial color="#f2c27d" transparent opacity={0.55} depthWrite={false} />
          </mesh>
        </group>
      ))}
      {end && (
        <>
          <mesh
            position={[(start[0] + end[0]) / 2, 0.1, (start[1] + end[1]) / 2]}
            rotation={[0, -Math.atan2(end[1] - start[1], end[0] - start[0]), 0]}
          >
            <boxGeometry args={[distance, 0.018, 0.035]} />
            <meshBasicMaterial color="#f2c27d" transparent opacity={0.95} depthWrite={false} />
          </mesh>
          <Html
            position={[(start[0] + end[0]) / 2, 0.28, (start[1] + end[1]) / 2]}
            center
            style={{ pointerEvents: 'none' }}
            zIndexRange={[26, 0]}
          >
            <div className="measure-label">{distance.toFixed(2)} m</div>
          </Html>
        </>
      )}
    </group>
  )
}

function PlacedFurniture({ item }: { item: FurnitureItem }) {
  const groupRef = useRef<Group>(null)
  const definition = FURNITURE_BY_TYPE[item.type]
  const [dragging, setDragging] = useState(false)
  const [warning, setWarning] = useState(false)
  const warningRef = useRef(false)
  const selected = useDesignStore((state) => state.selectedId === item.id)
  const selectFurniture = useDesignStore((state) => state.selectFurniture)
  const plan = useDesignStore((state) => state.plan)
  const measureMode = useDesignStore((state) => state.measureMode)
  const wallEditMode = useDesignStore((state) => state.wallEditMode)
  const { camera, gl } = useThree()
  const controls = useThree((state) => state.controls) as OrbitControlsLike | null
  const raycaster = useMemo(() => new Raycaster(), [])
  const groundPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), [])
  const pointerNdc = useMemo(() => new Vector2(), [])
  const hitPoint = useMemo(() => new Vector3(), [])
  const dragRef = useRef<{
    pointerId: number
    offsetX: number
    offsetZ: number
    startX: number
    startY: number
    moved: boolean
  } | null>(null)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
  }, [item.type, item.color])

  const evaluateCollision = useCallback(
    (x: number, z: number, rotation: number) => {
      if (!plan) return
      const report = getFurnitureCollision(plan, useDesignStore.getState().furniture, {
        ...item,
        position: [x, 0, z],
        rotation,
      })
      const blocked = report.wall || report.furniture || report.outside
      warningRef.current = blocked
      setWarning(blocked)
    },
    [item, plan],
  )

  const updateFromPointer = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const rect = gl.domElement.getBoundingClientRect()
      pointerNdc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointerNdc, camera as Camera)
      const hit = raycaster.ray.intersectPlane(groundPlane, hitPoint)
      if (!hit || !plan) return
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 4) {
        return
      }
      drag.moved = true
      const halfWidth = (plan.crop.w * plan.scale) / 2 + 0.8
      const halfDepth = (plan.crop.h * plan.scale) / 2 + 0.8
      const nextX = clamp(hit.x + drag.offsetX, -halfWidth, halfWidth)
      const nextZ = clamp(hit.z + drag.offsetZ, -halfDepth, halfDepth)
      const snappedX = Math.round(nextX / 0.05) * 0.05
      const snappedZ = Math.round(nextZ / 0.05) * 0.05
      useDesignStore.getState().updateFurniture(item.id, {
        position: [snappedX, 0, snappedZ],
      })
      evaluateCollision(snappedX, snappedZ, item.rotation)
    },
    [camera, evaluateCollision, gl, groundPlane, hitPoint, item.id, item.rotation, plan, pointerNdc, raycaster],
  )

  useEffect(() => {
    evaluateCollision(item.position[0], item.position[2], item.rotation)
  }, [evaluateCollision, item.position, item.rotation, item.scale])

  useEffect(() => {
    if (!dragging) return
    const handleMove = (event: PointerEvent) => {
      updateFromPointer(event)
    }
    const finish = () => {
      const drag = dragRef.current
      if (!drag) return
      if (gl.domElement.hasPointerCapture?.(drag.pointerId)) {
        gl.domElement.releasePointerCapture(drag.pointerId)
      }
      if (drag.moved) {
        useDesignStore.getState().endTransaction()
        if (warningRef.current) {
          useDesignStore.getState().pushToast({
            title: '家具与墙体或其它家具重叠',
            detail: '可继续拖动调整，或使用右侧位置输入框微调',
            tone: 'warning',
          })
        }
      } else {
        useDesignStore.getState().cancelTransaction()
      }
      dragRef.current = null
      setDragging(false)
      if (controls) controls.enabled = true
      gl.domElement.style.cursor = ''
    }
    window.addEventListener('pointermove', handleMove, { passive: false })
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
    }
  }, [controls, dragging, gl, updateFromPointer])

  useEffect(() => {
    return () => {
      if (controls) controls.enabled = true
    }
  }, [controls])

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (event.button !== 0 || measureMode || wallEditMode) return
    event.stopPropagation()
    selectFurniture(item.id)
    useDesignStore.getState().beginTransaction()
    const native = event.nativeEvent
    const rect = gl.domElement.getBoundingClientRect()
    pointerNdc.set(
      ((native.clientX - rect.left) / rect.width) * 2 - 1,
      -((native.clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(pointerNdc, camera as Camera)
    const hit = raycaster.ray.intersectPlane(groundPlane, hitPoint)
    dragRef.current = {
      pointerId: native.pointerId,
      offsetX: hit ? item.position[0] - hit.x : 0,
      offsetZ: hit ? item.position[2] - hit.z : 0,
      startX: native.clientX,
      startY: native.clientY,
      moved: false,
    }
    evaluateCollision(item.position[0], item.position[2], item.rotation)
    if (controls) controls.enabled = false
    gl.domElement.setPointerCapture?.(native.pointerId)
    gl.domElement.style.cursor = 'grabbing'
    setDragging(true)
  }

  return (
    <>
      <group
        ref={groupRef}
        position={[item.position[0], 0.014, item.position[2]]}
        rotation={[0, item.rotation, 0]}
        scale={item.scale}
        onPointerDown={handlePointerDown}
        onPointerOver={(event) => {
          event.stopPropagation()
          if (!dragging) gl.domElement.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          if (!dragging) gl.domElement.style.cursor = ''
        }}
      >
        <FurnitureModel type={item.type} color={item.color} />
      </group>
      {selected && <SelectionMarker item={item} warning={warning} />}
      {warning && (
        <Html
          position={[item.position[0], 1.35 + definition.height * item.scale * 0.15, item.position[2]]}
          center
          style={{ pointerEvents: 'none' }}
          zIndexRange={[30, 0]}
        >
          <div className="collision-tag">⚠ 与墙体 / 家具重叠</div>
        </Html>
      )}
    </>
  )
}

function FurnitureLayer() {
  const furniture = useDesignStore((state) => state.furniture)
  const showFurniture = useDesignStore((state) => state.showFurniture)
  if (!showFurniture) return null
  return (
    <group>
      {furniture.map((item) => (
        <PlacedFurniture item={item} key={item.id} />
      ))}
    </group>
  )
}

function RoomLabels({ plan }: { plan: PlanState }) {
  const viewMode = useDesignStore((state) => state.viewMode)
  if (viewMode !== 'top' || !plan.rooms?.length) return null
  return (
    <>
      {plan.rooms.map((room) => (
        <Html
          key={room.id}
          position={[room.centerX, 0.09, room.centerZ]}
          center
          style={{ pointerEvents: 'none' }}
          zIndexRange={[24, 0]}
        >
          <div className="room-label">
            <strong>{room.name || '未命名空间'}</strong>
            <span>{formatArea(room.area)}</span>
          </div>
        </Html>
      ))}
    </>
  )
}

function GridOverlay({ plan }: { plan: PlanState }) {
  const showGrid = useDesignStore((state) => state.showGrid)
  const width = plan.crop.w * plan.scale
  const depth = plan.crop.h * plan.scale
  if (!showGrid) return null
  const size = Math.ceil(Math.max(width, depth) + 4)
  return (
    <gridHelper
      args={[size, Math.max(8, Math.round(size / 0.5)), '#6f6a5e', '#999286']}
      position={[0, 0.033, 0]}
    >
      <lineBasicMaterial attach="material" transparent opacity={0.25} toneMapped={false} />
    </gridHelper>
  )
}

function SceneLights({ plan }: { plan: PlanState | null }) {
  const lighting = useDesignStore((state) => state.decor.lighting)
  const furniture = useDesignStore((state) => state.furniture)
  const compact = useThree((state) => state.size.width < 900)
  const config = LIGHTING[lighting]
  const shadowSize = compact ? 1024 : 2048
  const planWidth = plan ? plan.crop.w * plan.scale : 14
  const planDepth = plan ? plan.crop.h * plan.scale : 10
  const extent = Math.max(planWidth, planDepth) / 2 + 6
  const lamps = furniture.filter((item) => item.type === 'floor-lamp').slice(0, 4)

  return (
    <>
      <ambientLight intensity={config.ambient} />
      <hemisphereLight
        color={lighting === 'night' ? '#35465c' : '#f6ebd8'}
        groundColor={lighting === 'night' ? '#101419' : '#8b806f'}
        intensity={config.hemisphere}
      />
      <directionalLight
        castShadow
        position={
          lighting === 'dusk'
            ? [planWidth * 0.45, 9, planDepth * 0.55]
            : [planWidth * 0.4, 13, planDepth * 0.35]
        }
        intensity={config.key}
        color={config.keyColor}
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
        shadow-normalBias={0.045}
      />
      <directionalLight
        castShadow
        position={[-planWidth * 0.4, 7, -planDepth * 0.5]}
        intensity={config.fill}
        color={config.fillColor}
      />
      {lighting !== 'day' && (
        <pointLight
          position={[0, 2.4, 0]}
          intensity={config.nightLights * 8}
          distance={Math.max(planWidth, planDepth) * 0.8}
          decay={2}
          color="#ffc487"
        />
      )}
      {lighting !== 'day' &&
        lamps.map((lamp) => (
          <pointLight
            key={lamp.id}
            position={[lamp.position[0], 1.42, lamp.position[2]]}
            intensity={lighting === 'night' ? 5.5 : 2}
            distance={5.5}
            decay={2}
            color="#ffc98f"
          />
        ))}
    </>
  )
}

interface CameraAnimation {
  fromPosition: Vector3
  toPosition: Vector3
  fromTarget: Vector3
  toTarget: Vector3
  progress: number
  duration: number
}

function CameraRig({ plan }: { plan: PlanState | null }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const controls = useThree((state) => state.controls) as OrbitControlsLike | null
  const viewMode = useDesignStore((state) => state.viewMode)
  const wallEditMode = useDesignStore((state) => state.wallEditMode)
  const command = useDesignStore((state) => state.cameraCommand)
  const animationRef = useRef<CameraAnimation | null>(null)

  const startAnimation = useCallback(
    (toPosition: Vector3, toTarget: Vector3, duration = 0.9) => {
      animationRef.current = {
        fromPosition: camera.position.clone(),
        toPosition,
        fromTarget: controls?.target.clone() ?? new Vector3(),
        toTarget,
        progress: 0,
        duration,
      }
      if (controls) controls.enabled = false
    },
    [camera, controls],
  )

  useEffect(() => {
    if (!controls) return
    const planWidth = plan ? plan.crop.w * plan.scale : 14
    const planDepth = plan ? plan.crop.h * plan.scale : 10
    const maxDim = Math.max(planWidth, planDepth)
    const target = new Vector3(0, 0, 0)
    const fov = (camera.fov * Math.PI) / 180
    const aspect = Math.max(camera.aspect, 0.7)
    const topDistance =
      Math.max(planDepth / 2 / Math.tan(fov / 2), planWidth / 2 / (Math.tan(fov / 2) * aspect)) *
        1.18 +
      2
    const isoFitWidth =
      (planWidth / 2 + 0.8) / (Math.tan(fov / 2) * Math.max(aspect, 0.45))
    const isoFitDepth = (planDepth / 2 + 0.8) / Math.tan(fov / 2)
    const isoDistance = Math.max(isoFitWidth, isoFitDepth, maxDim * 0.72) * 1.12 + 1

    if (command.type === 'zoom-in' || command.type === 'zoom-out') {
      const direction = camera.position.clone().sub(controls.target)
      const factor = command.type === 'zoom-in' ? 0.78 : 1.28
      const toPosition = controls.target.clone().add(direction.multiplyScalar(factor))
      startAnimation(toPosition, controls.target.clone(), 0.45)
      return
    }

    const shouldTop = viewMode === 'top' || command.type === 'top'
    if (shouldTop) {
      startAnimation(new Vector3(0, Math.max(topDistance, 8), 0.35), target, 0.9)
    } else {
      const direction = new Vector3(0.82, 0.7, 0.98).normalize()
      startAnimation(target.clone().add(direction.multiplyScalar(isoDistance)), target, 0.95)
    }
  }, [camera, command.nonce, command.type, controls, plan?.id, startAnimation, viewMode])


  useFrame((_, delta) => {
    const animation = animationRef.current
    if (!animation || !controls) return
    animation.progress = Math.min(1, animation.progress + delta / animation.duration)
    const p = animation.progress
    const eased = 1 - Math.pow(1 - p, 3)
    camera.position.lerpVectors(animation.fromPosition, animation.toPosition, eased)
    controls.target.lerpVectors(animation.fromTarget, animation.toTarget, eased)
    camera.lookAt(controls.target)
    controls.update()
    if (p >= 1) {
      animationRef.current = null
      controls.enabled = true
    }
  })

  return (
    <OrbitControls
      makeDefault
      enableRotate={!wallEditMode}
      enableDamping
      dampingFactor={0.075}
      minDistance={2}
      maxDistance={90}
      maxPolarAngle={Math.PI / 2 - 0.025}
      onStart={() => {
        animationRef.current = null
        if (controls) controls.enabled = true
      }}
    />
  )
}

function ExportBridge() {
  const { gl, scene, camera } = useThree()
  const lighting = useDesignStore((state) => state.decor.lighting)
  const projectName = useDesignStore((state) => state.projectName)
  const pushToast = useDesignStore((state) => state.pushToast)

  useEffect(() => {
    const handler = () => {
      try {
        const previousColor = gl.getClearColor(new Color())
        const previousAlpha = gl.getClearAlpha()
        gl.setClearColor(LIGHTING[lighting].background, 1)
        gl.render(scene, camera)
        const dataUrl = gl.domElement.toDataURL('image/png')
        downloadDataUrl(dataUrl, `${safeFilename(projectName)}-3d.png`)
        gl.setClearColor(previousColor, previousAlpha)
        gl.render(scene, camera)
        pushToast({ title: '效果图已导出', detail: 'PNG 已保存到下载目录', tone: 'success' })
      } catch {
        pushToast({ title: '导出失败', detail: '请稍后重试', tone: 'warning' })
      }
    }
    window.addEventListener('roomtessera3d:export-image', handler)
    return () => window.removeEventListener('roomtessera3d:export-image', handler)
  }, [camera, gl, lighting, projectName, pushToast, scene])

  return null
}

function RendererSettings() {
  const gl = useThree((state) => state.gl)
  const lighting = useDesignStore((state) => state.decor.lighting)

  useEffect(() => {
    gl.toneMappingExposure = LIGHTING[lighting].exposure
  }, [gl, lighting])

  return null
}

function SceneContent() {
  const plan = useDesignStore((state) => state.plan)
  return (
    <>
      <SceneLights plan={plan} />
      {plan ? (
        <>
          <PlanFloor plan={plan} />
          <WallMesh plan={plan} />
          <RoomLabels plan={plan} />
          <GridOverlay plan={plan} />
          <MeasurementLayer />
          <WallDraftPreview />
          <FurnitureLayer />
        </>
      ) : (
        <EmptyScene />
      )}
      <CameraRig plan={plan} />
      <RendererSettings />
      <ExportBridge />
    </>
  )
}

function EmptyScene() {
  return (
    <group>
      <RoundedBox
        args={[15, 0.28, 11]}
        radius={0.06}
        smoothness={4}
        position={[0, -0.2, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#c2bcaf" roughness={0.88} />
      </RoundedBox>
      <gridHelper args={[15, 30, '#7e786b', '#a39c8f']} position={[0, -0.045, 0]}>
        <lineBasicMaterial attach="material" transparent opacity={0.32} toneMapped={false} />
      </gridHelper>
    </group>
  )
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl'),
    )
  } catch {
    return false
  }
}

function SceneFallback() {
  return (
    <div className="webgl-fallback">
      <div>
        <span className="webgl-fallback-icon">
          <svg width="27" height="27" viewBox="0 0 28 28" fill="none" aria-hidden>
            <path d="m14 2.5 9.5 5.2v12.6L14 25.5l-9.5-5.2V7.7L14 2.5Z" stroke="currentColor" strokeWidth="1.3" />
            <path d="m4.5 7.7 9.5 5.2 9.5-5.2M14 12.9v12.6" stroke="currentColor" strokeWidth="1.3" opacity=".65" />
          </svg>
        </span>
        <span className="eyebrow">3D VIEW UNAVAILABLE</span>
        <h2>当前浏览器未启用 WebGL</h2>
        <p>
          请更新 Chrome / Safari，或在浏览器设置中开启硬件加速后刷新页面。
          户型识别与方案保存功能仍可正常使用。
        </p>
      </div>
    </div>
  )
}

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('RoomTessera 3D scene error:', error)
  }

  render() {
    if (this.state.failed) return <SceneFallback />
    return this.props.children
  }
}

export function Scene() {
  const supported = useMemo(() => supportsWebGL(), [])

  if (!supported) return <SceneFallback />

  return (
    <SceneErrorBoundary>
      <Canvas
      shadows={{ type: PCFSoftShadowMap }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      camera={{ position: [14, 11, 16], fov: 38, near: 0.1, far: 220 }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.toneMappingExposure = 0.98
      }}
      onPointerMissed={() => useDesignStore.getState().selectFurniture(null)}
    >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </SceneErrorBoundary>
  )
}
