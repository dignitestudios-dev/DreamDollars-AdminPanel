"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getUserGrowth,
  UserGrowthParams,
  UserGrowthSummary,
} from "@/lib/api/dashboard.api";
import {
  Area,
  AreaChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  TrendingUp,
  Calendar,
  Users,
  RefreshCw,
  UserCheck,
  X,
} from "lucide-react";

const chartConfig = {
  newUsers: {
    label: "New Users",
    color: "#649809",
  },
  totalUsers: {
    label: "Total Users",
    color: "#335003",
  },
} satisfies ChartConfig;

type FilterMode = "monthly" | "yearly" | "range";

export function UserGrowthChart() {
  const currentYear = new Date().getFullYear();
  const [filterType, setFilterType] = useState<FilterMode>("monthly");
  const [year, setYear] = useState<number>(currentYear);

  // Separate draft dates (while user is selecting) from applied dates (which fire API)
  const [draftStartDate, setDraftStartDate] = useState<string>("2026-01-01");
  const [draftEndDate, setDraftEndDate] = useState<string>("2026-12-31");
  const [appliedStartDate, setAppliedStartDate] = useState<string>("2026-01-01");
  const [appliedEndDate, setAppliedEndDate] = useState<string>("2026-12-31");

  // Construct query params using applied dates
  const queryParams: UserGrowthParams = {
    ...(filterType === "monthly" ? { filterType: "monthly", year } : {}),
    ...(filterType === "yearly" ? { filterType: "yearly" } : {}),
    ...(filterType === "range"
      ? { startDate: appliedStartDate, endDate: appliedEndDate }
      : {}),
  };

  const {
    data: growthResponse,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "userGrowth",
      filterType,
      filterType === "monthly"
        ? year
        : filterType === "range"
        ? `${appliedStartDate}_${appliedEndDate}`
        : "all",
    ],
    queryFn: () => getUserGrowth(queryParams),
  });

  const handleApplyDateRange = () => {
    if (!draftStartDate || !draftEndDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    if (draftStartDate > draftEndDate) {
      toast.error("Start date cannot be after end date");
      return;
    }
    setAppliedStartDate(draftStartDate);
    setAppliedEndDate(draftEndDate);
  };

  const handleClearDateRange = () => {
    const defaultStart = `${currentYear}-01-01`;
    const defaultEnd = `${currentYear}-12-31`;
    setDraftStartDate(defaultStart);
    setDraftEndDate(defaultEnd);
    setAppliedStartDate(defaultStart);
    setAppliedEndDate(defaultEnd);
    setFilterType("monthly");
    toast.info("Date filter cleared, switched to Monthly view");
  };

  // Safely extract payload and summary
  const payload = growthResponse?.data ?? growthResponse;
  const summary: UserGrowthSummary | undefined = payload?.summary;

  // Normalize chart data points
  const chartData = useMemo(() => {
    if (!payload) return [];
    let list: any[] = [];
    if (Array.isArray(payload.chart)) {
      list = payload.chart;
    } else if (Array.isArray(payload)) {
      list = payload;
    } else if (Array.isArray(payload.data)) {
      list = payload.data;
    } else if (Array.isArray(payload.data?.chart)) {
      list = payload.data.chart;
    }

    return list.map((item) => ({
      period: item.period || "",
      label: item.label || String(item.year || item.month || ""),
      newUsers: Number(item.newUsers ?? item.count ?? 0),
      totalUsers: Number(item.totalUsers ?? 0),
    }));
  }, [payload]);

  // Derived metrics
  const totalNewUsers = useMemo(() => {
    if (summary?.totalNewUsersInRange !== undefined) {
      return summary.totalNewUsersInRange;
    }
    return chartData.reduce((acc, curr) => acc + curr.newUsers, 0);
  }, [summary, chartData]);

  const totalUsersAtEnd = useMemo(() => {
    if (summary?.totalUsersAtEnd !== undefined) {
      return summary.totalUsersAtEnd;
    }
    if (chartData.length === 0) return 0;
    return chartData[chartData.length - 1].totalUsers || totalNewUsers;
  }, [summary, chartData, totalNewUsers]);

  const peakNewUsers = useMemo(() => {
    return chartData.reduce(
      (max, curr) => (curr.newUsers > max ? curr.newUsers : max),
      0
    );
  }, [chartData]);

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#649809]/10 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-[#649809]" />
            </div>
            <CardTitle className="text-base font-bold text-gray-900">
              User Growth
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-gray-500 mt-1">
            New and cumulative user growth over time
          </CardDescription>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Monthly / Yearly / Date Range Switch */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 text-xs">
            <button
              type="button"
              onClick={() => setFilterType("monthly")}
              className={`py-1 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filterType === "monthly"
                  ? "bg-white text-[#649809] font-bold shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setFilterType("yearly")}
              className={`py-1 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filterType === "yearly"
                  ? "bg-white text-[#649809] font-bold shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Yearly
            </button>
            <button
              type="button"
              onClick={() => setFilterType("range")}
              className={`py-1 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filterType === "range"
                  ? "bg-white text-[#649809] font-bold shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Date Range
            </button>
          </div>

          {/* Year selector (only visible for Monthly) */}
          {/* {filterType === "monthly" && (
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-8 text-xs font-medium bg-white border border-border rounded-lg px-2.5 text-gray-700 outline-none focus:ring-1 focus:ring-[#649809] cursor-pointer"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
            </select>
          )} */}

          {/* Date range pickers (visible when range is active) */}
          {filterType === "range" && (
            <div className="flex flex-wrap items-center gap-2 bg-white px-2 py-1 rounded-lg border border-border">
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={draftStartDate}
                  onChange={(e) => setDraftStartDate(e.target.value)}
                  className="h-8 text-xs px-2.5 rounded-md bg-white border border-border text-gray-700 outline-none focus:ring-1 focus:ring-[#649809] cursor-pointer"
                  title="Start Date"
                />
                <span className="text-xs text-gray-400 font-medium px-0.5">to</span>
                <input
                  type="date"
                  value={draftEndDate}
                  onChange={(e) => setDraftEndDate(e.target.value)}
                  className="h-8 text-xs px-2.5 rounded-md bg-white border border-border text-gray-700 outline-none focus:ring-1 focus:ring-[#649809] cursor-pointer"
                  title="End Date"
                />
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleApplyDateRange}
                disabled={isFetching}
                className="h-8 px-3 text-xs bg-[#649809] hover:bg-[#527d07] text-white cursor-pointer font-medium"
              >
                Apply
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleClearDateRange}
                disabled={isFetching}
                className="h-8 px-2.5 text-xs border-gray-200 text-gray-600 hover:text-gray-900 cursor-pointer"
                title="Clear date filter"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 w-8 p-0 cursor-pointer text-gray-500 hover:text-gray-900"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-[#649809]" : ""}`}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-60 w-full rounded-lg" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ) : isError ? (
          <div className="h-60 flex flex-col items-center justify-center text-center p-4">
            <p className="text-xs text-red-500 mb-2">
              Failed to load user growth data
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="text-xs h-7 border-red-200"
            >
              Retry
            </Button>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center text-center text-gray-400">
            <Calendar className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-xs font-medium">No user growth records found</p>
            <p className="text-[11px] text-gray-400">
              Try selecting a different year
            </p>
          </div>
        ) : (
          <div>
            {/* Chart Legend */}
            <div className="flex items-center gap-4 mb-2 text-xs text-gray-500 justify-end">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#649809]" />
                <span className="font-medium text-gray-700">New Users</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full border-2 border-[#335003]" />
                <span className="font-medium text-gray-700">Total Users</span>
              </div>
            </div>

            <ChartContainer config={chartConfig} className="h-64 w-full aspect-auto">
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                  left: -15,
                  right: 12,
                  top: 10,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#649809" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#649809" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e1ebb0" opacity={0.5} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-[11px] fill-gray-500 font-medium"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  className="text-[11px] fill-gray-500"
                />
                <ChartTooltip
                  cursor={{ stroke: "#649809", strokeWidth: 1, strokeDasharray: "4 4" }}
                  content={({ active, payload: tooltipPayload, label }) => {
                    if (active && tooltipPayload && tooltipPayload.length) {
                      const newCount = tooltipPayload.find((p) => p.dataKey === "newUsers")?.value ?? 0;
                      const totalCount = tooltipPayload.find((p) => p.dataKey === "totalUsers")?.value ?? 0;
                      return (
                        <div className="bg-white border border-border rounded-lg p-2.5 shadow-md text-xs space-y-1">
                          <p className="font-bold text-gray-900 border-b border-gray-100 pb-1">
                            {label}
                          </p>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-500 flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-[#649809]" />
                              New Users:
                            </span>
                            <span className="font-bold text-[#649809]">{newCount}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-gray-500 flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-[#335003]" />
                              Total Users:
                            </span>
                            <span className="font-bold text-gray-900">{totalCount}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  dataKey="newUsers"
                  type="monotone"
                  fill="url(#growthGradient)"
                  fillOpacity={1}
                  stroke="#649809"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#649809", stroke: "#ffffff", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: "#649809", stroke: "#ffffff", strokeWidth: 2 }}
                />
                <Line
                  dataKey="totalUsers"
                  type="monotone"
                  stroke="#335003"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </AreaChart>
            </ChartContainer>

            {/* Bottom summary bar */}
            <div className="flex flex-wrap items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#649809]" />
                  <span className="text-gray-500">New Users:</span>
                  <span className="font-bold text-gray-900">{totalNewUsers.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-[#335003]" />
                  <span className="text-gray-500">Total at End:</span>
                  <span className="font-bold text-gray-900">{totalUsersAtEnd.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                <span>
                  Peak: <strong className="text-gray-900">{peakNewUsers}</strong>
                </span>
                <span className="capitalize">
                  Period:{" "}
                  <strong className="text-[#649809]">
                    {filterType === "monthly"
                      ? `${year}`
                      : filterType === "range"
                      ? `${appliedStartDate} ~ ${appliedEndDate}`
                      : "All-Time"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
