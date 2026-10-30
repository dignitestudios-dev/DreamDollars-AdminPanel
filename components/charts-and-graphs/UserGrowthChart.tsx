
"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getUserGrowth,
  type UserGrowthParams,
  type UserGrowthSummary,
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
  const now = new Date();
  const currentYear = now.getFullYear();
  const today = `${currentYear}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [filterType, setFilterType] =
    useState<FilterMode>("monthly");

  const [year] = useState<number>(currentYear);

  const [draftStartDate, setDraftStartDate] =
    useState<string>(`${currentYear}-01-01`);

  const [draftEndDate, setDraftEndDate] =
    useState<string>(today);

  const [appliedStartDate, setAppliedStartDate] =
    useState<string>(`${currentYear}-01-01`);

  const [appliedEndDate, setAppliedEndDate] =
    useState<string>(today);

  // Yearly view uses monthly breakdown for the selected year.
  // This gives the chart 12 points instead of one annual point.
  const queryParams: UserGrowthParams = useMemo(() => {
    if (filterType === "range") {
      const start = new Date(`${appliedStartDate}T00:00:00`);
      const end = new Date(`${appliedEndDate}T00:00:00`);

      const rangeDays =
        Math.floor(
          (end.getTime() - start.getTime()) /
          (1000 * 60 * 60 * 24)
        ) + 1;

      const granularity =
        rangeDays <= 30
          ? "daily"
          : rangeDays <= 180
            ? "weekly"
            : rangeDays <= 730
              ? "monthly"
              : "yearly";

      return {
        startDate: appliedStartDate,
        endDate: appliedEndDate,
        granularity,
      };
    }

    return {
      filterType: "monthly",
      year,
    };
  }, [
    filterType,
    year,
    appliedStartDate,
    appliedEndDate,
  ]);
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
      year,
      filterType === "range"
        ? `${appliedStartDate}_${appliedEndDate}`
        : "full-year",
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

    // Do not present future periods as completed reporting data.
    if (draftStartDate > today) {
      toast.error("Future date ranges are not available for reporting");
      return;
    }

    if (draftEndDate > today) {
      toast.error("End date cannot be in the future. Select today or an earlier date.");
      return;
    }

    setAppliedStartDate(draftStartDate);
    setAppliedEndDate(draftEndDate);
  };

  const handleClearDateRange = () => {
    const defaultStart = `${currentYear}-01-01`;
    const defaultEnd = today;

    setDraftStartDate(defaultStart);
    setDraftEndDate(defaultEnd);
    setAppliedStartDate(defaultStart);
    setAppliedEndDate(defaultEnd);
    setFilterType("monthly");

    toast.info("Date filter cleared, switched to Monthly view");
  };

  // Normalize API response.
  const payload = growthResponse?.data ?? growthResponse;

  const summary: UserGrowthSummary | undefined =
    payload?.summary;

  const chartData = useMemo(() => {
    if (!payload) return [];

    let list: any[] = [];

    if (Array.isArray(payload.chart)) {
      list = payload.chart;
    } else if (Array.isArray(payload)) {
      list = payload;
    } else if (Array.isArray(payload.data?.chart)) {
      list = payload.data.chart;
    } else if (Array.isArray(payload.data)) {
      list = payload.data;
    }

    return list.map((item) => {
      const period = item.period || "";

      let label = item.label || "";

      // Daily date labels: Oct 01, Oct 02, etc.
      if (
        filterType === "range" &&
        /^\d{4}-\d{2}-\d{2}/.test(period)
      ) {
        const date = new Date(`${period.slice(0, 10)}T00:00:00`);

        label = date.toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
        });
      }

      return {
        period,
        label: label || String(item.year ?? item.month ?? ""),
        newUsers: Number(item.newUsers ?? item.count ?? 0),
        totalUsers: Number(item.totalUsers ?? 0),
      };
    });
  }, [payload, filterType]);

  const displayChartData = useMemo(() => {
    // In Monthly view, omit future months and explicitly mark the current
    // month as partial so it is not mistaken for a completed month.
    if (filterType === "monthly") {
      const currentPeriod = today.slice(0, 7);

      return chartData
        .filter((point) => {
          const match = point.period.match(/^(\d{4})-(\d{2})$/);
          // If the API period is not YYYY-MM, preserve it rather than silently
          // removing a record that may still be valid.
          return !match || point.period <= currentPeriod;
        })
        .map((point) =>
          point.period === currentPeriod
            ? { ...point, label: `${point.label} (Partial)` }
            : point
        );
    }

    // Keep monthly resolution for shorter date ranges. For long ranges,
    // aggregate monthly API records into calendar quarters to avoid crowding.
    if (filterType !== "range" || chartData.length <= 36) {
      return chartData;
    }

    const groups = new Map<string, typeof chartData>();

    chartData.forEach((point) => {
      const match = point.period.match(/^(\d{4})-(\d{2})$/);
      if (!match) {
        // Do not silently lose records if the API uses a different period format.
        const fallbackKey = point.period || point.label;
        const fallbackGroup = groups.get(fallbackKey) ?? [];
        fallbackGroup.push(point);
        groups.set(fallbackKey, fallbackGroup);
        return;
      }

      const year = Number(match[1]);
      const month = Number(match[2]);
      if (month < 1 || month > 12) return;

      const quarter = Math.ceil(month / 3);
      const key = `${year}-Q${quarter}`;
      const group = groups.get(key) ?? [];
      group.push(point);
      groups.set(key, group);
    });

    return Array.from(groups.entries()).map(([label, points]) => {
      const orderedPoints = [...points].sort((a, b) =>
        a.period.localeCompare(b.period)
      );

      return {
        period: label,
        label,
        newUsers: orderedPoints.reduce(
          (sum, point) => sum + point.newUsers,
          0
        ),
        // Cumulative users are not summed; use the final month's value.
        totalUsers: orderedPoints[orderedPoints.length - 1]?.totalUsers ?? 0,
      };
    });
  }, [filterType, chartData, today]);
  const renderedChartData = useMemo(() => {
    if (displayChartData.length !== 1) {
      return displayChartData;
    }

    const point = displayChartData[0];

    // Display-only anchors: same actual values, no fabricated counts.
    return [
      {
        ...point,
        label: "",
        isSynthetic: true,
      },
      {
        ...point,
        isSynthetic: false,
      },
      {
        ...point,
        label: "",
        isSynthetic: true,
      },
    ];
  }, [displayChartData]);
  // Dots are useful for short ranges but overlap on long date ranges.
  // Keep active dots so individual points remain inspectable on hover.
  const showDataDots = displayChartData.length <= 36;


  const totalNewUsers = useMemo(() => {
    if (summary?.totalNewUsersInRange !== undefined) {
      return summary.totalNewUsersInRange;
    }

    return chartData.reduce(
      (total, item) => total + item.newUsers,
      0
    );
  }, [summary, chartData]);

  const totalUsersAtEnd = useMemo(() => {
    if (summary?.totalUsersAtEnd !== undefined) {
      return summary.totalUsersAtEnd;
    }

    if (chartData.length === 0) return 0;

    return chartData[chartData.length - 1].totalUsers;
  }, [summary, chartData]);

  const peakNewUsers = useMemo(() => {
    return chartData.reduce(
      (max, item) => Math.max(max, item.newUsers),
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 text-xs">
            <button
              type="button"
              onClick={() => setFilterType("monthly")}
              className={`py-1 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${filterType === "monthly"
                ? "bg-white text-[#649809] font-bold shadow-xs"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              Monthly
            </button>

            {/* <button
              type="button"
              onClick={() => setFilterType("yearly")}
              className={`py-1 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filterType === "yearly"
                  ? "bg-white text-[#649809] font-bold shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Yearly
            </button> */}

            <button
              type="button"
              onClick={() => setFilterType("range")}
              className={`py-1 px-3 rounded-md text-xs font-medium transition-all cursor-pointer ${filterType === "range"
                ? "bg-white text-[#649809] font-bold shadow-xs"
                : "text-gray-500 hover:text-gray-900"
                }`}
            >
              Date Range
            </button>
          </div>

          {/* Date range controls */}
          {filterType === "range" && (
            <div className="flex flex-wrap items-center gap-2 bg-white px-2 py-1 rounded-lg border border-border">
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={draftStartDate}
                  max={today}
                  onChange={(e) =>
                    setDraftStartDate(e.target.value)
                  }
                  className="h-8 text-xs px-2.5 rounded-md bg-white border border-border text-gray-700 outline-none focus:ring-1 focus:ring-[#649809] cursor-pointer"
                  title="Start Date"
                />

                <span className="text-xs text-gray-400 font-medium px-0.5">
                  to
                </span>

                <input
                  type="date"
                  value={draftEndDate}
                  max={today}
                  onChange={(e) =>
                    setDraftEndDate(e.target.value)
                  }
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
            aria-label="Refresh user growth chart"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching
                ? "animate-spin text-[#649809]"
                : ""
                }`}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
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

            <p className="text-xs font-medium">
              No user growth records found
            </p>

            <p className="text-[11px] text-gray-400">
              Try selecting a different date range
            </p>
          </div>
        ) : (
          <div>
            {/* Chart legend */}
            <div className="flex items-center gap-4 mb-2 text-xs text-gray-500 justify-end">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#649809]" />
                <span className="font-medium text-gray-700">
                  New Users
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full border-2 border-[#335003]" />
                <span className="font-medium text-gray-700">
                  Total Users
                </span>
              </div>
            </div>


            <ChartContainer
              config={chartConfig}
              className="h-64 w-full aspect-auto"
            >
              <AreaChart
                data={renderedChartData}
                margin={{ top: 20, right: 20, bottom: 8, left: 4 }}
              >
                <defs>
                  <linearGradient
                    id="growthGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#649809" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#649809" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="#e1ebb0"
                  opacity={0.5}
                />

                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  tick={{ fontSize: 12 }}
                  padding={{ left: 10, right: 10 }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  allowDecimals={false}
                  className="text-[11px] fill-gray-500"
                  domain={[0, "auto"]}
                />

                <ChartTooltip
                  cursor={{
                    stroke: "#649809",
                    strokeWidth: 1,
                    strokeDasharray: "4 4",
                  }}
                  content={({
                    active,
                    payload: tooltipPayload,
                    label,
                  }) => {
                    if (active && tooltipPayload?.length) {
                      const newCount =
                        tooltipPayload.find(
                          (item) => item.dataKey === "newUsers"
                        )?.value ?? 0;

                      const totalCount =
                        tooltipPayload.find(
                          (item) => item.dataKey === "totalUsers"
                        )?.value ?? 0;

                      return (
                        <div className="bg-white border border-border rounded-lg p-3 shadow-md text-xs space-y-2">
                          <p className="font-bold text-gray-900 border-b pb-2">
                            {label}
                          </p>

                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              New Users
                            </span>
                            <strong className="text-[#649809]">
                              {newCount}
                            </strong>
                          </div>

                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">
                              Total Users
                            </span>
                            <strong className="text-[#335003]">
                              {totalCount}
                            </strong>
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
                  dot={(props: any) => {
                    if (props.payload?.isSynthetic) return null;

                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={5}
                        fill="#649809"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 7 }}
                />

                <Line
                  type="monotone"
                  dataKey="totalUsers"
                  stroke="#335003"
                  strokeWidth={2}
                  dot={(props: any) => {
                    if (props.payload?.isSynthetic) return null;

                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={5}
                        fill="#335003"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{ r: 7 }}
                />
              </AreaChart>
            </ChartContainer>


            {filterType === "monthly" && (
              <p className="mt-1 text-[11px] text-gray-500">
                Current month is partial; future months are excluded from the chart.
              </p>
            )}

            {/* Summary bar */}
            <div className="flex flex-wrap items-center justify-between pt-3 mt-3 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[#649809]" />

                  <span className="text-gray-500">
                    New Users:
                  </span>

                  <span className="font-bold text-gray-900">
                    {totalNewUsers.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-[#335003]" />

                  <span className="text-gray-500">
                    Total at End:
                  </span>

                  <span className="font-bold text-gray-900">
                    {totalUsersAtEnd.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-500 text-[11px]">
                <span>
                  Peak:{" "}
                  <strong className="text-gray-900">
                    {peakNewUsers}
                  </strong>
                </span>

                <span>
                  Period:{" "}
                  <strong className="text-[#649809]">
                    {filterType === "range"
                      ? `${appliedStartDate} ~ ${appliedEndDate}`
                      : year}
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
