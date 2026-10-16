"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { login } from "@/lib/slices/authSlice";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminLogin } from "@/lib/api/auth.api";
import { requestFcmToken, getStoredFcmToken } from "@/lib/firebase/messaging";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validations/login.schema";

import { Logo } from "@/components/logo";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isSubmittingRef = useRef(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();



  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: adminLogin,
    onSuccess: (data) => {
      if (data && data.success === false) {
        const msg = data.message || "Invalid email or password";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      setErrorMessage("");
      toast.success(data?.message || "Signed in successfully!");

      const token = data?.token || data?.data?.token || data?.data?.accessToken;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("authToken", token);
      }

      const userData =
        data?.data?.user ||
        data?.data?.admin ||
        data?.admin ||
        data?.user || {
          name: "Admin",
          email: getValues("email"),
        };

      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userData));
      }

      // Proactively ensure FCM token is stored/registered in background
      if (typeof window !== "undefined" && !getStoredFcmToken()) {
        requestFcmToken().catch(() => { });
      }

      dispatch(login(userData));
      const returnUrl = searchParams ? searchParams.get("returnUrl") : null;
      router.push(returnUrl ? decodeURIComponent(returnUrl) : "/dashboard");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid email or password";
      setErrorMessage(msg);
      toast.error(msg);
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmittingRef.current || loginMutation.isPending) return;
    isSubmittingRef.current = true;
    setErrorMessage("");

    let fcmToken = getStoredFcmToken();
    if (!fcmToken) {
      try {
        console.log("[Login] Requesting FCM token...");
        fcmToken = await requestFcmToken();
      } catch (err) {
        console.warn("[Login] Could not retrieve FCM token:", err);
      }
    }

    console.log(fcmToken, "fcmToken==");

    loginMutation.mutate({
      ...data,
      fcmToken: fcmToken ?? "",
    });
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-[#e1ebb0]">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size={64} alt="Dream Dollar" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-600">Sign in to your account</p>
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
            disabled={loginMutation.isPending}
          />
          {errors.email && (
            <p className="text-sm text-red-500 break-words">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              maxLength={128}
              placeholder="Enter your password"
              {...register("password")}
              disabled={loginMutation.isPending}
              className="pr-10"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              disabled={loginMutation.isPending}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500 break-words">{errors.password.message}</p>
          )}
        </div>

        <div className="mt-6 text-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing In...
            </span>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </div>
  );
};

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-[400px]" />}>
      <LoginForm />
    </React.Suspense>
  );
}
