"use client";

import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminInsights } from "@/lib/api/insights.api";
import { getAdminCategories } from "@/lib/api/categories.api";
import { InsightsTable } from "./components/insights-table";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/use-url-state";
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function InsightsPage() {
  const { values, setParams } = useUrlState({
    page: 1,
    limit: 10,
    search: "",
    status: "all",
    categoryId: "all",
  });

  const page = values.page;
  const limit = values.limit;
  const search = values.search;
  const status = values.status;
  const categoryId = values.categoryId;

  useEffect(() => {
    document.title = "Financial Insights | Dream Dollar Admin";
  }, []);

  const handleSearchChange = React.useCallback(
    (val: string) => {
      setParams({ search: val, page: 1 });
    },
    [setParams]
  );

  const handleStatusChange = React.useCallback(
    (val: string) => {
      setParams({ status: val, page: 1 });
    },
    [setParams]
  );

  const handleCategoryChange = React.useCallback(
    (catId: string) => {
      setParams({ categoryId: catId, page: 1 });
    },
    [setParams]
  );

  const handleResetFilters = React.useCallback(() => {
    setParams({
      search: "",
      status: "all",
      categoryId: "all",
      page: 1,
    });
  }, [setParams]);
  // TanStack Query for insights
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["adminInsights", { page, limit, search, status, categoryId }],
    queryFn: () =>
      getAdminInsights({
        page,
        limit,
        search,
        status,
        category_id: categoryId,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Fetch categories for filter dropdown
  const { data: categoriesResponse } = useQuery({
    queryKey: ["adminCategoriesFilter"],
    queryFn: () => getAdminCategories({ limit: 50, type: 'insight' }),
  });

  const insights = response?.data ?? [];
  const categories = categoriesResponse?.data ?? [];
  const pagination = response?.pagination;

  const totalItems = pagination?.total ?? pagination?.totalItems ?? insights.length;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#649809]/10 flex items-center justify-center shrink-0 border border-border">
            <Sparkles className="h-5 w-5 text-[#649809]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Financial Insights
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Publish, organize, and manage financial education articles and wealth strategies
            </p>
          </div>
        </div>

        {totalItems !== undefined && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#649809]/10 text-[#649809] border border-[#649809]/20">
            <span>Total:</span>
            <span>{totalItems.toLocaleString()} articles</span>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 p-4 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>
              Failed to load insights: {(error as Error | null)?.message || "Please check server connection."}
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

      {/* Insights Table */}
      <InsightsTable
        insights={insights}
        categories={categories}
        pagination={pagination}
        isLoading={isLoading}
        search={search}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusChange}
        categoryId={categoryId}
        onCategoryChange={handleCategoryChange}
        page={page}
        onPageChange={(p) => setParams({ page: p })}
        limit={limit}
        onLimitChange={(l) => setParams({ limit: l, page: 1 })}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
}
