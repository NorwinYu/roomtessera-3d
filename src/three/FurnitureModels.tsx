import { RoundedBox } from '@react-three/drei'
import type { FurnitureType } from '../types'
import { mixHex } from '../lib/utils'

const DARK_WOOD = '#48362a'
const LINEN = '#e9e1d4'
const METAL = '#b59a73'
const TV_BLACK = '#1c211f'

interface ModelProps {
  color: string
}

function Cushion({
  color,
  position,
  size,
  rotation = 0,
  roughness = 0.92,
}: {
  color: string
  position: [number, number, number]
  size: [number, number, number]
  rotation?: number
  roughness?: number
}) {
  return (
    <RoundedBox
      args={size}
      radius={Math.min(size[0], size[1], size[2]) * 0.28}
      smoothness={3}
      position={position}
      rotation={[0, rotation, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={roughness} metalness={0.01} />
    </RoundedBox>
  )
}

function Leg({
  x,
  z,
  height = 0.14,
  color = DARK_WOOD,
  radius = 0.028,
}: {
  x: number
  z: number
  height?: number
  color?: string
  radius?: number
}) {
  return (
    <mesh position={[x, height / 2, z]} castShadow>
      <cylinderGeometry args={[radius, radius * 0.82, height, 10]} />
      <meshStandardMaterial color={color} roughness={0.58} metalness={0.03} />
    </mesh>
  )
}

function Sofa({ color }: ModelProps) {
  const width = 2.35
  const depth = 0.95
  const fabricAccent = mixHex(color, '#f6eee1', 0.22)
  return (
    <group>
      <Cushion color={color} position={[0, 0.25, 0.02]} size={[width, 0.26, depth]} />
      <Cushion color={fabricAccent} position={[-0.37, 0.47, 0.09]} size={[0.72, 0.18, 0.67]} />
      <Cushion color={fabricAccent} position={[0.37, 0.47, 0.09]} size={[0.72, 0.18, 0.67]} />
      <Cushion color={color} position={[0, 0.61, -0.38]} size={[width, 0.64, 0.2]} />
      <Cushion color={fabricAccent} position={[-0.58, 0.62, -0.2]} size={[0.58, 0.46, 0.14]} rotation={0.04} />
      <Cushion color={fabricAccent} position={[0.04, 0.62, -0.2]} size={[0.58, 0.46, 0.14]} rotation={-0.03} />
      <Cushion color={mixHex(color, '#c77751', 0.25)} position={[0.64, 0.62, -0.17]} size={[0.44, 0.4, 0.14]} rotation={0.13} />
      <Cushion color={mixHex(color, '#7e8f78', 0.22)} position={[-0.76, 0.61, -0.16]} size={[0.36, 0.36, 0.13]} rotation={-0.18} />
      <Cushion color={color} position={[-(width / 2 - 0.1), 0.48, 0.02]} size={[0.2, 0.54, depth]} />
      <Cushion color={color} position={[width / 2 - 0.1, 0.48, 0.02]} size={[0.2, 0.54, depth]} />
      <Leg x={-(width / 2 - 0.17)} z={-depth / 2 + 0.14} />
      <Leg x={width / 2 - 0.17} z={-depth / 2 + 0.14} />
      <Leg x={-(width / 2 - 0.17)} z={depth / 2 - 0.14} />
      <Leg x={width / 2 - 0.17} z={depth / 2 - 0.14} />
    </group>
  )
}

function Armchair({ color }: ModelProps) {
  const accent = mixHex(color, '#f2e9db', 0.18)
  return (
    <group>
      <Cushion color={color} position={[0, 0.23, 0]} size={[0.9, 0.24, 0.86]} />
      <Cushion color={accent} position={[0, 0.44, 0.08]} size={[0.58, 0.17, 0.6]} />
      <Cushion color={color} position={[0, 0.57, -0.34]} size={[0.9, 0.58, 0.18]} />
      <Cushion color={color} position={[-0.39, 0.44, 0.01]} size={[0.14, 0.42, 0.82]} />
      <Cushion color={color} position={[0.39, 0.44, 0.01]} size={[0.14, 0.42, 0.82]} />
      <Leg x={-0.3} z={-0.26} />
      <Leg x={0.3} z={-0.26} />
      <Leg x={-0.3} z={0.28} />
      <Leg x={0.3} z={0.28} />
    </group>
  )
}

function CoffeeTable({ color }: ModelProps) {
  return (
    <group>
      <RoundedBox args={[1.25, 0.065, 0.68]} radius={0.028} smoothness={3} position={[0, 0.36, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.02} />
      </RoundedBox>
      <RoundedBox args={[1.05, 0.035, 0.52]} radius={0.012} smoothness={2} position={[0, 0.14, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={mixHex(color, '#d8c3a8', 0.3)} roughness={0.6} />
      </RoundedBox>
      <Leg x={-0.54} z={-0.27} height={0.34} radius={0.032} color={color} />
      <Leg x={0.54} z={-0.27} height={0.34} radius={0.032} color={color} />
      <Leg x={-0.54} z={0.27} height={0.34} radius={0.032} color={color} />
      <Leg x={0.54} z={0.27} height={0.34} radius={0.032} color={color} />
      <mesh position={[0.22, 0.43, 0.05]} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 0.075, 24]} />
        <meshStandardMaterial color="#d7cbb9" roughness={0.62} />
      </mesh>
      <mesh position={[-0.28, 0.41, 0.02]} rotation={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.29, 0.035, 0.22]} />
        <meshStandardMaterial color="#526358" roughness={0.8} />
      </mesh>
      <mesh position={[-0.28, 0.435, 0.02]} rotation={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.23, 0.018, 0.17]} />
        <meshStandardMaterial color="#e6ddcb" roughness={0.82} />
      </mesh>
    </group>
  )
}

function SideTable({ color }: ModelProps) {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.26, 0.055, 32]} />
        <meshStandardMaterial color={color} roughness={0.48} metalness={0.03} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 0.48, 16]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.025, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.22, 0.04, 24]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.55} />
      </mesh>
      <mesh position={[0.02, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.17, 18]} />
        <meshStandardMaterial color="#bb9d7f" roughness={0.35} />
      </mesh>
      <mesh position={[0.02, 0.73, 0]} castShadow>
        <sphereGeometry args={[0.075, 16, 12]} />
        <meshStandardMaterial color="#a9b79d" roughness={0.8} />
      </mesh>
    </group>
  )
}

