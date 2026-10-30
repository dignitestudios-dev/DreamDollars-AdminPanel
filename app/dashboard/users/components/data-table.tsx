"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  EllipsisVertical,
  Eye,
  Download,
  Search,
  X,
  Calendar,
  RefreshCw,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCheck,
  UserX,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AdminUser, UsersPagination, updateUserStatus } from "@/lib/api/users.api";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { useSearch } from "@/hooks/use-search";
import { ConfirmationDialog } from "./confirmation-dialog";

interface DataTableProps {
  users: AdminUser[];
  pagination?: UsersPagination;
  isLoading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  isSubscribed: string;
  onSubscribedChange: (val: string) => void;
  startDate?: string;
  endDate?: string;
  onDateRangeChange: (start?: string, end?: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  sortBy: string;
  order: "asc" | "desc";
  onSortChange: (field: string, newOrder: "asc" | "desc") => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function DataTable({
  users,
  pagination,
  isLoading,
  search,
  onSearchChange,
  status,
  onStatusChange,
  isSubscribed,
  onSubscribedChange,
  startDate,
  endDate,
  onDateRangeChange,
  page,
  onPageChange,
  limit,
  onLimitChange,
  sortBy,
  order,
  onSortChange,
  onRefresh,
  isRefreshing = false,
}: DataTableProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  // Unified search hook with debounce and safe clearing
  const {
    query: searchInput,
    handleInputChange,
    clear: handleClearSearch,
  } = useSearch({
    value: search,
    onChange: onSearchChange,
    delay: 400,
  });

  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Date range filter state
  const [draftStartDate, setDraftStartDate] = useState(startDate || "");
  const [draftEndDate, setDraftEndDate] = useState(endDate || "");
  const [showDateFilter, setShowDateFilter] = useState(
    Boolean(startDate || endDate)
  );

  const handleApplyDateRange = () => {
    onDateRangeChange(
      draftStartDate ? draftStartDate : undefined,
      draftEndDate ? draftEndDate : undefined
    );
  };

  const handleClearDateRange = () => {
    setDraftStartDate("");
    setDraftEndDate("");
    onDateRangeChange(undefined, undefined);
  };

  const handleResetAllFilters = () => {
    handleClearSearch();
    onStatusChange("all");
    onSubscribedChange("all");
    setDraftStartDate("");
    setDraftEndDate("");
    onDateRangeChange(undefined, undefined);
  };

  const handleHeaderSort = (field: string) => {
    if (sortBy === field) {
      onSortChange(field, order === "asc" ? "desc" : "asc");
    } else {
      onSortChange(field, "asc");
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortBy === field) {
      return order === "asc" ? (
        <ArrowUp className="size-3.5 text-[#649809]" />
      ) : (
        <ArrowDown className="size-3.5 text-[#649809]" />
      );
    }
    return (
      <ArrowUpDown className="size-3.5 text-muted-foreground/50 group-hover:text-foreground" />
    );
  };

  const handleToggleUserStatus = async () => {
    if (!selectedUser) return;

    const nextStatus =
      selectedUser.accountStatus === "active"
        ? "inactive"
        : "active";

    const statusLabel =
      nextStatus === "active" ? "Active" : "Inactive";

    try {
      setUpdatingUserId(selectedUser.id);

      await updateUserStatus(selectedUser.id, nextStatus);

      toast.success(`User status changed to ${statusLabel}`);

      setSelectedUser(null);
      onRefresh();
    } catch (err: unknown) {
      const errorMsg =
        (err as {
          response?: { data?: { message?: string } };
        })?.response?.data?.message ||
        "Failed to update user status";

      toast.error(errorMsg);
    } finally {
      setUpdatingUserId(null);
    }
  };
  const hasActiveFilters =
    Boolean(search) ||
    status !== "all" ||
    isSubscribed !== "all" ||
    Boolean(startDate) ||
    Boolean(endDate);

  const totalPages =
    pagination?.totalPages ??
    Math.max(1, Math.ceil((pagination?.totalItems ?? users.length) / limit));
  const totalItems = pagination?.totalItems ?? users.length;
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  const exportToCSV = () => {
    if (!users.length) {
      toast.error("No users to export");
      return;
    }
    const headers = [
      "ID",
      "Name",
      "Email",
      "Subscription",
      "Status",
      "Email Verified",
      "Profile Completed",
      "Joined Date",
    ];
    const rows = users.map((u) => [
      u.id,
      `"${u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim() || ""}"`,
      `"${u.email}"`,
      u.isSubscribed ? "Active" : "Inactive",
      u.accountStatus,
      u.isEmailVerified ? "Yes" : "No",
      u.isProfileCompleted ? "Yes" : "No",
      `"${u.joinedDate || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dream_dollar_users_p${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully");
  };

  return (
    <div className="w-full space-y-4">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email..."
            value={searchInput}
            onChange={handleInputChange}
            className="pl-9 pr-9 h-9.5 text-sm bg-white dark:bg-card border-border focus-visible:ring-[#649809]"
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`cursor-pointer border-border h-9 gap-1.5 ${startDate || endDate
              ? "bg-[#649809]/10 text-[#649809] border-[#649809]"
              : ""
              }`}
          >
            <Calendar className="size-4" />
            <span>Date Range</span>
            {(startDate || endDate) && (
              <span className="size-2 rounded-full bg-[#649809]" />
            )}
          </Button>



          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="cursor-pointer border-border h-9 gap-1.5"
            title="Export to CSV"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Date Range Picker Expandable Row */}
      {showDateFilter && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-muted/40 border border-border">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Calendar className="size-3.5 text-[#649809]" /> Filter by Join Date:
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={draftStartDate}
              onChange={(e) => setDraftStartDate(e.target.value)}
              className="h-8 text-xs px-2.5 rounded-md bg-white border border-border text-gray-700 outline-none focus:ring-1 focus:ring-[#649809] cursor-pointer"
              title="Start Date"
            />
            <span className="text-xs text-gray-400 font-medium">to</span>
            <input
              type="date"
              value={draftEndDate}
              onChange={(e) => setDraftEndDate(e.target.value)}
              className="h-8 text-xs px-2.5 rounded-md bg-white border border-border text-gray-700 outline-none focus:ring-1 focus:ring-[#649809] cursor-pointer"
              title="End Date"
            />
          </div>
          <Button
            size="sm"
            onClick={handleApplyDateRange}
            className="h-8 px-3 text-xs bg-[#649809] hover:bg-[#527d07] text-white cursor-pointer"
          >
            Apply
          </Button>
          {(startDate || endDate || draftStartDate || draftEndDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearDateRange}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Filter Selects & Active Filter Indicators */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="w-40">
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

        {/* Subscription Filter: Active / Inactive (No Free/Subscribed) */}
        <div className="w-44">
          <Select value={isSubscribed} onValueChange={onSubscribedChange}>
            <SelectTrigger className="cursor-pointer h-9 text-xs border-border bg-white dark:bg-card">
              <SelectValue placeholder="Subscription: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subscriptions</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAllFilters}
            className="h-9 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer gap-1"
          >
            <X className="size-3.5" />
            Reset Filters
          </Button>
        )}

        <div className="ml-auto text-xs text-muted-foreground hidden md:block">
          Total Users:{" "}
          <strong className="text-gray-900 dark:text-gray-100">{totalItems}</strong>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-border dark:border-border overflow-hidden bg-white dark:bg-card shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-muted/50 border-b border-border/70">
              <TableRow className="hover:bg-transparent">
                {/* Name Column (Sortable) */}
                <TableHead className="w-[240px]">
                  <button
                    type="button"
                    onClick={() => handleHeaderSort("name")}
                    className="group inline-flex items-center gap-1.5 font-semibold text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 cursor-pointer"
                  >
                    <span>Name</span>
                    {renderSortIcon("name")}
                  </button>
                </TableHead>

                {/* Email Column (Sortable) */}
                <TableHead className="w-[240px]">
                  <button
                    type="button"
                    onClick={() => handleHeaderSort("email")}
                    className="group inline-flex items-center gap-1.5 font-semibold text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 cursor-pointer"
                  >
                    <span>Email</span>
                    {renderSortIcon("email")}
                  </button>
                </TableHead>

                {/* Subscription Column */}
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Subscription
                </TableHead>

                {/* Account Status Column */}
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Account Status
                </TableHead>

                {/* Email Verified Column */}
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Email Verified
                </TableHead>

                {/* Profile Status Column */}
                <TableHead className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Profile Status
                </TableHead>

                {/* Joined Date Column (Sortable: created_at) */}
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleHeaderSort("created_at")}
                    className="group inline-flex items-center gap-1.5 font-semibold text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 cursor-pointer"
                  >
                    <span>Joined Date</span>
                    {renderSortIcon("created_at")}
                  </button>
                </TableHead>

                {/* Actions Column */}
                <TableHead className="w-[100px] text-right font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading Skeleton Rows
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users.length > 0 ? (
                users.map((user) => {
                  const displayName =
                    user.name ||
                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    user.email.split("@")[0];

                  const initials =
                    displayName
                      .split(" ")
                      .map((p) => p[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "U";

                  const formattedJoinDate = user.joinedDate
                    ? new Date(user.joinedDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                    : "—";

                  const isUpdating = updatingUserId === user.id;

                  return (
                    <TableRow
                      key={user.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-muted/40 cursor-pointer"
                      onClick={() => router.push(`/dashboard/users/${user.id}`)}
                    >
                      {/* Name Column (Avatar + Display Name) */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 border border-border">
                            {user.profilePic && (
                              <AvatarImage
                                src={user.profilePic}
                                alt={displayName}
                              />
                            )}
                            <AvatarFallback className="bg-[#649809]/15 text-[#649809] font-semibold text-xs">
                              {user.avatarEmoji || initials}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            title={displayName}
                            className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate max-w-[180px]"
                          >
                            {displayName}
                          </span>
                        </div>
                      </TableCell>

                      {/* Email Column */}
                      <TableCell>
                        <span
                          title={user.email}
                          className="text-xs text-muted-foreground font-mono truncate max-w-[220px] block"
                        >
                          {user.email}
                        </span>
                      </TableCell>

                      {/* Subscription: Based ONLY on isSubscribed boolean. Active if true, Inactive if false */}
                      <TableCell>
                        {user.isSubscribed ? (
                          <Badge className="bg-[#649809]/15 text-[#649809] border border-[#649809]/30 hover:bg-[#649809]/20 font-medium text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-slate-100 dark:bg-muted text-muted-foreground border-border font-normal text-xs"
                          >
                            Inactive
                          </Badge>
                        )}
                      </TableCell>

                      {/* Account Status */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize font-medium ${user.accountStatus === "active"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                            }`}
                        >
                          {user.accountStatus || "unknown"}
                        </Badge>
                      </TableCell>

                      {/* Email Verified */}
                      <TableCell>
                        {user.isEmailVerified ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-xs gap-1 font-normal"
                          >
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 text-xs gap-1 font-normal"
                          >
                            <XCircle className="size-3 text-amber-600" />
                            Unverified
                          </Badge>
                        )}
                      </TableCell>

                      {/* Profile Status */}
                      <TableCell>
                        {user.isProfileCompleted ? (
                          <span className="inline-flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-muted-foreground italic">
                            Incomplete
                          </span>
                        )}
                      </TableCell>

                      {/* Joined Date */}
                      <TableCell>
                        <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formattedJoinDate}
                        </span>
                      </TableCell>

                      {/* Action Menu */}
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-gray-900 cursor-pointer"
                            onClick={() => router.push(`/dashboard/users/${user.id}`)}
                            title="View details page"
                          >
                            <Eye className="size-4" />
                            <span className="sr-only">View user details</span>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-gray-900 cursor-pointer"
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <Loader2 className="size-3.5 animate-spin text-[#649809]" />
                                ) : (
                                  <EllipsisVertical className="size-4" />
                                )}
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                className="cursor-pointer text-xs"
                                onClick={() => router.push(`/dashboard/users/${user.id}`)}
                              >
                                <UserIcon className="mr-2 size-3.5" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.accountStatus === "active" ? (
                                <DropdownMenuItem
                                  className="cursor-pointer text-xs text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <UserX className="mr-2 size-3.5 text-rose-600" />
                                  Mark as Inactive
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  className="cursor-pointer text-xs text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/30"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <UserCheck className="mr-2 size-3.5 text-emerald-600" />
                                  Mark as Active
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                /* Empty State */
                <TableRow>
                  <TableCell colSpan={8} className="h-44 text-center">
                    <EmptyState
                      icon={UserIcon}
                      title="No users found"
                      description={
                        hasActiveFilters
                          ? "Try adjusting your search terms or filter selections."
                          : "There are currently no users in the database."
                      }
                      action={
                        hasActiveFilters ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetAllFilters}
                            className="text-xs border-border cursor-pointer"
                          >
                            Clear All Filters
                          </Button>
                        ) : undefined
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
      <ConfirmationDialog
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open && !updatingUserId) {
            setSelectedUser(null);
          }
        }}
        title={
          selectedUser?.accountStatus === "active"
            ? "Deactivate User?"
            : "Activate User?"
        }
        description={
          selectedUser?.accountStatus === "active"
            ? `Are you sure you want to deactivate ${selectedUser.name || selectedUser.email}? This user will no longer have an active account.`
            : `Are you sure you want to activate ${selectedUser?.name || selectedUser?.email}? This will restore the user's active account status.`
        }
        confirmText={
          selectedUser?.accountStatus === "active"
            ? "Yes, Deactivate"
            : "Yes, Activate"
        }
        variant={
          selectedUser?.accountStatus === "active"
            ? "destructive"
            : "default"
        }
        isLoading={!!updatingUserId}
        onConfirm={handleToggleUserStatus}
      />
    </div>
  );
}
