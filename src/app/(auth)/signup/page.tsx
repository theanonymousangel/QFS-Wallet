import { SignupForm } from '@/components/auth/signup-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - QFS Wallet',
  description: 'Create a new QFS Wallet account.',
};

export default function SignupPage() {
  return <SignupForm />;
}

