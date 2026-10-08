'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DataItem {
  id: number;
  name: string;
  email: string;
  amount: number;
  status: string;
  date: string;
}

export default function HeavyDataPage() {
  const [data, setData] = useState<DataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate heavy data processing
    const generateData = () => {
      const items: DataItem[] = [];
      const statuses = ['Active', 'Inactive', 'Pending', 'Completed'];
      
      for (let i = 1; i <= 1000; i++) {
        items.push({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          amount: Math.floor(Math.random() * 10000),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        });
      }
      return items;
    };

    // Simulate network delay
    setTimeout(() => {
      setData(generateData());
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Loading 1000 rows of data...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Heavy Data Table</CardTitle>
          <CardDescription>1000 rows of data - Heavy rendering test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-sm">{item.email}</TableCell>
                    <TableCell>${item.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'Completed'
                              ? 'bg-blue-100 text-blue-800'
                              : item.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{item.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
