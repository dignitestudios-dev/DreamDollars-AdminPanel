"use client";

import React, { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  fallbackComponent?: React.ReactNode;
}

export function ApiImage({
  src,
  alt = "Image",
  className,
  fallbackSrc,
  fallbackComponent,
  onError,
  ...props
}: ApiImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }
    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          onError={() => setHasError(true)}
          {...props}
        />
      );
    }
    return (
      <div
        className={cn(
          "bg-slate-100 dark:bg-muted text-muted-foreground flex items-center justify-center shrink-0 border border-border",
          className
        )}
        aria-label={alt}
      >
        <ImageOff className="size-4 opacity-50" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        setHasError(true);
        onError?.(e);
      }}
      {...props}
    />
  );
}
