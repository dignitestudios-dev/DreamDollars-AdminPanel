"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminUser } from "@/lib/api/users.api";
import {
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  Copy,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

interface UserDetailsDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  if (!user) return null;

  const displayName =
    user.name ||
    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
    user.email.split("@")[0];

  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formattedDate = user.joinedDate
    ? new Date(user.joinedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">User Profile</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Complete account and subscription information
          </DialogDescription>
        </DialogHeader>

        {/* User Top Card */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-muted/40 border border-[#e1ebb0]/60">
          <Avatar className="h-14 w-14 rounded-xl border border-[#e1ebb0]">
            {user.profilePic && <AvatarImage src={user.profilePic} alt={displayName} />}
            <AvatarFallback className="bg-[#649809]/15 text-[#649809] font-bold text-base">
              {user.avatarEmoji || initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </h3>
              {user.isSubscribed && (
                <Badge className="bg-[#649809]/15 text-[#649809] border border-[#649809]/30 text-[10px] px-1.5 py-0 font-medium">
                  PRO
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge
                variant="outline"
                className={`text-[11px] capitalize ${
                  user.accountStatus === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {user.accountStatus || "unknown"}
              </Badge>
              {user.isSubscribed ? (
                <Badge className="bg-[#649809] text-white text-[11px]">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[11px]">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Detail List */}
        <div className="space-y-3 py-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
            <span className="text-muted-foreground flex items-center gap-2">
              <Mail className="size-3.5 text-[#649809]" /> Email
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                title={user.email}
                className="font-medium text-gray-900 dark:text-gray-200 truncate max-w-[200px]"
              >
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-gray-900 shrink-0"
                onClick={() => copyToClipboard(user.email, "Email")}
                title="Copy email"
                aria-label="Copy email address"
              >
                <Copy className="size-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
            <span className="text-muted-foreground flex items-center gap-2">
              <Sparkles className="size-3.5 text-[#649809]" /> Subscription
            </span>
            <span className="font-medium">
              {user.isSubscribed ? (
                <span className="text-[#649809] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Active
                </span>
              ) : (
                <span className="text-muted-foreground">Inactive</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
            <span className="text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="size-3.5 text-[#649809]" /> Email Verified
            </span>
            <span className="font-medium">
              {user.isEmailVerified ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Verified
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-1">
                  <XCircle className="size-3.5" /> Not Verified
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
            <span className="text-muted-foreground flex items-center gap-2">
              <UserCheck className="size-3.5 text-[#649809]" /> Profile Completion
            </span>
            <span className="font-medium">
              {user.isProfileCompleted ? (
                <span className="text-emerald-600">Completed</span>
              ) : (
                <span className="text-muted-foreground">Incomplete</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="size-3.5 text-[#649809]" /> Joined Date
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-200">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card">
            <span className="text-muted-foreground">User ID</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[170px]">
                {user.id}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-gray-900"
                onClick={() => copyToClipboard(user.id, "User ID")}
                title="Copy ID"
              >
                <Copy className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
