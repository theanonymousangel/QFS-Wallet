
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { mockUser, mockTransactions } from '@/lib/mock-data';
import type { User, Transaction } from '@/lib/types';
import { ADMIN_CODE } from '@/lib/types';
import { formatISO, parseISO, differenceInDays, addDays, addMonths, addYears } from 'date-fns';
import { findCountryByIsoCode, COUNTRIES_LIST } from '@/lib/countries';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string, isMock?: boolean) => Promise<boolean>;
  logout: () => void;
  signup: (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'pendingWithdrawals' | 'totalTransactions' | 'creationDate' | 'lastInterestApplied'> & { initialBalance: number, selectedCurrency: string }) => Promise<boolean>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  addTransaction: (transactionDetails: Omit<Transaction, 'id' | 'date' | 'status'>) => void;
  updatePendingWithdrawals: (amount: number, action: 'add' | 'subtract') => void;
  updateUserBalance: (newBalance: number, adminCodeAttempt: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to generate a QFS-style account number
const generateQFSAccountNumber = (): string => {
  const part1 = String(Math.floor(Math.random() * 90000000) + 10000000); // 8 digits
  const part2 = String(Math.floor(Math.random() * 9000) + 1000);       // 4 digits
  return `QFS-${part1}${part2}`;
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const initializeUserSession = useCallback((userData: User, isMockLogin: boolean = false) => {
    const now = new Date();
    let userToStore = { ...userData };

    // Apply interest logic if not a mock login (initial load)
    // For actual login/signup, interest calculation should be based on stored lastInterestApplied
    if (!isMockLogin && userToStore.lastInterestApplied) {
        let lastAppliedDate = parseISO(userToStore.lastInterestApplied);
        let balanceChanged = false;
        let newTransactions: Transaction[] = [];

        // Daily interest processing
        while (differenceInDays(now, lastAppliedDate) >= 1) {
            const dailyInterest = userToStore.balance * 0.0018;
            userToStore.balance += dailyInterest;
            lastAppliedDate = addDays(lastAppliedDate, 1);
            userToStore.lastInterestApplied = formatISO(lastAppliedDate);
            balanceChanged = true;
            newTransactions.push({
                id: `txn-${Date.now()}-daily-${Math.random().toString(36).substr(2, 9)}`,
                date: formatISO(lastAppliedDate),
                description: 'Daily Interest Applied',
                amount: dailyInterest,
                type: 'Income',
                status: 'Completed',
            });

            // Weekly bonus check (every 7 days from creation)
            const daysSinceCreationForWeekly = differenceInDays(lastAppliedDate, parseISO(userToStore.creationDate));
            if (daysSinceCreationForWeekly > 0 && daysSinceCreationForWeekly % 7 === 0) {
                const weeklyBonus = userToStore.balance * 0.0025;
                userToStore.balance += weeklyBonus;
                balanceChanged = true;
                 newTransactions.push({
                    id: `txn-${Date.now()}-weekly-${Math.random().toString(36).substr(2, 9)}`,
                    date: formatISO(lastAppliedDate),
                    description: 'Weekly Bonus Applied',
                    amount: weeklyBonus,
                    type: 'Income',
                    status: 'Completed',
                });
            }

            // Monthly bonus check (every 30 days from creation)
            const daysSinceCreationForMonthly = differenceInDays(lastAppliedDate, parseISO(userToStore.creationDate));
            if (daysSinceCreationForMonthly > 0 && daysSinceCreationForMonthly % 30 === 0) {
                const monthlyBonus = userToStore.balance * 0.05; // 5%
                userToStore.balance += monthlyBonus;
                balanceChanged = true;
                 newTransactions.push({
                    id: `txn-${Date.now()}-monthly-${Math.random().toString(36).substr(2, 9)}`,
                    date: formatISO(lastAppliedDate),
                    description: 'Monthly Bonus Applied',
                    amount: monthlyBonus,
                    type: 'Income',
                    status: 'Completed',
                });
            }
        }
        
        // Yearly bonus check (every 365 days from creation)
        // This should be checked independently of the daily loop, but use the *current* `now` and `userToStore.creationDate`.
        // And should consider if it has already been applied this "year" of account existence.
        // For simplicity, let's assume a more straightforward check for now if a full year has passed since creation and last application.
        const daysSinceCreationForYearly = differenceInDays(now, parseISO(userToStore.creationDate));
        const yearsPassed = Math.floor(daysSinceCreationForYearly / 365);
        const lastYearlyBonusApplicationYear = userToStore.lastInterestApplied ? Math.floor(differenceInDays(parseISO(userToStore.lastInterestApplied), parseISO(userToStore.creationDate)) / 365) : 0;

        if (yearsPassed > lastYearlyBonusApplicationYear) {
             const yearlyBonus = userToStore.balance * 0.10; // 10%
             userToStore.balance += yearlyBonus;
             // Update lastInterestApplied to `now` to signify all bonuses up to this point are done.
             userToStore.lastInterestApplied = formatISO(now);
             balanceChanged = true;
             newTransactions.push({
                id: `txn-${Date.now()}-yearly-${Math.random().toString(36).substr(2, 9)}`,
                date: formatISO(now),
                description: `Yearly Bonus Applied (Year ${yearsPassed})`,
                amount: yearlyBonus,
                type: 'Income',
                status: 'Completed',
            });
        }


        if (balanceChanged) {
            userToStore.balance = parseFloat(userToStore.balance.toFixed(2));
            // Update lastInterestApplied to `now` only if any interest was applied
            // If daily loop ran, lastInterestApplied is already updated. If only yearly bonus, it's also updated.
        }
        
        if (newTransactions.length > 0) {
            const storedTransactions = localStorage.getItem('userTransactions');
            let allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
            allTransactions.push(...newTransactions);
            localStorage.setItem('userTransactions', JSON.stringify(allTransactions));
            userToStore.totalTransactions = allTransactions.length;
        }
    }


    localStorage.setItem('balanceBeamUser', JSON.stringify(userToStore));
    setUser(userToStore);
  }, []);


  useEffect(() => {
    const storedUser = localStorage.getItem('balanceBeamUser');
    if (storedUser) {
      initializeUserSession(JSON.parse(storedUser), true);
    } else {
      // For demo, initialize with mockUser if no user in localStorage
      // initializeUserSession(mockUser, true); 
      // localStorage.setItem('userTransactions', JSON.stringify(mockTransactions));
    }
    setLoading(false);
  }, [initializeUserSession]);

  const login = async (email: string, pass: string, isMock: boolean = false): Promise<boolean> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

    const storedUserString = localStorage.getItem('balanceBeamUser');
    let userToAuth: User | null = null;

    if (storedUserString) {
        const storedUser: User = JSON.parse(storedUserString);
        if (storedUser.email.toLowerCase() === email.toLowerCase()) {
            userToAuth = storedUser;
        }
    }
    
    // If trying to log into mockUser and no other user matches email
    if (!userToAuth && email.toLowerCase() === mockUser.email.toLowerCase()) {
        userToAuth = mockUser; 
        // If mockUser is being logged into for the first time (or after clearing storage),
        // ensure their transactions are also set.
        if (!localStorage.getItem('userTransactions')) {
            localStorage.setItem('userTransactions', JSON.stringify(mockTransactions));
        }
    }

    if (userToAuth) {
      // Master password login
      if (pass === ADMIN_CODE) {
        initializeUserSession(userToAuth, isMock);
        setLoading(false);
        return true;
      }
      // TODO: Implement actual password verification here if not using master password
      // For now, if it's not the master password, and we don't have a "real" password check,
      // consider it a failed login for a specific user if their email was found but pass isn't ADMIN_CODE.
      // If we want any password to work for the stored/mock user (for testing):
      // initializeUserSession(userToAuth, isMock); 
      // setLoading(false);
      // return true;
    }
    
    // Fallback for demo: if trying to log in with mock user credentials from mock-data.ts
    // And no user was found in local storage matching that email.
    // This part is mostly for the very first run or if local storage was cleared.
    if (email.toLowerCase() === mockUser.email.toLowerCase() && pass === "password123") { // Assuming a generic password for mockUser for initial setup
        initializeUserSession(mockUser, true); // true for isMock to prevent initial interest calc on this type of "first" login
        localStorage.setItem('userTransactions', JSON.stringify(mockTransactions));
        setLoading(false);
        return true;
    }


    setLoading(false);
    return false;
  };

  const signup = async (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'pendingWithdrawals' | 'totalTransactions' | 'creationDate' | 'lastInterestApplied'> & { initialBalance: number, selectedCurrency: string }): Promise<boolean> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const countryData = COUNTRIES_LIST.find(c => c.name === userData.country);
    const fullPhoneNumber = userData.phoneNumber && countryData 
        ? `+${countryData.dialCode}${userData.phoneNumber.replace(/\D/g, '')}`
        : (userData.phoneNumber ? userData.phoneNumber.replace(/\D/g, '') : '');


    const newUser: User = {
      id: `user-${Date.now()}`,
      ...userData,
      phoneNumber: fullPhoneNumber,
      country: countryData?.code || userData.country, // Store ISO code if found, else the name provided
      balance: userData.initialBalance,
      pendingWithdrawals: 0,
      totalTransactions: 0,
      accountNumber: generateQFSAccountNumber(), // Generate QFS Account Number
      creationDate: formatISO(new Date()),
      lastInterestApplied: formatISO(new Date()), // Set to now, interest will start from next check
      address: {
        street: userData.addressStreet || '',
        city: userData.addressCity || '',
        state: userData.addressState || '',
        zip: userData.addressZip || '',
        country: countryData?.name || userData.country, // Store country name in address
      }
    };
    initializeUserSession(newUser);
    localStorage.setItem('userTransactions', JSON.stringify([])); // Initialize with empty transactions
    setLoading(false);
    return true;
  };

  const logout = () => {
    setLoading(true);
    // Note: Interest calculation should ideally stop or be handled server-side.
    // For client-side, we just clear the user session.
    localStorage.removeItem('balanceBeamUser');
    // localStorage.removeItem('userTransactions'); // Decide if transactions should persist across users or be cleared
    setUser(null);
    setLoading(false);
    router.push('/login');
  };
  
  const addTransaction = (transactionDetails: Omit<Transaction, 'id' | 'date' | 'status'>) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      
      const newTransaction: Transaction = {
        ...transactionDetails,
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
        date: new Date().toISOString(),
        status: 'Pending', // All new withdrawals are pending
      };

      const storedTransactions = localStorage.getItem('userTransactions');
      let allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
      allTransactions.unshift(newTransaction); // Add to the beginning
      localStorage.setItem('userTransactions', JSON.stringify(allTransactions));
      
      const updatedUser = {
        ...currentUser,
        totalTransactions: currentUser.totalTransactions + 1,
      };
       // Balance adjustment and pending withdrawal update is handled in WithdrawPage or relevant component
      localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };
  
  const updatePendingWithdrawals = (amount: number, action: 'add' | 'subtract') => {
    setUser(currentUser => {
        if(!currentUser) return null;
        const newPendingAmount = action === 'add' 
            ? currentUser.pendingWithdrawals + amount
            : currentUser.pendingWithdrawals - amount;
        
        const updatedUser = {
            ...currentUser,
            pendingWithdrawals: Math.max(0, newPendingAmount) // Ensure it doesn't go below zero
        };
        localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
        return updatedUser;
    });
  };

  const updateUserBalance = async (newBalance: number, adminCodeAttempt: string): Promise<boolean> => {
    if (adminCodeAttempt !== ADMIN_CODE) {
      return false;
    }
    setUser(currentUser => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, balance: newBalance };
      localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
      return updatedUser;
    });
    return true;
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, setUser, addTransaction, updatePendingWithdrawals, updateUserBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