function TVConsole({ color }: ModelProps) {
  return (
    <group>
      <RoundedBox args={[1.9, 0.4, 0.42]} radius={0.025} smoothness={3} position={[0, 0.31, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.58} />
      </RoundedBox>
      <mesh position={[0, 0.31, 0.213]}>
        <planeGeometry args={[1.82, 0.32]} />
        <meshStandardMaterial color={mixHex(color, '#000000', 0.14)} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.355, 0.225]}>
        <boxGeometry args={[0.012, 0.012, 0.01]} />
        <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.3} />
      </mesh>
      <Leg x={-0.82} z={-0.12} height={0.12} />
      <Leg x={0.82} z={-0.12} height={0.12} />
      <Leg x={-0.82} z={0.12} height={0.12} />
      <Leg x={0.82} z={0.12} height={0.12} />
      {/* Television */}
      <mesh position={[0, 1.17, -0.02]} castShadow>
        <boxGeometry args={[1.58, 0.9, 0.045]} />
        <meshStandardMaterial color={TV_BLACK} roughness={0.32} metalness={0.22} />
      </mesh>
      <mesh position={[0, 1.17, 0.003]}>
        <planeGeometry args={[1.5, 0.82]} />
        <meshStandardMaterial color="#121d1e" roughness={0.16} metalness={0.18} emissive="#0b1112" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.72, -0.02]} castShadow>
        <boxGeometry args={[0.09, 0.44, 0.04]} />
        <meshStandardMaterial color="#2c302d" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.54, -0.02]} castShadow>
        <boxGeometry args={[0.45, 0.025, 0.22]} />
        <meshStandardMaterial color="#2c302d" roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.51, 0.04]}>
        <boxGeometry args={[0.34, 0.03, 0.03]} />
        <meshStandardMaterial color="#30332f" roughness={0.85} />
      </mesh>
    </group>
  )
}

