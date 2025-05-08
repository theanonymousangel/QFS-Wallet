
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CalendarDays, BarChartBig, TrendingUp } from 'lucide-react';
import type { IncomeData } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';
import { parseISO, differenceInDays } from 'date-fns';
import { findCurrencyByCode, getDefaultCurrency } from '@/lib/currencies';

const incomePeriods = [
  { title: 'Daily Income', key: 'daily', icon: DollarSign, description: "Based on recent activity" },
  { title: 'Weekly Income', key: 'weekly', icon: CalendarDays, description: "Based on recent activity" },
  { title: 'Monthly Income', key: 'monthly', icon: BarChartBig, description: "Based on recent activity" },
  { title: 'Yearly Income', key: 'yearly', icon: TrendingUp, description: "Based on recent activity" },
] as const;


export function IncomeOverview() {
  const { user } = useAuth();
  const [calculatedInterests, setCalculatedInterests] = useState<IncomeData>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  
  const selectedUserCurrency = user ? (findCurrencyByCode(user.selectedCurrency) || getDefaultCurrency()) : getDefaultCurrency();


  useEffect(() => {
    if (user && user.balance > 0) {
      const currentBalance = user.balance;
      const creationDate = parseISO(user.creationDate);
      const today = new Date();

      const daily = currentBalance * 0.0018;
      let weekly = 0;
      if (differenceInDays(today, creationDate) >= 6) { 
         weekly = currentBalance * 0.0025;
      }
      
      let monthly = 0;
      if (differenceInDays(today, creationDate) >= 29) { 
         monthly = currentBalance * 0.05;
      }

      let yearly = 0;
      if (differenceInDays(today, creationDate) >= 364) { 
         yearly = currentBalance * 0.10;
      }

      setCalculatedInterests({
        daily: parseFloat(daily.toFixed(2)),
        weekly: parseFloat(weekly.toFixed(2)),
        monthly: parseFloat(monthly.toFixed(2)),
        yearly: parseFloat(yearly.toFixed(2)),
      });
    } else {
       setCalculatedInterests({ daily: 0, weekly: 0, monthly: 0, yearly: 0 });
    }
  }, [user]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: selectedUserCurrency.code,
      currencyDisplay: 'symbol',
    }).format(amount);
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
              <period.icon className={`h-4 w-4 text-primary`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(calculatedInterests[period.key])}
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {period.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
