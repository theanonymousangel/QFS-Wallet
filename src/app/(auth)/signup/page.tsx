import { SignupForm } from '@/components/auth/signup-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - Main Wallet',
  description: 'Create a new Main Wallet account.',
};

export default function SignupPage() {
  return <SignupForm />;
}
