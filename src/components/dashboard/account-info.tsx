'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Bitcoin, UserCircle, Copy, Landmark as BankIcon } from 'lucide-react'; // Added BankIcon
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
    { label: 'Withdraw to Bank', icon: BankIcon, href: '/withdraw' }, // Changed to BankIcon
    { label: 'Apple Wallet', icon: AppleWalletIcon, action: () => toast({ title: "Coming Soon!", description: "Apple Wallet integration is under development." }) },
    { label: 'Google Wallet', icon: GoogleWalletIcon, action: () => toast({ title: "Coming Soon!", description: "Google Wallet integration is under development." }) },
    { label: 'Add to Crypto Wallet', icon: Bitcoin, action: () => toast({ title: "Coming Soon!", description: "Crypto Wallet integration is under development." }) },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        {/* Removed UserCircle icon from here to match image 6 section A more closely */}
        <CardTitle className="text-xl">{user.firstName} {user.lastName}</CardTitle>
        <div className="flex items-center gap-1">
            <CardDescription className="text-sm">Account No: {user.accountNumber}</CardDescription>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(user.accountNumber, "Account Number")}>
                <Copy className="h-4 w-4 text-muted-foreground hover:text-primary" />
                <span className="sr-only">Copy Account Number</span>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Removed "Wallet Connections:" text to match image 6 section A */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {connectionOptions.map((opt) => (
            opt.href ? (
              <Button key={opt.label} variant="outline" className="justify-start gap-2 h-12 text-base" asChild>
                <Link href={opt.href}>
                  <opt.icon className="h-5 w-5 text-primary/80" />
                  {opt.label}
                </Link>
              </Button>
            ) : (
              <Button key={opt.label} variant="outline" className="justify-start gap-2 h-12 text-base" onClick={opt.action}>
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
