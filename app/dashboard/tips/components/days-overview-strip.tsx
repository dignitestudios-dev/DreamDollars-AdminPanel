"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Check, Sparkles } from "lucide-react";

export const DAYS_OF_WEEK = [
  { key: "all", label: "All Days", short: "All" },
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
] as const;

interface DaysOverviewStripProps {
  selectedDay: string;
  onSelectDay: (day: string) => void;
  dayCounts?: Record<string, number>;
}

export function DaysOverviewStrip({
  selectedDay,
  onSelectDay,
  dayCounts = {},
}: DaysOverviewStripProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {DAYS_OF_WEEK.map((day) => {
        const isSelected = selectedDay.toLowerCase() === day.key.toLowerCase();
        const count = dayCounts[day.key];

        return (
          <button
            key={day.key}
            type="button"
            onClick={() => onSelectDay(day.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer border ${
              isSelected
                ? "bg-[#649809] text-white border-[#649809] shadow-sm font-semibold"
                : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
            }`}
          >
            <span>{day.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? "bg-white/25 text-white"
                    : "bg-[#649809]/15 text-[#649809]"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
