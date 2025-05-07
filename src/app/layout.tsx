import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed from Geist to Inter
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/auth-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Using Inter font
});

export const metadata: Metadata = {
  title: 'Main Wallet',
  description: 'Your Modern Wallet Experience',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
