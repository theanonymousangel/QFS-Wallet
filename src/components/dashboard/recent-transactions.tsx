'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Landmark } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { mockTransactions } from '@/lib/mock-data'; // Using mock data
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export function RecentTransactions() {
  const transactions: Transaction[] = mockTransactions.slice(0, 3); // Get last 3

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'Income':
      case 'Deposit':
        return <ArrowUpRight className="h-5 w-5 text-green-500" />;
      case 'Expense':
        return <ArrowDownLeft className="h-5 w-5 text-red-500" />;
      case 'Withdrawal':
        return <Landmark className="h-5 w-5 text-blue-500" />;
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
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activities.</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/transactions">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No recent transactions.</p>
        ) : (
          <ul className="space-y-4">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(tx.date), 'MMM dd, yyyy')} - {tx.type}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "font-semibold",
                  tx.amount > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
