"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminTipById,
  deleteAdminTip,
  getDailyNotificationTime,
  getAdminTips,
  extractTipsTotalCount,
} from "@/lib/api/tips.api";
import { EditTipDialog } from "../components/edit-tip-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Lightbulb,
  Clock,
  Calendar,
  Bell,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

const DAY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  monday: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  tuesday: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
  wednesday: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
  thursday: { bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500/20" },
  friday: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  saturday: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20" },
  sunday: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20" },
};

export default function TipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch tip details
  const {
    data: tipResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["adminTip", id],
    queryFn: () => getAdminTipById(id),
    enabled: Boolean(id),
  });

  // Fetch daily notification time
  const { data: notifTimeResponse } = useQuery({
    queryKey: ["dailyNotificationTime"],
    queryFn: getDailyNotificationTime,
  });

  // Fetch total tips count for safety deletion check
  const { data: allTipsResponse } = useQuery({
    queryKey: ["adminTipsTotalCount"],
    queryFn: () => getAdminTips({ limit: 100 }),
  });

  const tip = tipResponse?.data;
  const notificationTime = notifTimeResponse?.data?.notificationTime || "09:00";
  const totalTipsCount = extractTipsTotalCount(allTipsResponse) ?? 1;
  const isDeleteProtected = totalTipsCount <= 1;

  React.useEffect(() => {
    document.title = tip?.title
      ? `${tip.title} | Dream Dollar Admin`
      : "Tip Details | Dream Dollar Admin";
  }, [tip?.title]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminTip(id),
    onSuccess: async (res) => {
      toast.success(res?.message || "Tip deleted successfully");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["adminTips"] }),
        queryClient.invalidateQueries({ queryKey: ["adminTipsTotalCount"] }),
      ]);
      router.push("/dashboard/tips");
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete tip. Please try again.";
      toast.error(errorMsg);
    },
  });

  const handleDelete = () => {
    if (isDeleteProtected) {
      toast.error(
        "Cannot delete: At least one tip must remain in the system for daily notifications."
      );
      setDeleteDialogOpen(false);
      return;
    }
    deleteMutation.mutate();
  };

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

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto w-full space-y-6 pb-12">
        <div className="flex items-center justify-between border-b pb-4 border-border">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !tip) {
    return (
      <div className="max-w-[1400px] mx-auto w-full py-12">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 p-8 text-center max-w-lg mx-auto space-y-4">
          <div className="h-12 w-12 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            Tip Not Found or Failed to Load
          </h2>
          <p className="text-xs text-muted-foreground">
            {(error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message ||
              "The financial tip could not be found or has been removed."}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs cursor-pointer"
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Retry
            </Button>
            <Link href="/dashboard/tips">
              <Button size="sm" className="bg-[#649809] text-white text-xs cursor-pointer">
                <ArrowLeft className="mr-1.5 size-3.5" />
                Back to Tips
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dayKey = (tip.day_of_week || "").toLowerCase();
  const dayStyle = DAY_COLORS[dayKey] || {
    bg: "bg-muted",
    text: "text-muted-foreground",
    border: "border-border",
  };
  const isActive = tip.status?.toLowerCase() === "active";

  return (
    <div className="max-w-[1400px] mx-auto w-full space-y-6 pb-12">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-border">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/tips">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs cursor-pointer hover:bg-muted border-border"
            >
              <ArrowLeft className="size-3.5 mr-1.5" />
              Back to Tips
            </Button>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div>
            <h1 className="text-xl font-bold break-all tracking-tight text-foreground flex items-center gap-2">
              <span>{tip.title}</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scheduled Daily Tip Details & Broadcast Information
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <Button
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            className="bg-[#649809] hover:bg-[#649809]/90 text-white text-xs cursor-pointer h-9 px-4"
          >
            <Edit className="size-3.5 mr-1.5" />
            Edit Tip
          </Button>

          {/* Delete Button (Protected when totalTipsCount <= 1) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isDeleteProtected}
                    onClick={() => setDeleteDialogOpen(true)}
                    className={`text-xs h-9 px-3 cursor-pointer ${
                      isDeleteProtected
                        ? "text-muted-foreground/40 cursor-not-allowed border-border"
                        : "border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                    }`}
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    Delete
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {isDeleteProtected
                    ? "Cannot delete: at least one tip must remain in system"
                    : "Delete this tip"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Safeguard Warning if only 1 tip exists */}
      {isDeleteProtected && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2.5">
          <ShieldAlert className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Safe Deletion Protection:</strong> This is currently the only active tip in the system. The admin panel requires at least one tip to be maintained for scheduled daily user broadcasts.
          </span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tip Content & Mobile Notification Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tip Overview Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#649809]/10 border border-[#649809]/20 flex items-center justify-center text-[#649809]">
                    <Lightbulb className="size-4" />
                  </div>

                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`capitalize font-semibold text-xs border ${dayStyle.bg} ${dayStyle.text} ${dayStyle.border}`}
                  >
                    <Calendar className="size-3 mr-1" />
                    {tip.day_of_week}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs font-medium border ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full mr-1.5 ${
                        isActive ? "bg-emerald-500" : "bg-gray-400"
                      }`}
                    />
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Title
                </h3>
                <p className="text-lg font-bold text-foreground break-words">{tip.title || "—"}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Detailed Advice / Description
                </h3>
                <div className="rounded-xl bg-muted/40 p-4 border border-border text-sm leading-relaxed text-foreground whitespace-pre-line break-words">
                  {tip.description || "—"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Push Notification Mobile Mockup */}
       
        </div>

        {/* Right Column: Schedule Info & System Metadata */}
        <div className="space-y-6">
          {/* Schedule Information Card */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#649809]/10 border border-[#649809]/20 flex items-center justify-center text-[#649809]">
                  <Bell className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Delivery Schedule</CardTitle>
                  <CardDescription className="text-xs">
                    Automated push trigger configuration
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-[#649809]" /> Day of Week:
                </span>
                <span className="font-semibold text-foreground capitalize">
                  {tip.day_of_week}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-[#649809]" /> Notification Time:
                </span>
                <span className="font-semibold text-foreground">
                  {formatTime12h(notificationTime)}{" "}
                  <span className="text-[11px] text-muted-foreground font-mono">
                    ({notificationTime})
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#649809]" /> Cadence:
                </span>
                <span className="font-semibold text-foreground">
                  Weekly on every {tip.day_of_week}
                </span>
              </div>

            
            </CardContent>
          </Card>

          {/* System Metadata Card */}
         
        </div>
      </div>

      {/* Edit Dialog */}
      <EditTipDialog
        tip={tip}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => refetch()}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle>Delete Financial Tip</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete{" "}
              <strong className="text-foreground break-all">&quot;{tip.title}&quot;</strong>?
              This action cannot be undone. Users will no longer receive this tip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="text-xs cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending || isDeleteProtected}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs cursor-pointer"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Tip"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
