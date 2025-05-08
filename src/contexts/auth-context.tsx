'use client';

import type { User, Transaction } from '@/lib/types';
import { ADMIN_CODE } from '@/lib/types';
import { mockUser, mockTransactions } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import type { Dispatch, ReactNode, SetStateAction} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { formatISO, parseISO, differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears, subDays } from 'date-fns';
import { DEFAULT_CURRENCY_CODE } from '@/lib/currencies';
import { findCountryByIsoCode } from '@/lib/countries'; // Import findCountryByIsoCode

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'pendingWithdrawals' | 'totalTransactions' | 'creationDate' | 'lastInterestApplied' | 'address' | 'selectedCurrency'> & { 
    initialBalance: number; 
    selectedCurrency: string;
    password?: string;
    addressStreet: string;
    addressCity: string;
    addressState: string;
    addressZip: string;
  }) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  setUser: Dispatch<SetStateAction<User | null>>;
  updateUserBalance: (newBalance: number, adminCodeInput?: string) => Promise<boolean>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'status'>) => void;
  updatePendingWithdrawals: (amount: number, operation: 'add' | 'subtract') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Simulate interest accrual and transaction status updates
  useEffect(() => {
    if (user) {
      const intervalId = setInterval(() => {
        setUser(currentUser => {
          if (!currentUser) return null;

          let updatedUser = { ...currentUser };
          const now = new Date();
          const lastAppliedDate = parseISO(currentUser.lastInterestApplied);
          const creationDate = parseISO(currentUser.creationDate);

          let newBalance = currentUser.balance;
          let interestAppliedThisCycle = false;

          // Daily interest
          const daysSinceLastApplied = differenceInDays(now, lastAppliedDate);
          if (daysSinceLastApplied > 0) {
            for (let i = 0; i < daysSinceLastApplied; i++) {
              newBalance += newBalance * 0.0018; // +0.18%
            }
            interestAppliedThisCycle = true;
          }
          
          // Weekly bonus
          const weeksSinceCreation = differenceInWeeks(now, creationDate);
          const weeksSinceLastAppliedForWeekly = differenceInWeeks(now, lastAppliedDate);
          if (weeksSinceCreation >= 1 && weeksSinceLastAppliedForWeekly >=1 && now.getDay() === creationDate.getDay()) { // Apply on the same day of the week as creation
             if(differenceInDays(now, lastAppliedDate) >=7) { // Ensure at least 7 days passed
                newBalance += newBalance * 0.0025; // +0.25%
                interestAppliedThisCycle = true;
             }
          }

          // Monthly bonus
          const monthsSinceCreation = differenceInMonths(now, creationDate);
          const monthsSinceLastAppliedForMonthly = differenceInMonths(now, lastAppliedDate);
          if (monthsSinceCreation >= 1 && monthsSinceLastAppliedForMonthly >= 1 && now.getDate() === creationDate.getDate()) { // Apply on the same day of the month
            if(differenceInDays(now, lastAppliedDate) >=28 ) { // Ensure roughly a month passed
                newBalance += newBalance * 0.05; // +5%
                interestAppliedThisCycle = true;
            }
          }
          
          // Yearly bonus
          const yearsSinceCreation = differenceInYears(now, creationDate);
          const yearsSinceLastAppliedForYearly = differenceInYears(now, lastAppliedDate);
          if (yearsSinceCreation >= 1 && yearsSinceLastAppliedForYearly >=1 && now.getMonth() === creationDate.getMonth() && now.getDate() === creationDate.getDate()) {
             if(differenceInDays(now, lastAppliedDate) >= 360) { // Ensure roughly a year passed
                newBalance += newBalance * 0.10; // +10%
                interestAppliedThisCycle = true;
             }
          }

          if (interestAppliedThisCycle) {
            updatedUser.balance = parseFloat(newBalance.toFixed(2));
            updatedUser.lastInterestApplied = formatISO(now);
          }
          
          // Persist updated user to localStorage
          localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
          return updatedUser;
        });
      }, 60000); // Check every minute for demo purposes; real app would be backend driven or less frequent

      return () => clearInterval(intervalId);
    }
  }, [user]);


  useEffect(() => {
    setLoading(true); 
    const storedUserString = localStorage.getItem('balanceBeamUser');
    if (storedUserString) {
      try {
        let userFromStorage: User = JSON.parse(storedUserString);
        // Ensure all necessary fields exist from older stored versions
        userFromStorage.country = userFromStorage.country || findCountryByIsoCode('US')?.name || 'United States'; // Default to 'United States' if missing
        userFromStorage.pendingWithdrawals = userFromStorage.pendingWithdrawals || 0;
        userFromStorage.totalTransactions = userFromStorage.totalTransactions || 0;
        userFromStorage.creationDate = userFromStorage.creationDate || formatISO(new Date());
        userFromStorage.lastInterestApplied = userFromStorage.lastInterestApplied || formatISO(subDays(new Date(),1));
        userFromStorage.selectedCurrency = userFromStorage.selectedCurrency || DEFAULT_CURRENCY_CODE;
        
        if (userFromStorage.accountNumber && typeof userFromStorage.accountNumber === 'string' && userFromStorage.accountNumber.startsWith('BB-')) {
          userFromStorage.accountNumber = userFromStorage.accountNumber.replace('BB-', 'QFS-');
        }
        localStorage.setItem('balanceBeamUser', JSON.stringify(userFromStorage));
        setUser(userFromStorage);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('balanceBeamUser'); 
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const storedUserString = localStorage.getItem('balanceBeamUser');
    const storedUserObject = storedUserString ? JSON.parse(storedUserString) : null; 

    if (storedUserObject && email === storedUserObject.email /* && pass === 'password' */) { 
      // Ensure selectedCurrency is present
      if (!storedUserObject.selectedCurrency) {
        storedUserObject.selectedCurrency = DEFAULT_CURRENCY_CODE;
      }
      // Ensure country is valid or default it
      if (!storedUserObject.country) {
        storedUserObject.country = findCountryByIsoCode('US')?.name || 'United States';
      }
      localStorage.setItem('balanceBeamUser', JSON.stringify(storedUserObject));
      setUser(storedUserObject); 
      setLoading(false);
      router.push('/dashboard'); 
      return true;
    } else if (!storedUserObject && email === mockUser.email) { 
        const userToStore = {...mockUser}; 
        if (userToStore.accountNumber.startsWith('BB-')) {
             userToStore.accountNumber = userToStore.accountNumber.replace('BB-', 'QFS-');
        }
        userToStore.creationDate = userToStore.creationDate || formatISO(new Date());
        userToStore.lastInterestApplied = userToStore.lastInterestApplied || formatISO(subDays(new Date(),1));
        userToStore.pendingWithdrawals = userToStore.pendingWithdrawals || 0;
        userToStore.totalTransactions = userToStore.totalTransactions || mockTransactions.length;
        userToStore.selectedCurrency = userToStore.selectedCurrency || DEFAULT_CURRENCY_CODE;
        userToStore.country = userToStore.country || findCountryByIsoCode('US')?.name || 'United States';


        setUser(userToStore);
        localStorage.setItem('balanceBeamUser', JSON.stringify(userToStore));
        if (!localStorage.getItem('userTransactions')) {
          localStorage.setItem('userTransactions', JSON.stringify(mockTransactions));
        }
        setLoading(false);
        router.push('/dashboard'); 
        return true;
    }
    setLoading(false);
    return false;
  };

  const signup = async (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'pendingWithdrawals' | 'totalTransactions' | 'creationDate' | 'lastInterestApplied' | 'address' | 'selectedCurrency'> & { 
    initialBalance: number; 
    selectedCurrency: string;
    password?: string; 
    addressStreet: string;
    addressCity: string;
    addressState: string;
    addressZip: string;
  }): Promise<boolean> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { initialBalance, selectedCurrency, password, addressStreet, addressCity, addressState, addressZip, ...userDetailsFromOmit } = userData;
    
    const newUser: User = {
      ...userDetailsFromOmit, 
      id: crypto.randomUUID(), 
      accountNumber: `QFS-${String(Math.floor(Math.random() * 90000000) + 10000000)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      balance: initialBalance,
      selectedCurrency: selectedCurrency,
      pendingWithdrawals: 0,
      totalTransactions: 0,
      address: {
        street: addressStreet,
        city: addressCity,
        state: addressState,
        zip: addressZip,
        country: userData.country, 
      },
      creationDate: formatISO(new Date()),
      lastInterestApplied: formatISO(subDays(new Date(),1)), 
    };
    localStorage.setItem('balanceBeamUser', JSON.stringify(newUser));
    localStorage.setItem('userTransactions', JSON.stringify([])); 
    setUser(newUser);
    setLoading(false);
    router.push('/dashboard'); 
    return true;
  };

  const logout = () => {
    localStorage.removeItem('balanceBeamUser');
    localStorage.removeItem('userTransactions'); 
    setUser(null);
    router.push('/login');
  };

  const updateUserBalance = async (newBalance: number, adminCodeInput?: string): Promise<boolean> => {
    if (user && adminCodeInput === ADMIN_CODE) {
      setUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser = { ...prevUser, balance: parseFloat(newBalance.toFixed(2)) };
        localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
        return updatedUser;
      });
      return true;
    }
    return false;
  };

  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'date' | 'status'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: crypto.randomUUID(),
      date: formatISO(new Date()),
      status: 'Pending', 
    };

    const storedTransactionsString = localStorage.getItem('userTransactions');
    let currentTransactions: Transaction[] = [];
    try {
      const parsed = storedTransactionsString ? JSON.parse(storedTransactionsString) : [];
      if (Array.isArray(parsed)) {
        currentTransactions = parsed;
      }
    } catch (e) {
      console.error("Error parsing userTransactions from localStorage", e);
      // currentTransactions remains empty if parsing fails
    }
    
    currentTransactions.unshift(newTransaction); // Add to the beginning
    localStorage.setItem('userTransactions', JSON.stringify(currentTransactions));
    
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = {
        ...prevUser,
        totalTransactions: (prevUser.totalTransactions || 0) + 1,
      };
      localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const updatePendingWithdrawals = (amount: number, operation: 'add' | 'subtract') => {
    setUser(currentUser => {
      if (!currentUser) return null;
      let newPendingWithdrawals = currentUser.pendingWithdrawals || 0;
      if (operation === 'add') {
        newPendingWithdrawals += amount;
      } else {
        newPendingWithdrawals -= amount;
        if (newPendingWithdrawals < 0) newPendingWithdrawals = 0;
      }
      const updatedUser = {
        ...currentUser,
        pendingWithdrawals: parseFloat(newPendingWithdrawals.toFixed(2)),
      };
      localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };


  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, setUser, updateUserBalance, addTransaction, updatePendingWithdrawals }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
