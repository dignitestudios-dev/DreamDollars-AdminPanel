"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDebouncedCallback } from "./use-debounce";

export interface UseSearchOptions {
  /**
   * Controlled search query from parent or URL state.
   * If provided, useSearch synchronizes its internal state with this value.
   */
  value?: string;

  /**
   * Initial search query for uncontrolled or standalone usage.
   * Defaults to "".
   */
  defaultValue?: string;

  /**
   * Debounce delay in milliseconds before triggering `onChange`.
   * Defaults to 400ms.
   */
  delay?: number;

  /**
   * Callback fired when the debounced search value changes.
   * Guaranteed not to be invoked with stale or resurrected values.
   */
  onChange?: (search: string) => void;

  /**
   * Optional callback fired when search is cleared via `clear()`.
   */
  onClear?: () => void;

  /**
   * Optional callback to reset pagination page, called with `1` whenever
   * a new search is debounced or cleared.
   */
  onPageChange?: (page: number) => void;

  /**
   * Whether to trim whitespace before invoking `onChange`.
   * Defaults to true.
   */
  trim?: boolean;
}

export interface UseSearchResult {
  /** Immediate search input value, suitable for `<Input value={query} />` */
  query: string;

  /** Debounced search value */
  debouncedQuery: string;

  /** Update search query (typically while typing) */
  setQuery: (nextQuery: string) => void;

  /**
   * Immediately clears search input, cancels any active debounce timer,
   * updates debounced state immediately to empty string, and notifies parent.
   * Eliminates search reappearing bugs.
   */
  clear: () => void;

  /**
   * Resets search to defaultValue (or empty string), canceling pending debounce.
   */
  reset: () => void;

  /**
   * Immediately sets search value without waiting for debounce delay.
   */
  setImmediateQuery: (nextQuery: string) => void;

  /**
   * Synthetic event handler for `<input onChange={handleInputChange} />`.
   */
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  /** Whether the search currently contains non-empty text */
  hasSearch: boolean;

  /** Whether a debounced search update is currently pending */
  isDebouncing: boolean;
}

export function useSearch({
  value,
  defaultValue = "",
  delay = 400,
  onChange,
  onClear,
  onPageChange,
  trim = true,
}: UseSearchOptions = {}): UseSearchResult {
  const isControlled = value !== undefined;
  const initialValue = isControlled ? (value ?? "") : defaultValue;

  // Track previous external value to sync controlled state during render per React 19 best practices
  const [prevExternalValue, setPrevExternalValue] = useState<string | undefined>(value);

  // Internal immediate input query
  const [query, setQueryState] = useState<string>(initialValue);

  // Debounced query
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialValue);

  // Track last emitted/synced value in state so it can be checked safely during render without accessing refs
  const [lastEmittedValue, setLastEmittedValue] = useState<string>(
    trim ? initialValue.trim() : initialValue
  );

  // Keep latest callbacks in refs updated via useEffect to satisfy React 19 rules
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const onClearRef = useRef(onClear);
  useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  const onPageChangeRef = useRef(onPageChange);
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  // Keep a ref tracking lastEmittedValue for callbacks to avoid capturing stale state closures
  const lastEmittedRef = useRef<string>(lastEmittedValue);
  useEffect(() => {
    lastEmittedRef.current = lastEmittedValue;
  }, [lastEmittedValue]);

  // Debounced controller that emits the search change
  const debouncedEmit = useDebouncedCallback((val: string) => {
    const normalized = trim ? val.trim() : val;
    if (normalized !== lastEmittedRef.current) {
      lastEmittedRef.current = normalized;
      setLastEmittedValue(normalized);
      setDebouncedQuery(normalized);
      onChangeRef.current?.(normalized);
      onPageChangeRef.current?.(1);
    }
  }, delay);

  // Synchronize state when controlled `value` changes from parent (e.g. Reset Filters or back/forward)
  if (isControlled && value !== prevExternalValue) {
    const normalizedExternal = trim ? (value ?? "").trim() : (value ?? "");
    setPrevExternalValue(value);

    // Only overwrite internal typing query if the external value changed independently
    // (e.g. Reset Filters or URL navigation), NOT when it's just the parent echoing our own debounced emit.
    if (normalizedExternal !== lastEmittedValue) {
      debouncedEmit.cancel();
      setLastEmittedValue(normalizedExternal);
      setQueryState(value ?? "");
      setDebouncedQuery(normalizedExternal);
    }
  }

  // Handler for user typing
  const setQuery = useCallback(
    (next: string) => {
      setQueryState(next);
      debouncedEmit.run(next);
    },
    [debouncedEmit]
  );

  // Immediately clear search and cancel any pending debounce
  const clear = useCallback(() => {
    debouncedEmit.cancel();
    const emptyValue = "";
    lastEmittedRef.current = emptyValue;
    setLastEmittedValue(emptyValue);
    setQueryState(emptyValue);
    setDebouncedQuery(emptyValue);
    onChangeRef.current?.(emptyValue);
    onPageChangeRef.current?.(1);
    onClearRef.current?.();
  }, [debouncedEmit]);

  // Reset to initial default value
  const reset = useCallback(() => {
    debouncedEmit.cancel();
    const target = defaultValue;
    const normalized = trim ? target.trim() : target;
    lastEmittedRef.current = normalized;
    setLastEmittedValue(normalized);
    setQueryState(target);
    setDebouncedQuery(normalized);
    onChangeRef.current?.(normalized);
    onPageChangeRef.current?.(1);
  }, [defaultValue, trim, debouncedEmit]);

  // Set query immediately without waiting for debounce
  const setImmediateQuery = useCallback(
    (next: string) => {
      debouncedEmit.cancel();
      const normalized = trim ? next.trim() : next;
      lastEmittedRef.current = normalized;
      setLastEmittedValue(normalized);
      setQueryState(next);
      setDebouncedQuery(normalized);
      onChangeRef.current?.(normalized);
      onPageChangeRef.current?.(1);
    },
    [trim, debouncedEmit]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
    },
    [setQuery]
  );

  const hasSearch = Boolean(query && query.trim().length > 0);
  const isDebouncing = debouncedEmit.isPending();

  return {
    query,
    debouncedQuery,
    setQuery,
    clear,
    reset,
    setImmediateQuery,
    handleInputChange,
    hasSearch,
    isDebouncing,
  };
}
