"use client";

import { Component, type ReactNode } from "react";

type Props = { resetKey: string; onError: () => void; children: ReactNode };
type State = { hasError: boolean; resetKey: string };

/** Hides a scan that fails to load and tells the parent to show the photo instead. */
export class ModelErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    // A different model gets a fresh attempt.
    return props.resetKey !== state.resetKey ? { hasError: false, resetKey: props.resetKey } : null;
  }

  componentDidCatch(error: Error) {
    console.warn(`[3d] Could not load model "${this.props.resetKey}", showing photo instead.`, error);
    this.props.onError();
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}
