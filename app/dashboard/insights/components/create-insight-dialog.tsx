"use client";

import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAdminInsight } from "@/lib/api/insights.api";
import { getAdminCategories } from "@/lib/api/categories.api";
import { setServerRetryHandler, clearServerRetryHandler } from "@/lib/error-retry";
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
import {
  Plus,
  Loader2,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Video,
  Link2,
  X,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";

interface CreateInsightDialogProps {
  onSuccess?: () => void;
}

type ContentMode = "media" | "link";

export function CreateInsightDialog({ onSuccess }: CreateInsightDialogProps) {
  const MAX_THUMBNAIL_SIZE = 10.5 * 1024 * 1024; // 10 MB
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  // Mode: "media" (video + thumbnail) OR "link" (external_link)
  const [contentMode, setContentMode] = useState<ContentMode>("media");

  // File states for media mode
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Link state for link mode
  const [externalLink, setExternalLink] = useState("");

  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const isSubmittingRef = useRef(false);

  const queryClient = useQueryClient();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      clearServerRetryHandler();
      resetForm();
    }
  };

  useEffect(() => {
    return () => {
      clearServerRetryHandler();
    };
  }, []);

  // Fetch categories for dropdown
  const { data: categoriesResponse } = useQuery({
    queryKey: ["adminCategoriesDropdown"],
    queryFn: () => getAdminCategories({ limit: 50, type: "insight" }),
  });

  const categories = categoriesResponse?.data ?? [];

  const isGifFile = (file: File) => {
    return file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif");
  };

  const isValidThumbnailImage = (file: File) => {
    if (isGifFile(file)) return false;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const allowedExts = /\.(jpe?g|png|webp)$/i;
    return allowedTypes.includes(file.type.toLowerCase()) || allowedExts.test(file.name);
  };

  const isValidMp4Video = (file: File) => {
    if (isGifFile(file)) return false;
    const isMp4 = file.type.toLowerCase() === "video/mp4" || file.name.toLowerCase().endsWith(".mp4");
    return isMp4;
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isGifFile(file)) {
      toast.error("GIF format is not allowed for thumbnails. Please upload a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }

    if (!isValidThumbnailImage(file)) {
      toast.error("Invalid thumbnail format. Only JPG, PNG, and WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_THUMBNAIL_SIZE) {
      toast.error("Thumbnail image must not exceed 10 MB.");
      e.target.value = "";
      return;
    }

    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview(null);
    }
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isGifFile(file)) {
      toast.error("GIF format is not allowed. Video must be in MP4 format.");
      e.target.value = "";
      return;
    }

    if (!isValidMp4Video(file)) {
      toast.error("Invalid video format. Only MP4 format is allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      toast.error("Video file must not exceed 100 MB.");
      e.target.value = "";
      return;
    }

    setVideoFile(file);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const mutation = useMutation({
    mutationFn: createAdminInsight,
    onSuccess: () => {
      isSubmittingRef.current = false;
      clearServerRetryHandler();
      toast.success("Insight published successfully");
      queryClient.invalidateQueries({ queryKey: ["adminInsights"] });
      setOpen(false);
      resetForm();
      onSuccess?.();
    },
    onError: (err: any) => {
      isSubmittingRef.current = false;
      toast.error(err?.response?.data?.message || "Failed to publish insight");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategoryId("");
    setStatus("active");
    setContentMode("media");
    handleRemoveThumbnail();
    handleRemoveVideo();
    setExternalLink("");
    mutation.reset();
  };

  const executeSubmit = () => {
    if (mutation.isPending) return;

    if (!title.trim()) {
      toast.error("Insight title is required");
      return;
    }
    if (!description.trim()) {
      toast.error("Description content is required");
      return;
    }
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
    if (contentMode === "media") {
      if (thumbnailFile) {
        if (isGifFile(thumbnailFile)) {
          toast.error("GIF format is not allowed for thumbnails. Please upload a JPG, PNG, or WEBP image.");
          return;
        }
        if (!isValidThumbnailImage(thumbnailFile)) {
          toast.error("Invalid thumbnail format. Only JPG, PNG, and WEBP images are allowed.");
          return;
        }
        if (thumbnailFile.size > MAX_THUMBNAIL_SIZE) {
          toast.error("Thumbnail image must not exceed 10 MB.");
          return;
        }
      }

      if (videoFile) {
        if (isGifFile(videoFile)) {
          toast.error("GIF format is not allowed. Video must be in MP4 format.");
          return;
        }
        if (!isValidMp4Video(videoFile)) {
          toast.error("Invalid video format. Only MP4 format is allowed.");
          return;
        }
        if (videoFile.size > MAX_VIDEO_SIZE) {
          toast.error("Video file must not exceed 100 MB.");
          return;
        }
      }
    }
    isSubmittingRef.current = true;
    setServerRetryHandler(() => executeSubmitRef.current());

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category_id", categoryId);
    formData.append("status", status);

    // Mutual exclusivity enforcement
    if (contentMode === "media") {
      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile);
      }
      if (videoFile) {
        formData.append("video", videoFile);
      }
    } else if (contentMode === "link") {
      if (externalLink.trim()) {
        formData.append("external_link", externalLink.trim());
      }
    }

    mutation.mutate(formData);
  };

  const executeSubmitRef = useRef(executeSubmit);
  useEffect(() => {
    executeSubmitRef.current = executeSubmit;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || mutation.isPending) return;
    executeSubmit();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button className="bg-[#649809] hover:bg-[#527d07] text-white cursor-pointer h-9 px-3.5 text-xs shadow-xs gap-1.5 font-medium">
          <Plus className="size-4" />
          <span>Add Insight</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden">        <DialogHeader>
        <DialogTitle className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Sparkles className="size-4 text-[#649809]" />
          Publish Financial Insight
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Create educational guides with either video/thumbnail media or an external link
        </DialogDescription>
      </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="insight-title" className="text-xs font-medium">
                Insight Title <span className="text-rose-500">*</span>
              </Label>

              <span className="text-[10px] text-muted-foreground">
                {title.length}/120
              </span>
            </div>

            <Input
              id="insight-title"
              placeholder="e.g. The 50/30/20 Budgeting Rule for Long-Term Wealth"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={mutation.isPending}
              maxLength={120}
              className="h-9 text-xs"
            />
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            {/* Category */}
            <div className="space-y-1.5 min-w-0">
              <Label
                htmlFor="insight-category"
                className="text-xs font-medium h-4 flex items-center"
              >
                Category <span className="text-rose-500 ml-1">*</span>
              </Label>

              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={mutation.isPending}
              >
                <SelectTrigger
                  id="insight-category"
                  className="h-9 w-full text-xs cursor-pointer"
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>

                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{
                            backgroundColor: cat.color_code || "#649809",
                          }}
                        />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Publish Status */}
            <div className="space-y-1.5 min-w-0">
              <Label
                htmlFor="insight-status"
                className="text-xs font-medium h-4 flex items-center"
              >
                Publish Status
              </Label>

              <Select
                value={status}
                onValueChange={(val) =>
                  setStatus(val as "active" | "inactive")
                }
                disabled={mutation.isPending}
              >
                <SelectTrigger
                  id="insight-status"
                  className="h-9 w-full text-xs cursor-pointer"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="active">
                    Active (Published)
                  </SelectItem>
                  <SelectItem value="inactive">
                    Inactive (Draft)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
         <div className="w-full min-w-0 space-y-1.5 ">
  <div className="flex items-center justify-between gap-2">
    <Label htmlFor="insight-desc" className="text-xs font-medium">
      Description Content <span className="text-rose-500">*</span>
    </Label>

    <span className="shrink-0 text-[10px] text-muted-foreground">
      {description.length}/500
    </span>
  </div>

  <Textarea
    id="insight-desc"
    placeholder="Write the educational content or detailed financial advice..."
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    disabled={mutation.isPending}
    maxLength={500}
    rows={4}
    wrap="soft"
    style={{
      overflowWrap: "anywhere",
      wordBreak: "break-all",
      whiteSpace: "pre-wrap",
    }}
    className="!box-border block h-[130px] min-h-[130px] max-h-[130px] w-full min-w-0 max-w-full resize-none overflow-x-hidden overflow-y-auto text-xs leading-relaxed"
  />
</div>

          {/* Content Mode Switch (Media Upload vs External Link) */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Resource Type:
              </Label>
              <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-muted border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setContentMode("media");
                    setExternalLink("");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${contentMode === "media"
                    ? "bg-white dark:bg-card text-gray-900 dark:text-gray-100 shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Video className="size-3.5 text-[#649809]" />
                  <span>Media Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContentMode("link");
                    handleRemoveThumbnail();
                    handleRemoveVideo();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${contentMode === "link"
                    ? "bg-white dark:bg-card text-gray-900 dark:text-gray-100 shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  <Link2 className="size-3.5 text-blue-600" />
                  <span>External Link</span>
                </button>
              </div>
            </div>

            {/* Mode 1: Media Upload (Thumbnail & Video) */}
            {/* Mode 1: Media Upload (Thumbnail & Video) */}
            {contentMode === "media" && (
              <div className="w-full min-w-0 max-w-full overflow-hidden space-y-3 rounded-xl border border-border bg-slate-50/60 p-3.5 dark:bg-muted/30">
                <p className="text-[11px] text-muted-foreground">
                  Upload video guide and thumbnail cover image for mobile presentation.
                </p>

                {/* Thumbnail Image Upload */}
                <div className="w-full min-w-0 space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-medium">
                    <ImageIcon className="size-3.5 text-[#649809]" />
                    Thumbnail Cover (Image)
                  </Label>

                  {thumbnailFile ? (
                    <div className="relative flex w-full min-w-0 max-w-full items-center gap-2.5 overflow-hidden rounded-lg border border-border bg-white p-2 dark:bg-card">
                      {thumbnailPreview && (
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail"
                          className="size-10 shrink-0 rounded border border-border object-cover"
                        />
                      )}

                      {/* IMPORTANT: w-0 */}
                      <div className="min-w-0 w-0 flex-1 overflow-hidden pr-8">
                        <p
                          className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-gray-900 dark:text-gray-100"
                          title={thumbnailFile.name}
                        >
                          {thumbnailFile.name}
                        </p>

                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {(thumbnailFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>

                      {/* Fixed remove button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveThumbnail}
                        className="absolute right-1.5 top-1/2 size-7 -translate-y-1/2 shrink-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-white p-4 text-center transition-colors hover:border-[#649809] dark:bg-card"
                    >
                      <Upload className="mb-1 size-5 text-muted-foreground" />

                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Click to upload Thumbnail Image
                      </span>

                      <span className="text-[10px] text-muted-foreground">
                        PNG, JPG, WEBP up to 10MB (GIFs not allowed)
                      </span>
                    </div>
                  )}

                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </div>

                {/* Video File Upload */}
                <div className="w-full min-w-0 space-y-1.5 border-t border-border/70 pt-2">
                  <Label className="flex items-center gap-1.5 text-xs font-medium">
                    <Video className="size-3.5 text-rose-500" />
                    Video Tutorial (File)
                  </Label>

                  {videoFile ? (
                    <div className="relative flex w-full min-w-0 max-w-full items-center gap-2.5 overflow-hidden rounded-lg border border-border bg-white p-2.5 dark:bg-card">
                      {/* Icon */}
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-rose-500/10 text-rose-600">
                        <FileCheck className="size-4" />
                      </div>

                      {/* IMPORTANT: w-0 flex-1 */}
                      <div className="min-w-0 w-0 flex-1 overflow-hidden pr-8">
                        <p
                          className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-gray-900 dark:text-gray-100"
                          title={videoFile.name}
                        >
                          {videoFile.name}
                        </p>

                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>

                      {/* Fixed remove button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveVideo}
                        className="absolute right-1.5 top-1/2 size-7 -translate-y-1/2 shrink-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => videoInputRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-white p-4 text-center transition-colors hover:border-[#649809] dark:bg-card"
                    >
                      <Video className="mb-1 size-5 text-muted-foreground" />

                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Click to upload Video File
                      </span>

                      <span className="text-[10px] text-muted-foreground">
                        MP4 format only up to 100MB (No GIFs)
                      </span>
                    </div>
                  )}

                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,.mp4"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Mode 2: External Article Link */}
            {contentMode === "link" && (
              <div className="space-y-2 p-3.5 rounded-xl border border-border bg-slate-50/60 dark:bg-muted/30">
                <Label htmlFor="external-link-input" className="text-xs font-medium flex items-center gap-1.5">
                  <Link2 className="size-3.5 text-blue-600" />
                  External Article / Resource URL
                </Label>
                <Input
                  id="external-link-input"
                  type="url"
                  placeholder="https://www.investopedia.com/terms/b/budget.asp"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  disabled={mutation.isPending}
                  maxLength={2048}
                  className="h-9 text-xs font-mono bg-white dark:bg-card"
                />
                <p className="text-[10px] text-muted-foreground">
                  When linking an external article, video and thumbnail file uploads are disabled.
                </p>
              </div>
            )}
          </div>

          {/* Dialog Footer */}
          <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between">
            {mutation.isError ? (
              <div className="flex items-center gap-1.5 text-xs text-rose-600">
                <span>Upload failed.</span>
                <button
                  type="button"
                  onClick={() => executeSubmit()}
                  disabled={mutation.isPending}
                  className="font-semibold underline hover:text-rose-700 cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={mutation.isPending}
                className="cursor-pointer h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={mutation.isPending || !title.trim() || !description.trim() || !categoryId}
                className="bg-[#649809] hover:bg-[#527d07] text-white cursor-pointer h-8 text-xs font-medium shadow-xs"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Publishing...
                  </>
                ) : mutation.isError ? (
                  "Try Again"
                ) : (
                  "Publish Insight"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
