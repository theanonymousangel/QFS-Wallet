import { SignupForm } from '@/components/auth/signup-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - Patriot Wallet',
  description: 'Create a new Patriot Wallet account.',
};

export default function SignupPage() {
  return <SignupForm />;
}

