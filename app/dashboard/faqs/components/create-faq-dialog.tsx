"use client";

import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAdminFaq } from "@/lib/api/faqs.api";
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
import { Plus, Loader2, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface CreateFaqDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateFaqDialog({ onSuccess, trigger }: CreateFaqDialogProps) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const isSubmittingRef = useRef(false);

  const queryClient = useQueryClient();

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
  };

  const mutation = useMutation({
    mutationFn: createAdminFaq,
    onSuccess: (data) => {
      toast.success(data?.message || "FAQ created successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminFaqs"] });
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to create FAQ. Please try again."
      );
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

    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();

    if (!trimmedQuestion) {
      toast.error("Please enter a question");
      return;
    }
    if (!trimmedAnswer) {
      toast.error("Please enter an answer");
      return;
    }

    isSubmittingRef.current = true;
    mutation.mutate({
      question: trimmedQuestion,
      answer: trimmedAnswer,
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
            Add New FAQ
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[#649809]/10 border border-[#649809]/20 flex items-center justify-center text-[#649809] shrink-0">
              <HelpCircle className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Add Frequently Asked Question</DialogTitle>
              <DialogDescription className="text-xs">
                Create a new help center FAQ to assist app users with common questions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Question */}
          <div className="space-y-1.5">
            <Label htmlFor="faq-question" className="text-xs font-semibold">
              Question <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="faq-question"
              placeholder="e.g., How is my Net Worth calculated?"
              value={question}
              maxLength={200}
              disabled={mutation.isPending}
              onChange={(e) => setQuestion(e.target.value)}
              className="text-xs"
            />
          </div>

          {/* Answer */}
          <div className="space-y-1.5">
            <Label htmlFor="faq-answer" className="text-xs font-semibold">
              Answer <span className="text-rose-500">*</span>
            </Label>
          <Textarea
  id="faq-answer"
  placeholder="e.g., Assets + savings buckets + goal balances + portfolio value – total debt. It recalculates the moment any of those changes."
  value={answer}
  maxLength={2000}
  disabled={mutation.isPending}
  onChange={(e) => setAnswer(e.target.value)}
  rows={5}
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
              disabled={mutation.isPending || !question.trim() || !answer.trim()}
              className="bg-[#649809] hover:bg-[#649809]/90 text-white text-xs cursor-pointer"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 size-3.5" />
                  Create FAQ
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
