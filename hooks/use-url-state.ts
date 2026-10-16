"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef, useEffect } from "react";

export function useUrlState(key: string, defaultValue?: string): readonly [string, (next: string) => void];
export function useUrlState<T extends Record<string, string | number | boolean>>(defaults: T): {
  values: T;
  setParams: (updates: Partial<T>) => void;
};
export function useUrlState<T extends Record<string, string | number | boolean>>(
  arg1: string | T,
  arg2 = ""
): { values: T; setParams: (updates: Partial<T>) => void } | readonly [string, (next: string) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isSingleKey = typeof arg1 === "string";
  const singleKey = isSingleKey ? arg1 : "";
  const singleDefault = arg2;

  // Stabilize defaults reference by serializing its shape so callers passing object literals don't cause thrashing
  const serializedDefaults = useMemo(() => {
    return isSingleKey ? "" : JSON.stringify(arg1);
  }, [isSingleKey, arg1]);

  const defaults = useMemo(() => {
    return isSingleKey ? ({} as T) : (JSON.parse(serializedDefaults) as T);
  }, [isSingleKey, serializedDefaults]);

  // Keep a ref tracking the latest committed query string so rapid/synchronous calls accumulate without clobbering
  const currentParamsStringRef = useRef(searchParams ? searchParams.toString() : "");

  useEffect(() => {
    currentParamsStringRef.current = searchParams ? searchParams.toString() : "";
  }, [searchParams]);

  const singleValue = useMemo(() => {
    if (!isSingleKey) return "";
    return searchParams ? (searchParams.get(singleKey) ?? singleDefault) : singleDefault;
  }, [isSingleKey, searchParams, singleKey, singleDefault]);

  const setSingleValue = useCallback(
    (next: string) => {
      if (!isSingleKey) return;

      const params = new URLSearchParams(currentParamsStringRef.current);

      if (next && next !== singleDefault) {
        params.set(singleKey, next);
      } else {
        params.delete(singleKey);
      }

      const queryString = params.toString();
      currentParamsStringRef.current = queryString;
      const targetUrl = queryString
        ? `${pathname}?${queryString}`
        : pathname;

      router.replace(targetUrl, { scroll: false });
    },
    [isSingleKey, router, pathname, singleKey, singleDefault]
  );

  const values = useMemo(() => {
    if (isSingleKey) return {} as T;
    const result = { ...defaults } as Record<string, string | number | boolean>;
    if (!searchParams) return result as T;

    for (const key of Object.keys(defaults)) {
      const val = searchParams.get(key);
      if (val !== null) {
        if (typeof defaults[key] === "number") {
          const num = Number(val);
          result[key] = isNaN(num) ? defaults[key] : num;
        } else if (typeof defaults[key] === "boolean") {
          result[key] = val === "true";
        } else {
          result[key] = val;
        }
      }
    }
    return result as T;
  }, [isSingleKey, searchParams, defaults]);

  const setParams = useCallback(
    (updates: Partial<T>) => {
      if (isSingleKey) return;

      const params = new URLSearchParams(currentParamsStringRef.current);
      for (const [k, v] of Object.entries(updates)) {
        if (
          v === undefined ||
          v === null ||
          String(v) === "" ||
          v === defaults[k]
        ) {
          params.delete(k);
        } else {
          params.set(k, String(v));
        }
      }
      const queryString = params.toString();
      currentParamsStringRef.current = queryString;
      const targetUrl = queryString
        ? `${pathname}?${queryString}`
        : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [isSingleKey, router, pathname, defaults]
  );

  if (isSingleKey) {
    return [singleValue, setSingleValue] as const;
  }

  return { values, setParams };
}
