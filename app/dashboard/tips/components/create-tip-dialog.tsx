"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAdminTip, DayOfWeek, TipStatus } from "@/lib/api/tips.api";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Lightbulb } from "lucide-react";
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

interface CreateTipDialogProps {
  defaultDay?: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateTipDialog({
  defaultDay,
  onSuccess,
  trigger,
}: CreateTipDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(
    (defaultDay && defaultDay !== "all" ? defaultDay : "monday") as DayOfWeek
  );
  const [status, setStatus] = useState<TipStatus>("active");
  const isSubmittingRef = React.useRef(false);

  const queryClient = useQueryClient();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) resetForm();
  };

  const mutation = useMutation({
    mutationFn: createAdminTip,
    onSuccess: async (data) => {
      isSubmittingRef.current = false;
      toast.success(data?.message || "Tip created successfully!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["adminTips"] }),
        queryClient.invalidateQueries({ queryKey: ["adminTipsTotalCount"] }),
      ]);
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (err: unknown) => {
      isSubmittingRef.current = false;
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create tip. Please try again.";
      toast.error(errorMsg);
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDayOfWeek((defaultDay && defaultDay !== "all" ? defaultDay : "monday") as DayOfWeek);
    setStatus("active");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || mutation.isPending) return;

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
      <DialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            size="sm"
            className="bg-[#649809] hover:bg-[#649809]/90 text-white cursor-pointer shadow-sm"
          >
            <Plus className="mr-1.5 size-4" />
            Add New Tip
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[#649809]/10 border border-[#649809]/20 flex items-center justify-center text-[#649809]">
              <Lightbulb className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Add Daily Financial Tip</DialogTitle>
              <DialogDescription className="text-xs">
                Schedule a new smart tip to be broadcasted to users on their scheduled day.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="tip-title" className="text-xs font-semibold">
              Tip Title <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="tip-title"
              placeholder="e.g., Save on Subscriptions"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={mutation.isPending}
              maxLength={150}
              className="text-xs"
            />
          </div>

          {/* Description */}

          <div className="w-full min-w-0 max-w-full space-y-1.5 overflow-hidden">
            <Label htmlFor="tip-desc" className="text-xs font-semibold">
              Tip Description / Advice <span className="text-rose-500">*</span>
            </Label>

            <Textarea
              id="tip-desc"
              placeholder="e.g., Audit recurring subscriptions every quarter to cancel unused services."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={mutation.isPending}
              maxLength={1500}
              rows={4}
              className="!block !w-full !min-w-0 !max-w-full !h-[130px] !min-h-[130px] !max-h-[130px] resize-none text-xs leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] break-all overflow-x-hidden overflow-y-auto"
            />

            <p className="text-[11px] text-muted-foreground">
              Provide clear, actionable, high-value financial guidance for app users.
            </p>
          </div>


          {/* Day of Week & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* Broadcast Day */}
            <div className="grid gap-1.5 min-w-0">
              <Label
                htmlFor="tip-day"
                className="h-4 text-xs font-semibold leading-4"
              >
                Broadcast Day <span className="text-rose-500">*</span>
              </Label>

              <Select
                value={dayOfWeek}
                onValueChange={(val) => setDayOfWeek(val as DayOfWeek)}
                disabled={mutation.isPending}
              >
                <SelectTrigger
                  id="tip-day"
                  className="h-10 w-full text-xs capitalize"
                >
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

            {/* Status */}
            <div className="grid gap-1.5 min-w-0">
              <Label
                htmlFor="tip-status"
                className="h-4 text-xs font-semibold leading-4"
              >
                Status
              </Label>

              <Select
                value={status}
                onValueChange={(val) => setStatus(val as TipStatus)}
                disabled={mutation.isPending}
              >
                <SelectTrigger
                  id="tip-status"
                  className="h-10 w-full text-xs"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="active" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      Active
                    </span>
                  </SelectItem>

                  <SelectItem value="inactive" className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-gray-400 shrink-0" />
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
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 size-3.5" />
                  Create Tip
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
