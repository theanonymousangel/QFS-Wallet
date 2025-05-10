
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Landmark, ArrowUpDown, Filter, Info, XCircle, Trash2, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
import { findCurrencyByCode, getDefaultCurrency } from '@/lib/currencies';

const getTransactionIcon = (tx: Transaction) => {
  switch (tx.type) {
    case 'Income':
    case 'Deposit':
      return <ArrowUpRight className="h-5 w-5 text-green-500" />;
    case 'Expense':
      return <ArrowDownLeft className="h-5 w-5 text-red-500" />;
    case 'Withdrawal':
      if (tx.payoutMethod === 'QFS System Card') {
        return <CreditCard className="h-5 w-5 text-primary" />;
      }
      return <Landmark className="h-5 w-5 text-primary" />; 
    default:
      return <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />;
  }
};

type SortKey = 'date' | 'description' | 'amount' | 'type' | 'status' | 'payoutMethod';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Transaction['type'] | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { user, setUser, updatePendingWithdrawals } = useAuth();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  const selectedUserCurrency = user ? (findCurrencyByCode(user.selectedCurrency) || getDefaultCurrency()) : getDefaultCurrency();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: selectedUserCurrency.code,
      currencyDisplay: 'symbol' 
    }).format(amount);
  };


  useEffect(() => {
    const storedTransactions = localStorage.getItem('userTransactions');
    let loadedTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
    
    const now = new Date();
    let transactionsUpdated = false;

    const updatedTransactions = loadedTransactions.map(tx => {
      if (tx.status === 'Pending') { 
        const daysOld = differenceInDays(now, parseISO(tx.date));
        if (daysOld > 30) {
          transactionsUpdated = true;
          
          let toastTitle = 'Transaction Rejected';
          let toastDescription = `Your transaction "${tx.description}" for ${formatCurrency(Math.abs(tx.amount))} was automatically rejected after 30 days.`;

          if (tx.type === 'Withdrawal') {
            toastTitle = 'Withdrawal Rejected';
            toastDescription = `Your withdrawal of ${formatCurrency(Math.abs(tx.amount))} for "${tx.description}" was rejected by your ${tx.payoutMethod === 'Bank Transfer' ? 'bank' : 'card'}. Please contact your Telegram agent.`;
            
            if (user) {
              setUser(prevUser => {
                if (!prevUser) return null;
                const newBalance = prevUser.balance + Math.abs(tx.amount);
                const updatedUser = {
                  ...prevUser,
                  balance: parseFloat(newBalance.toFixed(2)),
                };
                localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
                return updatedUser;
              });
              updatePendingWithdrawals(Math.abs(tx.amount), 'subtract'); 
            }
          }
          
          toast({
            title: toastTitle,
            description: toastDescription,
            variant: 'destructive',
            duration: 10000,
          });
          return { ...tx, status: 'Rejected' as 'Rejected' };
        }
      }
      return tx;
    });

    if (transactionsUpdated) {
      localStorage.setItem('userTransactions', JSON.stringify(updatedTransactions));
      setAllTransactions(updatedTransactions);
    } else {
      // Ensure unique IDs before setting state, even if no updates
      const uniqueTransactions = Array.from(new Map(loadedTransactions.map(item => [`${item.id}-${item.date}-${item.amount}`, item])).values());
      setAllTransactions(uniqueTransactions);
    }
  }, [toast, user, setUser, updatePendingWithdrawals, selectedUserCurrency.code]);


  const filteredAndSortedTransactions = useMemo(() => {
    let transactions = Array.from(new Map(allTransactions.map(tx => [`${tx.id}-${tx.date}-${tx.amount}`, tx])).values());

    if (searchTerm) {
      transactions = transactions.filter(tx =>
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.payoutMethod && tx.payoutMethod.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterType !== 'all') {
      transactions = transactions.filter(tx => tx.type === filterType);
    }
    
    const sortableTransactions = [...transactions];

    sortableTransactions.sort((a, b) => {
      let comparison = 0;
      const valA = a[sortKey as keyof Transaction];
      const valB = b[sortKey as keyof Transaction];

      if (valA === undefined && valB !== undefined) {
        comparison = -1; 
      } else if (valA !== undefined && valB === undefined) {
        comparison = 1;  
      } else if (valA === undefined && valB === undefined) {
        comparison = 0; 
      } else if (sortKey === 'date') {
        comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
      } else if (sortKey === 'amount') {
        comparison = (valA as number) - (valB as number);
      } else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = (valA as string).localeCompare(valB as string);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sortableTransactions;
  }, [allTransactions, searchTerm, filterType, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedTransactions.length / ITEMS_PER_PAGE));

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(startIndex, endIndex);
  }, [filteredAndSortedTransactions, currentPage]);


  const handleSort = (newSortKey: SortKey) => {
    if (sortKey === newSortKey) {
      // Toggle order if same key
      setSortOrder(prevSortOrder => prevSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New key selected
      setSortKey(newSortKey);
      // Set order: if new key is 'date', default to 'desc', otherwise 'asc'
      setSortOrder(newSortKey === 'date' ? 'desc' : 'asc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const handleCancelTransaction = async (transactionId: string) => {
    const txToCancel = allTransactions.find(tx => tx.id === transactionId);

    if (!txToCancel) {
      toast({ title: "Error", description: "Transaction not found.", variant: "destructive" });
      return;
    }

    if (txToCancel.status !== 'Pending') {
      toast({ title: "Cannot Cancel", description: "Only pending transactions can be cancelled.", variant: "destructive" });
      return;
    }

    const updatedTransactions = allTransactions.map(tx =>
      tx.id === transactionId ? { ...tx, status: 'Cancelled' as 'Cancelled' } : tx
    );
    setAllTransactions(updatedTransactions);
    localStorage.setItem('userTransactions', JSON.stringify(updatedTransactions));

    if (user && txToCancel.type === 'Withdrawal') {
      const amountToRefund = Math.abs(txToCancel.amount);
      
      setUser(prevUser => {
        if (!prevUser) return null;
        const newBalance = prevUser.balance + amountToRefund;
        const updatedUser = {
          ...prevUser,
          balance: parseFloat(newBalance.toFixed(2)),
        };
        localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
        return updatedUser;
      });
  
      updatePendingWithdrawals(amountToRefund, 'subtract');
    }

    toast({
      title: 'Transaction Cancelled',
      description: `Transaction "${txToCancel.description}" has been cancelled.`,
    });
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    const txToDelete = allTransactions.find(tx => tx.id === transactionId);

    if (!txToDelete) {
      toast({ title: "Error", description: "Transaction not found.", variant: "destructive" });
      return;
    }

    if (txToDelete.status !== 'Rejected' && txToDelete.status !== 'Cancelled') {
      toast({ title: "Cannot Delete", description: "Only rejected or cancelled transactions can be deleted.", variant: "destructive" });
      return;
    }

    const updatedTransactions = allTransactions.filter(tx => tx.id !== transactionId);
    setAllTransactions(updatedTransactions);
    localStorage.setItem('userTransactions', JSON.stringify(updatedTransactions));

    if (user) {
      setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = {
          ...prevUser,
          totalTransactions: Math.max(0, prevUser.totalTransactions - 1),
        };
        localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
        return updatedUser;
      });
    }

    toast({
      title: 'Transaction Deleted',
      description: `Transaction "${txToDelete.description}" has been permanently deleted.`,
    });
  };


  const transactionTypes: (Transaction['type'] | 'all')[] = ['all', 'Income', 'Expense', 'Withdrawal', 'Deposit'];

  const renderPayoutDetails = (details?: Transaction['payoutMethodDetails']) => {
    if (!details) return 'N/A';
    const relevantDetails = Object.entries(details)
        .filter(([key, value]) => value && !['fullName', 'phone', 'email', 'city', 'state', 'zip'].includes(key)) 
        .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`)
        .join('\n');
    return relevantDetails || 'Details not specified';
};

const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
};

const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Transaction History</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Review your complete financial activity.
          </CardDescription>
          
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Input
              placeholder="Search descriptions, methods..."
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="max-w-xs w-full sm:w-auto"
            />
            <Select value={filterType} onValueChange={(value: Transaction['type'] | 'all') => {setFilterType(value); setCurrentPage(1);}}>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] min-w-[60px] hidden sm:table-cell">Icon</TableHead>
                    <TableHead onClick={() => handleSort('date')} className="cursor-pointer hover:text-primary min-w-[130px]">
                      Date <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                    </TableHead>
                    <TableHead onClick={() => handleSort('description')} className="cursor-pointer hover:text-primary min-w-[120px] sm:min-w-[180px] lg:min-w-[250px]">
                      Description <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                    </TableHead>
                    <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:text-primary min-w-[100px] hidden md:table-cell">
                      Type <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                    </TableHead>
                    <TableHead onClick={() => handleSort('payoutMethod')} className="cursor-pointer hover:text-primary min-w-[120px] hidden lg:table-cell">
                      Method <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                    </TableHead>
                    <TableHead onClick={() => handleSort('amount')} className="text-right cursor-pointer hover:text-primary min-w-[100px] sm:min-w-[120px]">
                      Amount <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                    </TableHead>
                    <TableHead onClick={() => handleSort('status')} className="text-center cursor-pointer hover:text-primary min-w-[90px] table-cell">
                      Status <ArrowUpDown className="ml-1 inline-block h-4 w-4" />
                    </TableHead>
                    <TableHead className="text-right min-w-[80px] sm:min-w-[120px]">Actions</TableHead> {/* Adjusted min-width for actions */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((tx) => (
                      <TableRow key={`${tx.id}-${tx.date}-${tx.amount}`} className="hover:bg-accent/20">
                        <TableCell className="hidden sm:table-cell">{getTransactionIcon(tx)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{format(parseISO(tx.date), 'PP')}</span>
                            <span className="text-xs text-muted-foreground">{format(parseISO(tx.date), 'p')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {tx.description}
                           {/* Mobile/Tablet specific info for Type and Method */}
                            <div className="mt-1">
                                <span className="text-xs text-muted-foreground md:hidden block">Type: {tx.type}</span>
                                {tx.payoutMethod && (
                                <span className="text-xs text-muted-foreground lg:hidden block">
                                    Method: {tx.payoutMethod}
                                </span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{tx.type}</TableCell>
                        <TableCell className="hidden lg:table-cell">
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
                             tx.type === 'Expense' || (tx.type === 'Withdrawal' && tx.status !== 'Rejected' && tx.status !== 'Cancelled') ? "text-red-600" :
                             (tx.type === 'Withdrawal' && (tx.status === 'Rejected' || tx.status === 'Cancelled')) ? "text-muted-foreground line-through" :
                             (tx.status === 'Rejected' || tx.status === 'Cancelled' ? "text-muted-foreground line-through" : "")
                          )}
                        >
                          {tx.type === 'Income' || tx.type === 'Deposit' ? '+' : (tx.type === 'Expense' || tx.type === 'Withdrawal' ? '-' : '')}
                          {formatCurrency(Math.abs(tx.amount))}
                        </TableCell>
                        <TableCell className="text-center table-cell">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium border",
                            tx.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' : 
                            tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700' :
                            tx.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700' :
                            'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700' // Style for 'Cancelled'
                          )}>
                            {tx.status === 'Pending' ? 'Processing' : tx.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center space-x-1"> {/* Adjusted space-x for all screens */}
                            {tx.status === 'Pending' && (
                              <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80 h-8 px-2">
                                  <XCircle className="mr-1 h-4 w-4" /> 
                                  <span className="inline">Cancel</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action will cancel the pending transaction: "{tx.description}" for {formatCurrency(Math.abs(tx.amount))}.
                                    {tx.type === 'Withdrawal' && " The amount will be returned to your main balance."}
                                    This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Back</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancelTransaction(tx.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Yes, Cancel Transaction
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            )}
                            {(tx.status === 'Rejected' || tx.status === 'Cancelled') && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80 h-8 px-2">
                                        <Trash2 className="mr-1 h-4 w-4" /> 
                                        <span className="inline">Delete</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will permanently delete the transaction: "{tx.description}" for {formatCurrency(Math.abs(tx.amount))}.
                                            This action cannot be undone.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDeleteTransaction(tx.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Yes, Delete Transaction
                                        </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
          {filteredAndSortedTransactions.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
