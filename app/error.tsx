"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Route error boundary captured:", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50 dark:bg-background">
      <div className="bg-white dark:bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center shadow-sm space-y-4">
        <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground">Something went wrong</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We encountered an unexpected issue while rendering this page. You can try again or head back to the dashboard.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2.5 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => reset()}
            className="cursor-pointer text-xs h-9"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Try Again
          </Button>
          <Link href="/dashboard">
            <Button
              size="sm"
              className="cursor-pointer text-xs h-9 bg-[#649809] hover:bg-[#527d07] text-white"
            >
              <Home className="size-3.5 mr-1.5" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
