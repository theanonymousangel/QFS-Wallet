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
    // Simulate checking for an existing session
    const storedUser = localStorage.getItem('balanceBeamUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // For mock purposes, we retrieve the stored user to check against.
    // In a real app, this would be a database lookup.
    const storedUserString = localStorage.getItem('balanceBeamUser');
    const storedUserObject = storedUserString ? JSON.parse(storedUserString) : mockUser; // Fallback to default mockUser if nothing in storage

    if (email === storedUserObject.email /* && pass === 'password' */) { // Password check omitted for mock
      setUser(storedUserObject); // Use the object from storage or the default mock if it's the first login
      if (!storedUserString && email === mockUser.email) { // If it's the default mockUser and not in storage yet, store it.
          localStorage.setItem('balanceBeamUser', JSON.stringify(mockUser));
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
    // userDetailsFromOmit contains: firstName, lastName, email, phoneNumber?, state?

    const newUser: User = {
      ...userDetailsFromOmit, // Includes firstName, lastName, email, phoneNumber, and top-level state
      id: `user-${Date.now()}`,
      // Account number starts with QFS followed by random numbers
      accountNumber: `QFS-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      balance: balanceInput,
      address: {
        street: streetAddress || '',
        city: '', // Not collected at signup
        state: userDetailsFromOmit.state || '', // Use state from form for address.state
        zip: '', // Not collected at signup
        country: '', // Not collected at signup
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
