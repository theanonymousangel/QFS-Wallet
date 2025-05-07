'use client';

import type { User } from '@/lib/types';
import { mockUser } from '@/lib/mock-data';
import { useRouter } from 'next/navigation';
import type { Dispatch, ReactNode, SetStateAction} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'address'> & { 
    balanceInput: number; 
    password?: string;
    streetAddress?: string; // Added streetAddress
  }) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  setUser: Dispatch<SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true); // Ensure loading is true at the start
    const storedUserString = localStorage.getItem('balanceBeamUser');
    if (storedUserString) {
      try {
        let userFromStorage: User = JSON.parse(storedUserString);
        // Migration logic for account number prefix
        if (userFromStorage.accountNumber && typeof userFromStorage.accountNumber === 'string' && userFromStorage.accountNumber.startsWith('BB-')) {
          userFromStorage.accountNumber = userFromStorage.accountNumber.replace('BB-', 'QFS-');
          localStorage.setItem('balanceBeamUser', JSON.stringify(userFromStorage)); // Update localStorage
        }
        setUser(userFromStorage);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('balanceBeamUser'); // Clear corrupted data
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const storedUserString = localStorage.getItem('balanceBeamUser');
    // If user logged in after initial load, storedUserString should reflect migrated data if applicable.
    // mockUser is used as a fallback if localStorage is empty.
    const storedUserObject = storedUserString ? JSON.parse(storedUserString) : mockUser; 

    if (email === storedUserObject.email /* && pass === 'password' */) { // Password check omitted for mock
      setUser(storedUserObject); 
      if (!storedUserString && email === mockUser.email) { 
          localStorage.setItem('balanceBeamUser', JSON.stringify(mockUser)); // mockUser already has QFS-
      }
      setLoading(false);
      return true;
    }
    setLoading(false);
    return false;
  };

  const signup = async (userData: Omit<User, 'id' | 'accountNumber' | 'balance' | 'address'> & { 
    balanceInput: number; 
    password?: string;
    streetAddress?: string;
  }): Promise<boolean> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { balanceInput, password, streetAddress, ...userDetailsFromOmit } = userData;
    
    const newUser: User = {
      ...userDetailsFromOmit, 
      id: `user-${Date.now()}`,
      accountNumber: `QFS-${Math.floor(1000000000 + Math.random() * 9000000000)}`, // Generates QFS- prefix
      balance: balanceInput,
      address: {
        street: streetAddress || '',
        city: '', 
        state: userDetailsFromOmit.state || '', 
        zip: '', 
        country: '', 
      },
    };
    localStorage.setItem('balanceBeamUser', JSON.stringify(newUser));
    setUser(newUser);
    setLoading(false);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('balanceBeamUser');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, setUser }}>
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
