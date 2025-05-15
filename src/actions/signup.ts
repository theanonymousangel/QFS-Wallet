'use server';

import { connectToDatabase } from '@/lib/mongodbLocal';
import User from '@/models/User';
import { formatISO } from 'date-fns';
import { COUNTRIES_LIST } from '@/lib/countries'; // Adjust import paths
import { ADMIN_CODE } from '@/lib/types';




export async function signupAction(userData: any): Promise<{ success: boolean; message?: string, user: any }> {
  await connectToDatabase();

  const generateQFSAccountNumber = (): string => {
    const part1 = String(Math.floor(Math.random() * 90000000) + 10000000); 
    const part2 = String(Math.floor(Math.random() * 90000000) + 10000000); 
    return `QFS-${part1}${part2.substring(0, 4)}`;
  };

  if (userData.adminAccessPassword !== ADMIN_CODE) {
    return { success: false, message: 'Invalid admin code', user: null };
  }

  const countryData = COUNTRIES_LIST.find(c => c.code === userData.countryIsoCode);
  const fullPhoneNumber = userData.phoneNumber && countryData 
    ? `+${countryData.dialCode}${userData.phoneNumber.replace(/\D/g, '')}`
    : (userData.phoneNumber ? userData.phoneNumber.replace(/\D/g, '') : '');

  const newUser = new User({
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
  });

  const user = await newUser.save({new: true});

  return { success: true, user: user.toObject() };
}
