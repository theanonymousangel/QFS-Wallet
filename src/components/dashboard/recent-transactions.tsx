'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Landmark } from 'lucide-react';
import type { Transaction } from '@/lib/types';
// Removed mockTransactions import, will use localStorage or context
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';

export function RecentTransactions() {
  const [recentWithdrawals, setRecentWithdrawals] = useState<Transaction[]>([]);

  useEffect(() => {
    // Load transactions from localStorage
    const storedTransactions = localStorage.getItem('userTransactions');
    if (storedTransactions) {
      const allTransactions: Transaction[] = JSON.parse(storedTransactions);
      // Filter for withdrawals, sort by date descending, take top 3
      const withdrawals = allTransactions
        .filter(tx => tx.type === 'Withdrawal')
        .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
        .slice(0, 3);
      setRecentWithdrawals(withdrawals);
    }
  }, []); // Runs once on mount, and if we add a dependency for transactions updates

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'Income':
      case 'Deposit':
        return <ArrowUpRight className="h-5 w-5 text-green-500" />;
      case 'Expense':
        return <ArrowDownLeft className="h-5 w-5 text-red-500" />;
      case 'Withdrawal':
        return <Landmark className="h-5 w-5 text-primary" />; // Changed color
      default:
        return <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };


  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Withdrawals</CardTitle>
          <CardDescription>Your latest 3 withdrawal activities.</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/transactions">View All Transactions</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentWithdrawals.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No recent withdrawals.</p>
        ) : (
          <ul className="space-y-4">
            {recentWithdrawals.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(tx.date), 'MMM dd, yyyy')} - {tx.status}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "font-semibold",
                  tx.status === 'Rejected' ? "text-muted-foreground line-through" : "text-red-600" // Assuming withdrawals are negative
                )}>
                  {/* Withdrawals are typically negative, so show absolute and a minus sign */}
                  -{formatCurrency(Math.abs(tx.amount))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
