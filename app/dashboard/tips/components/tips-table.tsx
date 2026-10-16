"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  X,
  RefreshCw,
  Lightbulb,
  Calendar,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AdminTip, TipsPagination, deleteAdminTip } from "@/lib/api/tips.api";
import { EditTipDialog } from "./edit-tip-dialog";
import { CreateTipDialog } from "./create-tip-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useSearch } from "@/hooks/use-search";

interface TipsTableProps {
  tips: AdminTip[];
  pagination?: TipsPagination;
  isLoading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  dayOfWeek: string;
  onDayOfWeekChange: (day: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  totalTipsCount: number;
}

const DAY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  monday: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  tuesday: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20" },
  wednesday: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
  thursday: { bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400", border: "border-teal-500/20" },
  friday: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  saturday: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20" },
  sunday: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20" },
};

export function TipsTable({
  tips,
  pagination,
  isLoading,
  search,
  onSearchChange,
  dayOfWeek,
  onDayOfWeekChange,
  status,
  onStatusChange,
  page,
  onPageChange,
  limit,
  onLimitChange,
  onRefresh,
  isRefreshing = false,
  totalTipsCount,
}: TipsTableProps) {
  const {
    query: searchInput,
    handleInputChange,
    clear: handleClearSearch,
  } = useSearch({
    value: search,
    onChange: onSearchChange,
    delay: 400,
  });

  const [editingTip, setEditingTip] = useState<AdminTip | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingTip, setDeletingTip] = useState<AdminTip | null>(null);
  const queryClient = useQueryClient();

