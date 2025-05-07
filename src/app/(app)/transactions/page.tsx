'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Landmark, ArrowUpDown, Filter } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { mockTransactions } from '@/lib/mock-data'; // Using mock data
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Metadata } from 'next';

// This metadata would ideally be in a server component or a head.tsx file, but for client components, we can't use it directly.
// export const metadata: Metadata = {
//   title: 'Transactions - Main Wallet',
//   description: 'View your complete transaction history.',
// };


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

type SortKey = 'date' | 'description' | 'amount' | 'type';
type SortOrder = 'asc' | 'desc';

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Transaction['type'] | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredAndSortedTransactions = useMemo(() => {
    let transactions = [...mockTransactions];

    if (searchTerm) {
      transactions = transactions.filter(tx =>
        tx.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      transactions = transactions.filter(tx => tx.type === filterType);
    }

    transactions.sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortKey === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortKey === 'description' || sortKey === 'type') {
        comparison = a[sortKey].localeCompare(b[sortKey]);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return transactions;
  }, [searchTerm, filterType, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const transactionTypes: (Transaction['type'] | 'all')[] = ['all', 'Income', 'Expense', 'Withdrawal', 'Deposit'];


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Transaction History</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Review your complete financial activity.</CardDescription>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Input
              placeholder="Search descriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterType} onValueChange={(value: Transaction['type'] | 'all') => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map(type => (
                  <SelectItem key={type} value={type}>{type === 'all' ? 'All Types' : type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Icon</TableHead>
                <TableHead onClick={() => handleSort('date')} className="cursor-pointer hover:text-primary">
                  Date <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                </TableHead>
                <TableHead onClick={() => handleSort('description')} className="cursor-pointer hover:text-primary">
                  Description <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                </TableHead>
                <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:text-primary">
                  Type <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                </TableHead>
                <TableHead onClick={() => handleSort('amount')} className="text-right cursor-pointer hover:text-primary">
                  Amount <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                </TableHead>
                 <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTransactions.length > 0 ? (
                filteredAndSortedTransactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-accent/30">
                    <TableCell>{getTransactionIcon(tx.type)}</TableCell>
                    <TableCell>{format(new Date(tx.date), 'PP')}</TableCell>
                    <TableCell className="font-medium">{tx.description}</TableCell>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        tx.amount > 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </TableCell>
                     <TableCell className="text-right">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        tx.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                        tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      )}>
                        {tx.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
