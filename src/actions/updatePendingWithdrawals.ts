'use server';

import { connectToDatabase } from '@/lib/mongodbLocal';
import User from '@/models/User';

export async function updatePendingWithdrawalsAction(
  userId: string,
  amount: number,
  action: 'add' | 'subtract'
): Promise<{ success: boolean; pendingWithdrawals?: number; message?: string }> {
  await connectToDatabase();

  console.log('== userId ==', userId);
  // Get the current user
  const user = await User.findById(userId);
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  const newPending = action === 'add'
    ? user.pendingWithdrawals + amount
    : user.pendingWithdrawals - amount;

  const safeValue = Math.max(0, parseFloat(newPending.toFixed(2)));

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { pendingWithdrawals: safeValue },
    { new: true }
  );

  return {
    success: true,
    pendingWithdrawals: updatedUser?.pendingWithdrawals
  };
}
