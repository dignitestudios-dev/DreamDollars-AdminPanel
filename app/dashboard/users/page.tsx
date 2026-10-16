"use client";

import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { StatCards } from "./components/stat-cards";
import { DataTable } from "./components/data-table";
import { getAdminUsers } from "@/lib/api/users.api";
import { Users, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/use-url-state";

export default function UsersPage() {
  const { values, setParams } = useUrlState({
    page: 1,
    limit: 10,
    search: "",
    status: "all",
    isSubscribed: "all",
    startDate: "",
    endDate: "",
    sortBy: "created_at",
    order: "desc",
  });

  const page = values.page;
  const limit = values.limit;
  const search = values.search;
  const status = values.status;
  const isSubscribed = values.isSubscribed;
  const startDate = values.startDate || undefined;
  const endDate = values.endDate || undefined;
  const sortBy = values.sortBy;
  const order = values.order as "asc" | "desc";

  useEffect(() => {
    document.title = "User Management | Dream Dollar Admin";
  }, []);

  // Reset page to 1 when filters change
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

  const handleSubscribedChange = React.useCallback(
    (val: string) => {
      setParams({ isSubscribed: val, page: 1 });
    },
    [setParams]
  );

  const handleDateRangeChange = React.useCallback(
    (start?: string, end?: string) => {
      setParams({ startDate: start || "", endDate: end || "", page: 1 });
    },
    [setParams]
  );

  const handleSortChange = React.useCallback(
    (field: string, newOrder: "asc" | "desc") => {
      setParams({ sortBy: field, order: newOrder, page: 1 });
    },
    [setParams]
  );

  // TanStack Query for users list
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "adminUsers",
      { page, limit, search, status, isSubscribed, startDate, endDate, sortBy, order },
    ],
    queryFn: () =>
      getAdminUsers({
        page,
        limit,
        search,
        status,
        isSubscribed,
        startDate,
        endDate,
        sortBy,
        order,
      }),
    placeholderData: (previousData) => previousData,
  });

  const users = response?.data ?? [];
  const pagination = response?.pagination;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#649809]/10 flex items-center justify-center shrink-0 border border-border">
            <Users className="h-5 w-5 text-[#649809]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              User Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitor, filter, and manage registered user accounts and subscriptions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pagination?.totalItems !== undefined && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#649809]/10 text-[#649809] border border-[#649809]/20">
              <span>Total:</span>
              <span>{pagination.totalItems.toLocaleString()} users</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Stat Cards */}
      <StatCards totalUsersFallback={pagination?.totalItems} />

      {/* Error Banner if API fails */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>
              Failed to load user list: {(error as Error | null)?.message || "Please check server connection."}
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

      {/* Live Data Table */}
      <div className="w-full">
        <DataTable
          users={users}
          pagination={pagination}
          isLoading={isLoading}
          search={search}
          onSearchChange={handleSearchChange}
          status={status}
          onStatusChange={handleStatusChange}
          isSubscribed={isSubscribed}
          onSubscribedChange={handleSubscribedChange}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={handleDateRangeChange}
          page={page}
          onPageChange={(p) => setParams({ page: p })}
          limit={limit}
          onLimitChange={(l) => setParams({ limit: l, page: 1 })}
          sortBy={sortBy}
          order={order}
          onSortChange={handleSortChange}
          onRefresh={() => refetch()}
          isRefreshing={isFetching}
        />
      </div>
    </div>
  );
}
