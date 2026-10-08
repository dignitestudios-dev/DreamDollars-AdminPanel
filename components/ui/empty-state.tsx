"use client";

import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 min-w-0 max-w-full",
        className
      )}
    >
      <div className="size-12 rounded-2xl bg-[#649809]/10 border border-[#649809]/20 flex items-center justify-center text-[#649809] mb-3 shrink-0 shadow-xs">
        <Icon className="size-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground tracking-tight max-w-md break-words">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-sm break-words leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
