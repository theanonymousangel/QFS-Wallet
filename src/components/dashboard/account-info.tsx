'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Bitcoin, UserCircle, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { AppleWalletIcon } from '@/components/icons/apple-wallet-icon';
import { GoogleWalletIcon } from '@/components/icons/google-wallet-icon';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function AccountInfo() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to clipboard!", description: `${text} has been copied.` });
    }).catch(err => {
      toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" });
    });
  };

  const connectionOptions = [
    { label: 'Withdraw to Bank', icon: CreditCard, href: '/withdraw' },
    { label: 'Apple Wallet', icon: AppleWalletIcon, action: () => toast({ title: "Coming Soon!", description: "Apple Wallet integration is under development." }) },
    { label: 'Google Wallet', icon: GoogleWalletIcon, action: () => toast({ title: "Coming Soon!", description: "Google Wallet integration is under development." }) },
    { label: 'Add to Crypto Wallet', icon: Bitcoin, action: () => toast({ title: "Coming Soon!", description: "Crypto Wallet integration is under development." }) },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <UserCircle className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-xl">{user.firstName} {user.lastName}</CardTitle>
            <div className="flex items-center gap-2">
                <CardDescription>Account No: {user.accountNumber}</CardDescription>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(user.accountNumber)}>
                    <Copy className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-medium text-foreground mb-3">Wallet Connections:</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {connectionOptions.map((opt) => (
            opt.href ? (
              <Button key={opt.label} variant="outline" className="justify-start gap-2" asChild>
                <Link href={opt.href}>
                  <opt.icon className="h-5 w-5 text-primary/80" />
                  {opt.label}
                </Link>
              </Button>
            ) : (
              <Button key={opt.label} variant="outline" className="justify-start gap-2" onClick={opt.action}>
                <opt.icon className="h-5 w-5 text-primary/80" />
                {opt.label}
              </Button>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
