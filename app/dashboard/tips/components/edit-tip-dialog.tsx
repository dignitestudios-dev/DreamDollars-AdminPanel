"use client";

import React, { useState, useEffect } from "react";
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
import { Loader2, Edit, Save, Lightbulb } from "lucide-react";
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
    if (
      !newOpen &&
      tip &&
      (title !== (tip.title || "") ||
        description !== (tip.description || "") ||
        dayOfWeek !== (tip.day_of_week?.toLowerCase() || "monday") ||
        status !== (tip.status?.toLowerCase() || "active")) &&
      !mutation.isPending
    ) {
      if (
        !window.confirm(
          "You have unsaved tip changes. Are you sure you want to discard them?"
        )
      ) {
        return;
      }
    }
    onOpenChange(newOpen);
  };

  useEffect(() => {
    if (tip) {
      setTitle(tip.title || "");
      setDescription(tip.description || "");
      setDayOfWeek((tip.day_of_week?.toLowerCase() || "monday") as DayOfWeek);
      setStatus((tip.status?.toLowerCase() || "active") as TipStatus);
    }
  }, [tip]);

  const mutation = useMutation({
    mutationFn: (payload: {
      title: string;
      description: string;
      day_of_week: DayOfWeek;
      status: TipStatus;
    }) => updateAdminTip(tip!.id, payload),
    onSuccess: (data) => {
      isSubmittingRef.current = false;
      toast.success(data?.message || "Tip updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminTips"] });
      if (tip?.id) {
        queryClient.invalidateQueries({ queryKey: ["adminTip", tip.id] });
      }
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      isSubmittingRef.current = false;
      toast.error(
        err?.response?.data?.message || "Failed to update tip. Please try again."
      );
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
      <DialogContent className="sm:max-w-[540px]">
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

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
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
              className="text-xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
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
              className="text-xs resize-none"
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
