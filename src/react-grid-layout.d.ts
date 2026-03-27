declare module 'react-grid-layout' {
  import { Component } from 'react'

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

  interface GridLayoutProps {
    layout?: LayoutItem[]
    cols?: number
    rowHeight?: number
    width: number
    isDraggable?: boolean
    isResizable?: boolean
    draggableHandle?: string
    onLayoutChange?: (layout: LayoutItem[]) => void
    compactType?: 'vertical' | 'horizontal' | null
    margin?: [number, number]
    children?: React.ReactNode
  }

  export default class GridLayout extends Component<GridLayoutProps> {}
}
