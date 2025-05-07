export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string; // Added country at top level
  phoneNumber?: string;
  // state is part of address object now
  balance: number;
  pendingWithdrawals: number; // Added pending withdrawals
  totalTransactions: number; // Added total transactions count
  accountNumber: string; 
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    // country is now top-level, but can remain here for detailed address context
  };
  creationDate: string; // ISO string, for interest calculation
  lastInterestApplied: string; // ISO string, to track last interest application
  // Password is not stored here, handled by auth logic
}

export interface Transaction {
  id: string;
  date: string; // ISO string or formatted date string
  description: string;
  amount: number; // Positive for income, negative for expenses
  type: 'Income' | 'Expense' | 'Withdrawal' | 'Deposit'; // Withdrawal is the primary type for now
  status: 'Completed' | 'Pending' | 'Rejected';
  payoutMethod?: 'Bank Transfer' | 'QFS System Card';
  payoutMethodDetails?: { // Store details based on method
    // Bank Transfer - US
    accountNumber?: string;
    routingNumber?: string;
    // Bank Transfer - International
    iban?: string;
    swiftCode?: string;
    // QFS System Card
    memberId?: string;
    patriotNumber?: string;
    // Common details for admin notification
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
