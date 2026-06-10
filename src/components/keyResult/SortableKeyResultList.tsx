import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { KeyResult } from '../../types'
import { KeyResultCard } from './KeyResultCard'

type SortableKeyResultListProps = {
  keyResults: KeyResult[]
  editable: boolean
  draftPeriod: boolean
  onUpdate: (krId: string, updates: Partial<KeyResult>) => void
  onDelete: (krId: string) => void
  onReorder: (activeId: string, overId: string) => void
}

type SortableKeyResultItemProps = {
  keyResult: KeyResult
  sortable: boolean
  editable: boolean
  draftPeriod: boolean
  onUpdate: (updates: Partial<KeyResult>) => void
  onDelete: () => void
}

function SortableKeyResultItem({
  keyResult,
  sortable,
  editable,
  draftPeriod,
  onUpdate,
  onDelete,
}: SortableKeyResultItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: keyResult.id,
    disabled: !sortable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    zIndex: isDragging ? 1 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <KeyResultCard
        keyResult={keyResult}
        editable={editable}
        draftPeriod={draftPeriod}
        sortable={sortable}
        dragHandleProps={sortable ? { ...attributes, ...listeners } : undefined}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  )
}

export function SortableKeyResultList({
  keyResults,
  editable,
  draftPeriod,
  onUpdate,
  onDelete,
  onReorder,
}: SortableKeyResultListProps) {
  const sortable = editable && draftPeriod && keyResults.length > 1

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(String(active.id), String(over.id))
  }

  const items = keyResults.map((kr) => (
    <SortableKeyResultItem
      key={kr.id}
      keyResult={kr}
      sortable={sortable}
      editable={editable}
      draftPeriod={draftPeriod}
      onUpdate={(updates) => onUpdate(kr.id, updates)}
      onDelete={() => onDelete(kr.id)}
    />
  ))

  if (!sortable) {
    return <div className="space-y-3">{items}</div>
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={keyResults.map((kr) => kr.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">{items}</div>
      </SortableContext>
    </DndContext>
  )
}
