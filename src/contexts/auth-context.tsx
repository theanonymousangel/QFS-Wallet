'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { mockUser, mockTransactions } from '@/lib/mock-data';
import type { User, Transaction } from '@/lib/types';
import { ADMIN_CODE } from '@/lib/types'; 
import { formatISO, parseISO, differenceInDays, addDays, isValid } from 'date-fns';
import { findCountryByIsoCode, COUNTRIES_LIST } from '@/lib/countries';
import { signupAction } from '@/actions/signup';
import { addTransactionAction } from '@/actions/addTransaction';
import { ITransaction } from '@/models/Transaction';
import { updatePendingWithdrawalsAction } from '@/actions/updatePendingWithdrawals';
import { loginAction } from '@/actions/login';
import { deleteAccountACtion } from '@/actions/deleteAccount';
import { updateUserAction } from '@/actions/updateUser';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  signup: (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'pendingWithdrawals' | 'totalTransactions' | 'creationDate' | 'lastInterestApplied' | 'password' | 'address'> & { 
    initialBalance: number, 
    selectedCurrency: string, 
    password?: string, 
    adminAccessPassword?: string,
    addressStreet: string, 
    addressCity?: string, 
    addressState?: string, 
    addressZip?: string 
  }) => Promise<boolean>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  addTransaction: (transactionDetails: Omit<Transaction, 'id' | 'date' | 'status'>) => Promise<void>;
  updatePendingWithdrawals: (amount: number, action: 'add' | 'subtract') => Promise<void>;
  updateUserBalance: (newBalance: number, adminCodeAttempt: string) => Promise<boolean>;
  deleteAccount: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const generateQFSAccountNumber = (): string => {
  const part1 = String(Math.floor(Math.random() * 90000000) + 10000000); 
  const part2 = String(Math.floor(Math.random() * 90000000) + 10000000); 
  return `QFS-${part1}${part2.substring(0, 4)}`;
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const interestIntervalRef = useRef<NodeJS.Timeout | null>(null);


  const applyInterestAndBonuses = useCallback((currentUser: User): { updatedUser: User, newTransactions: Transaction[] } => {
    let userToUpdate = { ...currentUser };
    const now = new Date();
    let newTransactions: Transaction[] = [];

    let lastAppliedDate;
    try {
      const parsedDate = parseISO(userToUpdate.lastInterestApplied);
      if (!isValid(parsedDate)) { // Check if date is valid
        throw new Error("Invalid lastInterestApplied date string from storage");
      }
      lastAppliedDate = parsedDate;
    } catch (e) {
      console.error("Error parsing lastInterestApplied date, defaulting to now:", e, "Value was:", userToUpdate.lastInterestApplied);
      lastAppliedDate = new Date(); 
      userToUpdate.lastInterestApplied = formatISO(lastAppliedDate);
    }

    let creationDateObj;
    try {
      const parsedCreationDate = parseISO(userToUpdate.creationDate);
      if(!isValid(parsedCreationDate)) {
        throw new Error("Invalid creationDate string from storage");
      }
      creationDateObj = parsedCreationDate;
    } catch(e) {
      console.error("Error parsing creationDate, defaulting to now:", e, "Value was:", userToUpdate.creationDate);
      creationDateObj = new Date(); 
      userToUpdate.creationDate = formatISO(creationDateObj);
    }
    
    let iterations = 0;
    const MAX_ITERATIONS = 365 * 3;    

    while (differenceInDays(now, lastAppliedDate) >= 1 && iterations < MAX_ITERATIONS) {
      lastAppliedDate = addDays(lastAppliedDate, 1); 
      iterations++;

      const dailyInterest = userToUpdate.balance * 0.0018;
      if (dailyInterest > 0) {
        userToUpdate.balance += dailyInterest;
        newTransactions.push({
          id: `txn-${Date.now()}-daily-${Math.random().toString(36).substr(2, 9)}-${iterations}`,
          date: formatISO(lastAppliedDate),
          description: 'Daily Interest Applied',
          amount: dailyInterest,
          type: 'Income',
          status: 'Completed',
        });
      }

      const daysSinceCreation = differenceInDays(lastAppliedDate, creationDateObj);

      if (daysSinceCreation > 0 && daysSinceCreation % 7 === 0) {
        const weeklyBonus = userToUpdate.balance * 0.0025;
        if (weeklyBonus > 0) {
          userToUpdate.balance += weeklyBonus;
          newTransactions.push({
            id: `txn-${Date.now()}-weekly-${Math.random().toString(36).substr(2, 9)}-${iterations}`,
            date: formatISO(lastAppliedDate),
            description: 'Weekly Bonus Applied',
            amount: weeklyBonus,
            type: 'Income',
            status: 'Completed',
          });
        }
      }

      if (daysSinceCreation > 0 && daysSinceCreation % 30 === 0) {
        const monthlyBonus = userToUpdate.balance * 0.05;
        if (monthlyBonus > 0) {
          userToUpdate.balance += monthlyBonus;
          newTransactions.push({
            id: `txn-${Date.now()}-monthly-${Math.random().toString(36).substr(2, 9)}-${iterations}`,
            date: formatISO(lastAppliedDate),
            description: 'Monthly Bonus Applied',
            amount: monthlyBonus,
            type: 'Income',
            status: 'Completed',
          });
        }
      }

      if (daysSinceCreation > 0 && daysSinceCreation % 365 === 0) {
        const yearlyBonus = userToUpdate.balance * 0.10;
        if (yearlyBonus > 0) {
          userToUpdate.balance += yearlyBonus;
          newTransactions.push({
            id: `txn-${Date.now()}-yearly-${Math.random().toString(36).substr(2, 9)}-${iterations}`,
            date: formatISO(lastAppliedDate),
            description: `Yearly Bonus Applied (Year ${Math.floor(daysSinceCreation / 365)})`,
            amount: yearlyBonus,
            type: 'Income',
            status: 'Completed',
          });
        }
      }
      userToUpdate.lastInterestApplied = formatISO(lastAppliedDate);
    }
    
    if (newTransactions.length > 0) {
        userToUpdate.balance = parseFloat(userToUpdate.balance.toFixed(2));
    }
    
    if (parseISO(userToUpdate.lastInterestApplied) > now) {
        userToUpdate.lastInterestApplied = formatISO(now);
    }

    return { updatedUser: userToUpdate, newTransactions };
  }, []);


  const initializeUserSession = useCallback((userData: User) => {
    try {
      const { updatedUser, newTransactions } = applyInterestAndBonuses(userData);
      
      if (newTransactions.length > 0) {
        const storedTransactions = localStorage.getItem('userTransactions');
        let allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
        const uniqueNewTransactions = newTransactions.filter(nt => !allTransactions.find(at => at.id === nt.id));
        allTransactions.push(...uniqueNewTransactions);
        allTransactions.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        localStorage.setItem('userTransactions', JSON.stringify(allTransactions));
        updatedUser.totalTransactions = allTransactions.length;
      }

      setUser(updatedUser);
    } catch (error) {
      console.error("Error during initializeUserSession:", error);
      // Optionally, clear corrupted user data and log out
      localStorage.removeItem('userTransactions');
      setUser(null); // Ensure user is logged out
      router.push('/login'); // Redirect to login
    }
  }, [applyInterestAndBonuses, router]);


  useEffect(() => {
    const storedUser = localStorage.getItem('balanceBeamUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.email && parsedUser.password) { 
          initializeUserSession(parsedUser);
        } else {
          console.error("Stored user data is invalid. Clearing.");
        }
      } catch (error) {
        console.error("Failed to initialize user session from localStorage:", error);
      }
    }
    setLoading(false);
  }, [initializeUserSession]);

  useEffect(() => {
    if (user && !interestIntervalRef.current) {
      interestIntervalRef.current = setInterval(() => {
        setUser(currentUser => {
          if (!currentUser) return null;
          
          try {
            const { updatedUser, newTransactions } = applyInterestAndBonuses(currentUser);

            if (newTransactions.length > 0) {
              const storedTransactions = localStorage.getItem('userTransactions');
              let allTransactions: Transaction[] = storedTransactions ? JSON.parse(storedTransactions) : [];
              const uniqueNewTransactions = newTransactions.filter(nt => !allTransactions.find(at => at.id === nt.id));
              allTransactions.push(...uniqueNewTransactions);
              allTransactions.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
              localStorage.setItem('userTransactions', JSON.stringify(allTransactions));
              updatedUser.totalTransactions = allTransactions.length;
            }
            
            localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
            return updatedUser;
          } catch (error) {
            console.error("Error applying interest in interval:", error);
            // Decide how to handle this error, e.g., log out user or try to recover
            return currentUser; // Return current user to avoid breaking state
          }
        });
      }, 60000); 
    }

    return () => {
      if (interestIntervalRef.current) {
        clearInterval(interestIntervalRef.current);
        interestIntervalRef.current = null;
      }
    };
  }, [user, applyInterestAndBonuses]);


 const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    
    const isSuccess = await loginAction(email, pass);

    if(isSuccess.success) {
      initializeUserSession(isSuccess.user as User);
      setLoading(false);
      return true;
    }else {
      setLoading(false);
      return false;
    }
};


  const signup = async (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'pendingWithdrawals' | 'totalTransactions' | 'creationDate' | 'lastInterestApplied' | 'password' | 'address'> & { 
    initialBalance: number, 
    selectedCurrency: string, 
    password?: string, 
    adminAccessPassword?: string,
    addressStreet: string,
    addressCity?: string,
    addressState?: string,
    addressZip?: string 
  }): Promise<boolean> => {
    setLoading(true);
    
    if (userData.adminAccessPassword !== ADMIN_CODE) {
        setLoading(false);
        return false; 
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
      password: userData.password, 
      country: countryData?.code || userData.countryIsoCode, 
      phoneNumber: fullPhoneNumber,
      balance: userData.initialBalance,
      pendingWithdrawals: 0, 
      totalTransactions: 0, 
      accountNumber: generateQFSAccountNumber(),
      selectedCurrency: userData.selectedCurrency,
      address: {
        street: userData.addressStreet, 
        city: userData.addressCity || '', 
        state: userData.addressState || '', 
        zip: userData.addressZip || '', 
        country: countryData?.name || userData.countryIsoCode, 
      },
      creationDate: formatISO(new Date()),
      lastInterestApplied: formatISO(new Date()), 
    };
    const isSuccess = await signupAction(userData);
    if(isSuccess.success) {
      initializeUserSession(isSuccess?.user as User); 
      setLoading(false);
      return true;
    }else {
      setLoading(false);
      return false;
    }
   
  };

  const logout = () => {
    setLoading(true);
    if(user){ 
      try {
        const { updatedUser } = applyInterestAndBonuses(user); 
        localStorage.setItem('balanceBeamUser', JSON.stringify(updatedUser));
      } catch(e) {
        console.error("Error applying interest on logout:", e);
        // Still proceed with logout even if interest application fails
        localStorage.setItem('balanceBeamUser', JSON.stringify(user)); // Save current state at least
      }
    }
    if (interestIntervalRef.current) {
      clearInterval(interestIntervalRef.current);
      interestIntervalRef.current = null;
    }
    setUser(null);
    setLoading(false);
    router.push('/login');
  };
  
 const addTransaction = async (transactionDetails: Omit<Transaction, 'id' | 'date' | 'status'>) => {
  const newTransactionCandidate = { 
    ...transactionDetails,
    userId: user?._id,
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    status: transactionDetails.type === 'Withdrawal' ? 'Pending' : 'Completed',
  };  
  const isSuccess = await addTransactionAction(newTransactionCandidate as ITransaction);

  if(isSuccess.success) {
    setUser(currentUser => {
      if(!currentUser) return null; 
      const updatedUser = {
          ...currentUser,
          totalTransactions: isSuccess.totalTransactions ?? 0
      };
      return updatedUser;
  });
  }
  };
  
  const updatePendingWithdrawals = async (amount: number, action: 'add' | 'subtract') => {
    const isSuccess = await updatePendingWithdrawalsAction(user?._id ??  '', amount, action);

    if(isSuccess?.success) {
      setUser(currentUser => {
        if(!currentUser) return null; 
        const updatedUser = {
            ...currentUser,
            pendingWithdrawals: isSuccess?.pendingWithdrawals || 0
        };
        return updatedUser;
    });
    }

    
  };

  const updateUserBalance = async (newBalance: number, adminCodeAttempt: string): Promise<boolean> => {
    console.log('== updateUserBalance ==>', newBalance, adminCodeAttempt);
    if (adminCodeAttempt !== ADMIN_CODE) {
      return false;
    }
    const updatedUser = { balance: parseFloat(newBalance.toFixed(2)) };
    const userUpdated = await updateUserAction(user?._id ?? '', updatedUser as User);
    console.log('== userUpdated===>', userUpdated);
    if(userUpdated.success) {
      setUser(userUpdated.updatedUser as User);
    }
    return userUpdated.success
  };

  const deleteAccount = async (userId: string): Promise<void> => {
    setLoading(true);
    await deleteAccountACtion(userId)
    setUser(null);
    setLoading(false);
    router.push('/signup'); 
  };


  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup, setUser, addTransaction, updatePendingWithdrawals, updateUserBalance, deleteAccount }}>
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

