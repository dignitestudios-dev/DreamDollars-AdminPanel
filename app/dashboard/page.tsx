"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/api/dashboard.api";
import { UserGrowthChart } from "@/components/charts-and-graphs/UserGrowthChart";
import { ChartBarMultiple } from "@/components/charts-and-graphs/ChartBarMultiple";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  CreditCard,
  Sparkles,
  MessageSquare,
  Mail,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

type NewUserTimeRange = "today" | "last7Days" | "last30Days";

export default function DashboardPage() {
  const router = useRouter();
  const [newUserTab, setNewUserTab] = useState<NewUserTimeRange>("today");

  useEffect(() => {
    document.title = "Dashboard | Dream Dollar Admin";
  }, []);

  const {
    data: statsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
  });

  const stats = statsResponse?.data;

  // Handle new users breakdown
  const newUsersBreakdown = useMemo(() => {
    const nu = stats?.newUsers;
    if (typeof nu === "object" && nu !== null) {
      return {
        today: nu.today ?? 2,
        last7Days: nu.last7Days ?? 11,
        last30Days: nu.last30Days ?? 16,
      };
    }
    return {
      today: (stats as any)?.today ?? 2,
      last7Days: (stats as any)?.last7Days ?? 11,
      last30Days: (stats as any)?.last30Days ?? 16,
    };
  }, [stats]);

  const activeNewUserCount = newUsersBreakdown[newUserTab];
  const activeNewUserLabel =
    newUserTab === "today"
      ? "Joined today"
      : newUserTab === "last7Days"
      ? "Last 7 days"
      : "Last 30 days";

  const allCards = [
    {
      id: "totalUsers",
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      description: "Registered on platform",
      color: "text-[#649809]",
      bgColor: "bg-[#649809]/10",
      href: "/dashboard/users",
    },
    {
      id: "activeUsers",
      title: "Active Users",
      value: stats?.activeUsers ?? 0,
      icon: UserCheck,
      description: "Currently active",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      href: "/dashboard/users?status=active",
    },
    {
      id: "inactiveUsers",
      title: "Inactive Users",
      value: stats?.inactiveUsers ?? 0,
      icon: UserX,
      description: "Dormant accounts",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      href: "/dashboard/users?status=inactive",
    },
    {
      id: "newUsers",
      title: "New Users",
      isNewUsers: true,
      icon: UserPlus,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/dashboard/users?sortBy=created_at&order=desc",
    },
    // {
    //   id: "paidUsers",
    //   title: "Paid Users",
    //   value: stats?.paidUsers ?? 0,
    //   icon: CreditCard,
    //   description: "With paid transactions",
    //   color: "text-[#649809]",
    //   bgColor: "bg-[#F6FAD9]",
    //   href: "/dashboard/users?isSubscribed=true",
    // },
    {
      id: "subscribedUsers",
      title: "Subscribed Users",
      value: stats?.subscribedUsers ?? 0,
      icon: Sparkles,
      description: "Active subscription plan",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/dashboard/users?isSubscribed=true",
    },
    {
      id: "unreadChats",
      title: "Unread Chats",
      value: stats?.unreadChats ?? 0,
      icon: MessageSquare,
      description: "Awaiting response",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      href: "/dashboard/chat",
    },
    {
      id: "unreadMessages",
      title: "Unread Messages",
      value: stats?.unreadMessages ?? 0,
      icon: Mail,
      description: "Pending direct messages",
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      href: "/dashboard/chat",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-xs text-gray-500">
            Real-time analytics and user performance metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="cursor-pointer self-start sm:self-auto gap-1.5 h-8 text-xs border-[#e1ebb0]"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-[#649809]" : ""}`}
          />
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Error Banner */}
      {isError && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>
              {(error as any)?.response?.data?.message ||
                (error as any)?.message ||
                "Failed to fetch dashboard stats."}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="cursor-pointer h-7 text-xs border-red-300 hover:bg-red-100"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Compact Stats Grid (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {isLoading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-[#e1ebb0] p-3.5 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
                <Skeleton className="h-6 w-14" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))
          : allCards.map((card) => {
              const Icon = card.icon;

              // Render special interactive New Users card
              if (card.isNewUsers) {
                return (
                  <div
                    key={card.id}
                    onClick={() => router.push(card.href)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(card.href);
                      }
                    }}
                    className="bg-white rounded-xl border border-[#e1ebb0] p-3.5 shadow-xs hover:shadow-md hover:border-[#649809]/50 hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between cursor-pointer group"
                    title={`View ${card.title}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 group-hover:text-gray-900 transition-colors">
                            {card.title}
                          </span>
                          <ArrowUpRight className="h-3 w-3 text-gray-400 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-[#649809] transition-all" />
                        </div>
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${card.bgColor} group-hover:scale-105 transition-transform`}
                        >
                          <Icon className={`h-3.5 w-3.5 ${card.color}`} />
                        </div>
                      </div>

                      <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          {Number(activeNewUserCount).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {activeNewUserLabel}
                        </span>
                      </div>
                    </div>

                    {/* Compact Range Chips */}
                    <div className="grid grid-cols-3 gap-1 pt-1.5 mt-2 border-t border-gray-100 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewUserTab("today");
                        }}
                        className={`py-0.5 px-1 rounded text-center transition-colors cursor-pointer ${
                          newUserTab === "today"
                            ? "bg-[#F6FAD9] text-[#649809] font-semibold border border-[#e1ebb0]"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-[9px] uppercase leading-tight">Today</div>
                        <div className="text-[11px] font-bold">{newUsersBreakdown.today}</div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewUserTab("last7Days");
                        }}
                        className={`py-0.5 px-1 rounded text-center transition-colors cursor-pointer ${
                          newUserTab === "last7Days"
                            ? "bg-[#F6FAD9] text-[#649809] font-semibold border border-[#e1ebb0]"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-[9px] uppercase leading-tight">7D</div>
                        <div className="text-[11px] font-bold">{newUsersBreakdown.last7Days}</div>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewUserTab("last30Days");
                        }}
                        className={`py-0.5 px-1 rounded text-center transition-colors cursor-pointer ${
                          newUserTab === "last30Days"
                            ? "bg-[#F6FAD9] text-[#649809] font-semibold border border-[#e1ebb0]"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <div className="text-[9px] uppercase leading-tight">30D</div>
                        <div className="text-[11px] font-bold">{newUsersBreakdown.last30Days}</div>
                      </button>
                    </div>
                  </div>
                );
              }

              // Standard compact KPI card
              return (
                <Link
                  key={card.id}
                  href={card.href}
                  className="bg-white rounded-xl border border-[#e1ebb0] p-3.5 shadow-xs hover:shadow-md hover:border-[#649809]/50 hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between cursor-pointer group"
                  title={`View ${card.title}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-gray-500 group-hover:text-gray-900 transition-colors">
                        {card.title}
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-gray-400 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-[#649809] transition-all" />
                    </div>
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${card.bgColor} group-hover:scale-105 transition-transform`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${card.color}`} />
                    </div>
                  </div>

                  <div className="mt-1.5">
                    <div className="text-xl font-bold text-gray-900">
                      {Number(card.value).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate group-hover:text-gray-500 transition-colors">
                      {card.description}
                    </p>
                  </div>
                </Link>
              );
            })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-5 pt-1">
        <UserGrowthChart />
        
      </div>
    </div>
  );
}
