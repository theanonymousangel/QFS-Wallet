'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CalendarDays, BarChartBig, TrendingUp } from 'lucide-react';
import type { IncomeData } from '@/lib/types';
import { mockIncomeData } from '@/lib/mock-data'; // Using mock data

const incomePeriods = [
  { title: 'Daily Income', key: 'daily', icon: DollarSign, color: 'text-green-500' },
  { title: 'Weekly Income', key: 'weekly', icon: CalendarDays, color: 'text-blue-500' },
  { title: 'Monthly Income', key: 'monthly', icon: BarChartBig, color: 'text-purple-500' },
  { title: 'Yearly Income', key: 'yearly', icon: TrendingUp, color: 'text-yellow-500' },
] as const;


export function IncomeOverview() {
  const incomeData: IncomeData = mockIncomeData; // In a real app, this would come from props or context/API

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Income Overview</CardTitle>
        <CardDescription>Your estimated income across different periods.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {incomePeriods.map((period) => (
          <Card key={period.key} className="bg-card/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{period.title}</CardTitle>
              <period.icon className={`h-4 w-4 ${period.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(incomeData[period.key])}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on recent activity
              </p>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
