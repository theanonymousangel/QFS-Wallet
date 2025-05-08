import type { User, Transaction, IncomeData } from './types';
import { subDays, formatISO } from 'date-fns';
import { DEFAULT_CURRENCY_CODE } from './currencies';

const now = new Date();

export const mockUser: User = {
  id: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: 'password123', // Added password for mock user
  country: 'US', 
  phoneNumber: '5551234', 
  balance: 12500.75,
  pendingWithdrawals: 0, 
  totalTransactions: 7, 
  accountNumber: `QFS-${String(Math.floor(Math.random() * 90000000) + 10000000)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
  selectedCurrency: DEFAULT_CURRENCY_CODE,
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '90210',
    country: 'United States',
  },
  creationDate: formatISO(subDays(now, Math.floor(Math.random() * 30) + 1)), 
  lastInterestApplied: formatISO(subDays(now, 1)), 
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

mockUser.totalTransactions = mockTransactions.length;
mockUser.pendingWithdrawals = mockTransactions.filter(tx => tx.type === 'Withdrawal' && tx.status === 'Pending').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);


export const mockIncomeData: IncomeData = {
  daily: 0, 
  weekly: 0, 
  monthly: 0, 
  yearly: 0, 
};
