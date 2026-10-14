"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  X,
  RefreshCw,
  Tag,
  DollarSign,
  TrendingUp,
  Wallet,
  Sparkles,
  Layers,
  Pencil,
  Trash2,
  Loader2,
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
import {
  AdminCategory,
  CategoriesPagination,
  deleteAdminCategory,
} from "@/lib/api/categories.api";
import { CreateCategoryDialog } from "./create-category-dialog";
import { EditCategoryDialog } from "./edit-category-dialog";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { EmptyState } from "@/components/ui/empty-state";

interface CategoriesTableProps {
  categories: AdminCategory[];
  pagination?: CategoriesPagination;
  isLoading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const TYPE_TABS = [
  { id: "all", label: "All Types", icon: Layers },
  { id: "expense", label: "Expense", icon: Wallet, color: "text-rose-600" },
  { id: "income", label: "Income", icon: DollarSign, color: "text-[#649809]" },
  { id: "asset", label: "Asset", icon: TrendingUp, color: "text-blue-600" },
  { id: "insight", label: "Insight", icon: Sparkles, color: "text-amber-600" },
];

export function CategoriesTable({
  categories,
  pagination,
  isLoading,
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  page,
  onPageChange,
  limit,
  onLimitChange,
  onRefresh,
  isRefreshing = false,
}: CategoriesTableProps) {
  const [searchInput, setSearchInput] = useState(search);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<AdminCategory | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Debounce search with trimmed value
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed !== search) {
      onSearchChange(trimmed);
    }
  }, [debouncedSearch, search, onSearchChange]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminCategory(id),
    onSuccess: () => {
      toast.success("Admin category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      queryClient.invalidateQueries({ queryKey: ["adminCategoryStats"] });
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      onRefresh();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete category");
    },
  });

  const handleEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDeletePrompt = (category: AdminCategory) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "expense":
        return (
          <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 font-medium text-xs">
            Expense
          </Badge>
        );
      case "income":
        return (
          <Badge className="bg-[#649809]/15 text-[#649809] border-[#649809]/30 font-medium text-xs">
            Income
          </Badge>
        );
      case "asset":
        return (
          <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 font-medium text-xs">
            Asset
          </Badge>
        );
      case "insight":
        return (
          <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-medium text-xs">
            Insight
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs capitalize">
            {type}
          </Badge>
        );
    }
  };

  const totalPages =
    pagination?.totalPages ??
    Math.max(1, Math.ceil((pagination?.totalItems ?? categories.length) / limit));
  const totalItems = pagination?.totalItems ?? categories.length;
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div className="w-full space-y-4">
      {/* Type Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-muted/50 rounded-xl border border-border w-fit">
        {TYPE_TABS.map((tab) => {
          const isActive = selectedType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();

  console.log("Clicked filter:", tab.id);
  onTypeChange(tab.id);
}}              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-white dark:bg-card text-gray-900 dark:text-gray-100 shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className={`size-3.5 ${tab.color || ""}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search categories by name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9 h-9 text-sm bg-white dark:bg-card border-border focus-visible:ring-[#649809]"
          />
          {searchInput && (
            <button
              aria-label="Clear search query"
              onClick={() => {
                setSearchInput("");
                onSearchChange("");
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Right Actions: Refresh & Create Category */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing || isLoading}
            className="cursor-pointer border-border h-9 gap-1.5 text-xs shadow-xs"
            title="Refresh category list"
          >
            <RefreshCw
              className={`size-3.5 ${
                isRefreshing ? "animate-spin text-[#649809]" : ""
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <CreateCategoryDialog onSuccess={onRefresh} />
        </div>
      </div>

      {/* Categories Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-white dark:bg-card shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-muted/50 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[280px] font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Category Name
                </TableHead>
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Type
                </TableHead>
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Color Accent
                </TableHead>
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Usage Status
                </TableHead>
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Ownership
                </TableHead>
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Created Date
                </TableHead>
                <TableHead className="w-[100px] text-right font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-md" /></TableCell>
                  </TableRow>
                ))
              ) : categories.length > 0 ? (
                categories.map((cat) => {
                  const isInUse = Boolean(cat.inUse ?? cat.in_use);
                  // ONLY categories with in_use === false can be deleted
                  const canDelete = !isInUse;

                  const formattedDate = cat.created_at
                    ? new Date(cat.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <TableRow
                      key={cat.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-muted/40"
                    >
                      {/* Name with Color Dot */}
                      <TableCell className="max-w-[260px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="size-4 rounded-full border border-black/10 shrink-0 shadow-2xs"
                            style={{ backgroundColor: cat.color_code || "#649809" }}
                          />
                          <span
                            className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate block min-w-0"
                            title={cat.name || "—"}
                          >
                            {cat.name || "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Type Badge */}
                      <TableCell>{getTypeBadge(cat.type)}</TableCell>

                      {/* Color Preview & Hex */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="size-3.5 rounded-sm border border-black/10 shrink-0"
                            style={{ backgroundColor: cat.color_code || "#649809" }}
                          />
                          <span className="font-mono text-xs text-muted-foreground uppercase">
                            {cat.color_code || "—"}
                          </span>
                        </div>
                      </TableCell>

                      {/* In Use Status */}
                      <TableCell>
                        {isInUse ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs font-normal"
                          >
                            In Use
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-slate-100 dark:bg-muted text-slate-500 border-border text-xs font-normal"
                          >
                            Not in Use
                          </Badge>
                        )}
                      </TableCell>

                      {/* Ownership */}
                      <TableCell>
                        <span className="text-xs text-muted-foreground capitalize">
                          {cat.owned_by || "Admin"}
                        </span>
                      </TableCell>

                      {/* Created Date */}
                      <TableCell>
                        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formattedDate}
                        </span>
                      </TableCell>

                      {/* Actions: Edit always; Delete ONLY if in_use === false */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Action Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                            onClick={() => handleEdit(cat)}
                            title="Edit category"
                          >
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit</span>
                          </Button>

                          {/* Delete Action Button: strictly rendered ONLY if in_use is false */}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              onClick={() => handleDeletePrompt(cat)}
                              title="Delete category"
                            >
                              <Trash2 className="size-3.5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                /* Empty State */
                <TableRow>
                  <TableCell colSpan={7} className="h-44 text-center p-0">
                    <EmptyState
                      icon={Tag}
                      title="No categories found"
                      description={
                        search || selectedType !== "all"
                          ? "Try clearing filters or search keywords."
                          : "Create your first category by clicking 'Add Category'."
                      }
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

      {/* Edit Category Modal */}
      <EditCategoryDialog
        category={editingCategory}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onRefresh}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
              Delete Category
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete category{" "}
              <strong className="text-gray-900 dark:text-gray-100">
                &ldquo;{categoryToDelete?.name}&rdquo;
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="cursor-pointer h-8 text-xs"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer h-8 text-xs font-medium shadow-xs"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