function DiningChair({ x, z, rotation, color }: { x: number; z: number; rotation: number; color: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      <Cushion color={color} position={[0, 0.45, 0]} size={[0.42, 0.075, 0.4]} />
      <Cushion color={color} position={[0, 0.69, -0.17]} size={[0.42, 0.42, 0.06]} />
      <Leg x={-0.16} z={-0.14} height={0.44} />
      <Leg x={0.16} z={-0.14} height={0.44} />
      <Leg x={-0.16} z={0.14} height={0.44} />
      <Leg x={0.16} z={0.14} height={0.44} />
    </group>
  )
}

function DiningSet({ color }: ModelProps) {
  const seats = mixHex(color, '#e6dccd', 0.24)
  return (
    <group>
      <RoundedBox args={[1.55, 0.075, 0.88]} radius={0.025} smoothness={3} position={[0, 0.73, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.5} />
      </RoundedBox>
      <Leg x={-0.66} z={-0.32} height={0.71} radius={0.035} color={color} />
      <Leg x={0.66} z={-0.32} height={0.71} radius={0.035} color={color} />
      <Leg x={-0.66} z={0.32} height={0.71} radius={0.035} color={color} />
      <Leg x={0.66} z={0.32} height={0.71} radius={0.035} color={color} />
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.17, 0.065, 24]} />
        <meshStandardMaterial color="#d9cfc0" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.86, 0]} castShadow>
        <sphereGeometry args={[0.08, 14, 10]} />
        <meshStandardMaterial color="#7e8e70" roughness={0.85} />
      </mesh>
      <DiningChair x={-0.38} z={-0.72} rotation={Math.PI} color={seats} />
      <DiningChair x={0.38} z={-0.72} rotation={Math.PI} color={seats} />
      <DiningChair x={-0.38} z={0.72} rotation={0} color={seats} />
      <DiningChair x={0.38} z={0.72} rotation={0} color={seats} />
    </group>
  )
}

