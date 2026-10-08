import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import "./nprogress.css";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { Providers } from "@/components/providers";
import { ConnectionStatus } from "@/components/connection-status";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/error-boundary";
import { ServerErrorDialog } from "@/components/server-error-dialog";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dream Dollar Admin Panel",
  description: "Dream Dollar Admin Dashboard",
  robots: "noindex, nofollow",
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={figtree.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ConnectionStatus />
        <Toaster position="top-right" richColors closeButton className="max-w-[calc(100vw-2rem)]" />
        <Providers>
          <ServerErrorDialog />
          <SidebarConfigProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
          </SidebarConfigProvider>
        </Providers>
      </body>
    </html>
  );
}
