'use server';

import { connectToDatabase } from '@/lib/mongodbLocal';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { ITransaction } from '@/models/Transaction';

type TransactionInput = Omit<ITransaction, 'id' | 'date' | 'status'> & { userId: string };

export async function addTransactionAction(transactionDetails: TransactionInput): Promise<{ success: boolean; message?: string, totalTransactions?: number }> {
  await connectToDatabase();

  const newTransaction: ITransaction = {
    ...transactionDetails,
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
    status: transactionDetails.type === 'Withdrawal' ? 'Pending' : 'Completed',
  } as ITransaction;

  // Optional: check for duplicates
  const recentTransactions = await Transaction.find({ userId: transactionDetails.userId })
    .sort({ date: -1 })
    .limit(5);

  const duplicate = recentTransactions.find(tx =>
    tx.amount === newTransaction.amount &&
    tx.type === newTransaction.type &&
    tx.description === newTransaction.description &&
    Math.abs(new Date().getTime() - new Date(tx.date).getTime()) < 2000
  );

  if (duplicate) {
    return { success: false, message: 'Duplicate transaction detected.' };
  }

  await Transaction.create(newTransaction);

  const updatedUser = await User.findOneAndUpdate(
    { _id: transactionDetails.userId },
    { $inc: { totalTransactions: 1 } },
    { new: true }
  )

  return { success: true, totalTransactions: updatedUser?.totalTransactions ?? 0 };
}
