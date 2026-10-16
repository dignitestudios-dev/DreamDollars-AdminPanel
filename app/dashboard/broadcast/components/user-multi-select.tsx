"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminUsers, AdminUser } from "@/lib/api/users.api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  Check,
  X,
  Users,
  ChevronsUpDown,
  UserCheck,
} from "lucide-react";

import { useSearch } from "@/hooks/use-search";

interface UserMultiSelectProps {
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
  disabled?: boolean;
}

export function UserMultiSelect({
  selectedUserIds,
  onChange,
  disabled = false,
}: UserMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const {
    query: searchTerm,
    debouncedQuery: debouncedSearch,
    handleInputChange,
    clear: handleClearSearch,
  } = useSearch({
    defaultValue: "",
    delay: 250,
  });

  // Fetch users from API
  const { data: response, isLoading } = useQuery({
    queryKey: ["adminUsersForBroadcast", debouncedSearch],
    queryFn: () => getAdminUsers({ limit: 100, search: debouncedSearch }),
    staleTime: 60 * 1000,
  });

  const users: AdminUser[] = useMemo(() => response?.data ?? [], [response]);

  // Map of users for quick lookup
  const userMap = useMemo(() => {
    const map = new Map<string, AdminUser>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const toggleUser = (userId: string) => {
    if (disabled) return;
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  };

  const removeUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selectedUserIds.filter((id) => id !== userId));
  };

  const handleSelectAllVisible = () => {
    if (disabled) return;
    const newIds = new Set(selectedUserIds);
    users.forEach((u) => newIds.add(u.id));
    onChange(Array.from(newIds));
  };

  const handleClearAll = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (disabled) return;
    onChange([]);
  };

  const getUserDisplayName = (user?: AdminUser) => {
    if (!user) return "User";
    const name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return name || user.email || "User";
  };

  const getUserInitials = (user?: AdminUser) => {
    const name = getUserDisplayName(user);
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (name[0] || "U").toUpperCase();
  };

  // Preview only first 3 chips so it never clutters the UI
  const previewUserIds = selectedUserIds.slice(0, 3);
  const remainingCount = selectedUserIds.length - previewUserIds.length;

  return (
    <div className="space-y-2">
      {/* Popover Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            role="combobox"
            aria-expanded={open}
            aria-controls="user-multi-select-list"
            className={`w-full min-h-[44px] px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs bg-background ${
              open
                ? "border-[#649809] ring-2 ring-[#649809]/20 shadow-sm"
                : "border-border hover:border-border/80 hover:bg-muted/30"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0 py-0.5">
              {selectedUserIds.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4 text-muted-foreground/70 shrink-0" />
                  <span>Click to choose recipients from directory...</span>
                </div>
              ) : (
                <>
                  <Badge
                    variant="outline"
                    className="bg-[#649809]/10 text-[#649809] border-[#649809]/30 text-xs font-bold gap-1 px-2 py-0.5 shrink-0"
                  >
                    <UserCheck className="size-3" />
                    {selectedUserIds.length} Selected
                  </Badge>

                  {/* Clean preview chips */}
                  {previewUserIds.map((userId) => {
                    const user = userMap.get(userId);
                    const name = user ? getUserDisplayName(user) : "User";
                    const email = user?.email;
                    const identity = email ? `${name} — ${email}` : name;

                    return (
                      <span
                        key={userId}
                        title={identity}
                        aria-label={`Selected recipient: ${identity}`}
                        className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md border border-border/80 bg-muted px-2 py-1 text-[11px] text-foreground"
                      >
                        <span className="max-w-[130px] truncate font-medium">{name}</span>

                        {email ? (
                          <span
                            title={email}
                            className="max-w-[180px] truncate text-muted-foreground"
                          >
                            {email}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">ID: {userId.slice(-6)}</span>
                        )}

                        <button
                          type="button"
                          aria-label={`Remove ${identity}`}
                          title={`Remove ${identity}`}
                          onClick={(e) => removeUser(userId, e)}
                          className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-rose-500 cursor-pointer"
                        >
                          <X className="size-2.5" />
                        </button>
                      </span>
                    );
                  })}

                  {remainingCount > 0 && (
                    <span className="text-[11px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60">
                      +{remainingCount} more
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
              {selectedUserIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="hover:text-rose-500 p-1 rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
                  title="Clear all"
                >
                  <X className="size-3.5" />
                </button>
              )}
              <ChevronsUpDown className="size-4 text-muted-foreground/70" />
            </div>
          </div>
        </PopoverTrigger>

        {/* Dropdown Content */}
        <PopoverContent
          id="user-multi-select-list"
          align="start"
          sideOffset={5}
          className="w-[var(--radix-popover-trigger-width)] min-w-[340px] max-w-[480px] p-0 shadow-lg border-border bg-card rounded-xl overflow-hidden"
        >
          {/* Search Header inside Dropdown */}
          <div className="p-2.5 border-b border-border bg-muted/30 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={handleInputChange}
                className="pl-8 pr-8 text-xs h-8 bg-background border-border"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center justify-between text-xs px-1 pt-0.5">
              <span className="text-muted-foreground text-[11px]">
                {selectedUserIds.length} user{selectedUserIds.length !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                {users.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllVisible}
                    className="text-[11px] font-semibold text-[#649809] hover:underline cursor-pointer"
                  >
                    Select All Visible
                  </button>
                )}
                {selectedUserIds.length > 0 && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <button
                      type="button"
                      onClick={() => handleClearAll()}
                      className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-border/50">
            {isLoading ? (
              <div className="p-3 space-y-2">
                <Skeleton className="h-8 w-full rounded" />
                <Skeleton className="h-8 w-full rounded" />
                <Skeleton className="h-8 w-full rounded" />
              </div>
            ) : users.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No users found matching &quot;{debouncedSearch}&quot;
              </div>
            ) : (
              users.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                const displayName = getUserDisplayName(user);
                const initials = getUserInitials(user);

                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={`flex items-center justify-between px-3 py-2.5 text-xs transition-colors cursor-pointer select-none ${
                      isSelected
                        ? "bg-[#649809]/10"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {/* Avatar Circle */}
                      <div
                        className={`size-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border transition-colors ${
                          isSelected
                            ? "bg-[#649809] text-white border-[#649809]"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`truncate text-xs ${
                            isSelected ? "font-bold text-foreground" : "font-medium text-foreground"
                          }`}
                        >
                          {displayName}
                        </p>
                        {user.email && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div
                      className={`size-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? "bg-[#649809] border-[#649809] text-white"
                          : "border-muted-foreground/40 bg-background"
                      }`}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-2 border-t border-border bg-muted/20 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Total {users.length} users in directory
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-7 text-xs px-3 bg-[#649809] hover:bg-[#649809]/90 text-white cursor-pointer"
            >
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
