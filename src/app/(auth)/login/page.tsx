import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - QFS Wallet',
  description: 'Login to your QFS Wallet account.',
};

export default function LoginPage() {
  return <LoginForm />;
}

