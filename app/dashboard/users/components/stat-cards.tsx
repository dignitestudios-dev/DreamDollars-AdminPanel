"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/api/dashboard.api";
import {
  Users,
  CreditCard,
  UserCheck,
  UserX,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardsProps {
  totalUsersFallback?: number;
}

export function StatCards({ totalUsersFallback }: StatCardsProps) {
  const { data: statsResponse, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
  });

  const stats = statsResponse?.data;

  const totalUsers = stats?.totalUsers ?? totalUsersFallback ?? 0;
  const activeUsers = stats?.activeUsers ?? 0;
  const subscribedUsers = stats?.subscribedUsers ?? stats?.paidUsers ?? 0;
  const inactiveUsers = stats?.inactiveUsers ?? 0;

  const cards = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString(),
      subtext: "Registered accounts",
      icon: Users,
      iconBg: "bg-[#649809]/10 text-[#649809]",
      borderAccent: "border-l-4 border-l-[#649809]",
    },
    {
      title: "Active Users",
      value: activeUsers.toLocaleString(),
      subtext: "Currently active accounts",
      icon: UserCheck,
      iconBg: "bg-emerald-500/10 text-emerald-600",
      borderAccent: "border-l-4 border-l-emerald-500",
    },
    {
      title: "Subscribed Users",
      value: subscribedUsers.toLocaleString(),
      subtext: "Active subscriptions",
      icon: Sparkles,
      iconBg: "bg-[#649809]/15 text-[#649809]",
      borderAccent: "border-l-4 border-l-[#649809]",
    },
    {
      title: "Inactive Users",
      value: inactiveUsers.toLocaleString(),
      subtext: "Inactive or deactivated",
      icon: UserX,
      iconBg: "bg-rose-500/10 text-rose-600",
      borderAccent: "border-l-4 border-l-rose-500",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => (
        <Card
          key={idx}
          className={`border border-border shadow-xs transition-all hover:shadow-sm ${card.borderAccent}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </span>
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${card.iconBg}`}
              >
                <card.icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-2">
              {isLoading && totalUsers === 0 ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <div className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  {card.value}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {card.subtext}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
