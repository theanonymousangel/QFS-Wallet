'use server';

import { connectToDatabase } from '@/lib/mongodbLocal';
import User from '@/models/User';

export async function adjustTotalTransactionsAction(
  userId: string,
  adjustment: number // pass +1 to increment, -1 to decrement
): Promise<{ success: boolean; totalTransactions?: number; message?: string }> {
  try {
    await connectToDatabase();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { totalTransactions: adjustment } },
      { new: true }
    );

    if (!updatedUser) {
      return { success: false, message: 'User not found' };
    }

    return {
      success: true,
      totalTransactions: updatedUser.totalTransactions,
    };
  } catch (error) {
    console.error('Error adjusting totalTransactions:', error);
    return { success: false, message: 'Server error' };
  }
}
