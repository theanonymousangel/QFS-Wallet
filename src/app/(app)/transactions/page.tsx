'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Landmark, ArrowUpDown, Filter, Info } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const getTransactionIcon = (type: Transaction['type']) => {
  switch (type) {
    case 'Income':
    case 'Deposit':
      return <ArrowUpRight className="h-5 w-5 text-green-500" />;
    case 'Expense':
      return <ArrowDownLeft className="h-5 w-5 text-red-500" />;
    case 'Withdrawal':
      return <Landmark className="h-5 w-5 text-primary" />; // Changed color to primary for consistency
    default:
      return <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />;
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

type SortKey = 'date' | 'description' | 'amount' | 'type' | 'status' | 'payoutMethod';
type SortOrder = 'asc' | 'desc';

export default function TransactionsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Transaction['type'] | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { user, setUser, updatePendingWithdrawals } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Load transactions from localStorage (or API in a real app)
    const storedTransactions = localStorage.getItem('userTransactions');
    let loadedTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
    
    // Check for pending withdrawals older than 30 days
    const now = new Date();
    let transactionsUpdated = false;
    const updatedTransactions = loadedTransactions.map(tx => {
      if (tx.type === 'Withdrawal' && tx.status === 'Pending') {
        const daysOld = differenceInDays(now, parseISO(tx.date));
        if (daysOld > 30) {
          transactionsUpdated = true;
          toast({
            title: 'Withdrawal Rejected',
            description: `Your withdrawal of ${formatCurrency(Math.abs(tx.amount))} for "${tx.description}" was rejected by your ${tx.payoutMethod === 'Bank Transfer' ? 'bank' : 'card'}. Please contact your Telegram agent.`,
            variant: 'destructive',
            duration: 10000,
          });
           // Add amount back to user's balance and remove from pending withdrawals
          if (user) {
            setUser(prevUser => {
              if (!prevUser) return null;
              return {
                ...prevUser,
                balance: prevUser.balance + Math.abs(tx.amount),
              };
            });
            updatePendingWithdrawals(Math.abs(tx.amount), 'subtract');
          }
          return { ...tx, status: 'Rejected' as 'Rejected' };
        }
      }
      return tx;
    });

    if (transactionsUpdated) {
      localStorage.setItem('userTransactions', JSON.stringify(updatedTransactions));
      setAllTransactions(updatedTransactions);
    } else {
      setAllTransactions(loadedTransactions);
    }
  }, [toast, user, setUser, updatePendingWithdrawals]);


  const filteredAndSortedTransactions = useMemo(() => {
    // Start with a unique set of transactions from allTransactions by ID
    let transactions = Array.from(new Map(allTransactions.map(tx => [tx.id, tx])).values());

    if (searchTerm) {
      transactions = transactions.filter(tx =>
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.payoutMethod && tx.payoutMethod.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      transactions = transactions.filter(tx => tx.type === filterType);
    }
    
    // Create a mutable copy for sorting
    const sortableTransactions = [...transactions];

    sortableTransactions.sort((a, b) => {
      let comparison = 0;
      const valA = a[sortKey as keyof Transaction];
      const valB = b[sortKey as keyof Transaction];

      if (valA === undefined && valB !== undefined) {
        comparison = -1; // undefined values come before defined values
      } else if (valA !== undefined && valB === undefined) {
        comparison = 1;  // defined values come after undefined values
      } else if (valA === undefined && valB === undefined) {
        comparison = 0; // both undefined, treat as equal
      } else if (sortKey === 'date') {
        comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
      } else if (sortKey === 'amount') {
        comparison = (valA as number) - (valB as number);
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = (valA as string).localeCompare(valB as string);
      }
      // Add other type-specific comparisons if necessary for other sortKeys
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sortableTransactions;
  }, [allTransactions, searchTerm, filterType, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const transactionTypes: (Transaction['type'] | 'all')[] = ['all', 'Income', 'Expense', 'Withdrawal', 'Deposit'];

  const renderPayoutDetails = (details?: Transaction['payoutMethodDetails']) => {
    if (!details) return 'N/A';
    const relevantDetails = Object.entries(details)
        .filter(([key, value]) => value && !['fullName', 'phone', 'email', 'city', 'state', 'zip'].includes(key)) // Exclude common contact details
        .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`)
        .join('\n');
    return relevantDetails || 'Details not specified';
};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Transaction History</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Review your complete financial activity. Pending withdrawals older than 30 days are automatically marked as rejected.</CardDescription>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Input
              placeholder="Search descriptions, methods..."
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
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Icon</TableHead>
                  <TableHead onClick={() => handleSort('date')} className="cursor-pointer hover:text-primary">
                    Date <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('description')} className="cursor-pointer hover:text-primary">
                    Description <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:text-primary">
                    Type <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('payoutMethod')} className="cursor-pointer hover:text-primary">
                    Method <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('amount')} className="text-right cursor-pointer hover:text-primary">
                    Amount <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                  </TableHead>
                  <TableHead onClick={() => handleSort('status')} className="text-right cursor-pointer hover:text-primary">
                    Status <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTransactions.length > 0 ? (
                  filteredAndSortedTransactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-accent/20"> {/* Lighter hover */}
                      <TableCell>{getTransactionIcon(tx.type)}</TableCell>
                      <TableCell>{format(parseISO(tx.date), 'PP pp')}</TableCell>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell>{tx.type}</TableCell>
                      <TableCell>
                        {tx.payoutMethod ? (
                           <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                                <span className="flex items-center cursor-help">
                                    {tx.payoutMethod}
                                    {tx.payoutMethodDetails && <Info className="ml-1 h-3 w-3 text-muted-foreground" />}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="whitespace-pre-line bg-popover text-popover-foreground p-2 shadow-md rounded-md">
                                <p className="text-sm">{renderPayoutDetails(tx.payoutMethodDetails)}</p>
                            </TooltipContent>
                        </Tooltip>
                        ) : ( tx.type === 'Withdrawal' ? 'N/A' : '')}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold",
                           tx.type === 'Income' || tx.type === 'Deposit' ? "text-green-600" : 
                           tx.type === 'Expense' || (tx.type === 'Withdrawal' && tx.status !== 'Rejected') ? "text-red-600" :
                           (tx.type === 'Withdrawal' && tx.status === 'Rejected') ? "text-muted-foreground" : "" // Muted if rejected withdrawal
                        )}
                      >
                        {tx.type === 'Income' || tx.type === 'Deposit' ? '+' : (tx.type === 'Expense' || tx.type === 'Withdrawal' ? '-' : '')}
                        {formatCurrency(Math.abs(tx.amount))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium border",
                          tx.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' : 
                          tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700' :
                          'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700'
                        )}>
                          {tx.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}
