export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string; // Added for simple auth, should be hashed in prod
  country: string; 
  phoneNumber?: string;
  balance: number;
  pendingWithdrawals: number; 
  totalTransactions: number; 
  accountNumber: string; 
  selectedCurrency: string; 
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string; // Country name for address context
  };
  creationDate: string; 
  lastInterestApplied: string; 
}

export interface Transaction {
  id: string;
  date: string; 
  description: string;
  amount: number; 
  type: 'Income' | 'Expense' | 'Withdrawal' | 'Deposit'; 
  status: 'Completed' | 'Pending' | 'Rejected' | 'Cancelled';
  payoutMethod?: 'Bank Transfer' | 'QFS System Card';
  payoutMethodDetails?: { 
    accountNumber?: string;
    routingNumber?: string;
    iban?: string;
    swiftCode?: string;
    memberId?: string;
    patriotNumber?: string;
    fullName?: string;
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export interface IncomeData {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

export const ADMIN_CODE = "admin2025";