function Desk({ color }: ModelProps) {
  return (
    <group>
      <RoundedBox args={[1.45, 0.055, 0.7]} radius={0.02} smoothness={3} position={[0, 0.74, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.5} />
      </RoundedBox>
      <Leg x={-0.65} z={-0.28} height={0.72} radius={0.028} color={color} />
      <Leg x={0.65} z={-0.28} height={0.72} radius={0.028} color={color} />
      <RoundedBox args={[0.38, 0.46, 0.58]} radius={0.015} smoothness={2} position={[0.48, 0.48, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={mixHex(color, '#000000', 0.08)} roughness={0.55} />
      </RoundedBox>
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={[0.48, 0.3 + index * 0.14, 0.295]}>
          <boxGeometry args={[0.28, 0.012, 0.01]} />
          <meshStandardMaterial color={METAL} metalness={0.65} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[-0.18, 0.84, 0.03]} rotation={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[0.44, 0.015, 0.29]} />
        <meshStandardMaterial color="#303430" metalness={0.35} roughness={0.38} />
      </mesh>
      <mesh position={[-0.18, 0.96, -0.06]} rotation={[0.28, 0.2, 0]} castShadow>
        <boxGeometry args={[0.42, 0.27, 0.014]} />
        <meshStandardMaterial color="#242a28" metalness={0.3} roughness={0.25} emissive="#0d1515" emissiveIntensity={0.6} />
      </mesh>
      <group position={[0.02, 0, 0.72]} rotation={[0, Math.PI, 0]}>
        <Cushion color="#8a8479" position={[0, 0.45, 0]} size={[0.46, 0.07, 0.43]} />
        <Cushion color="#80796e" position={[0, 0.7, -0.19]} size={[0.44, 0.4, 0.06]} />
        <Leg x={-0.17} z={-0.15} height={0.44} />
        <Leg x={0.17} z={-0.15} height={0.44} />
        <Leg x={-0.17} z={0.15} height={0.44} />
        <Leg x={0.17} z={0.15} height={0.44} />
      </group>
    </group>
  )
}

function Bed({ color, single = false }: ModelProps & { single?: boolean }) {
  const width = single ? 1.25 : 1.86
  const depth = single ? 2.08 : 2.18
  const duvet = mixHex(color, '#f5ede1', 0.14)
  const blanket = mixHex(color, '#8b7f6f', 0.2)
  return (
    <group>
      <RoundedBox args={[width, 0.2, depth]} radius={0.04} smoothness={3} position={[0, 0.22, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={DARK_WOOD} roughness={0.6} />
      </RoundedBox>
      <RoundedBox args={[width - 0.1, 0.27, depth - 0.18]} radius={0.07} smoothness={3} position={[0, 0.45, 0.04]} castShadow receiveShadow>
        <meshStandardMaterial color="#ece4d7" roughness={0.9} />
      </RoundedBox>
      <Cushion color={duvet} position={[0, 0.55, 0.16]} size={[width - 0.08, 0.1, depth - 0.52]} roughness={0.92} />
      <Cushion color={blanket} position={[0, 0.63, 0.36]} size={[width - 0.06, 0.08, 0.92]} roughness={0.95} />
      <RoundedBox args={[width, 0.98, 0.12]} radius={0.04} smoothness={3} position={[0, 0.56, -depth / 2 - 0.015]} castShadow receiveShadow>
        <meshStandardMaterial color={mixHex(color, '#7f6c5d', 0.34)} roughness={0.78} />
      </RoundedBox>
      <Cushion color={LINEN} position={[-width * 0.23, 0.71, -depth / 2 + 0.34]} size={[width * 0.36, 0.17, 0.36]} rotation={0.04} />
      <Cushion color={LINEN} position={[width * 0.23, 0.71, -depth / 2 + 0.34]} size={[width * 0.36, 0.17, 0.36]} rotation={-0.05} />
      <Cushion color={mixHex(blanket, '#c7a97d', 0.3)} position={[0, 0.66, 0.6]} size={[width * 0.68, 0.07, 0.42]} rotation={0.01} />
      <Leg x={-(width / 2 - 0.12)} z={-depth / 2 + 0.14} height={0.14} />
      <Leg x={width / 2 - 0.12} z={-depth / 2 + 0.14} height={0.14} />
      <Leg x={-(width / 2 - 0.12)} z={depth / 2 - 0.14} height={0.14} />
      <Leg x={width / 2 - 0.12} z={depth / 2 - 0.14} height={0.14} />
      {!single && (
        <mesh position={[width / 2 + 0.02, 0.52, -depth / 2 + 0.4]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 0.55, 18]} />
          <meshStandardMaterial color="#a59179" roughness={0.65} />
        </mesh>
      )}
    </group>
  )
}

function Wardrobe({ color }: ModelProps) {
  const doorColor = mixHex(color, '#ffffff', 0.06)
  return (
    <group>
      <RoundedBox args={[2.05, 2.2, 0.62]} radius={0.025} smoothness={3} position={[0, 1.13, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.72} />
      </RoundedBox>
      {[-0.51, 0.51].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.14, 0.315]}>
            <boxGeometry args={[0.96, 2.02, 0.018]} />
            <meshStandardMaterial color={doorColor} roughness={0.7} />
          </mesh>
          <mesh position={[x, 1.14, 0.326]}>
            <boxGeometry args={[0.84, 1.9, 0.008]} />
            <meshStandardMaterial color={mixHex(doorColor, '#8e7c68', 0.08)} roughness={0.76} />
          </mesh>
          <mesh position={[x + (x < 0 ? 0.38 : -0.38), 1.14, 0.34]}>
            <boxGeometry args={[0.018, 0.22, 0.018]} />
            <meshStandardMaterial color={METAL} metalness={0.55} roughness={0.35} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.25, 0]}>
        <boxGeometry args={[2.07, 0.035, 0.64]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.65} />
      </mesh>
    </group>
  )
}

const BOOK_COLORS = ['#9e6e51', '#7d8a78', '#c1a77f', '#6c6f7f', '#b78f7c', '#8f7d68', '#52645d', '#b8a58b']

function Bookshelf({ color }: ModelProps) {
  return (
    <group>
      <mesh position={[0, 0.925, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.22, 1.85, 0.08]} />
        <meshStandardMaterial color={mixHex(color, '#000000', 0.14)} roughness={0.68} />
      </mesh>
      {[-0.58, 0.58].map((x) => (
        <mesh key={x} position={[x, 0.925, 0]} castShadow>
          <boxGeometry args={[0.06, 1.85, 0.4]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
      ))}
      {[0.02, 0.42, 0.86, 1.3, 1.76].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.18, 0.045, 0.4]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
      ))}
      {[0.47, 0.91, 1.35].map((y, shelf) =>
        Array.from({ length: 8 }).map((_, index) => {
          const height = 0.19 + ((index * 7 + shelf * 3) % 5) * 0.017
          return (
            <mesh
              key={`${y}-${index}`}
              position={[-0.47 + index * 0.125, y + height / 2, 0.01]}
              castShadow
            >
              <boxGeometry args={[0.09, height, 0.24]} />
              <meshStandardMaterial
                color={BOOK_COLORS[(index + shelf * 2) % BOOK_COLORS.length]}
                roughness={0.82}
              />
            </mesh>
          )
        }),
      )}
      <mesh position={[-0.25, 1.82, 0.02]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.13, 16]} />
        <meshStandardMaterial color="#c0aa8b" roughness={0.45} />
      </mesh>
      <mesh position={[0.28, 1.86, 0.02]} castShadow>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color="#7e8e72" roughness={0.82} />
      </mesh>
    </group>
  )
}

