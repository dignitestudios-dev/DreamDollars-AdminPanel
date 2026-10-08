'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.success('Internet Connection Restored', {
          description: 'You are back online and your session is active.',
          icon: <Wifi className="h-4 w-4 text-emerald-500" />,
        });
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.error('Connection Lost', {
        description: 'You are currently offline. Check your network connection.',
        icon: <WifiOff className="h-4 w-4 text-rose-500" />,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (isOnline) return null;

  return (
    <aside
      aria-label="Offline status banner"
      className="fixed top-0 inset-x-0 z-[100] bg-rose-600 text-white text-xs py-1.5 px-4 flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top-2"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span className="font-medium">
        You are currently offline. Changes may not be saved until your internet connection is restored.
      </span>
    </aside>
  );
}
