"use client";

import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminTips } from "@/lib/api/tips.api";
import { NotificationTimeCard } from "./components/notification-time-card";
import { DaysOverviewStrip } from "./components/days-overview-strip";
import { TipsTable } from "./components/tips-table";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/use-url-state";
import {
  Lightbulb,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function TipsPage() {
  const { values, setParams } = useUrlState({
    page: 1,
    limit: 10,
    search: "",
    dayOfWeek: "all",
    status: "all",
  });

  const page = values.page;
  const limit = values.limit;
  const search = values.search;
  const dayOfWeek = values.dayOfWeek;
  const status = values.status;

  useEffect(() => {
    document.title = "Daily Tips Management | Dream Dollar Admin";
  }, []);

  const handleSearchChange = (val: string) => {
    setParams({ search: val, page: 1 });
  };

  const handleDayOfWeekChange = (day: string) => {
    setParams({ dayOfWeek: day, page: 1 });
  };

  const handleStatusChange = (val: string) => {
    setParams({ status: val, page: 1 });
  };

  // TanStack Query for Tips list
  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["adminTips", { page, limit, search, dayOfWeek, status }],
    queryFn: () =>
      getAdminTips({
        page,
        limit,
        search,
        day_of_week: dayOfWeek,
        status,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Query to count all tips across the system (without filters) for safety rule and overall count
  const { data: allTipsResponse } = useQuery({
    queryKey: ["adminTipsTotalCount"],
    queryFn: () => getAdminTips({ limit: 100 }),
  });

  const tips = response?.data ?? [];
  const pagination = response?.pagination;

  // Calculate total count
  const allTips = allTipsResponse?.data ?? tips;
  const totalTipsCount =
    allTipsResponse?.pagination?.totalItems ??
    pagination?.totalItems ??
    tips.length;

  // Calculate tip counts per day for the visual day selector
  const dayCounts: Record<string, number> = {
    all: totalTipsCount,
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0,
  };

  allTips.forEach((tip) => {
    const day = (tip.day_of_week || "").toLowerCase();
    if (dayCounts[day] !== undefined) {
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  });

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#649809]/10 flex items-center justify-center shrink-0 border border-[#649809]/20">
            <Lightbulb className="h-5 w-5 text-[#649809]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Daily Tips Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure daily notification schedules and smart financial tips delivered to users
            </p>
          </div>
        </div>

        {totalTipsCount !== undefined && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#649809]/10 text-[#649809] border border-[#649809]/20">
            <Sparkles className="size-3.5" />
            <span>Total Active Tips:</span>
            <span>{totalTipsCount}</span>
          </div>
        )}
      </div>

      {/* Daily Notification Time Configuration Widget */}
      <NotificationTimeCard />

      {/* Days of Week Quick Filter Strip */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground">
            Filter by Day of the Week:
          </p>
          {dayOfWeek !== "all" && (
            <button
              onClick={() => handleDayOfWeekChange("all")}
              className="text-xs text-[#649809] hover:underline cursor-pointer"
            >
              Reset to All Days
            </button>
          )}
        </div>
        <DaysOverviewStrip
          selectedDay={dayOfWeek}
          onSelectDay={handleDayOfWeekChange}
          dayCounts={dayCounts}
        />
      </div>

      {/* Error Alert */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 p-4 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-600" />
            <span>
              Failed to load tips:{" "}
              {(error as any)?.response?.data?.message ||
                (error as any)?.message ||
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

      {/* Tips Table */}
      <TipsTable
        tips={tips}
        pagination={pagination}
        isLoading={isLoading}
        search={search}
        onSearchChange={handleSearchChange}
        dayOfWeek={dayOfWeek}
        onDayOfWeekChange={handleDayOfWeekChange}
        status={status}
        onStatusChange={handleStatusChange}
        page={page}
        onPageChange={(p) => setParams({ page: p })}
        limit={limit}
        onLimitChange={(l) => setParams({ limit: l, page: 1 })}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        totalTipsCount={totalTipsCount}
      />
    </div>
  );
}
