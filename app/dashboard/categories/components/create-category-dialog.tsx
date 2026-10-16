"use client";

import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAdminCategory, CategoryType } from "@/lib/api/categories.api";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#649809", // Dream Dollar Green
  "#10B981", // Emerald
  "#F97316", // Orange
  "#EF4444", // Red
  "#EC4899", // Pink
  "#8B5CF6", // Purple
  "#3B82F6", // Blue
  "#14B8A6", // Teal
  "#EAB308", // Yellow
  "#6366F1", // Indigo
  "#06B6D4", // Cyan
  "#64748B", // Slate
];

interface CreateCategoryDialogProps {
  onSuccess?: () => void;
}

export function CreateCategoryDialog({ onSuccess }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("expense");
  const [colorCode, setColorCode] = useState("#649809");
  const isSubmittingRef = useRef(false);

  const queryClient = useQueryClient();

  const resetForm = () => {
    setName("");
    setType("expense");
    setColorCode("#649809");
  };

  const mutation = useMutation({
    mutationFn: createAdminCategory,
    onSuccess: () => {
      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      queryClient.invalidateQueries({ queryKey: ["adminCategoryStats"] });
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create category");
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    setOpen(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || mutation.isPending) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Category name is required");
      return;
    }

    isSubmittingRef.current = true;
    mutation.mutate({
      name: trimmedName,
      type,
      color_code: colorCode,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-[#649809] hover:bg-[#527d07] text-white cursor-pointer h-9 px-3.5 text-xs shadow-xs gap-1.5 font-medium">
          <Plus className="size-4" />
          <span>Add Category</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Tag className="size-4 text-[#649809] shrink-0" />
            <span>Add New Category</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create a standard category for transactions and financial tracking
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Category Name */}
          <div className="space-y-1.5">
            <Label htmlFor="category-name" className="text-xs font-medium">
              Category Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="category-name"
              placeholder="e.g. Dining Out, Salary, Investments"
              value={name}
              maxLength={50}
              onChange={(e) => setName(e.target.value)}
              disabled={mutation.isPending}
              className="h-9 text-xs"
            />
          </div>

          {/* Category Type (Fixed 4 Types) */}
          <div className="space-y-1.5">
            <Label htmlFor="category-type" className="text-xs font-medium">
              Category Type <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={type}
              disabled={mutation.isPending}
              onValueChange={(val) => setType(val as CategoryType)}
            >
              <SelectTrigger id="category-type" className="h-9 text-xs cursor-pointer w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="insight">Insight</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color Code Picker */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center justify-between">
              <span>Color Accent</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {colorCode}
              </span>
            </Label>
            {/* Color Swatches */}
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Select color ${c}`}
                  disabled={mutation.isPending}
                  onClick={() => setColorCode(c)}
                  className={`size-6 rounded-full transition-transform cursor-pointer border ${
                    colorCode.toLowerCase() === c.toLowerCase()
                      ? "ring-2 ring-offset-2 ring-[#649809] scale-110 border-white"
                      : "border-black/10 hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            {/* Custom Hex input */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="color"
                aria-label="Color picker"
                value={colorCode}
                disabled={mutation.isPending}
                onChange={(e) => setColorCode(e.target.value)}
                className="size-8 rounded border border-border p-0.5 cursor-pointer bg-white shrink-0"
              />
              <Input
                type="text"
                value={colorCode}
                maxLength={7}
                disabled={mutation.isPending}
                onChange={(e) => setColorCode(e.target.value)}
                placeholder="#649809"
                className="h-8 font-mono text-xs max-w-[120px]"
              />
            </div>
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={mutation.isPending}
              onClick={() => handleOpenChange(false)}
              className="cursor-pointer h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={mutation.isPending || !name.trim()}
              className="bg-[#649809] hover:bg-[#527d07] text-white cursor-pointer h-8 text-xs font-medium shadow-xs"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Save Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
