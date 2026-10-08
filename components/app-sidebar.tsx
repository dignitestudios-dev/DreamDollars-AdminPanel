"use client";

import * as React from "react";
import {
  LayoutPanelLeft,
  LayoutDashboard,
  Mail,
  CheckSquare,
  MessageCircle,
  Calendar,
  Shield,
  AlertTriangle,
  Settings,
  HelpCircle,
  CreditCard,
  LayoutTemplate,
  Users,
  BarChart3,
  Zap,
  Tag,
  Sparkles,
  Lightbulb,
  Megaphone,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Next js",
    email: "admin@example.com",
    avatar: "",
  },
  navGroups: [
    {
      label: "Dashboards",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "Management",
      items: [
        {
          title: "Users",
          url: "/dashboard/users",
          icon: Users,
        },
        {
          title: "Categories",
          url: "/dashboard/categories",
          icon: Tag,
        },
        {
          title: "Insights",
          url: "/dashboard/insights",
          icon: Sparkles,
        },
        {
          title: "Tips",
          url: "/dashboard/tips",
          icon: Lightbulb,
        },
        {
          title: "FAQs",
          url: "/dashboard/faqs",
          icon: HelpCircle,
        },
        {
          title: "Broadcasts",
          url: "/dashboard/broadcast",
          icon: Megaphone,
        },
        {
          title: "Support Chat",
          url: "/dashboard/chat",
          icon: MessageCircle,
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          title: "Profile",
          url: "/dashboard/profile",
          icon: Users,
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSelector((state: RootState) => state.auth.user);

  const userData = user
    ? {
      name: user.name,
      email: user.email,
      avatar: "",
    }
    : {
      name: "Guest",
      email: "",
      avatar: "",
    };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-white p-1 shadow-xs border border-sidebar-border">
                  <Logo size={28} alt="Dream Dollar" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-foreground">Dream Dollar</span>
                  <span className="truncate text-xs text-muted-foreground">Admin Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
