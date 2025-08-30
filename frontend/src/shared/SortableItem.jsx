import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function SortableItem({ id, children }){
  const { attributes, listeners, setNodeRef, transform, transition, isSorting } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition: transition || 'transform 150ms ease' }
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

