
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CalendarDays, BarChartBig, TrendingUp } from 'lucide-react';
import type { IncomeData } from '@/lib/types';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState, useRef } from 'react';
import { parseISO, differenceInDays } from 'date-fns';
import { findCurrencyByCode, getDefaultCurrency } from '@/lib/currencies';

const incomePeriods = [
  { title: 'Daily Income', key: 'daily', icon: DollarSign, description: "Based on recent activity" },
  { title: 'Weekly Income', key: 'weekly', icon: CalendarDays, description: "Based on recent activity" },
  { title: 'Monthly Income', key: 'monthly', icon: BarChartBig, description: "Based on recent activity" },
  { title: 'Yearly Income', key: 'yearly', icon: TrendingUp, description: "Based on recent activity" },
] as const;

type IncomePeriodKey = typeof incomePeriods[number]['key'];

export function IncomeOverview() {
  const { user } = useAuth();
  const [calculatedInterests, setCalculatedInterests] = useState<IncomeData>({
    daily: 0,
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [fontSizes, setFontSizes] = useState<Record<IncomePeriodKey, string>>({
    daily: 'text-2xl',
    weekly: 'text-2xl',
    monthly: 'text-2xl',
    yearly: 'text-2xl',
  });

  const containerRefs = {
    daily: useRef<HTMLDivElement>(null),
    weekly: useRef<HTMLDivElement>(null),
    monthly: useRef<HTMLDivElement>(null),
    yearly: useRef<HTMLDivElement>(null),
  };
  const measuringSpanRef = useRef<HTMLSpanElement>(null);
  
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

  useEffect(() => {
    if (!measuringSpanRef.current) return;
    const measureEl = measuringSpanRef.current;
    const availableSizes = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm'];
    const newFontSizes: Record<IncomePeriodKey, string> = { ...fontSizes };

    incomePeriods.forEach(period => {
      const containerEl = containerRefs[period.key].current;
      const formattedAmount = formatCurrency(calculatedInterests[period.key]);

      if (containerEl && formattedAmount) {
        measureEl.textContent = formattedAmount;
        let newOptimalSize = availableSizes[availableSizes.length - 1];

        for (const sizeClass of availableSizes) {
          measureEl.className = `font-bold whitespace-nowrap ${sizeClass}`;
          if (measureEl.scrollWidth <= containerEl.clientWidth - 5) { // -5 for a little padding
            newOptimalSize = sizeClass;
            break;
          }
        }
        newFontSizes[period.key] = newOptimalSize;
      }
    });
    setFontSizes(newFontSizes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedInterests, selectedUserCurrency.code]); // Dependencies updated

  return (
    <>
      <span
        ref={measuringSpanRef}
        className="font-bold"
        style={{ position: 'absolute', visibility: 'hidden', height: 'auto', width: 'auto', whiteSpace: 'nowrap', zIndex: -1 }}
      ></span>
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
                <div ref={containerRefs[period.key]} className="min-w-0 flex-1">
                  <div className={`font-bold text-foreground whitespace-nowrap ${fontSizes[period.key]} truncate`}>
                    {formatCurrency(calculatedInterests[period.key])}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  {period.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
