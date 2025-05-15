import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: string;
  description: string;
  amount: number;
  type: string;
  payoutMethod?: string;
  payoutMethodDetails?: Record<string, any>;
  id: string;
  date: string;
  status: string;
}

const TransactionSchema = new Schema<ITransaction>({
  userId: { type: String, required: true },
  description: String,
  amount: Number,
  type: String,
  payoutMethod: String,
  payoutMethodDetails: Object,
  id: String,
  date: String,
  status: String,
});

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
