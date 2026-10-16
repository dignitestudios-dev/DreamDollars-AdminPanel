"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getBroadcastNotifications,
  BroadcastRecord,
} from "@/lib/api/notifications.api";
import { BroadcastTable } from "./components/broadcast-table";
import { Megaphone, Sparkles } from "lucide-react";
import { useUrlState } from "@/hooks/use-url-state";

export default function BroadcastPage() {
  const { values, setParams } = useUrlState({
    page: 1,
    limit: 10,
    search: "",
  });

  const page = values.page;
  const limit = values.limit;
  const search = values.search;

  useEffect(() => {
    document.title = "Broadcast Notifications | Dream Dollar Admin";
  }, []);

  const [localBroadcasts, setLocalBroadcasts] = useState<BroadcastRecord[]>([]);

  // Fetch broadcasts from server
  const {
    data: response,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["broadcastNotifications", { page, limit, search }],
    queryFn: () => getBroadcastNotifications({ page, limit, search }),
    retry: false, // Prevent infinite retries if backend has SQL query error
    placeholderData: (previousData) => previousData,
  });

  const serverBroadcasts: BroadcastRecord[] = React.useMemo(
    () => response?.data ?? [],
    [response?.data]
  );

  // Merge server broadcasts with locally sent broadcasts in the current session
  const allBroadcasts = React.useMemo(() => {
    const existingIds = new Set(serverBroadcasts.map((b) => b.id));
    const uniqueLocal = localBroadcasts.filter((b) => !existingIds.has(b.id));
    return [...uniqueLocal, ...serverBroadcasts];
  }, [serverBroadcasts, localBroadcasts]);

  const handleBroadcastSent = (
    broadcast?: BroadcastRecord,
    totalRecipients?: number
  ) => {
    if (broadcast) {
      const newRecord: BroadcastRecord = {
        ...broadcast,
        totalRecipients: totalRecipients ?? broadcast.totalRecipients ?? 0,
        createdAt: broadcast.createdAt || new Date().toISOString(),
      };
      setLocalBroadcasts((prev) => [newRecord, ...prev]);
    }
  };

  const totalItems =
    (response?.pagination?.totalItems ?? serverBroadcasts.length) +
    localBroadcasts.filter(
      (b) => !new Set(serverBroadcasts.map((sb) => sb.id)).has(b.id)
    ).length;

  const handleSearchChange = React.useCallback(
    (s: string) => setParams({ search: s, page: 1 }),
    [setParams]
  );
  const handlePageChange = React.useCallback(
    (p: number) => setParams({ page: p }),
    [setParams]
  );
  const handleLimitChange = React.useCallback(
    (l: number) => setParams({ limit: l, page: 1 }),
    [setParams]
  );
  const handleRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#649809]/10 flex items-center justify-center shrink-0 border border-[#649809]/20">
            <Megaphone className="h-5 w-5 text-[#649809]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Broadcast Notifications
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send instant push notifications to all users or specific individuals
            </p>
          </div>
        </div>

        {totalItems > 0 && (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#649809]/10 text-[#649809] border border-[#649809]/20">
            <Sparkles className="size-3.5" />
            <span>Total Broadcasts:</span>
            <span>{totalItems}</span>
          </div>
        )}
      </div>

      {/* Broadcast History Table with Modal Action */}
      <BroadcastTable
        broadcasts={allBroadcasts}
        pagination={response?.pagination}
        isLoading={isLoading && localBroadcasts.length === 0}
        search={search}
        onSearchChange={handleSearchChange}
        page={page}
        onPageChange={handlePageChange}
        limit={limit}
        onLimitChange={handleLimitChange}
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        onBroadcastCreated={handleBroadcastSent}
      />
    </div>
  );
}