  // Safety rule: At least one tip must remain in the system
  const isDeleteProtected = totalTipsCount <= 1;
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminTip(id),
    onSuccess: async (data) => {
      toast.success(data?.message || "Tip deleted successfully");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["adminTips"] }),
        queryClient.invalidateQueries({
          queryKey: ["adminTipsTotalCount"],
        }),
      ]);

      onRefresh();
      setDeletingTip(null);
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete tip. Please try again.";
      toast.error(errorMsg);
    },
  });

  const handleDeleteConfirm = () => {
    if (deleteMutation.isPending) return;

    if (totalTipsCount <= 1) {
      toast.error(
        "Cannot delete: At least one tip must remain in the system for daily notifications."
      );
      setDeletingTip(null);
      return;
    }

    if (deletingTip) {
      deleteMutation.mutate(deletingTip.id);
    }
  };

  const totalPages = pagination?.totalPages || 1;
  const totalItems =
    pagination?.totalItems ??
    pagination?.total ??
    (pagination?.count as number | undefined) ??
    totalTipsCount;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search tips by title or content..."
            value={searchInput}
            onChange={handleInputChange}
            className="pl-9 pr-8 text-xs h-9 bg-background"
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Right: Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Day of Week Filter */}
          <Select value={dayOfWeek} onValueChange={onDayOfWeekChange}>
            <SelectTrigger className="h-9 text-xs w-[130px] bg-background capitalize">
              <SelectValue placeholder="All Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Days
              </SelectItem>
              <SelectItem value="monday" className="text-xs">
                Monday
              </SelectItem>
              <SelectItem value="tuesday" className="text-xs">
                Tuesday
              </SelectItem>
              <SelectItem value="wednesday" className="text-xs">
                Wednesday
              </SelectItem>
              <SelectItem value="thursday" className="text-xs">
                Thursday
              </SelectItem>
              <SelectItem value="friday" className="text-xs">
                Friday
              </SelectItem>
              <SelectItem value="saturday" className="text-xs">
                Saturday
              </SelectItem>
              <SelectItem value="sunday" className="text-xs">
                Sunday
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-9 text-xs w-[120px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Status
              </SelectItem>
              <SelectItem value="active" className="text-xs">
                Active
              </SelectItem>
              <SelectItem value="inactive" className="text-xs">
                Inactive
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-9 px-2.5 text-xs cursor-pointer border-border"
            title="Refresh"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? "animate-spin text-[#649809]" : ""}`}
            />
          </Button>

          {/* Add Tip Button */}
          <CreateTipDialog
            defaultDay={dayOfWeek !== "all" ? dayOfWeek : undefined}
            onSuccess={onRefresh}
          />
        </div>
      </div>

      {/* Safety Banner (Notice when only 1 tip exists) */}
      {totalTipsCount <= 1 && !isLoading && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <ShieldAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>System Safeguard:</strong> At least one tip must remain configured in the system for daily user broadcasts. Deletion is protected.
          </span>
        </div>
      )}

      {/* Tips Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[40%] text-xs font-semibold">Tip Information</TableHead>
              <TableHead className="text-xs font-semibold">Broadcast Day</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="text-xs font-semibold">Created / Updated</TableHead>
              <TableHead className="text-xs font-semibold text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-72" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-24" />
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : tips.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <EmptyState
                    icon={Lightbulb}
                    title="No financial tips found"
                    description={
                      search || dayOfWeek !== "all" || status !== "all"
                        ? "Try clearing filters or search term to see more results."
                        : "Start adding daily tips to guide users toward financial success."
                    }
                    action={
                      <CreateTipDialog
                        defaultDay={dayOfWeek !== "all" ? dayOfWeek : undefined}
                        onSuccess={onRefresh}
                      />
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              // Data Rows
              tips.map((tip) => {
                const dayKey = (tip.day_of_week || "").toLowerCase();
                const dayStyle = DAY_COLORS[dayKey] || {
                  bg: "bg-muted",
                  text: "text-muted-foreground",
                  border: "border-border",
                };
                const isActive = tip.status?.toLowerCase() === "active";

                return (
                  <TableRow
                    key={tip.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    {/* Tip Information */}
                    <TableCell className="py-3 w-[40%] max-w-[400px]">
                      <div className="space-y-1 min-w-0 max-w-full">
                        <Link
                          href={`/dashboard/tips/${tip.id}`}
                          title={tip.title}
                          className="font-semibold text-sm text-foreground hover:text-[#649809] transition-colors flex items-start gap-1.5 min-w-0"
                        >
                          <span className="break-words whitespace-normal line-clamp-2">
                            {tip.title}
                          </span>
                        </Link>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed break-words">
                          {tip.description}
                        </p>
                      </div>
                    </TableCell>

                    {/* Day of Week */}
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={`capitalize font-semibold text-xs border ${dayStyle.bg} ${dayStyle.text} ${dayStyle.border}`}
                      >
                        <Calendar className="size-3 mr-1" />
                        {tip.day_of_week}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium border ${isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
                          }`}
                      >
                        <span
                          className={`size-1.5 rounded-full mr-1.5 ${isActive ? "bg-emerald-500" : "bg-gray-400"
                            }`}
                        />
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>

                    {/* Created / Updated */}
                    <TableCell className="py-3">
                      <div className="text-xs text-muted-foreground flex flex-col">
                        <span>{formatDate(tip.updated_at || tip.created_at)}</span>
                        <span className="text-[10px] text-muted-foreground/70">
                          {tip.created_at ? `Created ${formatDate(tip.created_at)}` : ""}
                        </span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Details (Dedicated Page, NOT Modal) */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/dashboard/tips/${tip.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  <Eye className="size-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">View Tip Details Page</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Edit Button */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingTip(tip);
                                  setIsEditDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-[#649809] cursor-pointer"
                              >
                                <Edit className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Edit Tip</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Delete Button (Protected when totalTipsCount <= 1) */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isDeleteProtected}
                                  onClick={() => setDeletingTip(tip)}
                                  className={`h-8 w-8 p-0 cursor-pointer ${isDeleteProtected
                                    ? "text-muted-foreground/40 cursor-not-allowed"
                                    : "text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                    }`}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                {isDeleteProtected
                                  ? "Cannot delete: at least 1 tip must remain"
                                  : "Delete Tip"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Select
            value={limit.toString()}
            onValueChange={(val) => {
              onLimitChange(Number(val));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px] text-xs bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5" className="text-xs">5</SelectItem>
              <SelectItem value="10" className="text-xs">10</SelectItem>
              <SelectItem value="20" className="text-xs">20</SelectItem>
              <SelectItem value="50" className="text-xs">50</SelectItem>
            </SelectContent>
          </Select>
          <span>
            Total: <strong>{totalItems}</strong> tip{totalItems !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span>
            Page <strong>{page}</strong> of <strong>{totalPages || 1}</strong>
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="h-8 px-2.5 text-xs cursor-pointer"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="h-8 px-2.5 text-xs cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Tip Dialog */}
      <EditTipDialog
        tip={editingTip}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onRefresh}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deletingTip)}
        onOpenChange={(open) => !open && setDeletingTip(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle>Delete Financial Tip</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete{" "}
              <strong className="text-foreground break-all">
                &quot;{deletingTip?.title}&quot;
              </strong>
              ? This action cannot be undone and users will no longer receive this tip.
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
              onClick={handleDeleteConfirm}
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
