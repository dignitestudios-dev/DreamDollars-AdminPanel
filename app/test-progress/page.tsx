'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface LoadingTime {
  page: string;
  simulatedDelay: number;
}

export default function TestProgressPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadingPages: LoadingTime[] = [
    { page: 'Heavy Data Table', simulatedDelay: 2000 },
    { page: 'Heavy Charts', simulatedDelay: 2500 },
  ];

  if (!mounted) return null;

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Progress Bar Testing</CardTitle>
          <CardDescription>
            Click on any link below to navigate to a page with delayed loading. Watch the progress bar at the top!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loadingPages.map((item) => (
              <Link
                key={item.page}
                href={item.page === 'Heavy Data Table' ? '/heavy-data' : '/heavy-charts'}
                className="block"
              >
                <div className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                  <h3 className="font-semibold text-lg">{item.page}</h3>
                  <p className="text-sm text-muted-foreground">
                    Simulated loading time: {item.simulatedDelay / 1000} seconds
                  </p>
                </div>
              </Link>
            ))}

            <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <h4 className="font-semibold text-foreground mb-2">💡 Tips:</h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Watch the green progress bar at the top of the page</li>
                <li>• Try navigating between different pages</li>
                <li>• Try using browser back/forward buttons</li>
                <li>• The progress bar simulates page load time</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
