'use server';

import { connectToDatabase } from '@/lib/mongodbLocal';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

export async function deleteAccountACtion(
  userId: string,
): Promise<void> {
  try {
    await connectToDatabase();
    await User.deleteOne({ _id: userId });
    await Transaction.deleteMany({ userId: userId });
    
  } catch (error) {
    console.error('Error updating transaction:', error);
  }
}
