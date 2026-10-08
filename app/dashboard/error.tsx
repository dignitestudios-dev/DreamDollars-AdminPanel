"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardSectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Dashboard error boundary captured:", error);
    }
  }, [error]);

  return (
    <div className="min-h-[420px] flex items-center justify-center p-6 w-full">
      <div className="bg-white dark:bg-card rounded-2xl border border-border p-8 max-w-md w-full text-center shadow-xs space-y-4">
        <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground">Section Unavailable</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            There was a problem loading this section of the dashboard. Your other tabs and pages remain unaffected.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2.5 pt-2">
          <Button
            size="sm"
            onClick={() => reset()}
            className="cursor-pointer text-xs h-9 bg-[#649809] hover:bg-[#527d07] text-white"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Reload Section
          </Button>
        </div>
      </div>
    </div>
  );
}
