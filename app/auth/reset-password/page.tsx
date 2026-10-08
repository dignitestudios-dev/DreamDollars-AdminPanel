"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";

import { useMutation } from "@tanstack/react-query";
import { adminResetPassword } from "@/lib/api/auth.api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/validations/reset-password.schema";

const RULES = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/];

function getPasswordStrength(pw: string) {
  const score = RULES.filter((r) => r.test(pw)).length + (pw.length >= 8 ? 1 : 0);
  const colors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"]; // red→green, index by score
  return { score, max: 5, color: colors[score] ?? colors[0] };
}

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("admin@dreamdollars.com");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const isSubmittingRef = useRef(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPasswordValue = watch("newPassword", "");

  const passwordChecks = {
    minLength: newPasswordValue.length >= 8,
    hasUppercase: /[A-Z]/.test(newPasswordValue),
    hasLowercase: /[a-z]/.test(newPasswordValue),
    hasNumber: /[0-9]/.test(newPasswordValue),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPasswordValue),
  };

  const strength = getPasswordStrength(newPasswordValue);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("forgot_email");
      const storedOtp = sessionStorage.getItem("verified_otp");
      const storedToken = sessionStorage.getItem("reset_token");
      if (storedEmail) setEmail(storedEmail);
      if (storedOtp) setOtp(storedOtp);
      if (storedToken) setResetToken(storedToken);
    }
  }, []);

  const resetMutation = useMutation({
    mutationFn: adminResetPassword,
    onSuccess: (data) => {
      if (data && data.success === false) {
        const msg = data.message || "Failed to reset password";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      setErrorMessage("");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("forgot_email");
        sessionStorage.removeItem("verified_otp");
        sessionStorage.removeItem("reset_token");
      }

      toast.success(
        data?.message ||
        "Password has been reset successfully! Please sign in with your new password."
      );
      router.push("/auth/login");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to reset password. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    if (isSubmittingRef.current || resetMutation.isPending) return;
    isSubmittingRef.current = true;
    setErrorMessage("");
    resetMutation.mutate({
      email,
      otp: otp || "1234",
      resetToken: resetToken || "",
      newPassword: data.newPassword,
      confirmPassword: data.confirmPassword,
    });
  };

  const showStrengthMeter = isFocused || newPasswordValue.length > 0;

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-[#e1ebb0]">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size={64} alt="Dream Dollar" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
        <p className="text-gray-600">
          Enter your new password below for <span className="font-semibold text-gray-800 break-all">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm break-words">
            {errorMessage}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">
            New Password <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              maxLength={128}
              placeholder="Enter your new password"
              {...register("newPassword")}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={resetMutation.isPending}
              className="pr-10"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              disabled={resetMutation.isPending}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-500 break-words">{errors.newPassword.message}</p>
          )}

          {/* Password strength dynamic meter */}
          {showStrengthMeter && (
            <div className="space-y-2 pt-1 transition-all">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${(strength.score / strength.max) * 100}%`,
                    backgroundColor: strength.color,
                  }}
                />
              </div>

              {/* Password strength checklist */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div
                  className={`flex items-center gap-1.5 ${
                    passwordChecks.minLength ? "text-[#649809] font-medium" : "text-gray-400"
                  }`}
                >
                  <span>{passwordChecks.minLength ? "✓" : "○"}</span>
                  <span>8+ characters</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    passwordChecks.hasUppercase ? "text-[#649809] font-medium" : "text-gray-400"
                  }`}
                >
                  <span>{passwordChecks.hasUppercase ? "✓" : "○"}</span>
                  <span>Uppercase letter</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    passwordChecks.hasLowercase ? "text-[#649809] font-medium" : "text-gray-400"
                  }`}
                >
                  <span>{passwordChecks.hasLowercase ? "✓" : "○"}</span>
                  <span>Lowercase letter</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    passwordChecks.hasNumber ? "text-[#649809] font-medium" : "text-gray-400"
                  }`}
                >
                  <span>{passwordChecks.hasNumber ? "✓" : "○"}</span>
                  <span>Number</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    passwordChecks.hasSpecial ? "text-[#649809] font-medium" : "text-gray-400"
                  }`}
                >
                  <span>{passwordChecks.hasSpecial ? "✓" : "○"}</span>
                  <span>Special character</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm Password <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              maxLength={128}
              placeholder="Confirm your new password"
              {...register("confirmPassword")}
              disabled={resetMutation.isPending}
              className="pr-10"
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={resetMutation.isPending}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 break-words">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={resetMutation.isPending}
        >
          {resetMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Resetting Password...
            </span>
          ) : (
            "Reset Password"
          )}
        </Button>

        <div className="text-center">
          <Link href="/auth/login" className="text-sm text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
