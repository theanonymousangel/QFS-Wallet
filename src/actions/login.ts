'use server';

import { connectToDatabase } from '@/lib/mongodbLocal';
import User from '@/models/User';
import { IUser } from '@/models/User';

export async function loginAction(email: string, pass: string): Promise<{
  success: boolean;
  user?: IUser;
  message?: string;
}> {
  await connectToDatabase();

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  const isPasswordValid = user.password === pass;

  if (!isPasswordValid) {
    return { success: false, message: 'Invalid credentials' };
  }

  return {
    success: true,
    user: user.toObject(),
  };
}
