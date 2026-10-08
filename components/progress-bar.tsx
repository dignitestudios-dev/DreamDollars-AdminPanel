'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

NProgress.configure({ 
  showSpinner: false,
  speed: 400,
  easing: 'ease',
  trickleSpeed: 200,
});

export function ProgressBar() {
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);
  const progressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Detect when pathname actually changes (navigation completed)
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      
      // Clear any existing timeout
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
      }
      
      // Complete the progress bar after page loads
      NProgress.done();
    }
  }, [pathname]);

  useEffect(() => {
    // Intercept router.push to show progress bar BEFORE navigation
    const originalPush = router.push;
    const originalReplace = router.replace;

    (router.push as any) = function (this: any, href: string, options?: any) {
      NProgress.start();
      return originalPush.call(this, href, options);
    };

    (router.replace as any) = function (this: any, href: string, options?: any) {
      NProgress.start();
      return originalReplace.call(this, href, options);
    };

    return () => {
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current);
      }
    };
  }, [router]);

  return null;
}
