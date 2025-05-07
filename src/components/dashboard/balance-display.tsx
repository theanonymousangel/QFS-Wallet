'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, TrendingUp, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

export function BalanceDisplay() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  if (!user) return null;

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(user.balance);

  return (
    <Card className="shadow-lg bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-primary">
          Current Balance
        </CardTitle>
        <UserCircle className="h-5 w-5 text-primary/70" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-foreground">
              {isVisible ? formattedBalance : '••••••••'}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsVisible(!isVisible)} aria-label={isVisible ? "Hide balance" : "Show balance"}>
            {isVisible ? <EyeOff className="h-5 w-5 text-primary/70" /> : <Eye className="h-5 w-5 text-primary/70" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
