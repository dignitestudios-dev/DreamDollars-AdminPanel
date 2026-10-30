  "use client";

  import React, { useState } from "react";
  import { useParams, useRouter } from "next/navigation";
  import Link from "next/link";
  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import {
    getAdminInsightById,
    deleteAdminInsight,
  } from "@/lib/api/insights.api";
  import { EditInsightDialog } from "../components/edit-insight-dialog";
  import { Button } from "@/components/ui/button";
  import { Badge } from "@/components/ui/badge";
  import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
  import {
    ArrowLeft,
    Edit,
    Trash2,
    Sparkles,
    Loader2,
    Video,
    Link2,
    ExternalLink,
    Layers,
    FileText,
    CheckCircle2,
    XCircle,
  } from "lucide-react";
  import { toast } from "sonner";

  export default function InsightDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // Fetch Insight Details
    const {
      data: insightResponse,
      isLoading,
      isError,
      error,
      refetch,
    } = useQuery({
      queryKey: ["adminInsight", id],
      queryFn: () => getAdminInsightById(id),
      enabled: Boolean(id),
    });

    const insight = insightResponse?.data;

    React.useEffect(() => {
      document.title = insight?.title
        ? `${insight.title} | Dream Dollar Admin`
        : "Insight Details | Dream Dollar Admin";
    }, [insight?.title]);

    // Delete Mutation
    const deleteMutation = useMutation({
      mutationFn: () => deleteAdminInsight(id),
      onSuccess: () => {
        toast.success("Insight deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["adminInsights"] });
        router.push("/dashboard/insights");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to delete insight");
      },
    });

    if (isLoading) {
      return (
        <div className="max-w-[1400px] mx-auto w-full space-y-6 pb-12">
          <div className="flex items-center justify-between border-b pb-4 border-border">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      );
    }

    if (isError || !insight) {
      return (
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <div className="size-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
            <XCircle className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Insight Not Found
          </h2>
          <p className="text-xs text-muted-foreground">
            {(error as any)?.message || "The requested insight could not be found or has been removed."}
          </p>
          <Button asChild variant="outline" className="cursor-pointer gap-2 text-xs">
            <Link href="/dashboard/insights">
              <ArrowLeft className="size-3.5" />
              Back to Insights
            </Link>
          </Button>
        </div>
      );
    }

    const categoryName = insight.category?.name || "General";
    const categoryColor = insight.category?.color_code || "#649809";
    const formattedCreatedDate = insight.created_at
      ? new Date(insight.created_at).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "—";
    const formattedCreatedTime = insight.created_at
      ? new Date(insight.created_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const formattedUpdatedDate = insight.updated_at
      ? new Date(insight.updated_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

    const mediaThumbnail = insight.thumbnail_url || insight.thumbnail;
    const mediaVideo = insight.video_url || insight.video;
    const hasExternalLink = Boolean(insight.external_link && insight.external_link.trim());

    return (
      <div className="max-w-[1400px] mx-auto w-full space-y-6 pb-12">
        {/* Edit Modal Component */}
        {insight && (
          <EditInsightDialog
            insight={insight}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={() => refetch()}
          />
        )}

        {/* Top Header & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 border-border">
          <div className="space-y-1.5">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/insights"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                <span>Insights</span>
              </Link>
              <span className="text-muted-foreground text-xs">/</span>
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100  max-w-xs sm:max-w-md break-all">
                {insight.title}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                Insight Details
              </h1>

              {/* Status Badge */}
              {insight.status === "active" ? (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-medium gap-1">
                  <CheckCircle2 className="size-3" />
                  Active
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-slate-100 dark:bg-muted text-muted-foreground border-border text-xs"
                >
                  Inactive (Draft)
                </Badge>
              )}

              {/* Category Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-muted border border-border text-gray-800 dark:text-gray-200">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: categoryColor }}
                />
                <span>{categoryName}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Edit Modal Trigger */}
            <Button
              onClick={() => setEditDialogOpen(true)}
              size="sm"
              className="bg-[#649809] hover:bg-[#527d07] text-white cursor-pointer h-9 px-3.5 text-xs font-medium shadow-xs gap-1.5"
            >
              <Edit className="size-3.5" />
              <span>Edit Insight</span>
            </Button>

            {/* Delete Dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900 h-9 px-3 text-xs gap-1.5"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Delete Financial Insight
                  </AlertDialogTitle>
                 <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                    Are you sure you want to delete <strong className="text-foreground">"{insight.title}"</strong>? This action cannot be undone and will remove it permanently.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer text-xs h-8">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer text-xs h-8"
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Yes, Delete Insight"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left 2 Columns: Full Insight View */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Player / Cover Banner */}
            <Card className="border border-border shadow-xs bg-white dark:bg-card overflow-hidden">
              {mediaVideo ? (
                <div className="w-full bg-black/95">
                  <video
                    src={mediaVideo}
                    poster={mediaThumbnail || undefined}
                    controls
                    className="w-full max-h-[440px] object-contain mx-auto"
                  />
                </div>
              ) : mediaThumbnail ? (
                <div className="w-full max-h-[380px] bg-slate-100 dark:bg-muted overflow-hidden flex items-center justify-center">
                  <img
                    src={mediaThumbnail}
                    alt={insight.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%23649809' stroke-width='1.5'%3E%3Crect width='18' height='18' x='3' y='3' rx='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                    }}
                    className="w-full h-full max-h-[380px] object-cover"
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50/60 dark:bg-muted/20 border-b border-border">
                  <div className="size-12 rounded-xl bg-[#649809]/10 text-[#649809] flex items-center justify-center mx-auto mb-2">
                    <FileText className="size-6" />
                  </div>
                  <p className="text-xs text-muted-foreground">Standard Text Article (No media attached)</p>
                </div>
              )}

              <CardContent className="p-6 space-y-4">
                {/* Article Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {categoryName}
                    </span>
                    <span>•</span>
                    <span>{formattedCreatedDate}</span>
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug break-all">
                    {insight.title}
                  </h2>
                </div>

                {/* Description / Body Text */}
                <div className="pt-3 border-t border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Insight Description & Guidance
                  </h4>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {insight.description}
                  </p>
                </div>

                {/* External Link Block */}
                {hasExternalLink && (
                  <div className="pt-4 border-t border-border">
                    <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                          <Link2 className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-blue-950 dark:text-blue-100">
                            Referenced Educational Source
                          </p>
                          <p className="text-[11px] text-blue-700 dark:text-blue-300 truncate font-mono mt-0.5">
                            {insight.external_link}
                          </p>
                        </div>
                      </div>
                      <Button
                        asChild
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 shrink-0 cursor-pointer gap-1.5"
                      >
                        <a
                          href={insight.external_link!}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span>Visit Resource</span>
                          <ExternalLink className="size-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right 1 Column: Metadata & App Mockup */}
          <div className="space-y-6">
            {/* Metadata Card */}
            <Card className="border border-border shadow-xs bg-white dark:bg-card">
              <CardHeader className="pb-3 border-b border-border/70">
                <CardTitle className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <Layers className="size-3.5 text-[#649809]" />
                  Insight Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5 text-xs">
                {/* ID */}
                

                {/* Category */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <div className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <span>{categoryName}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-semibold capitalize text-gray-800 dark:text-gray-200">
                    {insight.status}
                  </span>
                </div>

                {/* Resource Type */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resource Type</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {mediaVideo
                      ? "Video Walkthrough"
                      : hasExternalLink
                      ? "External Article Link"
                      : "Standard Article"}
                  </span>
                </div>

                {/* Published Date */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Published</span>
                  <div className="text-right">
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {formattedCreatedDate}
                    </p>
                    {formattedCreatedTime && (
                      <p className="text-[10px] text-muted-foreground">
                        {formattedCreatedTime}
                      </p>
                    )}
                  </div>
                </div>

                {/* Last Updated */}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {formattedUpdatedDate}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
