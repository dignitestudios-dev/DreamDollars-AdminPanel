"use client";

import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminCategories, getAdminCategoryStats } from "@/lib/api/categories.api";
import { CategoriesTable } from "./components/categories-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tag,
  Wallet,
  DollarSign,
  TrendingUp,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { useUrlState } from "@/hooks/use-url-state";

export default function CategoriesPage() {
  const { values, setParams } = useUrlState({
    page: 1,
    limit: 10,
    search: "",
    type: "all",
  });

  const page = values.page;
  const limit = values.limit;
  const search = values.search;
  const selectedType = values.type;

  const setPage = React.useCallback(
    (p: number) => setParams({ page: p }),
    [setParams]
  );

  const setLimit = React.useCallback(
    (l: number) => setParams({ limit: l, page: 1 }),
    [setParams]
  );

  const handleSearchChange = React.useCallback(
    (val: string) => {
      setParams({ search: val, page: 1 });
    },
    [setParams]
  );

  const handleTypeChange = React.useCallback(
    (type: string) => {
      setParams({ type, page: 1 });
    },
    [setParams]
  );

  useEffect(() => {
    document.title = "Category Management — Dream Dollar Admin";
  }, []);

  // TanStack Query for categories list
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch: refetchCategories,
    isFetching,
  } = useQuery({
    queryKey: ["adminCategories", { selectedType, page, limit, search }],
    queryFn: () =>
      getAdminCategories({
        type: selectedType === "all" ? undefined : selectedType,
        page,
        limit,
        search,
      }),
    placeholderData: (previousData) => previousData,
  });

  // TanStack Query for category stats
  const {
    data: statsResponse,
    isLoading: isStatsLoading,
    refetch: refetchStats,
    isFetching: isStatsFetching,
  } = useQuery({
    queryKey: ["adminCategoryStats"],
    queryFn: getAdminCategoryStats,
  });

  const categories = response?.data ?? [];
  const pagination = response?.pagination;
  const stats = statsResponse?.data;

  const totalCount = stats?.total ?? pagination?.totalItems ?? 0;
  const expenseCount = stats?.byType?.expense ?? 0;
  const incomeCount = stats?.byType?.income ?? 0;
  const assetCount = stats?.byType?.asset ?? 0;
  const insightCount = stats?.byType?.insight ?? 0;

  const handleRefreshAll = () => {
    refetchCategories();
    refetchStats();
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#649809]/10 flex items-center justify-center shrink-0 border border-border">
            <Tag className="h-5 w-5 text-[#649809]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Category Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage system categories for Expense, Income, Asset, and Insight classifications
            </p>
          </div>
        </div>

        {totalCount !== undefined && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#649809]/10 text-[#649809] border border-[#649809]/20">
            <span>Total:</span>
            <span>{isStatsLoading ? "..." : totalCount.toLocaleString()} categories</span>
          </div>
        )}
      </div>

      {/* Top Category Type Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Expense Card */}
        <Card
          onClick={() => handleTypeChange(selectedType === "expense" ? "all" : "expense")}
          className={`border border-border shadow-xs border-l-4 border-l-rose-500 bg-white dark:bg-card cursor-pointer transition-all hover:shadow-sm ${
            selectedType === "expense" ? "ring-2 ring-rose-500/30" : ""
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Expense
              </span>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isStatsLoading ? (
                  <Skeleton className="h-6 w-12 rounded" />
                ) : (
                  expenseCount.toLocaleString()
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Spending categories</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <Wallet className="size-4" />
            </div>
          </CardContent>
        </Card>

        {/* Income Card */}
        <Card
          onClick={() => handleTypeChange(selectedType === "income" ? "all" : "income")}
          className={`border border-border shadow-xs border-l-4 border-l-[#649809] bg-white dark:bg-card cursor-pointer transition-all hover:shadow-sm ${
            selectedType === "income" ? "ring-2 ring-[#649809]/30" : ""
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Income
              </span>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isStatsLoading ? (
                  <Skeleton className="h-6 w-12 rounded" />
                ) : (
                  incomeCount.toLocaleString()
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Income streams</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-[#649809]/10 text-[#649809] flex items-center justify-center shrink-0">
              <DollarSign className="size-4" />
            </div>
          </CardContent>
        </Card>

        {/* Asset Card */}
        <Card
          onClick={() => handleTypeChange(selectedType === "asset" ? "all" : "asset")}
          className={`border border-border shadow-xs border-l-4 border-l-blue-500 bg-white dark:bg-card cursor-pointer transition-all hover:shadow-sm ${
            selectedType === "asset" ? "ring-2 ring-blue-500/30" : ""
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Asset
              </span>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isStatsLoading ? (
                  <Skeleton className="h-6 w-12 rounded" />
                ) : (
                  assetCount.toLocaleString()
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Asset classifications</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <TrendingUp className="size-4" />
            </div>
          </CardContent>
        </Card>

        {/* Insight Card */}
        <Card
          onClick={() => handleTypeChange(selectedType === "insight" ? "all" : "insight")}
          className={`border border-border shadow-xs border-l-4 border-l-amber-500 bg-white dark:bg-card cursor-pointer transition-all hover:shadow-sm ${
            selectedType === "insight" ? "ring-2 ring-amber-500/30" : ""
          }`}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Insight
              </span>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {isStatsLoading ? (
                  <Skeleton className="h-6 w-12 rounded" />
                ) : (
                  insightCount.toLocaleString()
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">Financial intelligence</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="size-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert Banner */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 p-4 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>
              Failed to load categories: {(error as Error | null)?.message || "Please check server connection."}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshAll}
            className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-100 cursor-pointer"
          >
            <RefreshCw className="mr-1.5 size-3" />
            Retry
          </Button>
        </div>
      )}

      {/* Categories Table Component */}
      <CategoriesTable
        categories={categories}
        pagination={pagination}
        isLoading={isLoading}
        search={search}
        onSearchChange={handleSearchChange}
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
        page={page}
        onPageChange={setPage}
        limit={limit}
        onLimitChange={setLimit}
        onRefresh={handleRefreshAll}
        isRefreshing={isFetching || isStatsFetching}
      />
    </div>
  );
}

