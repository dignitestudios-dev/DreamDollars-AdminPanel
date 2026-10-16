"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ChatNotificationProvider } from "@/context/chat-notification-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { config } = useSidebarConfig();

  return (
    <ProtectedRoute>
      <ChatNotificationProvider>
        <SidebarProvider
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-icon": "3rem",
            "--header-height": "calc(var(--spacing) * 14)",
          } as React.CSSProperties
        }
        className={config.collapsible === "none" ? "sidebar-none-mode" : ""}
      >
        {config.side === "left" ? (
          <>
            <AppSidebar
              variant={config.variant}
              collapsible={config.collapsible}
              side={config.side}
            />
            <SidebarInset>
              <SiteHeader />
              <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
                    <React.Suspense fallback={null}>
                      {children}
                    </React.Suspense>
                  </div>
                </div>
              </div>
            </SidebarInset>
          </>
        ) : (
          <>
            <SidebarInset>
              <SiteHeader />
              <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                  <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                    <React.Suspense fallback={null}>
                      {children}
                    </React.Suspense>
                  </div>
                </div>
              </div>
            </SidebarInset>
            <AppSidebar
              variant={config.variant}
              collapsible={config.collapsible}
              side={config.side}
            />
          </>
        )}
      </SidebarProvider>
      </ChatNotificationProvider>
    </ProtectedRoute>
  );
}
