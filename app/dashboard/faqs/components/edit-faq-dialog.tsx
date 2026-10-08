"use client";

import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAdminFaq, AdminFaq } from "@/lib/api/faqs.api";
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
import { Edit, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface EditFaqDialogProps {
  faq: AdminFaq | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditFaqDialog({
  faq,
  open,
  onOpenChange,
  onSuccess,
}: EditFaqDialogProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const isSubmittingRef = useRef(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (faq) {
      setQuestion(faq.question || "");
      setAnswer(faq.answer || "");
    }
  }, [faq, open]);

  const isDirty = Boolean(
    faq && (question !== (faq.question || "") || answer !== (faq.answer || ""))
  );

  const mutation = useMutation({
    mutationFn: (payload: { question: string; answer: string }) =>
      updateAdminFaq(faq!.id, payload),
    onSuccess: (data) => {
      toast.success(data?.message || "FAQ updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["adminFaqs"] });
      if (faq?.id) {
        queryClient.invalidateQueries({ queryKey: ["adminFaq", faq.id] });
      }
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to update FAQ. Please try again."
      );
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isDirty) {
      const confirmDiscard = window.confirm("You have unsaved changes. Discard them?");
      if (!confirmDiscard) return;
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || mutation.isPending) return;
    if (!faq) return;

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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[#649809]/10 border border-[#649809]/20 flex items-center justify-center text-[#649809] shrink-0">
              <Edit className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Edit FAQ</DialogTitle>
              <DialogDescription className="text-xs">
                Update the question or answer text displayed to users.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Question */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-faq-question" className="text-xs font-semibold">
              Question <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="edit-faq-question"
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
            <Label htmlFor="edit-faq-answer" className="text-xs font-semibold">
              Answer <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="edit-faq-answer"
              placeholder="e.g., Assets + savings buckets + goal balances..."
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
