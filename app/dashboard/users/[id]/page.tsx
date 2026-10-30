"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserDetails, updateUserStatus } from "@/lib/api/users.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  Mail,
  CheckCircle2,
  XCircle,
  Sparkles,
  UserCheck,
  UserX,
  RefreshCw,
  Wallet,
  PiggyBank,
  Target,
  TrendingUp,
  CreditCard,
  Layers,
  Shield,
  Briefcase,
  DollarSign,
  Activity,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmationDialog } from "../components/confirmation-dialog";

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params?.id as string;
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const {
    data: response,
    isLoading,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["adminUserDetails", userId],
    queryFn: () => getUserDetails(userId),
    enabled: Boolean(userId),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    staleTime: 60 * 1000,
  });

  const userData = response?.data;
  const profile = userData?.profile;
  const settings = userData?.settings;
  const insights = userData?.insights;

  const displayName =
    profile?.name ||
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
    profile?.email?.split("@")[0] ||
    "User";

  React.useEffect(() => {
    if (profile) {
      document.title = `${displayName} | User Profile | Dream Dollar Admin`;
    } else {
      document.title = "User Details | Dream Dollar Admin";
    }
  }, [profile, displayName]);

  const initials =
    displayName
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const formattedJoinedDate = profile?.joinedDate
    ? new Date(profile.joinedDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "—";

  const formattedLastActive = insights?.lastActiveAt
    ? new Date(insights.lastActiveAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    : "—";

  const handleToggleStatus = async () => {
    if (!profile) return;

    const nextStatus =
      profile.accountStatus === "active"
        ? "inactive"
        : "active";

    const statusLabel =
      nextStatus === "active" ? "Active" : "Inactive";

    try {
      setIsUpdatingStatus(true);

      await updateUserStatus(profile.id, nextStatus);

      toast.success(`User marked as ${statusLabel}`);

      setShowStatusConfirmation(false);

      await refetch();

      queryClient.invalidateQueries({
        queryKey: ["adminUsers"],
      });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        "Failed to update user status"
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Keep skeleton visible during initial loading, pending state, and active retries
  const showSkeleton = !profile && (isLoading || isPending || isFetching || !isError);

  if (showSkeleton) {
    return (
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Card className="border-border shadow-xs">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-2xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Only show error state if all retries failed and there is no profile in cache
  if (isError && !profile && !isFetching) {
    return (
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full p-4 lg:p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/users")}
          className="w-fit gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="size-4" /> Back to Users
        </Button>
        <Card className="border-rose-200 bg-rose-50/50 dark:bg-rose-950/20">
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="size-10 text-rose-500 mx-auto" />
            <h2 className="text-lg font-semibold text-rose-900 dark:text-rose-200">
              User Not Found or Error Loading Profile
            </h2>
            <p className="text-sm text-rose-700 dark:text-rose-300 max-w-md mx-auto">
              {(error as any)?.response?.data?.message ||
                (error as any)?.message ||
                "Unable to retrieve the requested user details. The account might have been removed or the ID is invalid."}
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="cursor-pointer"
              >
                <RefreshCw className="mr-1.5 size-3.5" /> Try Again
              </Button>
              <Button
                size="sm"
                className="bg-[#649809] text-white hover:bg-[#527d07] cursor-pointer"
                onClick={() => router.push("/dashboard/users")}
              >
                Return to Users List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback if profile is still missing after loading finishes with no error
  if (!profile) {
    return (
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full p-4 lg:p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/users")}
          className="w-fit gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="size-4" /> Back to Users
        </Button>
        <Card className="border-border bg-card">
          <CardContent className="p-8 text-center space-y-3">
            <AlertCircle className="size-10 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold text-foreground">
              User Profile Not Found
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              The user profile could not be located. The account may have been deleted.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button
                size="sm"
                className="bg-[#649809] text-white hover:bg-[#527d07] cursor-pointer"
                onClick={() => router.push("/dashboard/users")}
              >
                Return to Users List
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto w-full pb-10">
      {/* Background Refetch Failure Banner (Cached data preserved) */}
      {isError && (
        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-600 shrink-0" />
            <span>Could not refresh latest details. Showing cached profile.</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-7 text-xs border-amber-300 hover:bg-amber-100 cursor-pointer"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4 border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/users")}
            className="cursor-pointer border-border h-9 gap-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 shadow-xs"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Users</span>
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            User Profile Overview
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching || isUpdatingStatus}
            className="cursor-pointer border-border h-9 gap-1.5 text-xs shadow-xs"
            title="Refresh user data"
          >
            <RefreshCw
              className={`size-3.5 ${isFetching ? "animate-spin text-[#649809]" : ""}`}
            />
            <span>Refresh</span>
          </Button>

          {profile.accountStatus === "active" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatusConfirmation(true)}
              disabled={isUpdatingStatus}
              className="cursor-pointer border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:hover:bg-rose-950/30 h-9 gap-1.5 text-xs shadow-xs"
            >
              {isUpdatingStatus ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <UserX className="size-3.5 text-rose-600" />
              )}
              <span>Mark as Inactive</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowStatusConfirmation(true)}
              disabled={isUpdatingStatus}
              className="cursor-pointer bg-[#649809] hover:bg-[#527d07] text-white h-9 gap-1.5 text-xs shadow-xs"
            >
              {isUpdatingStatus ? (
                <Loader2 className="size-3.5 animate-spin text-white" />
              ) : (
                <UserCheck className="size-3.5 text-white" />
              )}
              <span>Mark as Active</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Profile Banner Card */}
      <Card className="border border-border shadow-xs overflow-hidden bg-white dark:bg-card">
        <div className="h-2 bg-gradient-to-r from-[#649809] via-[#86bd17] to-emerald-400" />
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <Avatar className="h-18 w-18 sm:h-20 sm:w-20 rounded-2xl border-2 border-border shadow-xs">
                {profile.profilePic && (
                  <AvatarImage src={profile.profilePic} alt={displayName} />
                )}
                <AvatarFallback className="bg-[#649809]/10 text-[#649809] text-xl font-bold rounded-2xl">
                  {profile.avatarEmoji || initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                    {displayName}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground font-mono truncate flex items-center gap-1.5">
                  <Mail className="size-3.5 text-muted-foreground" />
                  {profile.email}
                </p>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Account Status Badge */}
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize font-medium ${profile.accountStatus === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
                      : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800"
                      }`}
                  >
                    Status: {profile.accountStatus || "unknown"}
                  </Badge>

                  {/* Subscription: Based ONLY on isSubscribed boolean. Active / Inactive */}
                  {profile.isSubscribed ? (
                    <Badge className="bg-[#649809]/15 text-[#649809] border border-[#649809]/30 hover:bg-[#649809]/20 font-medium text-xs gap-1">
                      <Sparkles className="size-3" />
                      Subscription: Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-slate-100 dark:bg-muted text-muted-foreground border-border font-normal text-xs"
                    >
                      Subscription: Inactive
                    </Badge>
                  )}

                  {/* Email Verified Badge */}
                  {profile.isEmailVerified ? (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs gap-1 font-normal"
                    >
                      <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                      Email Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 text-xs gap-1 font-normal"
                    >
                      <XCircle className="size-3 text-amber-600 dark:text-amber-400" />
                      Email Unverified
                    </Badge>
                  )}

                  {/* Profile Status Badge */}
                  {profile.isProfileCompleted ? (
                    <Badge
                      variant="outline"
                      className="bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 border-border text-xs font-normal"
                    >
                      Profile Complete
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-slate-100 dark:bg-muted text-slate-500 border-border text-xs font-normal italic"
                    >
                      Profile Incomplete
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Joined & Last Active Info */}
            <div className="flex md:flex-col justify-between sm:justify-start gap-3 text-xs border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-6 border-border">
              <div>
                <span className="text-muted-foreground block text-[11px] mb-0.5">Joined Date</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-[#649809]" />
                  {formattedJoinedDate}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] mb-0.5">Last Active</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-[#649809]" />
                  {formattedLastActive}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Financial Insights Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="size-3.5 text-[#649809]" />
            Financial Insights & Activity
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Income Sources */}
          <Card className="border border-border shadow-xs hover:border-[#649809]/40 transition-all bg-white dark:bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Income Sources</span>
                <div className="h-7 w-7 rounded-lg bg-[#649809]/10 text-[#649809] flex items-center justify-center">
                  <Wallet className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {insights?.totalIncomeSources ?? 0}
              </div>
              <p className="text-[11px] text-muted-foreground">Registered sources</p>
            </CardContent>
          </Card>

          {/* Assets */}
          <Card className="border border-border shadow-xs hover:border-[#649809]/40 transition-all bg-white dark:bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Total Assets</span>
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {insights?.totalAssets ?? 0}
              </div>
              <p className="text-[11px] text-muted-foreground">Declared assets</p>
            </CardContent>
          </Card>

          {/* Savings Pots */}
          <Card className="border border-border shadow-xs hover:border-[#649809]/40 transition-all bg-white dark:bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Savings Pots</span>
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <PiggyBank className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {insights?.totalSavingsPots ?? 0}
              </div>
              <p className="text-[11px] text-muted-foreground">Active savings pots</p>
            </CardContent>
          </Card>

          {/* Financial Goals */}
          <Card className="border border-border shadow-xs hover:border-[#649809]/40 transition-all bg-white dark:bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Goals</span>
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Target className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {insights?.totalGoals ?? 0}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {insights?.completedGoals ?? 0} completed · {insights?.inProgressGoals ?? 0} in progress
              </p>
            </CardContent>
          </Card>

          {/* Budgets */}
          <Card className="border border-border shadow-xs hover:border-[#649809]/40 transition-all bg-white dark:bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Budgets</span>
                <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Layers className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {insights?.totalBudgets ?? 0}
              </div>
              <p className="text-[11px] text-muted-foreground">Tracked budget plans</p>
            </CardContent>
          </Card>

          {/* Debts */}
          <Card className="border border-border shadow-xs hover:border-[#649809]/40 transition-all bg-white dark:bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Debts</span>
                <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <CreditCard className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {insights?.totalDebts ?? 0}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {insights?.activeDebts ?? 0} active debts
              </p>
            </CardContent>
          </Card>

          {/* Investments */}
          <Card className="border border-border shadow-xs hover:border-[#649809]/40 transition-all bg-white dark:bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Investments</span>
                <div className="h-7 w-7 rounded-lg bg-[#649809]/10 text-[#649809] flex items-center justify-center">
                  <DollarSign className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {insights?.totalInvestments ?? 0}
              </div>
              <p className="text-[11px] text-muted-foreground">Investment assets</p>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="border border-border shadow-xs hover:border-[#649809]/40 transition-all bg-white dark:bg-card">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Active Sessions</span>
                <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Activity className="size-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {insights?.activeSessionsCount ?? 1}
              </div>
              <p className="text-[11px] text-muted-foreground">Current user sessions</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Account Settings & Preferences Section */}
      <Card className="border border-border shadow-xs bg-white dark:bg-card">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Briefcase className="size-4 text-[#649809]" />
            Account Settings & Preferences
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Occupation, currency, admin status, and declared target goals
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl border border-border bg-slate-50/60 dark:bg-muted/30">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs mb-1">
                <Briefcase className="size-3.5 text-[#649809]" /> Occupation
              </span>
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block">
                {settings?.occupation || "Not specified"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-slate-50/60 dark:bg-muted/30">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs mb-1">
                <DollarSign className="size-3.5 text-[#649809]" /> Preferred Currency
              </span>
              <div className="mt-0.5">
                <Badge className="bg-[#649809]/15 text-[#649809] border border-[#649809]/30 font-bold text-xs">
                  {settings?.currency || "USD"}
                </Badge>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-slate-50/60 dark:bg-muted/30">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs mb-1">
                <Shield className="size-3.5 text-[#649809]" /> Deactivated By Admin
              </span>
              <span className="font-medium text-sm block mt-0.5">
                {profile.isDeactivatedByAdmin ? (
                  <span className="text-rose-600 font-semibold">Yes</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">No</span>
                )}
              </span>
            </div>
          </div>

          {/* Financial Goals Chips */}
          <div className="pt-2">
            <span className="text-xs text-muted-foreground block mb-2 font-semibold uppercase tracking-wider">
              Declared Financial Goals
            </span>
            {Array.isArray(settings?.financialGoals) && settings.financialGoals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {settings.financialGoals.map((goal, idx) => (
                  <Badge
                    key={idx}
                    className="bg-[#649809]/10 text-[#649809] border border-[#649809]/30 px-3 py-1 text-xs capitalize font-medium gap-1.5 shadow-2xs"
                  >
                    <Target className="size-3 text-[#649809]" />
                    {goal}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic text-xs">No financial goals set yet</p>
            )}
          </div>
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={showStatusConfirmation}
        onOpenChange={setShowStatusConfirmation}
        title={
          profile.accountStatus === "active"
            ? "Deactivate User?"
            : "Activate User?"
        }
        description={
          profile.accountStatus === "active"
            ? `Are you sure you want to deactivate ${displayName}? This user will no longer have an active account.`
            : `Are you sure you want to activate ${displayName}? This will restore the user's active account status.`
        }
        confirmText={
          profile.accountStatus === "active"
            ? "Yes, Deactivate"
            : "Yes, Activate"
        }
        variant={
          profile.accountStatus === "active"
            ? "destructive"
            : "default"
        }
        isLoading={isUpdatingStatus}
        onConfirm={handleToggleStatus}
      />
    </div>
  );
}
