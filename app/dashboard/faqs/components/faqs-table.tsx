"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  X,
  RefreshCw,
  HelpCircle,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
} from "lucide-react";
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
import { AdminFaq, FaqsPagination, deleteAdminFaq } from "@/lib/api/faqs.api";
import { CreateFaqDialog } from "./create-faq-dialog";
import { EditFaqDialog } from "./edit-faq-dialog";
import { useSearch } from "@/hooks/use-search";
import { EmptyState } from "@/components/ui/empty-state";

interface FaqsTableProps {
  faqs: AdminFaq[];
  pagination?: FaqsPagination;
  isLoading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function FaqsTable({
  faqs,
  pagination,
  isLoading,
  search,
  onSearchChange,
  page,
  onPageChange,
  limit,
  onLimitChange,
  onRefresh,
  isRefreshing = false,
}: FaqsTableProps) {
  const {
    query: searchInput,
    handleInputChange,
    clear: handleClearSearch,
  } = useSearch({
    value: search,
    onChange: onSearchChange,
    delay: 400,
  });

  const [editingFaq, setEditingFaq] = useState<AdminFaq | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingFaq, setDeletingFaq] = useState<AdminFaq | null>(null);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminFaq(id),
    onSuccess: (data) => {
      toast.success(data?.message || "FAQ deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminFaqs"] });
      setDeletingFaq(null);
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete FAQ. Please try again.";
      toast.error(errorMsg);
    },
  });

  const handleDeleteConfirm = () => {
    if (deletingFaq) {
      deleteMutation.mutate(deletingFaq.id);
    }
  };

  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems ?? faqs.length;

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
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs by question or answer..."
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

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
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

          {/* Add FAQ Button */}
          <CreateFaqDialog onSuccess={onRefresh} />
        </div>
      </div>

      {/* FAQs Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[60%] text-xs font-semibold">Question & Answer</TableHead>
              <TableHead className="w-[20%] text-xs font-semibold">Created / Updated</TableHead>
              <TableHead className="w-[20%] text-xs font-semibold text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-3 w-96" />
                    </div>
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
            ) : faqs.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={3} className="h-64 text-center">
                  <EmptyState
                    icon={HelpCircle}
                    title="No FAQs found"
                    description={
                      search
                        ? "No questions matched your search query. Try searching with different keywords."
                        : "Start adding frequently asked questions to help users understand the platform."
                    }
                    action={<CreateFaqDialog onSuccess={onRefresh} />}
                  />
                </TableCell>
              </TableRow>
            ) : (
              // Data Rows
              faqs.map((faq) => {
                return (
                  <TableRow
                    key={faq.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    {/* Question & Answer */}
                    <TableCell className="py-3.5 w-[60%] max-w-[500px]">
                      <div className="space-y-1 min-w-0 max-w-full">
                        <Link
                          href={`/dashboard/faqs/${faq.id}`}
                          title={faq.question}
                          className="font-semibold text-sm text-foreground hover:text-[#649809] transition-colors flex items-start gap-1.5 min-w-0"
                        >
                          <span className="break-words whitespace-normal line-clamp-2">
                            {faq.question}
                          </span>
                        </Link>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed break-words">
                          {faq.answer}
                        </p>
                      </div>
                    </TableCell>

                    {/* Created / Updated */}
                    <TableCell className="py-3.5 w-[20%]">
                      <div className="text-xs text-muted-foreground flex flex-col">
                        <span>{formatDate(faq.updated_at || faq.created_at)}</span>
                        <span className="text-[10px] text-muted-foreground/70">
                          {faq.created_at ? `Created ${formatDate(faq.created_at)}` : ""}
                        </span>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3.5 w-[20%] text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Detail Page */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/dashboard/faqs/${faq.id}`}>
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
                              <p className="text-xs">View FAQ Details</p>
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
                                  setEditingFaq(faq);
                                  setIsEditDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-[#649809] cursor-pointer"
                              >
                                <Edit className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Edit FAQ</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Delete Button */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingFaq(faq)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Delete FAQ</p>
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
            Total: <strong>{totalItems}</strong> FAQ{totalItems !== 1 ? "s" : ""}
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

      {/* Edit FAQ Dialog */}
      <EditFaqDialog
        faq={editingFaq}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onRefresh}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={Boolean(deletingFaq)}
        onOpenChange={(open) => !open && setDeletingFaq(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this FAQ:{" "}
              <strong className="text-foreground">
                &quot;{deletingFaq?.question}&quot;
              </strong>
              ? This action cannot be undone.
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
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs cursor-pointer"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete FAQ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
