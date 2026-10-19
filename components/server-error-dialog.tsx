"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { setServerError } from "@/lib/slices/uiSlice";
import { getServerRetryHandler, clearServerRetryHandler } from "@/lib/error-retry";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export function ServerErrorDialog() {
  const dispatch = useDispatch();
  const [isRetrying, setIsRetrying] = useState(false);
  const hasServerError = useSelector(
    (state: RootState) => state.ui?.hasServerError ?? false
  );

  const closeDialog = () => {
    dispatch(setServerError(false));
    clearServerRetryHandler();
  };

  const handleRetry = async () => {
    const retryHandler = getServerRetryHandler();
    dispatch(setServerError(false));
    if (retryHandler) {
      clearServerRetryHandler();
      try {
        setIsRetrying(true);
        await retryHandler();
      } catch (err) {
        console.error("Retry handler failed:", err);
      } finally {
        setIsRetrying(false);
      }
    } else {
      window.location.reload();
    }
  };

  return (
    <Dialog open={hasServerError} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <DialogTitle>Something went wrong on our end</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-2">
            We&apos;re having trouble connecting right now. Please try again in a moment.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2">
          <Button variant="ghost" onClick={closeDialog} disabled={isRetrying} className="cursor-pointer text-xs">
            Close
          </Button>
          <Button onClick={handleRetry} disabled={isRetrying} className="cursor-pointer text-xs bg-[#649809] hover:bg-[#527d07] text-white">
            <RefreshCw className={`size-3.5 mr-1.5 ${isRetrying ? "animate-spin" : ""}`} />
            {isRetrying ? "Retrying..." : "Try Again"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
