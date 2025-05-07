'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Bitcoin, UserCircle, Copy, Landmark as BankIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { AppleWalletIcon } from '@/components/icons/apple-wallet-icon';
import { GoogleWalletIcon } from '@/components/icons/google-wallet-icon';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function AccountInfo() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!user) return null;

  const copyToClipboard = (text: string, label: string = "Account Number") => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to clipboard!", description: `${label} has been copied.` });
    }).catch(err => {
      toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" });
    });
  };

  const connectionOptions = [
    { label: 'Withdraw to Bank', icon: BankIcon, href: '/withdraw' },
    { label: 'Apple Wallet', icon: AppleWalletIcon, action: () => toast({ title: "Coming Soon!", description: "Apple Wallet integration is under development." }) },
    { label: 'Google Wallet', icon: GoogleWalletIcon, action: () => toast({ title: "Coming Soon!", description: "Google Wallet integration is under development." }) },
    { label: 'Add to Crypto Wallet', icon: Bitcoin, action: () => toast({ title: "Coming Soon!", description: "Crypto Wallet integration is under development." }) },
  ];

  return (
    <Card className="shadow-lg h-full"> {/* Added h-full to try to match height with BalanceDisplay if in a grid */}
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
                 <UserCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
                <CardTitle className="text-xl">{user.firstName} {user.lastName}</CardTitle>
                <div className="flex items-center gap-1">
                    <CardDescription className="text-sm text-muted-foreground">Account No: {user.accountNumber}</CardDescription>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(user.accountNumber, "Account Number")}>
                        <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                        <span className="sr-only">Copy Account Number</span>
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
              <Button key={opt.label} variant="outline" className="justify-start gap-2 h-11 text-sm" asChild>
                <Link href={opt.href}>
                  <opt.icon className="h-4 w-4 text-primary/80" />
                  {opt.label}
                </Link>
              </Button>
            ) : (
              <Button key={opt.label} variant="outline" className="justify-start gap-2 h-11 text-sm" onClick={opt.action}>
                <opt.icon className="h-4 w-4 text-primary/80" />
                {opt.label}
              </Button>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
