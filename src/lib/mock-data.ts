import type { User, Transaction, IncomeData } from './types';

export const mockUser: User = {
  id: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phoneNumber: '555-1234',
  state: 'California',
  balance: 12500.75,
  accountNumber: 'BB-1234567890',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '90210',
    country: 'USA',
  },
};

export const mockTransactions: Transaction[] = [
  { id: 'txn1', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), description: 'Salary Deposit', amount: 5000, type: 'Deposit', status: 'Completed' },
  { id: 'txn2', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), description: 'Online Shopping - Tech Gadget', amount: -299.99, type: 'Expense', status: 'Completed' },
  { id: 'txn3', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: 'Restaurant Dinner', amount: -75.50, type: 'Expense', status: 'Completed' },
  { id: 'txn4', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: 'Freelance Project Payment', amount: 800, type: 'Income', status: 'Completed' },
  { id: 'txn5', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), description: 'ATM Withdrawal', amount: -100, type: 'Withdrawal', status: 'Completed' },
  { id: 'txn6', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), description: 'Utility Bill Payment', amount: -120.00, type: 'Expense', status: 'Completed' },
  { id: 'txn7', date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), description: 'Stock Dividend', amount: 45.25, type: 'Income', status: 'Completed' },
];

export const mockIncomeData: IncomeData = {
  daily: 25.30,
  weekly: 450.75,
  monthly: 1800.50,
  yearly: 21600.00,
};
