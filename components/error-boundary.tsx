"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    }
  }

  public handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 w-full">
          <div className="bg-white dark:bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center shadow-xs space-y-4">
            <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto shadow-xs">
              <AlertCircle className="size-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-foreground">Something went wrong</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                An unexpected error occurred while loading this section. Please try again or return to the home page.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReload}
                className="cursor-pointer text-xs h-9"
              >
                <RefreshCw className="size-3.5 mr-1.5" />
                Reload Page
              </Button>
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="cursor-pointer text-xs h-9 bg-[#649809] hover:bg-[#527d07] text-white"
                >
                  <Home className="size-3.5 mr-1.5" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
