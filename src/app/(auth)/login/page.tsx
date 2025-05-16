import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Patriot Wallet',
  description: 'Login to your Patriot Wallet account.',
};

export default function LoginPage() {
  return <LoginForm />;
}

