'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Percent, CalendarDays, BarChartBig, TrendingUp } from 'lucide-react'; // Using Percent for daily
import type { IncomeData } from '@/lib/types'; // Re-using IncomeData for the structure
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { parseISO, differenceInDays } from 'date-fns';

// Define interest periods and their rates/icons for display
const interestDisplayPeriods = [
  { title: 'Daily Interest', key: 'daily', icon: Percent, rateDetails: "+0.18% of current balance" },
  { title: 'Weekly Bonus', key: 'weekly', icon: CalendarDays, rateDetails: "+0.25% added every 7 days" },
  { title: 'Monthly Bonus', key: 'monthly', icon: BarChartBig, rateDetails: "+5% added every 30 days" },
  { title: 'Yearly Bonus', key: 'yearly', icon: TrendingUp, rateDetails: "+10% added after 365 days" },
] as const;

export function InterestSection() {
  const { user } = useAuth();
  const [potentialInterests, setPotentialInterests] = useState<IncomeData>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });

  useEffect(() => {
    if (user && user.balance > 0) {
      const currentBalance = user.balance;
      const creationDate = parseISO(user.creationDate); // Assuming creationDate is available
      const today = new Date();

      // Calculate potential interest amounts for display. Actual application is in AuthContext.
      const daily = currentBalance * 0.0018;
      
      let weekly = 0;
      // Simplified check: if account older than 7 days, show potential weekly bonus
      if (differenceInDays(today, creationDate) >= 6) { // 6 full days means 7th day is reached or passed
        weekly = currentBalance * 0.0025;
      }
      
      let monthly = 0;
      // Simplified check: if account older than 30 days
      if (differenceInDays(today, creationDate) >= 29) { // 29 full days means 30th day is reached/passed
        monthly = currentBalance * 0.05;
      }
      
      let yearly = 0;
      // Simplified check: if account older than 365 days
      if (differenceInDays(today, creationDate) >= 364) { // 364 full days means 365th day is reached/passed
        yearly = currentBalance * 0.10;
      }

      setPotentialInterests({
        daily: parseFloat(daily.toFixed(2)),
        weekly: parseFloat(weekly.toFixed(2)),
        monthly: parseFloat(monthly.toFixed(2)),
        yearly: parseFloat(yearly.toFixed(2)),
      });
    } else {
      setPotentialInterests({ daily: 0, weekly: 0, monthly: 0, yearly: 0 });
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Interest Calculation Overview</CardTitle>
        <CardDescription>How interest is calculated and applied to your balance.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {interestDisplayPeriods.map((period) => (
          <Card key={period.key} className="bg-card/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{period.title}</CardTitle>
              <period.icon className={`h-4 w-4 text-primary`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(potentialInterests[period.key])}
              </div>
              <p className="text-xs text-muted-foreground">
                {period.rateDetails}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (Estimated next payout based on current balance)
              </p>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
