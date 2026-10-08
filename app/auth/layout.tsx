"use client";

import { Logo } from "@/components/logo";
import GridShape from "@/components/grid-shape";
import { PublicRoute } from "@/components/PublicRoute";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PublicRoute>
      <div className="flex h-screen bg-white dark:bg-background">
        {/* Left side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          {children}
        </div>
        {/* Right side - Brand */}
        <div className="lg:w-1/2 w-full h-full bg-[#649809] lg:grid items-center hidden relative overflow-hidden">
          <div className="relative items-center justify-center flex z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-xs text-center">
              <div className="mb-6 p-4 rounded-2xl bg-white shadow-xl">
                <Logo size={96} alt="Dream Dollar" />
              </div>
              <h1 className="text-white text-4xl font-bold tracking-tight">Dream Dollar</h1>
              <p className="text-center text-white/90 mt-2 font-medium">
                Welcome to the Admin Panel. Please Sign in to Continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicRoute>
  );
}
