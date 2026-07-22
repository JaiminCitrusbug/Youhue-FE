import { Component, type ReactNode } from "react"

import { ServerError500 } from "../pages/system"

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

// A render-time throw anywhere below shows the 500 surface instead of a blank screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(): void {
    // hook for monitoring/logging in the active env
  }

  render(): ReactNode {
    if (this.state.hasError) return <ServerError500 />
    return this.props.children
  }
}
