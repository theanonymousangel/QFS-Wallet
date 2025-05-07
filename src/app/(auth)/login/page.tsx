import { LoginForm } from '@/components/auth/login-form';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - BalanceBeam',
  description: 'Login to your BalanceBeam account.',
};

export default function LoginPage() {
  return <LoginForm />;
}
