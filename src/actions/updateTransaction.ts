'use server';

import { connectToDatabase } from '@/lib/mongodbLocal';
import Transaction from '@/models/Transaction';
import { ITransaction } from '@/models/Transaction';

export async function updateTransactionAction(
  userId: string,
  transactionId: string,
  updates: Partial<Omit<ITransaction, '_id' | 'id' | 'userId' | 'date'>>
): Promise<{
  success: boolean;
  message?: string;
  updatedTransaction?: ITransaction;
}> {
  try {
    await connectToDatabase();

    const updated = await Transaction.findOneAndUpdate(
      { userId, id: transactionId },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return { success: false, message: 'Transaction not found' };
    }

    return {
      success: true,
      updatedTransaction: updated.toObject()
    };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { success: false, message: 'Server error' };
  }
}
