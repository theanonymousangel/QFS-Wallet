'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Landmark, DollarSign } from 'lucide-react'; // Added DollarSign for other types
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export function RecentTransactions() {
  const { user } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const storedTransactions = localStorage.getItem('userTransactions');
    if (storedTransactions) {
      try {
        const allTransactions: Transaction[] = JSON.parse(storedTransactions);
        
        if (!Array.isArray(allTransactions)) {
          console.error("User transactions from localStorage is not an array.");
          setRecentTransactions([]);
          return;
        }

        const validTransactions = allTransactions.filter(
          tx => tx && typeof tx.id === 'string' && typeof tx.date === 'string'
        );

        const sortedTransactions = validTransactions
          .sort((a, b) => {
            try {
              return parseISO(b.date).getTime() - parseISO(a.date).getTime();
            } catch (e) {
              // console.error("Error parsing date for sorting transactions", e, a, b);
              return 0; // Keep original order or put problematic items at end
            }
          })
          .slice(0, 3);
        
        // Deduplicate the final list of 3 (or fewer) items to ensure unique keys for React
        const finalUniqueTransactions = Array.from(new Map(sortedTransactions.map(item => [item.id, item])).values());
        setRecentTransactions(finalUniqueTransactions);

      } catch (e) {
        console.error("Failed to parse transactions from localStorage or process them:", e);
        setRecentTransactions([]);
      }
    } else {
      setRecentTransactions([]);
    }
  }, [user?.totalTransactions]); // Re-run when totalTransactions changes or user object itself changes

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'Income':
        return <ArrowUpRight className="h-5 w-5 text-green-500" />;
      case 'Deposit':
        return <DollarSign className="h-5 w-5 text-green-500" />; // Using DollarSign for Deposit as in image example
      case 'Expense':
        return <ArrowDownLeft className="h-5 w-5 text-red-500" />;
      case 'Withdrawal':
        return <Landmark className="h-5 w-5 text-primary" />;
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
          <Link href="/transactions">View All Transactions</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No recent transactions.</p>
        ) : (
          <ul className="space-y-4">
            {recentTransactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(tx.date), 'MMM dd, yyyy')} - {tx.type} 
                      {tx.status !== 'Completed' && ` (${tx.status})`}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "font-semibold",
                  tx.amount >= 0 ? "text-green-600" : 
                  (tx.amount < 0 && tx.status === 'Rejected') ? "text-muted-foreground line-through" : "text-red-600"
                )}>
                  {tx.amount >= 0 ? '+' : ''}
                  {formatCurrency(tx.amount)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