function Sideboard({ color }: ModelProps) {
  return (
    <group>
      <RoundedBox args={[1.55, 0.72, 0.45]} radius={0.02} smoothness={3} position={[0, 0.48, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.62} />
      </RoundedBox>
      {[-0.38, 0.38].map((x) => (
        <mesh key={x} position={[x, 0.48, 0.232]}>
          <boxGeometry args={[0.67, 0.58, 0.012]} />
          <meshStandardMaterial color={mixHex(color, '#e6d5b7', 0.25)} roughness={0.8} />
        </mesh>
      ))}
      {[-0.38, 0.38].map((x) =>
        Array.from({ length: 5 }).map((_, index) => (
          <mesh key={`${x}-${index}`} position={[x - 0.26 + index * 0.13, 0.48, 0.24]}>
            <boxGeometry args={[0.008, 0.54, 0.006]} />
            <meshStandardMaterial color={DARK_WOOD} roughness={0.8} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.855, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.58, 0.035, 0.47]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.55} />
      </mesh>
      <Leg x={-0.66} z={-0.15} height={0.12} />
      <Leg x={0.66} z={-0.15} height={0.12} />
      <Leg x={-0.66} z={0.15} height={0.12} />
      <Leg x={0.66} z={0.15} height={0.12} />
      <mesh position={[0.45, 0.96, 0]} castShadow>
        <cylinderGeometry args={[0.075, 0.11, 0.2, 18]} />
        <meshStandardMaterial color="#9f8c74" roughness={0.42} />
      </mesh>
      <mesh position={[0.45, 1.13, 0]} castShadow>
        <sphereGeometry args={[0.15, 16, 12]} />
        <meshStandardMaterial color="#7e8f6f" roughness={0.82} />
      </mesh>
    </group>
  )
}

function FloorLamp({ color }: ModelProps) {
  return (
    <group>
      <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.05, 28]} />
        <meshStandardMaterial color={DARK_WOOD} roughness={0.45} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 1.5, 12]} />
        <meshStandardMaterial color="#8a765f" metalness={0.45} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.47, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.26, 0.38, 28, 1, true]} />
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          side={2}
          emissive="#ffd9a0"
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.055, 12, 10]} />
        <meshStandardMaterial color="#ffe5b2" emissive="#ffc77e" emissiveIntensity={0.9} />
      </mesh>
    </group>
  )
}

