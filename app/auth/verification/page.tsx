"use client";

import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { useMutation } from "@tanstack/react-query";
import { adminVerifyOtp, adminForgotPassword } from "@/lib/api/auth.api";
import { toast } from "sonner";
import { Loader2, RotateCw } from "lucide-react";
import { verifyOtpSchema } from "@/lib/validations/verify-otp.schema";

const Verification = () => {
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [email, setEmail] = useState<string>("admin@dreamdollars.com");
  const [errorMessage, setErrorMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  // Retrieve email stored from forgot-password page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("forgot_email");
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // TanStack Query mutation for OTP verification
  const verifyMutation = useMutation({
    mutationFn: adminVerifyOtp,
    onSuccess: (data, variables) => {
      if (data && data.success === false) {
        const msg = data.message || "Invalid or expired OTP";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      setErrorMessage("");
      const token =
        data?.resetToken ||
        data?.data?.resetToken ||
        data?.token ||
        data?.data?.token ||
        "";

      if (typeof window !== "undefined") {
        sessionStorage.setItem("verified_otp", variables.otp);
        sessionStorage.setItem("reset_token", token);
      }

      toast.success(data?.message || "OTP verified successfully!");
      router.push("/auth/reset-password");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid or expired OTP. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    },
  });

  // TanStack Query mutation for resending OTP
  const resendMutation = useMutation({
    mutationFn: adminForgotPassword,
    onSuccess: (data) => {
      if (data && data.success === false) {
        toast.error(data.message || "Failed to resend OTP");
        return;
      }
      setOtp(["", "", "", ""]);
      setErrorMessage("");
      setResendTimer(60);
      toast.success(data?.message || "A new 4-digit OTP has been sent to your email!");
      inputRefs.current[0]?.focus();
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to resend OTP. Please try again later."
      );
    },
  });

  // Handle single digit input
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const raw = e.target.value;
    const digit = raw.replace(/\D/g, "").slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMessage("");

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle copy paste across all 4 inputs
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const digits = pastedData.replace(/\D/g, "").slice(0, 4);

    if (!digits) return;

    const newOtp = [...otp];
    for (let i = 0; i < 4; i++) {
      newOtp[i] = digits[i] || "";
    }
    setOtp(newOtp);
    setErrorMessage("");

    const targetFocus = Math.min(digits.length, 3);
    inputRefs.current[targetFocus]?.focus();

    // If all 4 digits pasted, auto-trigger verification
    if (digits.length === 4) {
      const result = verifyOtpSchema.safeParse({ email, otp: digits });
      if (result.success) {
        verifyMutation.mutate({ email, otp: digits });
      }
    }
  };

  // Handle backspace and arrow navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 3) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const isComplete = otp.every((digit) => digit !== "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");

    // Validate using zod schema
    const result = verifyOtpSchema.safeParse({ email, otp: otpCode });
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Invalid OTP";
      setErrorMessage(firstError);
      toast.error(firstError);
      return;
    }

    verifyMutation.mutate({ email, otp: otpCode });
  };

  const handleResend = () => {
    if (resendTimer > 0 || resendMutation.isPending) return;
    resendMutation.mutate({ email });
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-[#e1ebb0]">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size={64} alt="Dream Dollar" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
        <p className="text-gray-600">
          Enter the 4-digit code sent to{" "}
          <span className="font-semibold text-gray-800">{email}</span>
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-3 sm:gap-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              disabled={verifyMutation.isPending}
              className={`w-14 h-16 sm:w-16 sm:h-18 text-center text-3xl font-bold border rounded-xl outline-none transition-all ${
                errorMessage
                  ? "border-red-400 bg-red-50/20"
                  : digit
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-input bg-background"
              } focus:border-primary focus:ring-2 focus:ring-primary/20`}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={!isComplete || verifyMutation.isPending}
        >
          {verifyMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying Code...
            </span>
          ) : (
            "Verify OTP"
          )}
        </Button>

        <div className="flex items-center justify-between text-sm pt-2">
          <Link
            href="/auth/forgot-password"
            className="text-muted-foreground hover:text-foreground hover:underline"
          >
            Change Email
          </Link>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendTimer > 0 || resendMutation.isPending}
            className={`font-medium ${
              resendTimer > 0 || resendMutation.isPending
                ? "text-muted-foreground cursor-not-allowed"
                : "text-primary hover:underline cursor-pointer"
            }`}
          >
            {resendMutation.isPending ? (
              <span className="flex items-center gap-1">
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                Resending...
              </span>
            ) : resendTimer > 0 ? (
              `Resend OTP in ${resendTimer}s`
            ) : (
              "Resend OTP"
            )}
          </button>
        </div>

        <div className="text-center pt-2">
          <Link href="/auth/login" className="text-sm text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Verification;
