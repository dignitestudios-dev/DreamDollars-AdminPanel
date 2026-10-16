"use client";

import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminFaqs } from "@/lib/api/faqs.api";
import { FaqsTable } from "./components/faqs-table";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/use-url-state";
import {
  HelpCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function FaqsPage() {
  const { values, setParams } = useUrlState({
    page: 1,
    limit: 10,
    search: "",
  });

  const page = values.page;
  const limit = values.limit;
  const search = values.search;

  useEffect(() => {
    document.title = "FAQs | Dream Dollar Admin";
  }, []);

  const handleSearchChange = React.useCallback(
    (val: string) => {
      setParams({ search: val, page: 1 });
    },
    [setParams]
  );

  // TanStack Query for FAQs
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["adminFaqs", { page, limit, search }],
    queryFn: () =>
      getAdminFaqs({
        page,
        limit,
        search,
      }),
    placeholderData: (previousData) => previousData,
  });

  const faqs = response?.data ?? [];
  const pagination = response?.pagination;
  const totalItems = pagination?.totalItems ?? faqs.length;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#649809]/10 flex items-center justify-center shrink-0 border border-[#649809]/20">
            <HelpCircle className="h-5 w-5 text-[#649809]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions (FAQs)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage questions and answers for user support and help center
            </p>
          </div>
        </div>

        {totalItems !== undefined && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#649809]/10 text-[#649809] border border-[#649809]/20">
            <Sparkles className="size-3.5" />
            <span>Total FAQs:</span>
            <span>{totalItems}</span>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 p-4 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>
              Failed to load FAQs:{" "}
              {(error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (error as Error | null)?.message ||
                "Please check server connection."}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            <RefreshCw className="mr-1.5 size-3" />
            Retry
          </Button>
        </div>
      )}

      {/* FAQs Table */}
      <FaqsTable
        faqs={faqs}
        pagination={pagination}
        isLoading={isLoading}
        search={search}
        onSearchChange={handleSearchChange}
        page={page}
        onPageChange={(p) => setParams({ page: p })}
        limit={limit}
        onLimitChange={(l) => setParams({ limit: l, page: 1 })}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />
    </div>
  );
}
