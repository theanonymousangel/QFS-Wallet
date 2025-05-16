'use server';

import { connectToDatabase } from '@/lib/mongodbLocal';
import { User as IUser } from '@/lib/types';
import User from '@/models/User';

export async function updateUserAction(
  userId: string,
  updates: IUser
): Promise<{
  success: boolean;
  message?: string;
  updatedUser?: IUser;
}> {
  try {
    await connectToDatabase();

    const updated = await User.findOneAndUpdate(
      { _id: userId, },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return { success: false, message: 'Transaction not found' };
    }

    return {
      success: true,
      updatedUser: updated.toObject()
    };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { success: false, message: 'Server error' };
  }
}
