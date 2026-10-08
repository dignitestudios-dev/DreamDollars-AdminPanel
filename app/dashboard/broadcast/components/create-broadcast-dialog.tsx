"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sendBroadcastNotification,
  BroadcastTargetType,
  BroadcastRecord,
} from "@/lib/api/notifications.api";
import { UserMultiSelect } from "./user-multi-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Send,
  Loader2,
  Megaphone,
  Users,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface CreateBroadcastDialogProps {
  onSuccess?: (broadcast?: BroadcastRecord, totalRecipients?: number) => void;
  trigger?: React.ReactNode;
}

export function CreateBroadcastDialog({
  onSuccess,
  trigger,
}: CreateBroadcastDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState<BroadcastTargetType>("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const isSubmittingRef = React.useRef(false);

  const queryClient = useQueryClient();

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && (title.trim() || message.trim()) && !mutation.isPending) {
      if (!window.confirm("You have unsaved broadcast changes. Are you sure you want to discard them?")) {
        return;
      }
    }
    setOpen(newOpen);
  };

  const mutation = useMutation({
    mutationFn: sendBroadcastNotification,
    onSuccess: (res) => {
      isSubmittingRef.current = false;
      const recipientCount = res?.data?.totalRecipients || 0;
      toast.success(
        res?.message || `Broadcast notification sent to ${recipientCount} user(s)!`
      );
      queryClient.invalidateQueries({ queryKey: ["broadcastNotifications"] });

      setOpen(false);
      setTitle("");
      setMessage("");
      setSelectedUserIds([]);
      setTargetType("all");

      onSuccess?.(res?.data?.broadcast, recipientCount);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            size="sm"
            className="bg-[#649809] hover:bg-[#649809]/90 text-white cursor-pointer shadow-sm text-xs"
          >
            <Plus className="mr-1.5 size-4" />
            Send Broadcast
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[#649809]/10 border border-[#649809]/20 flex items-center justify-center text-[#649809]">
              <Megaphone className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Compose Push Broadcast</DialogTitle>
              <DialogDescription className="text-xs">
                Send instant push notifications to all users or specific individuals.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Target Audience Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Target Audience</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType("all")}
                disabled={mutation.isPending}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  targetType === "all"
                    ? "border-[#649809] bg-[#649809]/10 text-foreground shadow-sm"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <div
                  className={`size-6 rounded-md flex items-center justify-center shrink-0 border ${
                    targetType === "all"
                      ? "bg-[#649809] text-white border-[#649809]"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  <Users className="size-3" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-foreground">All Users</span>
                    {targetType === "all" && (
                      <CheckCircle2 className="size-3 text-[#649809]" />
                    )}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType("specific")}
                disabled={mutation.isPending}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                  targetType === "specific"
                    ? "border-[#649809] bg-[#649809]/10 text-foreground shadow-sm"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                }`}
              >
                <div
                  className={`size-6 rounded-md flex items-center justify-center shrink-0 border ${
                    targetType === "specific"
                      ? "bg-[#649809] text-white border-[#649809]"
                      : "bg-muted border-border text-muted-foreground"
                  }`}
                >
                  <UserCheck className="size-3" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-foreground">Specific Users</span>
                    {targetType === "specific" && (
                      <CheckCircle2 className="size-3 text-[#649809]" />
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* User Multi Select Dropdown (Visible only when Specific Users is selected) */}
          {targetType === "specific" && (
            <div className="space-y-1.5">
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
                className="h-[130px] min-h-[130px] max-h-[130px] resize-none text-xs leading-relaxed whitespace-pre-wrap break-words overflow-y-auto"

            />
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={mutation.isPending}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending}
              className="bg-[#649809] hover:bg-[#649809]/90 text-white text-xs cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 size-3.5" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
