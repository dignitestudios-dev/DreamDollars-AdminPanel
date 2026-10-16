"use client";

import React, { useState, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  profileSchema,
  type ProfileFormData,
} from "@/lib/validations/profile.schema";
import {
  getAdminProfile,
  updateAdminProfile,
} from "@/lib/api/auth.api";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { updateUser } from "@/lib/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera,
  Loader2,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Pencil,
  X,
  Check,
  IdCard,
} from "lucide-react";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const isSubmittingRef = useRef(false);

  const {
    data: profileResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["adminProfile"],
    queryFn: getAdminProfile,
  });

  const profile = profileResponse?.data;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? { name: profile.name || "" }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: updateAdminProfile,
    onSuccess: (data) => {
      if (data && data.success === false) {
        toast.error(data.message || "Failed to update profile");
        return;
      }
      toast.success(data?.message || "Profile updated successfully!");
      if (data?.data) {
        queryClient.setQueryData(["adminProfile"], data);
        dispatch(
          updateUser({
            name: data.data.name,
            email: data.data.email,
          })
        );
      }
      queryClient.invalidateQueries({ queryKey: ["adminProfile"] });
      queryClient.refetchQueries({ queryKey: ["adminProfile"] });
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageError(false);
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile"
      );
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    if (isSubmittingRef.current || updateMutation.isPending) return;
    isSubmittingRef.current = true;
    updateMutation.mutate({
      name: data.name,
      profilePicture: selectedFile,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }
    setSelectedFile(file);
    setImageError(false);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    reset();
  };

  const avatarSrc = React.useMemo(() => {
    if (previewUrl) return previewUrl;
    if (!profile?.profilePicture) return null;
    const v = profile?.updatedAt ? new Date(profile.updatedAt).getTime() : Date.now();
    return `${profile.profilePicture}${profile.profilePicture.includes("?") ? "&" : "?"}v=${v}`;
  }, [previewUrl, profile?.profilePicture, profile?.updatedAt]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-12 text-center">
        <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <X className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load profile</h3>
        <p className="text-gray-500 mb-6">
          {(error as any)?.response?.data?.message || (error as any)?.message || "Something went wrong."}
        </p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["adminProfile"] })} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Profile Banner ── */}
      <div className="relative rounded-xl overflow-hidden border border-[#e1ebb0] bg-white">
        {/* Banner gradient */}
        <div className="h-36 bg-gradient-to-br from-[#649809] via-[#7ab310] to-[#4d7507]" />

        {/* Avatar + name row */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 min-w-0">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="h-24 w-24 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden flex items-center justify-center">
              {avatarSrc && !imageError ? (
                <img
                  key={avatarSrc}
                  src={avatarSrc}
                  alt={profile?.name || "Profile"}
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="h-full w-full bg-[#F6FAD9] flex items-center justify-center">
                  <User className="h-10 w-10 text-[#649809]" />
                </div>
              )}
            </div>
            {isEditing && (
              <button
                type="button"
                aria-label="Upload profile photo"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>

          {/* Name & role */}
          <div className="flex-1 min-w-0 pt-2 sm:pt-0">
            <h1 className="text-xl font-bold text-gray-900 truncate" title={profile?.name || "Administrator"}>
              {profile?.name || "Administrator"}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#649809]/10 text-[#649809] capitalize shrink-0">
                <Shield className="h-3 w-3" />
                {profile?.role || "admin"}
              </span>
              <span className="text-sm text-gray-500 truncate" title={profile?.email || ""}>
                {profile?.email || "—"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="shrink-0 flex gap-2 sm:pb-1">
            {!isEditing ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)} className="cursor-pointer">
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit} disabled={updateMutation.isPending} className="cursor-pointer">
                  <X className="h-4 w-4 mr-1.5" />
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={updateMutation.isPending} className="cursor-pointer">
                  {updateMutation.isPending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" />
                      Save Changes
                    </span>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Info Sections Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Personal Info */}
        <div className="bg-white rounded-xl border border-[#e1ebb0] p-6 min-w-0">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-8 w-8 rounded-lg bg-[#649809]/10 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-[#649809]" />
            </div>
            <h2 className="font-semibold text-gray-900 truncate">Personal Info</h2>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Full Name {isEditing && <span className="text-rose-500">*</span>}
              </Label>
              {isEditing ? (
                <div className="mt-1.5">
                  <Input
                    id="name"
                    maxLength={50}
                    {...register("name")}
                    disabled={updateMutation.isPending}
                    placeholder="Enter name"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1 break-words">{errors.name.message}</p>}
                </div>
              ) : (
                <p className="mt-1 text-gray-900 font-medium break-words">{profile?.name || "—"}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</Label>
              <p className="mt-1 text-gray-900 font-medium capitalize break-words">{profile?.role || "—"}</p>
            </div>
          </div>
        </div>

        {/* Right: Contact + Account */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-[#e1ebb0] p-6 min-w-0">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-[#649809]/10 flex items-center justify-center shrink-0">
                <Phone className="h-4 w-4 text-[#649809]" />
              </div>
              <h2 className="font-semibold text-gray-900 truncate">Contact Information</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Email */}
              <div className="min-w-0">
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3 w-3 shrink-0" /> Email Address
                </Label>
                <p className="mt-1 text-gray-900 font-medium break-all">{profile?.email || "—"}</p>
                {isEditing && <p className="text-xs text-gray-400 mt-0.5">Cannot be changed</p>}
              </div>

              {/* Phone */}
              
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white rounded-xl border border-[#e1ebb0] p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-[#649809]/10 flex items-center justify-center">
                <IdCard className="h-4 w-4 text-[#649809]" />
              </div>
              <h2 className="font-semibold text-gray-900">Account Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Member Since
                </Label>
                <p className="mt-1 text-gray-900 font-medium">{formatDate(profile?.createdAt)}</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> Last Updated
                </Label>
                <p className="mt-1 text-gray-900 font-medium">{formatDate(profile?.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
