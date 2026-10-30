"use client";

import React from "react";
import { BroadcastRecord, BroadcastsPagination } from "@/lib/api/notifications.api";
import { CreateBroadcastDialog } from "./create-broadcast-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Megaphone,
  Users,
  UserCheck,
  RefreshCw,
  Search,
  X,
  Calendar,
} from "lucide-react";
import { Eye } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useSearch } from "@/hooks/use-search";

interface BroadcastTableProps {
  broadcasts: BroadcastRecord[];
  pagination?: BroadcastsPagination;
  isLoading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  page: number;
  onPageChange: (page: number) => void;
  limit: number;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onBroadcastCreated?: (broadcast?: BroadcastRecord, totalRecipients?: number) => void;
}

export function BroadcastTable({
  broadcasts,
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
  onBroadcastCreated,
}: BroadcastTableProps) {
  const {
    query: searchInput,
    handleInputChange,
    clear: handleClearSearch,
  } = useSearch({
    value: search,
    onChange: onSearchChange,
    delay: 400,
  });

  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems ?? broadcasts.length;
  const [selectedBroadcast, setSelectedBroadcast] =
    React.useState<BroadcastRecord | null>(null);
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  // Filter broadcasts client-side by search term if search is typed
  const filteredBroadcasts = React.useMemo(() => {
    if (!searchInput.trim()) return broadcasts;
    const term = searchInput.toLowerCase();
    return broadcasts.filter(
      (b) =>
        b.title?.toLowerCase().includes(term) ||
        b.message?.toLowerCase().includes(term) ||
        b.targetType?.toLowerCase().includes(term)
    );
  }, [broadcasts, searchInput]);

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search broadcasts by title or message..."
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
            title="Refresh history"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? "animate-spin text-[#649809]" : ""}`}
            />
          </Button>

          {/* Send Broadcast Modal Dialog */}
          <CreateBroadcastDialog onSuccess={onBroadcastCreated} />
        </div>
      </div>

      {/* Broadcasts Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[50%] text-xs font-semibold">Title & Message</TableHead>
              <TableHead className="w-[18%] text-xs font-semibold">Target Audience</TableHead>
              <TableHead className="w-[14%] text-xs font-semibold">Recipients</TableHead>
              <TableHead className="w-[18%] text-xs font-semibold">Sent At</TableHead>
              <TableHead className="w-[70px] text-xs font-semibold text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-72" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-3 w-28" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredBroadcasts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <EmptyState
                    icon={Megaphone}
                    title="No broadcast notifications found"
                    description={
                      searchInput
                        ? "No results matched your search term. Try searching with different keywords."
                        : "Start by dispatching your first push notification to users."
                    }
                    action={<CreateBroadcastDialog onSuccess={onBroadcastCreated} />}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredBroadcasts.map((item) => {
                const isAll = (item.targetType || "").toLowerCase() === "all";
                const recipients =
                  item.totalRecipients ??
                  item.total_recipients ??
                  (isAll ? "All" : 1);

                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    {/* Title & Message */}
                    <TableCell className="py-3.5 max-w-[420px]">
                      <div className="min-w-0 max-w-full">
                        <p
                          title={item.title || ""}
                          className="font-semibold text-sm text-foreground line-clamp-2 break-words whitespace-normal overflow-hidden"
                        >
                          {item.title || "—"}
                        </p>

                        <p
                          title={item.message || ""}
                          className="text-xs text-muted-foreground line-clamp-2 break-words whitespace-normal overflow-hidden"
                        >
                          {item.message || "—"}
                        </p>
                      </div>
                    </TableCell>

                    {/* Target Audience */}
                    <TableCell className="py-3.5">
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize font-semibold border ${isAll
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                          }`}
                      >
                        {isAll ? (
                          <>
                            <Users className="size-3 mr-1" /> All Users
                          </>
                        ) : (
                          <>
                            <UserCheck className="size-3 mr-1" /> Specific Users
                          </>
                        )}
                      </Badge>
                    </TableCell>

                    {/* Recipients */}
                    <TableCell className="py-3.5">
                      <span className="text-xs font-semibold text-foreground">
                        {recipients}{" "}
                        <span className="text-muted-foreground font-normal">
                          user{recipients !== 1 ? "s" : ""}
                        </span>
                      </span>
                    </TableCell>

                    {/* Sent Date */}
                    <TableCell className="py-3.5">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(
                          item.createdAt || item.created_at || item.updatedAt
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedBroadcast(item)}
                        title="View broadcast details"
                        className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-[#649809]"
                      >
                        <Eye className="size-4" />
                        <span className="sr-only">View broadcast details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>



      <Dialog
        open={!!selectedBroadcast}
        onOpenChange={(open) => {
          if (!open) setSelectedBroadcast(null);
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[85vh] overflow-y-auto overflow-x-hidden rounded-xl p-5 sm:p-7">

          <DialogHeader className="space-y-1.5 pb-3">
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Broadcast Details
            </DialogTitle>

           
          </DialogHeader>

          {selectedBroadcast && (
            <div className="space-y-5">

              {/* Title */}
              <div className="space-y-2 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">
                  Title
                </p>

                <div className="rounded-xl border border-border bg-slate-50 dark:bg-muted/40 p-3.5 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-all [overflow-wrap:anywhere]">
                    {selectedBroadcast.title || "—"}
                  </p>
                </div>
              </div>

              {/* Full Message */}
              <div className="space-y-2 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">
                  Full Message
                </p>

                <div className="rounded-xl border border-border bg-slate-50 dark:bg-muted/40 p-3.5 min-w-0">
                  <div className="max-h-40 overflow-y-auto overflow-x-hidden pr-2">
                    <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all [overflow-wrap:anywhere]">
                      {selectedBroadcast.message || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Target Audience
                </p>

                <Badge
                  variant="outline"
                  className="w-fit gap-1.5 rounded-lg border-[#649809]/25 bg-[#649809]/10 px-3 py-1.5 text-xs font-semibold text-[#649809]"
                >
                  <Users className="size-3.5" />

                  {(selectedBroadcast.targetType || "").toLowerCase() === "all"
                    ? "All Users"
                    : "Specific Users"}
                </Badge>
              </div>

              {/* Recipients */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Recipients
                </p>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 dark:bg-muted/40 p-3.5">
                  <Users className="size-5 shrink-0 text-blue-600" />

                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {selectedBroadcast.totalRecipients ??
                      selectedBroadcast.total_recipients ??
                      ((selectedBroadcast.targetType || "").toLowerCase() === "all"
                        ? "All"
                        : 1)}{" "}
                    Users
                  </p>
                </div>
              </div>

              {/* Sent Date */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  Sent At
                </p>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-slate-50 dark:bg-muted/40 p-3.5">
                  <Calendar className="size-5 shrink-0 text-blue-600" />

                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(
                      selectedBroadcast.createdAt ||
                      selectedBroadcast.created_at ||
                      selectedBroadcast.updatedAt
                    )}
                  </p>
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

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
            Total: <strong>{totalItems}</strong> broadcast{totalItems !== 1 ? "s" : ""}
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
    </div>
  );
}
