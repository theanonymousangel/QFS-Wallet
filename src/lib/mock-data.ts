import type { User, Transaction, IncomeData } from './types';
import { subDays, formatISO } from 'date-fns';
import { DEFAULT_CURRENCY_CODE } from './currencies';

const now = new Date();

export const mockUser: User = {
  id: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  country: 'United States', // Changed 'USA' to 'United States'
  phoneNumber: '555-1234', // This will be normalized in AuthContext or form
  balance: 12500.75,
  pendingWithdrawals: 0, // Initialize pending withdrawals
  totalTransactions: 7, // Initialize based on current mock transactions
  accountNumber: `QFS-${String(Math.floor(Math.random() * 90000000) + 10000000)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
  selectedCurrency: DEFAULT_CURRENCY_CODE,
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '90210',
  },
  creationDate: formatISO(subDays(now, Math.floor(Math.random() * 30) + 1)), // Random creation date in the last month
  lastInterestApplied: formatISO(subDays(now, 1)), // Assume interest was applied yesterday
};

export const mockTransactions: Transaction[] = [
  { 
    id: 'txn1', 
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
    description: 'Salary Deposit', 
    amount: 5000, 
    type: 'Deposit', 
    status: 'Completed' 
  },
  { 
    id: 'txn2', 
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
    description: 'Online Shopping - Tech Gadget', 
    amount: -299.99, 
    type: 'Expense', 
    status: 'Completed' 
  },
  { 
    id: 'txn3', 
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
    description: 'Restaurant Dinner', 
    amount: -75.50, 
    type: 'Expense', 
    status: 'Completed' 
  },
  { 
    id: 'txn4', 
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
    description: 'Freelance Project Payment', 
    amount: 800, 
    type: 'Income', 
    status: 'Completed' 
  },
  { 
    id: 'txn5', 
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), 
    description: 'ATM Withdrawal', 
    amount: -100, 
    type: 'Withdrawal', 
    status: 'Completed',
    payoutMethod: 'Bank Transfer',
    payoutMethodDetails: { accountNumber: '****1234', routingNumber: '****5678'}
  },
  { 
    id: 'txn6', 
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), 
    description: 'Utility Bill Payment', 
    amount: -120.00, 
    type: 'Expense', 
    status: 'Completed' 
  },
  { 
    id: 'txn7', 
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), 
    description: 'Stock Dividend', 
    amount: 45.25, 
    type: 'Income', 
    status: 'Completed' 
  },
];

// Calculate initial totalTransactions for mockUser based on mockTransactions length
mockUser.totalTransactions = mockTransactions.length;
// Calculate initial pendingWithdrawals for mockUser
mockUser.pendingWithdrawals = mockTransactions.filter(tx => tx.type === 'Withdrawal' && tx.status === 'Pending').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);


export const mockIncomeData: IncomeData = {
  daily: 0, // Will be calculated dynamically
  weekly: 0, // Will be calculated dynamically
  monthly: 0, // Will be calculated dynamically
  yearly: 0, // Will be calculated dynamically
};

