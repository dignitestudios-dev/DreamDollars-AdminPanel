"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminFaqById, deleteAdminFaq } from "@/lib/api/faqs.api";
import { EditFaqDialog } from "../components/edit-faq-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export default function FaqDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch FAQ details by ID
  const {
    data: faqResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["adminFaq", id],
    queryFn: () => getAdminFaqById(id),
    enabled: Boolean(id),
  });

  const faq = faqResponse?.data;

  React.useEffect(() => {
    document.title = faq?.question
      ? `${faq.question} | Dream Dollar Admin`
      : "FAQ Details | Dream Dollar Admin";
  }, [faq?.question]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminFaq(id),
    onSuccess: (res) => {
      toast.success(res?.message || "FAQ deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["adminFaqs"] });
      router.push("/dashboard/faqs");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message || "Failed to delete FAQ. Please try again."
      );
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto w-full space-y-6 pb-12">
        <div className="flex items-center justify-between border-b pb-4 border-border">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !faq) {
    return (
      <div className="max-w-[1200px] mx-auto w-full py-12">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 dark:bg-rose-950/20 p-8 text-center max-w-lg mx-auto space-y-4">
          <div className="h-12 w-12 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            FAQ Not Found or Failed to Load
          </h2>
          <p className="text-xs text-muted-foreground">
            {(error as any)?.response?.data?.message ||
              "The FAQ could not be found or has been removed."}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs cursor-pointer"
            >
              <RefreshCw className="mr-1.5 size-3.5" />
              Retry
            </Button>
            <Link href="/dashboard/faqs">
              <Button size="sm" className="bg-[#649809] text-white text-xs cursor-pointer">
                <ArrowLeft className="mr-1.5 size-3.5" />
                Back to FAQs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-6 pb-12">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-border">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/faqs">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs cursor-pointer hover:bg-muted border-border"
            >
              <ArrowLeft className="size-3.5 mr-1.5" />
              Back to FAQs
            </Button>
          </Link>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              FAQ Details
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              View and manage this frequently asked question
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Edit Button */}
          <Button
            size="sm"
            onClick={() => setEditDialogOpen(true)}
            className="bg-[#649809] hover:bg-[#649809]/90 text-white text-xs cursor-pointer h-9 px-4"
          >
            <Edit className="size-3.5 mr-1.5" />
            Edit FAQ
          </Button>

          {/* Delete Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-xs h-9 px-3 cursor-pointer border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
          >
            <Trash2 className="size-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main FAQ Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#649809]/10 border border-[#649809]/20 flex items-center justify-center text-[#649809]">
              <HelpCircle className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Question & Answer</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Question */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Question
            </h3>
            <p className="text-lg font-bold text-foreground leading-snug break-words">
              {faq.question || "—"}
            </p>
          </div>

          {/* Answer */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Answer
            </h3>
            <div className="rounded-xl bg-muted/40 p-4 sm:p-5 border border-border text-sm leading-relaxed text-foreground whitespace-pre-line break-words">
              {faq.answer || "—"}
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-[#649809]" />
              <span>Created:</span>
              <span className="font-medium text-foreground">
                {formatDateTime(faq.created_at)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-[#649809]" />
              <span>Last Updated:</span>
              <span className="font-medium text-foreground">
                {formatDateTime(faq.updated_at)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditFaqDialog
        faq={faq}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => refetch()}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="size-5" />
              <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete this FAQ:{" "}
              <strong className="text-foreground">&quot;{faq.question}&quot;</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="text-xs cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs cursor-pointer"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete FAQ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
