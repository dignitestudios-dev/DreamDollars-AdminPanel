"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useMutation } from "@tanstack/react-query";
import { adminForgotPassword } from "@/lib/api/auth.api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/forgot-password.schema";

const ForgotPassword = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const isSubmittingRef = React.useRef(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotMutation = useMutation({
    mutationFn: adminForgotPassword,
    onSuccess: (data) => {
      if (data && data.success === false) {
        const msg = data.message || "Failed to send reset code";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      setErrorMessage("");
      if (typeof window !== "undefined") {
        sessionStorage.setItem("forgot_email", getValues("email").trim());
      }
      toast.success(
        data?.message || "Password reset OTP sent to your email successfully"
      );
      router.push("/auth/verification");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send reset code. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    if (isSubmittingRef.current || forgotMutation.isPending) return;
    isSubmittingRef.current = true;
    setErrorMessage("");
    forgotMutation.mutate({ email: data.email.trim() });
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-[#e1ebb0]">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size={64} alt="Dream Dollar" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h2>
        <p className="text-gray-600">
          Enter your email address and we&apos;ll send you an OTP to reset your password
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm break-words">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            maxLength={254}
            placeholder="Enter your email"
            {...register("email")}
            disabled={forgotMutation.isPending}
          />
          {errors.email && (
            <p className="text-sm text-red-500 break-words">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={forgotMutation.isPending}
        >
          {forgotMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending OTP...
            </span>
          ) : (
            "Send Reset Link"
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

export default ForgotPassword;
