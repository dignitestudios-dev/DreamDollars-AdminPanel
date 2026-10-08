"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { useDebounce } from "@/hooks/use-debounce";

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
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 400);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch !== search) {
      onSearchChange(debouncedSearch.trim());
    }
  }, [debouncedSearch, search, onSearchChange]);

  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems ?? broadcasts.length;

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
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-8 text-xs h-9 bg-background"
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setSearchInput("");
                onSearchChange("");
              }}
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
                        className={`text-xs capitalize font-semibold border ${
                          isAll
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
