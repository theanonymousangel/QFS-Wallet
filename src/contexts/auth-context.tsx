'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { mockUser, mockTransactions } from '@/lib/mock-data';
import type { User, Transaction } from '@/lib/types';
import { ADMIN_CODE } from '@/lib/types'; // Keep for balance editing, not login
import { formatISO, parseISO, differenceInDays, addDays } from 'date-fns';
import { findCountryByIsoCode, COUNTRIES_LIST } from '@/lib/countries';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>; // Removed isMock
  logout: () => void;
  signup: (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'pendingWithdrawals' | 'totalTransactions' | 'creationDate' | 'lastInterestApplied' | 'password'> & { initialBalance: number, selectedCurrency: string, password?: string, adminAccessPassword?: string }) => Promise<boolean>;
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

  const initializeUserSession = useCallback((userData: User) => {
    const now = new Date();
    let userToStore = { ...userData };

    if (userToStore.lastInterestApplied) {
        let lastAppliedDate = parseISO(userToStore.lastInterestApplied);
        let balanceChanged = false;
        let newTransactions: Transaction[] = [];

        while (differenceInDays(now, lastAppliedDate) >= 1) {
            const dailyInterest = userToStore.balance * 0.0018;
            if (dailyInterest > 0) { 
                userToStore.balance += dailyInterest;
                balanceChanged = true;
                newTransactions.push({
                    id: `txn-${Date.now()}-daily-${Math.random().toString(36).substr(2, 9)}`,
                    date: formatISO(addDays(lastAppliedDate, 1)), 
                    description: 'Daily Interest Applied',
                    amount: dailyInterest,
                    type: 'Income',
                    status: 'Completed',
                });
            }
            lastAppliedDate = addDays(lastAppliedDate, 1); 

            const daysSinceCreation = differenceInDays(lastAppliedDate, parseISO(userToStore.creationDate));

            if (daysSinceCreation > 0 && daysSinceCreation % 7 === 0) {
                const weeklyBonus = userToStore.balance * 0.0025;
                 if (weeklyBonus > 0) {
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
            }

            if (daysSinceCreation > 0 && daysSinceCreation % 30 === 0) {
                const monthlyBonus = userToStore.balance * 0.05;
                if (monthlyBonus > 0) {
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
            
            if (daysSinceCreation > 0 && daysSinceCreation % 365 === 0) {
                const yearlyBonus = userToStore.balance * 0.10;
                if (yearlyBonus > 0) {
                    userToStore.balance += yearlyBonus;
                    balanceChanged = true;
                    newTransactions.push({
                        id: `txn-${Date.now()}-yearly-${Math.random().toString(36).substr(2, 9)}`,
                        date: formatISO(lastAppliedDate),
                        description: `Yearly Bonus Applied (Year ${Math.floor(daysSinceCreation / 365)})`,
                        amount: yearlyBonus,
                        type: 'Income',
                        status: 'Completed',
                    });
                }
            }
        }
        
        if (balanceChanged) {
            userToStore.balance = parseFloat(userToStore.balance.toFixed(2));
        }
        userToStore.lastInterestApplied = formatISO(now); 


        if (newTransactions.length > 0) {
            const storedTransactions = localStorage.getItem('userTransactions');
            let allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
            allTransactions.push(...newTransactions);
            allTransactions.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
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
      initializeUserSession(JSON.parse(storedUser)); 
    }
    setLoading(false);
  }, [initializeUserSession]);

 const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const storedUserString = localStorage.getItem('balanceBeamUser');
    
    if (storedUserString) {
        try {
            const storedUser: User = JSON.parse(storedUserString);
            if (storedUser.email.toLowerCase() === email.toLowerCase() && storedUser.password === pass) {
                initializeUserSession(storedUser);
                setLoading(false);
                return true;
            }
        } catch (e) {
            console.error("Error parsing stored user data:", e);
        }
    }
    
    // Fallback to mockUser if no stored user matches or if localStorage is empty/corrupted
    if (email.toLowerCase() === mockUser.email.toLowerCase() && pass === mockUser.password) {
        initializeUserSession(mockUser);
         if (!localStorage.getItem('userTransactions')) { 
            localStorage.setItem('userTransactions', JSON.stringify(mockTransactions));
         }
        setLoading(false);
        return true;
    }

    setLoading(false);
    return false; 
};


  const signup = async (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'pendingWithdrawals' | 'totalTransactions' | 'creationDate' | 'lastInterestApplied' | 'password'> & { initialBalance: number, selectedCurrency: string, password?: string, adminAccessPassword?: string }): Promise<boolean> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (userData.adminAccessPassword !== ADMIN_CODE) {
        setLoading(false);
        return false; // Admin code check failed
    }
    
    const countryData = COUNTRIES_LIST.find(c => c.code === userData.countryIsoCode);
    const fullPhoneNumber = userData.phoneNumber && countryData 
        ? `+${countryData.dialCode}${userData.phoneNumber.replace(/\D/g, '')}`
        : (userData.phoneNumber ? userData.phoneNumber.replace(/\D/g, '') : '');


    const newUser: User = {
      id: `user-${Date.now()}`,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password, // Store the password
      country: countryData?.code || userData.countryIsoCode, 
      phoneNumber: fullPhoneNumber,
      balance: userData.initialBalance,
      pendingWithdrawals: 0,
      totalTransactions: 0,
      accountNumber: generateQFSAccountNumber(),
      selectedCurrency: userData.selectedCurrency,
      address: {
        street: userData.addressStreet || '',
        city: userData.addressCity || '',
        state: userData.addressState || '',
        zip: userData.addressZip || '',
        country: countryData?.name || userData.countryIsoCode, 
      },
      creationDate: formatISO(new Date()),
      lastInterestApplied: formatISO(new Date()), 
    };
    initializeUserSession(newUser); 
    localStorage.setItem('userTransactions', JSON.stringify([]));
    setLoading(false);
    return true;
  };

  const logout = () => {
    setLoading(true);
    if(user){ 
        localStorage.setItem('balanceBeamUser', JSON.stringify(user));
    }
    setUser(null);
    // No need to clear localStorage here if we want users to persist for next login demo
    setLoading(false);
    router.push('/login');
  };
  
  const addTransaction = (transactionDetails: Omit<Transaction, 'id' | 'date' | 'status'>) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      
      const newTransaction: Transaction = {
        ...transactionDetails,
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: new Date().toISOString(),
        status: transactionDetails.type === 'Withdrawal' ? 'Pending' : 'Completed',
      };

      const storedTransactionsString = localStorage.getItem('userTransactions');
      let allTransactions: Transaction[] = storedTransactionsString ? JSON.parse(storedTransactionsString) : [];
      
      allTransactions.unshift(newTransaction); // Add to the beginning
      localStorage.setItem('userTransactions', JSON.stringify(allTransactions));
      
      const updatedUser = {
        ...currentUser,
        totalTransactions: currentUser.totalTransactions + 1,
      };
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
            pendingWithdrawals: Math.max(0, parseFloat(newPendingAmount.toFixed(2))) 
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
      const updatedUser = { ...currentUser, balance: parseFloat(newBalance.toFixed(2)) };
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
