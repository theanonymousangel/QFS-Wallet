import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  country: string;
  phoneNumber: string;
  balance: number;
  pendingWithdrawals: number;
  totalTransactions: number;
  accountNumber: string;
  selectedCurrency: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  creationDate: string;
  lastInterestApplied: string;
}

const UserSchema = new Schema<IUser>({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  country: String,
  phoneNumber: String,
  balance: Number,
  pendingWithdrawals: Number,
  totalTransactions: Number,
  accountNumber: String,
  selectedCurrency: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  creationDate: String,
  lastInterestApplied: String,
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
