'use server';

import { connectToDatabase } from '@/lib/mongodbLocal';
import Transaction from '@/models/Transaction';

export async function getTransactionsAction(userId: string): Promise<any> {
  await connectToDatabase();

  const transactions = await Transaction.find({ userId }).sort({ date: -1 }).lean();

  return transactions;
}
