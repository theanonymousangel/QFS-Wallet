export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  state?: string;
  balance: number;
  accountNumber: string; // Mock account number
  // For settings page
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  // Password is not stored here, handled by auth logic
}

export interface Transaction {
  id: string;
  date: string; // ISO string or formatted date string
  description: string;
  amount: number; // Positive for income, negative for expenses
  type: 'Income' | 'Expense' | 'Withdrawal' | 'Deposit';
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface IncomeData {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}
