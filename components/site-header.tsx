"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { MessageCircle } from "lucide-react";
import { useChatNotifications } from "@/context/chat-notification-context";
import Link from "next/link";

export function SiteHeader() {
  const { totalUnreadCount } = useChatNotifications();

  return (
    <>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 py-3 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              asChild
              size="sm"
              className="relative inline-flex items-center gap-1.5"
            >
              <Link href="/dashboard/chat">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Chat</span>
                {totalUnreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button
              variant="ghost"
              asChild
              size="sm"
              className="hidden sm:flex"
            >
              <Link href="/dashboard">
                Overview
              </Link>
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}
