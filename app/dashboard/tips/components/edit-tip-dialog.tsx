"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAdminTip, AdminTip, DayOfWeek, TipStatus } from "@/lib/api/tips.api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Edit, Save } from "lucide-react";
import { toast } from "sonner";

const DAYS_OPTIONS: { value: DayOfWeek; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

interface EditTipDialogProps {
  tip: AdminTip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditTipDialog({
  tip,
  open,
  onOpenChange,
  onSuccess,
}: EditTipDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>("monday");
  const [status, setStatus] = useState<TipStatus>("active");
  const isSubmittingRef = React.useRef(false);

  const queryClient = useQueryClient();

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const [prevTipId, setPrevTipId] = useState<string | null>(null);

  if (tip && tip.id !== prevTipId) {
    setPrevTipId(tip.id);
    setTitle(tip.title || "");
    setDescription(tip.description || "");
    setDayOfWeek((tip.day_of_week?.toLowerCase() || "monday") as DayOfWeek);
    setStatus((tip.status?.toLowerCase() || "active") as TipStatus);
  }

  const mutation = useMutation({
    mutationFn: (payload: {
      title: string;
      description: string;
      day_of_week: DayOfWeek;
      status: TipStatus;
    }) => updateAdminTip(tip!.id, payload),
    onSuccess: async (data) => {
      isSubmittingRef.current = false;
      toast.success(data?.message || "Tip updated successfully!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["adminTips"] }),
        queryClient.invalidateQueries({ queryKey: ["adminTipsTotalCount"] }),
      ]);
      if (tip?.id) {
        queryClient.invalidateQueries({ queryKey: ["adminTip", tip.id] });
      }
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: unknown) => {
      isSubmittingRef.current = false;
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update tip. Please try again.";
      toast.error(errorMsg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || mutation.isPending) return;

    if (!tip) return;
    if (!title.trim()) {
      toast.error("Please enter a tip title");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a tip description");
      return;
    }

    isSubmittingRef.current = true;
    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      day_of_week: dayOfWeek,
      status: status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[540px] min-w-0 overflow-x-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[#649809]/10 border border-[#649809]/20 flex items-center justify-center text-[#649809]">
              <Edit className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Edit Financial Tip</DialogTitle>
              <DialogDescription className="text-xs">
                Update the message, scheduled delivery day, or visibility status.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}   className="w-full min-w-0 space-y-4 overflow-x-hidden py-2 px-2"
>
          {/* Title */}
          <div className="min-w-0 w-full space-y-1.5">
            <Label htmlFor="edit-tip-title" className="text-xs font-semibold">
              Tip Title <span className="text-rose-500">*</span>
            </Label>

            <Input
              id="edit-tip-title"
              placeholder="e.g., Save on Subscriptions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={mutation.isPending}
              maxLength={150}
              className="w-full min-w-0 max-w-full text-xs"
            />
          </div>
          {/* Description */}
          {/* Description */}
          <div className="min-w-0 w-full space-y-1.5">
            <Label htmlFor="edit-tip-desc" className="text-xs font-semibold">
              Tip Description / Advice <span className="text-rose-500">*</span>
            </Label>

            <Textarea
              id="edit-tip-desc"
              placeholder="e.g., Audit recurring subscriptions every quarter to cancel unused services."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={mutation.isPending}
              maxLength={1500}
              rows={4}
              wrap="soft"
              className="!block !w-full !min-w-0 !max-w-full !h-[130px] !min-h-[130px] !max-h-[130px] resize-none whitespace-pre-wrap [overflow-wrap:anywhere] break-all overflow-x-hidden overflow-y-auto text-xs leading-relaxed"
            />
          </div>

          {/* Day of Week & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-tip-day" className="text-xs font-semibold">
                Broadcast Day <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={dayOfWeek}
                onValueChange={(val) => setDayOfWeek(val as DayOfWeek)}
                disabled={mutation.isPending}
              >
                <SelectTrigger id="edit-tip-day" className="text-xs capitalize">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs capitalize"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-tip-status" className="text-xs font-semibold">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as TipStatus)}
                disabled={mutation.isPending}
              >
                <SelectTrigger id="edit-tip-status" className="text-xs">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                      Active
                    </span>
                  </SelectItem>
                  <SelectItem value="inactive" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-gray-400 inline-block" />
                      Inactive
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-1.5 size-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
