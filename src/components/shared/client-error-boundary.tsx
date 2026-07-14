"use client";

import { Component, type ReactNode } from "react";

// Isolates a widget so a client-side render/hydration crash shows a small
// fallback instead of blanking every section below it on the page.
export class ClientErrorBoundary extends Component<
  { children: ReactNode; label?: string; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[widget:${this.props.label ?? "unknown"}] failed to render`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
            {this.props.label ?? "This section"} failed to load.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
