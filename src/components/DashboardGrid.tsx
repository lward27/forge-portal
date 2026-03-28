import { useMemo, useRef, useState, useEffect } from 'react'
import GridLayout from 'react-grid-layout'
import type { DashboardWidget } from '../types'

interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  static?: boolean
}

interface Props {
  widgets: DashboardWidget[]
  editing: boolean
  onLayoutChange: (widgets: DashboardWidget[]) => void
  renderWidget: (widget: DashboardWidget) => React.ReactNode
}

export function DashboardGrid({ widgets, editing, onLayoutChange, renderWidget }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1200)

  useEffect(() => {
    function updateWidth() {
      if (containerRef.current) setWidth(containerRef.current.offsetWidth)
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const layout: LayoutItem[] = useMemo(() =>
    widgets.map(w => ({
      i: w.id,
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
      minW: 2,
      minH: 1,
      static: !editing,
    })),
    [widgets, editing]
  )

  function handleLayoutChange(newLayout: LayoutItem[]) {
    if (!editing) return
    const updated = widgets.map(w => {
      const l = newLayout.find(item => item.i === w.id)
      if (!l) return w
      return { ...w, x: l.x, y: l.y, w: l.w, h: l.h }
    })
    onLayoutChange(updated)
  }

  return (
    <div ref={containerRef}>
      <GridLayout
        layout={layout as any}
        cols={12}
        rowHeight={80}
        width={width}
        isDraggable={editing}
        isResizable={editing}
        draggableHandle=".widget-drag-handle"
        onLayoutChange={handleLayoutChange as any}
        compactType="vertical"
        margin={[16, 16] as [number, number]}
      >
        {widgets.map(widget => (
          <div key={widget.id} style={{ height: '100%' }}>
            {renderWidget(widget)}
          </div>
        ))}
      </GridLayout>
    </div>
  )
}
