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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isSubmittingRef = React.useRef(false);

  const queryClient = useQueryClient();

  const handleOpenChange = (newOpen: boolean) => {
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

    // Submitting the form only validates and asks for explicit confirmation.
    // It must never dispatch a broadcast directly (including via Enter).
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

    // Open the in-app confirmation dialog instead of using a browser alert.
    setConfirmOpen(true);
  };

  const confirmBroadcast = () => {
    if (isSubmittingRef.current || mutation.isPending) return;

    isSubmittingRef.current = true;
    setConfirmOpen(false);
    mutation.mutate({
      title: title.trim(),
      message: message.trim(),
      targetType,
      targetUserIds: selectedUserIds,
      userIds: selectedUserIds,
    });
  };

  return (
    <>
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
      <DialogContent className="w-[calc(100%-2rem)] max-w-[560px] min-w-0 max-h-[90vh] overflow-x-hidden overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-4 py-2">
          {/* Target Audience Selector */}
          <div className="w-full min-w-0 space-y-1.5">
            <Label className="block max-w-full break-words text-xs font-semibold">Target Audience</Label>
            <div className="grid w-full min-w-0 grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetType("all")}
                disabled={mutation.isPending}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${targetType === "all"
                    ? "border-[#649809] bg-[#649809]/10 text-foreground shadow-sm"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
              >
                <div
                  className={`size-6 rounded-md flex items-center justify-center shrink-0 border ${targetType === "all"
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
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2.5 ${targetType === "specific"
                    ? "border-[#649809] bg-[#649809]/10 text-foreground shadow-sm"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                  }`}
              >
                <div
                  className={`size-6 rounded-md flex items-center justify-center shrink-0 border ${targetType === "specific"
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
          <div className="w-full min-w-0 space-y-1.5">
            <Label htmlFor="broadcast-title" className="block max-w-full break-words text-xs font-semibold">
              Notification Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="broadcast-title"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  // Do not allow Enter in the title field to submit a broadcast.
                  e.preventDefault();
                }
              }}
              placeholder="e.g., Special Holiday Update"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={mutation.isPending}
              maxLength={100}
              className="w-full min-w-0 text-xs"
            />
          </div>

          {/* Message Content */}
          <div className="w-full min-w-0 space-y-1.5">
            <Label htmlFor="broadcast-message" className="block max-w-full break-words text-xs font-semibold">
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
              className="block h-[130px] min-h-[130px] max-h-[130px] w-full min-w-0 max-w-full resize-none text-xs leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap break-words overflow-x-hidden overflow-y-auto"

            />
          </div>

          <DialogFooter className="flex w-full min-w-0 flex-wrap gap-2 pt-3 sm:justify-end">
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[560px] min-w-0 max-h-[85vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="size-4 text-[#649809]" />
              Confirm Broadcast
            </DialogTitle>
            <DialogDescription>
              Review the notification details before sending.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full min-w-0 space-y-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Notification Title</p>
              <p className="max-w-full min-w-0 font-semibold text-foreground [overflow-wrap:anywhere] break-words">{title.trim()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Message</p>
              <p className="max-w-full min-w-0 whitespace-pre-wrap text-foreground [overflow-wrap:anywhere] break-words">{message.trim()}</p>
            </div>
           
          </div>

          {targetType === "all" && (
            <p className="text-xs text-amber-700">
              This notification will be sent to all eligible users.
            </p>
          )}

          <DialogFooter className="flex w-full min-w-0 flex-wrap gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmBroadcast}
              disabled={mutation.isPending}
              className="bg-[#649809] text-white hover:bg-[#649809]/90"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 size-4" />
                  Confirm & Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
