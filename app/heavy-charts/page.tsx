'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  name: string;
  value1: number;
  value2: number;
  value3: number;
  value4: number;
}

export default function HeavyChartsPage() {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate heavy chart data generation
    const generateChartData = () => {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      
      return months.map((name, idx) => ({
        name,
        value1: Math.floor(Math.random() * 10000) + 1000,
        value2: Math.floor(Math.random() * 10000) + 1000,
        value3: Math.floor(Math.random() * 10000) + 1000,
        value4: Math.floor(Math.random() * 10000) + 1000,
      }));
    };

    // Simulate network delay
    setTimeout(() => {
      setData(generateChartData());
      setIsLoading(false);
    }, 2500);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Loading heavy charts...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Line Chart</CardTitle>
          <CardDescription>Multi-line chart with heavy rendering</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value1" stroke="#649809" strokeWidth={2} />
              <Line type="monotone" dataKey="value2" stroke="#ef4444" />
              <Line type="monotone" dataKey="value3" stroke="#10b981" />
              <Line type="monotone" dataKey="value4" stroke="#f59e0b" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bar Chart</CardTitle>
          <CardDescription>Multi-bar chart comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value1" fill="#649809" radius={[4, 4, 0, 0]} />
              <Bar dataKey="value2" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="value3" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="value4" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Area Chart</CardTitle>
          <CardDescription>Stacked area chart</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value1" stackId="1" fill="#649809" stroke="#649809" />
              <Area type="monotone" dataKey="value2" stackId="1" fill="#ef4444" />
              <Area type="monotone" dataKey="value3" stackId="1" fill="#10b981" />
              <Area type="monotone" dataKey="value4" stackId="1" fill="#f59e0b" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
