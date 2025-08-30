import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function SortableItem({ id, children }){
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition: transition || 'transform 150ms ease' }

  const dragHandleProps = { ...attributes, ...listeners }

  if (typeof children === 'function') {
    return (
      <div ref={setNodeRef} style={style}>
        {children(dragHandleProps)}
      </div>
    )
  }

  // Fallback: no-op handle on wrapper (may interfere with clicks)
  return (
    <div ref={setNodeRef} style={style}>
      {children}
    </div>
  )
}

