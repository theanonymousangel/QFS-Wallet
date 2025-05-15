'use server';

import { connectToDatabase } from '@/lib/mongodbLocal';
import Transaction from '@/models/Transaction';

export async function deleteTransactionAction(
  userId: string,
  transactionId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    await connectToDatabase();

    const result = await Transaction.findOneAndDelete({
      userId,
      id: transactionId
    });

    if (!result) {
      return { success: false, message: 'Transaction not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return { success: false, message: 'Server error' };
  }
}
