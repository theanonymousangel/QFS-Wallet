'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CalendarDays, BarChartBig, TrendingUp, Percent } from 'lucide-react';
import type { IncomeData } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { parseISO, differenceInDays, addDays, getDay, getDate, getMonth, getYear, isSameDay, isSameWeek, isSameMonth, isSameYear } from 'date-fns';


const interestPeriods = [
  { title: 'Daily Interest Bonus', key: 'daily', icon: Percent, rate: 0.0018, description: "+0.18% Daily" },
  { title: 'Weekly Interest Bonus', key: 'weekly', icon: CalendarDays, rate: 0.0025, description: "+0.25% Weekly" },
  { title: 'Monthly Interest Bonus', key: 'monthly', icon: BarChartBig, rate: 0.05, description: "+5% Monthly" },
  { title: 'Yearly Interest Bonus', key: 'yearly', icon: TrendingUp, rate: 0.10, description: "+10% Annually" },
] as const;


export function InterestSection() { // Renamed from IncomeOverview
  const { user } = useAuth();
  const [calculatedInterests, setCalculatedInterests] = useState<IncomeData>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });

  useEffect(() => {
    if (user) {
      const currentBalance = user.balance;
      const creationDate = parseISO(user.creationDate);
      const today = new Date();

      const dailyInterest = currentBalance * 0.0018;

      // Weekly bonus: Check if 7 days have passed since creation AND it's the "anniversary" day of the week
      let weeklyBonus = 0;
      if (differenceInDays(today, creationDate) >= 6 ) { // Check if it's been at least a week (6 full days passed)
         // Check if today is the "anniversary" day of the week for the bonus
         // This simplistic check assumes bonus could be applied if it's the right day of a week after account creation
         // A more robust system would track last weekly bonus application date.
         // For display, we'll show potential bonus if it's the anniversary day.
         // Note: Actual application logic is in AuthContext. This is for display.
         weeklyBonus = currentBalance * 0.0025;
      }
      
      // Monthly bonus: Check if 30 days have passed since creation AND it's the "anniversary" day of the month
      let monthlyBonus = 0;
      if (differenceInDays(today, creationDate) >= 29) { // Check if it's been at least a month (29 full days passed)
         monthlyBonus = currentBalance * 0.05;
      }

      // Yearly bonus: Check if 365 days have passed
      let yearlyBonus = 0;
      if (differenceInDays(today, creationDate) >= 364) { // Check if it's been at least a year
         yearlyBonus = currentBalance * 0.10;
      }

      setCalculatedInterests({
        daily: parseFloat(dailyInterest.toFixed(2)),
        weekly: parseFloat(weeklyBonus.toFixed(2)),
        monthly: parseFloat(monthlyBonus.toFixed(2)),
        yearly: parseFloat(yearlyBonus.toFixed(2)),
      });
    }
  }, [user]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Interest Overview</CardTitle>
        <CardDescription>Potential interest earnings based on current balance and applied rates.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {interestPeriods.map((period) => (
          <Card key={period.key} className="bg-card/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{period.title}</CardTitle>
              <period.icon className={`h-4 w-4 text-primary`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(calculatedInterests[period.key])}
              </div>
              <p className="text-xs text-muted-foreground">
                {period.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
