"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sendBroadcastNotification,
  BroadcastTargetType,
  BroadcastRecord,
} from "@/lib/api/notifications.api";
import { UserMultiSelect } from "./user-multi-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone,
  Users,
  UserCheck,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface BroadcastFormProps {
  onBroadcastSent?: (broadcast: BroadcastRecord, recipients: number) => void;
}

export function BroadcastForm({ onBroadcastSent }: BroadcastFormProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<BroadcastTargetType>("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const isSubmittingRef = React.useRef(false);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: sendBroadcastNotification,
    onSuccess: (res) => {
      isSubmittingRef.current = false;
      const recipientCount = res?.data?.totalRecipients || 0;
      toast.success(
        res?.message || `Broadcast notification sent to ${recipientCount} user(s)!`
      );
      queryClient.invalidateQueries({ queryKey: ["broadcastNotifications"] });

      if (res?.data?.broadcast) {
        onBroadcastSent?.(res.data.broadcast, recipientCount);
      }

      // Reset form
      setTitle("");
      setMessage("");
      setSelectedUserIds([]);
    },
    onError: (err: any) => {
      isSubmittingRef.current = false;
      toast.error(
        err?.response?.data?.message || "Failed to send broadcast notification"
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || mutation.isPending) return;

    if (!title.trim()) {
      toast.error("Please enter a notification title");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter a notification message");
      return;
    }
    if (targetType === "specific" && selectedUserIds.length === 0) {
      toast.error("Please select at least one recipient user");
      return;
    }

    isSubmittingRef.current = true;
    mutation.mutate({
      title: title.trim(),
      message: message.trim(),
      targetType: targetType,
      targetUserIds: selectedUserIds,
      userIds: selectedUserIds,
    });
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-[#649809]/10 border border-[#649809]/20 flex items-center justify-center text-[#649809]">
            <Megaphone className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">Compose Push Broadcast</CardTitle>
            <CardDescription className="text-xs">
              Dispatch real-time push announcements to all members or selected users
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Audience Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Target Audience</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: All Users */}
              <button
                type="button"
                onClick={() => setTargetType("all")}
                disabled={mutation.isPending}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  targetType === "all"
                    ? "border-[#649809] bg-[#649809]/10 text-foreground shadow-sm"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <div
                  className={`size-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    targetType === "all"
                      ? "bg-[#649809] text-white border-[#649809]"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  <Users className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">All Users</span>
                    {targetType === "all" && (
                      <CheckCircle2 className="size-3.5 text-[#649809]" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Broadcast to every active user on the platform
                  </p>
                </div>
              </button>

              {/* Option 2: Specific Users */}
              <button
                type="button"
                onClick={() => setTargetType("specific")}
                disabled={mutation.isPending}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  targetType === "specific"
                    ? "border-[#649809] bg-[#649809]/10 text-foreground shadow-sm"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <div
                  className={`size-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    targetType === "specific"
                      ? "bg-[#649809] text-white border-[#649809]"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  <UserCheck className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">Specific Users</span>
                    {targetType === "specific" && (
                      <CheckCircle2 className="size-3.5 text-[#649809]" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Select multiple individual users from the directory
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* User Multi Select Dropdown (Visible only when Specific Users is selected) */}
          {targetType === "specific" && (
            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">
                Select Recipients <span className="text-rose-500">*</span>
              </Label>
              <UserMultiSelect
                selectedUserIds={selectedUserIds}
                onChange={setSelectedUserIds}
                disabled={mutation.isPending}
              />
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-title" className="text-xs font-semibold">
              Notification Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="broadcast-title"
              placeholder="e.g., Special Holiday Update"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={mutation.isPending}
              maxLength={100}
              className="text-xs"
            />
          </div>

          {/* Message Content */}
          <div className="space-y-1.5">
            <Label htmlFor="broadcast-message" className="text-xs font-semibold">
              Message Content <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="broadcast-message"
              placeholder="e.g., We have added new features to help you track your goals faster!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={mutation.isPending}
              maxLength={1000}
              rows={4}
              className="text-xs resize-none leading-relaxed"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {targetType === "all" ? (
                <span>Audience: <strong>All registered users</strong></span>
              ) : (
                <span>
                  Audience: <strong>{selectedUserIds.length}</strong> selected recipient{selectedUserIds.length !== 1 ? "s" : ""}
                </span>
              )}
            </span>

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-[#649809] hover:bg-[#649809]/90 text-white text-xs px-5 h-9 cursor-pointer shadow-sm"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Sending Broadcast...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 size-3.5" />
                  Send Broadcast
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
