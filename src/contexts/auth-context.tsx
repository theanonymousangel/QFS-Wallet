'use client';

import type { User, Transaction } from '@/lib/types';
import { ADMIN_CODE } from '@/lib/types';
import { mockUser, mockTransactions } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import type { Dispatch, ReactNode, SetStateAction} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { formatISO, parseISO, differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears, subDays } from 'date-fns';
import { DEFAULT_CURRENCY_CODE, findCurrencyByCode } from '@/lib/currencies';
import { findCountryByIsoCode } from '@/lib/countries'; 

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'pendingWithdrawals' | 'totalTransactions' | 'creationDate' | 'lastInterestApplied' | 'address' | 'selectedCurrency' | 'country'> & { 
    initialBalance: number; 
    selectedCurrency: string;
    password?: string;
    countryIsoCode: string; // Use ISO code from signup form
    phoneNumber: string;
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

  // Helper function to consolidate user session initialization logic
  const initializeUserSession = (userToLogin: User, isMockUserSetup: boolean = false) => {
    let userToStore = { ...userToLogin };

    // Ensure QFS prefix for account number
    if (userToStore.accountNumber && typeof userToStore.accountNumber === 'string' && userToStore.accountNumber.startsWith('BB-')) {
      userToStore.accountNumber = userToStore.accountNumber.replace('BB-', 'QFS-');
    }
    // Default values for potentially missing fields
    userToStore.creationDate = userToStore.creationDate || formatISO(new Date());
    userToStore.lastInterestApplied = userToStore.lastInterestApplied || formatISO(subDays(new Date(), 1));
    userToStore.pendingWithdrawals = userToStore.pendingWithdrawals || 0;
    
    if (isMockUserSetup) {
      userToStore.totalTransactions = mockTransactions.length; // Always for mock user setup
    } else if (userToStore.totalTransactions === undefined) {
      // For existing users (not mock setup), if totalTransactions is missing, initialize to 0
      userToStore.totalTransactions = 0; 
    }
    // Otherwise, userToStore.totalTransactions retains its existing value from userToLogin.


    userToStore.selectedCurrency = userToStore.selectedCurrency || DEFAULT_CURRENCY_CODE;
    
    // Standardize country: user.country should store the ISO code.
    // If it's a name, try to find its code. If it's already a code, validate it.
    let countryIsoToStore = '';
    if (userToStore.country) { // user.country might be name or code
        const countryByCode = findCountryByIsoCode(userToStore.country.toUpperCase());
        if (countryByCode) {
            countryIsoToStore = countryByCode.code; // It was a code or a name matching a code
        } else {
            const countryByName = COUNTRIES_LIST.find(c => c.name.toLowerCase() === userToStore.country.toLowerCase());
            if (countryByName) {
                countryIsoToStore = countryByName.code;
            }
        }
    }
    userToStore.country = countryIsoToStore || 'US'; // Default to 'US' ISO code if not found or invalid


    userToStore.address = userToStore.address || { 
        street: '', 
        city: '', 
        state: '', 
        zip: '', 
        // address.country is for display/context, main country ISO code is on user object
        country: findCountryByIsoCode(userToStore.country)?.name || userToStore.country 
    };
    // Ensure address.country (display name) matches the user.country (ISO code)
    const currentAddressCountryName = findCountryByIsoCode(userToStore.country)?.name;
    if (userToStore.address && currentAddressCountryName && userToStore.address.country !== currentAddressCountryName) {
        userToStore.address.country = currentAddressCountryName;
    }


    setUser(userToStore);
    localStorage.setItem('balanceBeamUser', JSON.stringify(userToStore));
    
    if (isMockUserSetup && !localStorage.getItem('userTransactions')) {
      localStorage.setItem('userTransactions', JSON.stringify(mockTransactions));
    }
    setLoading(false);
    router.push('/dashboard');
  };


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
          if (weeksSinceCreation >= 1 && weeksSinceLastAppliedForWeekly >=1 && now.getDay() === creationDate.getDay()) { 
             if(differenceInDays(now, lastAppliedDate) >=7) { 
                newBalance += newBalance * 0.0025; // +0.25%
                interestAppliedThisCycle = true;
             }
          }

          // Monthly bonus
          const monthsSinceCreation = differenceInMonths(now, creationDate);
          const monthsSinceLastAppliedForMonthly = differenceInMonths(now, lastAppliedDate);
          if (monthsSinceCreation >= 1 && monthsSinceLastAppliedForMonthly >= 1 && now.getDate() === creationDate.getDate()) { 
            if(differenceInDays(now, lastAppliedDate) >=28 ) { 
                newBalance += newBalance * 0.05; // +5%
                interestAppliedThisCycle = true;
            }
          }
          
          // Yearly bonus
          const yearsSinceCreation = differenceInYears(now, creationDate);
          const yearsSinceLastAppliedForYearly = differenceInYears(now, lastAppliedDate);
          if (yearsSinceCreation >= 1 && yearsSinceLastAppliedForYearly >=1 && now.getMonth() === creationDate.getMonth() && now.getDate() === creationDate.getDate()) {
             if(differenceInDays(now, lastAppliedDate) >= 360) { 
                newBalance += newBalance * 0.10; // +10%
                interestAppliedThisCycle = true;
             }
          }

          if (interestAppliedThisCycle) {
            updatedUser.balance = parseFloat(newBalance.toFixed(2));
            updatedUser.lastInterestApplied = formatISO(now);
          }
          
          localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
          return updatedUser;
        });
      }, 60000); 

      return () => clearInterval(intervalId);
    }
  }, [user]);


  useEffect(() => {
    setLoading(true); 
    const storedUserString = localStorage.getItem('balanceBeamUser');
    if (storedUserString) {
      try {
        let userFromStorage: User = JSON.parse(storedUserString);
        
        // Ensure QFS prefix for account number
        if (userFromStorage.accountNumber && typeof userFromStorage.accountNumber === 'string' && userFromStorage.accountNumber.startsWith('BB-')) {
          userFromStorage.accountNumber = userFromStorage.accountNumber.replace('BB-', 'QFS-');
        }

        // Standardize country storage to ISO code
        let countryIsoToStore = '';
        if (userFromStorage.country) {
            const countryByCode = findCountryByIsoCode(userFromStorage.country.toUpperCase());
            if (countryByCode) { // If it was a code or name matching a code
                countryIsoToStore = countryByCode.code;
            } else { // If it was a name, find its code
                const countryByName = COUNTRIES_LIST.find(c => c.name.toLowerCase() === userFromStorage.country.toLowerCase());
                if (countryByName) countryIsoToStore = countryByName.code;
            }
        }
        userFromStorage.country = countryIsoToStore || 'US'; // Default to 'US' ISO code

        userFromStorage.pendingWithdrawals = userFromStorage.pendingWithdrawals || 0;
        userFromStorage.totalTransactions = userFromStorage.totalTransactions === undefined ? 0 : userFromStorage.totalTransactions;
        userFromStorage.creationDate = userFromStorage.creationDate || formatISO(new Date());
        userFromStorage.lastInterestApplied = userFromStorage.lastInterestApplied || formatISO(subDays(new Date(),1));
        userFromStorage.selectedCurrency = userFromStorage.selectedCurrency || DEFAULT_CURRENCY_CODE;
        
        userFromStorage.address = userFromStorage.address || { street: '', city: '', state: '', zip: '' };
        // Ensure address.country is name, derived from user.country (ISO code)
        userFromStorage.address.country = findCountryByIsoCode(userFromStorage.country)?.name || userFromStorage.country;


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
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    const storedUserString = localStorage.getItem('balanceBeamUser');
    const storedUserObject: User | null = storedUserString ? JSON.parse(storedUserString) : null;

    let userToAuth: User | null = null;
    let isMockLogin = false;

    if (storedUserObject && email.toLowerCase() === storedUserObject.email.toLowerCase()) {
      userToAuth = storedUserObject;
    } else if (!storedUserObject && email.toLowerCase() === mockUser.email.toLowerCase()) {
      // If no user stored, try to match against mock user
      userToAuth = mockUser;
      isMockLogin = true;
    }

    if (userToAuth) {
      // Master password login
      if (pass === ADMIN_CODE) {
        initializeUserSession(userToAuth, isMockLogin);
        return true;
      }
      // Regular login: IMPORTANT - Current system lacks actual password verification for stored users.
      // The original code `/* && pass === 'password' */` was commented.
      // So, if email matches, any non-master password is treated as "correct" for now.
      // This should be replaced with actual password hash comparison in a real app.
      // For this project's scope, this fulfills "user logs in with email and password from signup"
      // by effectively not checking the password string itself against a stored hash.
      // If password checking logic was added to signup, it would be used here.
      initializeUserSession(userToAuth, isMockLogin);
      return true;
    }

    setLoading(false);
    return false;
  };

  const signup = async (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'pendingWithdrawals' | 'totalTransactions' | 'creationDate' | 'lastInterestApplied' | 'address' | 'selectedCurrency' | 'country'> & { 
    initialBalance: number; 
    selectedCurrency: string;
    password?: string; 
    countryIsoCode: string;
    phoneNumber: string;
    addressStreet: string;
    addressCity: string;
    addressState: string;
    addressZip: string;
  }): Promise<boolean> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { initialBalance, selectedCurrency, password, countryIsoCode, phoneNumber, addressStreet, addressCity, addressState, addressZip, ...userDetailsFromOmit } = userData;
    
    const countryData = findCountryByIsoCode(countryIsoCode);
    const fullPhoneNumber = phoneNumber && countryData 
      ? `+${countryData.dialCode}${phoneNumber.replace(/\D/g, '')}` 
      : phoneNumber.replace(/\D/g, '');

    const newUser: User = {
      ...userDetailsFromOmit, 
      id: crypto.randomUUID(), 
      accountNumber: `QFS-${String(Math.floor(Math.random() * 90000000) + 10000000)}${String(Math.floor(Math.random() * 9000) + 1000)}`,
      balance: initialBalance,
      selectedCurrency: selectedCurrency,
      country: countryIsoCode, // Store ISO code
      phoneNumber: fullPhoneNumber,
      pendingWithdrawals: 0,
      totalTransactions: 0,
      address: {
        street: addressStreet,
        city: addressCity,
        state: addressState,
        zip: addressZip,
        country: countryData?.name || countryIsoCode, // Store country name for display in address
      },
      creationDate: formatISO(new Date()),
      lastInterestApplied: formatISO(subDays(new Date(),1)), 
      // Note: `password` from userData is not stored on the User object for security.
      // Real apps would hash and store it securely, then compare during login.
    };
    localStorage.setItem('balanceBeamUser', JSON.stringify(newUser));
    localStorage.setItem('userTransactions', JSON.stringify([])); 
    setUser(newUser); // This will trigger the main useEffect to load the new user
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
      status: transactionData.type === 'Withdrawal' ? 'Pending' : 'Completed', 
    };

    const storedTransactionsString = localStorage.getItem('userTransactions');
    let currentTransactions: Transaction[] = [];
    try {
      const parsed = storedTransactionsString ? JSON.parse(storedTransactionsString) : [];
      if (Array.isArray(parsed)) {
        currentTransactions = parsed.filter(tx => tx && tx.id); // Basic validation
      }
    } catch (e) {
      console.error("Error parsing userTransactions from localStorage", e);
    }
    
    currentTransactions.unshift(newTransaction); 
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

// Helper to get country list, already in countries.ts
import { COUNTRIES_LIST } from '@/lib/countries';
