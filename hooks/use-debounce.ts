"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/**
 * Returns a debounced copy of the provided value that only updates
 * after `delay` milliseconds have elapsed since the last change.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
}

export interface DebouncedCallback<Args extends unknown[]> {
  /** Trigger the debounced callback */
  run: (...args: Args) => void;
  /** Cancel any pending debounced execution */
  cancel: () => void;
  /** Immediately invoke the callback, cancelling any pending timer */
  flush: (...args: Args) => void;
  /** Check if a debounce timer is currently running */
  isPending: () => boolean;
}

/**
 * Creates a stable debounced callback controller that delays calling `callback`
 * until after `delay` milliseconds have passed since the last invocation.
 * Provides `.run(...)`, `.cancel()`, `.flush(...)`, and `.isPending()` utilities.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 400
): DebouncedCallback<Args> {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const isPending = useCallback(() => {
    return timerRef.current !== null;
  }, []);

  const flush = useCallback(
    (...args: Args) => {
      cancel();
      callbackRef.current(...args);
    },
    [cancel]
  );

  const run = useCallback(
    (...args: Args) => {
      cancel();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        callbackRef.current(...args);
      }, delay);
    },
    [cancel, delay]
  );

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return useMemo(
    () => ({
      run,
      cancel,
      flush,
      isPending,
    }),
    [run, cancel, flush, isPending]
  );
}
