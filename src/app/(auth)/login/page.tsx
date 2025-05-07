import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Main Wallet',
  description: 'Login to your Main Wallet account.',
};

export default function LoginPage() {
  return <LoginForm />;
}
