import {
  Armchair,
  Archive,
  BedDouble,
  BedSingle,
  BookOpen,
  Box,
  DoorClosed,
  Lamp,
  Laptop,
  Layers,
  Leaf,
  Sofa,
  Square,
  Table2,
  TreePine,
  Tv,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import type { FurnitureType } from '../types'

const ICONS: Record<FurnitureType, LucideIcon> = {
  sofa: Sofa,
  armchair: Armchair,
  'coffee-table': Table2,
  'side-table': Square,
  'tv-console': Tv,
  'dining-set': UtensilsCrossed,
  desk: Laptop,
  'bed-double': BedDouble,
  'bed-single': BedSingle,
  wardrobe: DoorClosed,
  bookshelf: BookOpen,
  sideboard: Archive,
  'floor-lamp': Lamp,
  plant: TreePine,
  rug: Layers,
}

export function FurnitureIcon({
  type,
  size = 20,
  strokeWidth = 1.6,
}: {
  type: FurnitureType
  size?: number
  strokeWidth?: number
}) {
  const Icon = ICONS[type] ?? Box
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden />
}

export function LeafIcon({ size = 18 }: { size?: number }) {
  return <Leaf size={size} strokeWidth={1.5} aria-hidden />
}
