"use client";

import {
  CreditCard,
  EllipsisVertical,
  LogOut,
  BellDot,
  CircleUser,
} from "lucide-react";
import Link from "next/link";
import { useDispatch } from 'react-redux';
import { logout } from '@/lib/slices/authSlice';
import { useRouter } from 'next/navigation';
import { adminLogout, getAdminProfile } from '@/lib/api/auth.api';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useEffect, useMemo, useState } from "react";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const dispatch = useDispatch();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);

  const { data: profileResponse } = useQuery({
    queryKey: ["adminProfile"],
    queryFn: getAdminProfile,
  });

  const profile = profileResponse?.data;
  const displayName = profile?.name || user.name;
  const displayEmail = profile?.email || user.email;

  const avatarUrl = useMemo(() => {
    const raw = profile?.profilePicture || user.avatar;
    if (!raw) return "";
    if (raw.startsWith("blob:") || raw.startsWith("data:")) return raw;
    const v = profile?.updatedAt ? new Date(profile.updatedAt).getTime() : Date.now();
    return `${raw}${raw.includes("?") ? "&" : "?"}v=${v}`;
  }, [profile?.profilePicture, profile?.updatedAt, user.avatar]);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {
      // Ignored - cleanup handled in adminLogout
    } finally {
      dispatch(logout());
      toast.success('Logged out successfully');
      router.push('/auth/login');
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-primary/10 text-primary shrink-0">
                {avatarUrl && !imageError ? (
                  <img
                    key={`sidebar-${avatarUrl}`}
                    src={avatarUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <CircleUser className="size-5" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {displayEmail}
                </span>
              </div>
              <EllipsisVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden bg-primary/10 text-primary shrink-0">
                  {avatarUrl && !imageError ? (
                    <img
                      key={`dropdown-${avatarUrl}`}
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <CircleUser className="size-5" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {displayEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/profile">
                  <CircleUser />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/broadcast">
                  <BellDot />
                  Broadcasts
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
