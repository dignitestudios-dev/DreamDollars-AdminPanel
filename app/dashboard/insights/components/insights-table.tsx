"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  X,
  RefreshCw,
  Sparkles,
  Video,
  ExternalLink,
  FileText,
  Trash2,
  Eye,
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
import { Skeleton } from "@/components/ui/skeleton";
import { AdminInsight, InsightsPagination, deleteAdminInsight } from "@/lib/api/insights.api";
import { AdminCategory } from "@/lib/api/categories.api";
import { CreateInsightDialog } from "./create-insight-dialog";
import { EditInsightDialog } from "./edit-insight-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useSearch } from "@/hooks/use-search";

interface InsightsTableProps {
  insights: AdminInsight[];
  categories: AdminCategory[];
  pagination?: InsightsPagination;
  isLoading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  categoryId: string;
  onCategoryChange: (catId: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onResetFilters: () => void;
}

export function InsightsTable({
  insights,
  categories,
  pagination,
  isLoading,
  search,
  onSearchChange,
  status,
  onStatusChange,
  categoryId,
  onCategoryChange,
  page,
  onPageChange,
  limit,
  onLimitChange,
  onRefresh,
  isRefreshing = false,
  onResetFilters,
}: InsightsTableProps) {
  const {
    query: searchInput,
    handleInputChange,
    clear: handleClearSearch,
  } = useSearch({
    value: search,
    onChange: onSearchChange,
    delay: 400,
  });

  const [deletingInsight, setDeletingInsight] = useState<AdminInsight | null>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminInsight(id),
    onSuccess: () => {
      toast.success("Insight deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminInsights"] });
      setDeletingInsight(null);
      onRefresh();
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete insight";
      toast.error(errorMsg);
    },
  });

  const handleResetFilters = () => {
    handleClearSearch();
    onResetFilters();
  };


  const totalItems =
    pagination?.total ?? pagination?.totalItems ?? insights.length;
  const totalPages =
    pagination?.totalPages ?? Math.max(1, Math.ceil(totalItems / limit));
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  const hasActiveFilters = Boolean(search) || status !== "all" || categoryId !== "all";





  return (
    <div className="w-full space-y-4">
      {/* Delete Confirmation Modal */}
      <AlertDialog
        open={Boolean(deletingInsight)}
        onOpenChange={(open) => !open && setDeletingInsight(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
              Delete Financial Insight
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground break-all">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">
                &ldquo;{deletingInsight?.title}&rdquo;
              </strong>
              ? This action cannot be undone and will remove it permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer text-xs h-8">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingInsight) {
                  deleteMutation.mutate(deletingInsight.id);
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer text-xs h-8"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search insights by title or content..."
            value={searchInput}
            onChange={handleInputChange}
            className="pl-9 pr-9 h-9 text-sm bg-white dark:bg-card border-border focus-visible:ring-[#649809]"
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Middle/Right: Select Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="w-36">
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="cursor-pointer h-9 text-xs border-border bg-white dark:bg-card">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="w-44">
            <Select value={categoryId} onValueChange={onCategoryChange}>
              <SelectTrigger className="cursor-pointer h-9 text-xs border-border bg-white dark:bg-card">
                <SelectValue placeholder="Category: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-9 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer gap-1"
            >
              <X className="size-3.5" />
              Reset
            </Button>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing || isLoading}
            className="cursor-pointer border-border h-9 gap-1.5 text-xs shadow-xs"
            title="Refresh insight list"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? "animate-spin text-[#649809]" : ""
                }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Create Insight Modal Trigger */}
          <CreateInsightDialog onSuccess={onRefresh} />
        </div>
      </div>

      {/* Insights Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-white dark:bg-card shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-muted/50 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[380px] font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Insight Article
                </TableHead>
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Category
                </TableHead>
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Media & Links
                </TableHead>
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Published Date
                </TableHead>
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-72" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : insights.length > 0 ? (
                insights.map((item) => {
                  const categoryName = item.category?.name || "General";
                  const categoryColor = item.category?.color_code || "#649809";
                  const formattedDate = item.created_at
                    ? new Date(item.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                    : "—";

                  return (
                    <TableRow
                      key={item.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-muted/40"
                    >
                      {/* Title & Description with Thumbnail */}
                      <TableCell>
                        <div className="flex items-start gap-3 py-1">
                          {item.thumbnail_url ? (
                            <img
                              src={item.thumbnail_url}
                              alt={item.title}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23649809' stroke-width='1.5'%3E%3Crect width='18' height='18' x='3' y='3' rx='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                              }}
                              className="h-12 w-12 rounded-lg object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-[#649809]/10 text-[#649809] flex items-center justify-center shrink-0 border border-border">
                              <FileText className="size-5" />
                            </div>
                          )}
                          <div className="space-y-1 min-w-0 flex-1">
                            <Link
                              href={`/dashboard/insights/${item.id}`}
                              title={item?.title}
                              className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-snug line-clamp-1 hover:text-[#649809] transition-colors break-all"
                            >
                              {item?.title
                                ? item.title.length > 60
                                  ? `${item.title.slice(0, 60)}...`
                                  : item.title
                                : "—"}
                            </Link>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {item?.description
                                ? item.description.length > 60
                                  ? `${item.description.slice(0, 60)}...`
                                  : item.description
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Category Badge */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: categoryColor }}
                          />
                          <span className="font-medium text-xs text-gray-800 dark:text-gray-200">
                            {categoryName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Media & Links */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.video_url && (
                            <a
                              href={item.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800 transition-colors"
                              title={item.video_url}
                            >
                              <Video className="size-3" />
                              <span>Video</span>
                            </a>
                          )}
                          {item.external_link && (
                            <a
                              href={item.external_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 transition-colors"
                              title={item.external_link}
                            >
                              <ExternalLink className="size-3" />
                              <span>Link</span>
                            </a>
                          )}
                          {!item.video_url && !item.external_link && (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {item.status === "active" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-slate-100 dark:bg-muted text-muted-foreground border-border text-xs font-normal"
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>

                      {/* Published Date */}
                      <TableCell>
                        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formattedDate}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Detail Page */}
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="size-8 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer"
                            title="View Insight Details"
                          >
                            <Link href={`/dashboard/insights/${item.id}`}>
                              <Eye className="size-3.5" />
                            </Link>
                          </Button>

                          {/* Edit Modal Dialog */}
                          <EditInsightDialog
                            insight={item}
                            onSuccess={onRefresh}
                          />

                          {/* Delete Action */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingInsight(item)}
                            className="size-8 text-gray-600 dark:text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                            title="Delete Insight"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                /* Empty State */
                <TableRow>
                  <TableCell colSpan={6} className="h-44 text-center">
                    <EmptyState
                      icon={Sparkles}
                      title="No financial insights found"
                      description={
                        hasActiveFilters
                          ? "Try adjusting your search criteria or filter options."
                          : "Start building your educational knowledge base by adding insights."
                      }
                      action={<CreateInsightDialog onSuccess={onRefresh} />}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
        {/* Rows per page selector */}
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={limit.toString()}
            onValueChange={(val) => {
              onLimitChange(Number(val));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="w-18 h-8 text-xs cursor-pointer border-border bg-white dark:bg-card">
              <SelectValue placeholder={limit.toString()} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="hidden sm:inline">
            Showing {startItem}–{endItem} of {totalItems}
          </span>
        </div>

        {/* Page navigation */}
        <div className="flex items-center space-x-4">
          <div className="text-xs text-muted-foreground">
            Page <strong className="text-gray-900 dark:text-gray-100">{page}</strong> of{" "}
            <strong className="text-gray-900 dark:text-gray-100">{totalPages}</strong>
          </div>
          <div className="flex items-center space-x-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              className="h-8 px-2.5 text-xs cursor-pointer border-border"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="h-8 px-2.5 text-xs cursor-pointer border-border"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
