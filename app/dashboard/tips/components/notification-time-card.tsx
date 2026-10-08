"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDailyNotificationTime,
  updateDailyNotificationTime,
} from "@/lib/api/tips.api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Bell,
  CheckCircle2,
  Loader2,
  Sparkles,
  Info,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";

const QUICK_PRESETS = ["08:00", "09:00", "09:30", "10:00", "12:00", "18:00"];

export function NotificationTimeCard() {
  const queryClient = useQueryClient();
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Fetch current notification time
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dailyNotificationTime"],
    queryFn: getDailyNotificationTime,
  });

  useEffect(() => {
    if (data?.data?.notificationTime) {
      setSelectedTime(data.data.notificationTime);
    }
  }, [data]);

  // Mutation to update notification time
  const mutation = useMutation({
    mutationFn: (time: string) =>
      updateDailyNotificationTime({ notificationTime: time }),
    onSuccess: (res) => {
      toast.success(
        res?.message || "Daily notification time updated successfully!"
      );
      queryClient.invalidateQueries({ queryKey: ["dailyNotificationTime"] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Failed to update daily notification time"
      );
    },
  });

  const handleSave = () => {
    if (!selectedTime) {
      toast.error("Please enter a valid time");
      return;
    }
    mutation.mutate(selectedTime);
  };

  // Format 24h "HH:mm" to 12h readable time (e.g., 09:30 AM)
  const formatTime12h = (timeStr?: string) => {
    if (!timeStr) return "--:--";
    try {
      const [hourStr, minStr] = timeStr.split(":");
      const hours = parseInt(hourStr, 10);
      const minutes = parseInt(minStr, 10);
      if (isNaN(hours) || isNaN(minutes)) return timeStr;
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${displayHours}:${displayMinutes} ${period}`;
    } catch {
      return timeStr;
    }
  };

  const currentTime = data?.data?.notificationTime || selectedTime;

  return (
    <Card className="border-border bg-gradient-to-r from-card via-card to-[#649809]/5 overflow-hidden shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Info & Description */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-[#649809]/10 border border-[#649809]/20 flex items-center justify-center shrink-0 text-[#649809]">
              <Bell className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-foreground">
                  Daily Tip Notification Schedule
                </h2>
                {/* <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-medium"
                >
                  <Sparkles className="size-3 mr-1" /> Auto Broadcast
                </Badge> */}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Users receive the scheduled daily tip notification at this set time every day.
              </p>
            </div>
          </div>

          {/* Right: Controls & Time Setting */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-background/80 dark:bg-background/40 p-2.5 rounded-xl border border-border">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border">
                <Clock className="size-4 text-[#649809]" />
                <span className="text-xs font-medium text-muted-foreground">Current:</span>
                <span className="text-sm font-bold text-foreground">
                  {isLoading ? (
                    <Loader2 className="size-3.5 animate-spin inline" />
                  ) : (
                    formatTime12h(currentTime)
                  )}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  ({currentTime})
                </span>
              </div>

              {/* Time Input */}
              <div className="relative">
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => {
                    setSelectedTime(e.target.value);
                    setIsEditing(true);
                  }}
                  className="h-9 w-32 text-xs font-mono bg-background cursor-pointer"
                  disabled={mutation.isPending}
                />
              </div>
            </div>

            {/* Quick Presets */}
            {/* <div className="hidden xl:flex items-center gap-1">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setSelectedTime(preset);
                    setIsEditing(true);
                  }}
                  className={`px-2 py-1 text-[11px] rounded font-mono transition-colors ${
                    selectedTime === preset
                      ? "bg-[#649809] text-white font-semibold"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div> */}

            {/* Save Button */}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={mutation.isPending || (currentTime === selectedTime && !isEditing)}
              className="bg-[#649809] hover:bg-[#649809]/90 text-white text-xs h-9 font-medium px-4 cursor-pointer shrink-0"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5 mr-1.5" />
                  Save Time
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