function Plant({ color }: ModelProps) {
  const leafColors = [color, mixHex(color, '#a4b185', 0.24), mixHex(color, '#4a5b43', 0.18)]
  return (
    <group>
      <RoundedBox args={[0.46, 0.44, 0.46]} radius={0.08} smoothness={3} position={[0, 0.22, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#b58e6d" roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.19, 20]} />
        <meshStandardMaterial color="#54453a" roughness={1} />
      </mesh>
      {[0, 1, 2, 3, 4].map((index) => {
        const angle = (index / 5) * Math.PI * 2 + 0.35
        const lean = 0.1 + (index % 3) * 0.07
        return (
          <group key={index} rotation={[0, angle, 0]}>
            <mesh position={[lean, 0.95, 0]} rotation={[0.12, 0, -lean * 1.3]} castShadow>
              <cylinderGeometry args={[0.018, 0.028, 1.02, 8]} />
              <meshStandardMaterial color="#5d664c" roughness={0.85} />
            </mesh>
            {[0, 1, 2].map((leafIndex) => {
              const height = 0.92 + leafIndex * 0.21
              const spread = 0.18 + leafIndex * 0.075
              return (
                <mesh
                  key={leafIndex}
                  position={[lean + spread, height, 0]}
                  rotation={[0.2, 0.1, -0.5 - leafIndex * 0.1]}
                  scale={[0.22 + leafIndex * 0.04, 0.018, 0.14 + leafIndex * 0.035]}
                  castShadow
                >
                  <sphereGeometry args={[1, 10, 8]} />
                  <meshStandardMaterial color={leafColors[(index + leafIndex) % leafColors.length]} roughness={0.86} />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

function Rug({ color }: ModelProps) {
  return (
    <group>
      <RoundedBox args={[2.8, 0.025, 2.0]} radius={0.009} smoothness={3} position={[0, 0.014, 0]} receiveShadow>
        <meshStandardMaterial color={color} roughness={1} />
      </RoundedBox>
      <RoundedBox args={[2.56, 0.029, 1.76]} radius={0.009} smoothness={2} position={[0, 0.019, 0]} receiveShadow>
        <meshStandardMaterial color={mixHex(color, '#f1e8da', 0.24)} roughness={1} />
      </RoundedBox>
      {[-0.9, -0.45, 0, 0.45, 0.9].map((x) => (
        <mesh key={x} position={[x, 0.036, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.006, 1.56]} />
          <meshStandardMaterial color={mixHex(color, '#8e7961', 0.3)} roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

export function FurnitureModel({ type, color }: { type: FurnitureType; color: string }) {
  switch (type) {
    case 'sofa':
      return <Sofa color={color} />
    case 'armchair':
      return <Armchair color={color} />
    case 'coffee-table':
      return <CoffeeTable color={color} />
    case 'side-table':
      return <SideTable color={color} />
    case 'tv-console':
      return <TVConsole color={color} />
    case 'dining-set':
      return <DiningSet color={color} />
    case 'desk':
      return <Desk color={color} />
    case 'bed-double':
      return <Bed color={color} />
    case 'bed-single':
      return <Bed color={color} single />
    case 'wardrobe':
      return <Wardrobe color={color} />
    case 'bookshelf':
      return <Bookshelf color={color} />
    case 'sideboard':
      return <Sideboard color={color} />
    case 'floor-lamp':
      return <FloorLamp color={color} />
    case 'plant':
      return <Plant color={color} />
    case 'rug':
      return <Rug color={color} />
    default:
      return <Sofa color={color} />
  }
}
