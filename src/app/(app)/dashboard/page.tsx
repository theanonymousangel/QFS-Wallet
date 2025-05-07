import { BalanceDisplay } from '@/components/dashboard/balance-display';
import { IncomeOverview } from '@/components/dashboard/income-overview'; // Renamed from InterestSection in plan to IncomeOverview
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { AccountInfo } from '@/components/dashboard/account-info';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Hourglass, ListChecks } from 'lucide-react';
import type { Metadata } from 'next';
import { useAuth } from '@/contexts/auth-context'; // Assuming auth context provides these
import { InterestSection } from '@/components/dashboard/interest-section';


export const metadata: Metadata = {
  title: 'Home - Main Wallet',
  description: 'Your financial overview on Main Wallet.',
};


// Helper to format currency consistently
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};


export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Home</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Section A: Balance Display */}
        <div className="lg:col-span-1">
          <BalanceDisplay />
        </div>

        {/* New Cards: Pending Withdrawals & Total Transactions */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Pending Withdrawals
            </CardTitle>
            <Hourglass className="h-5 w-5 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {user ? formatCurrency(user.pendingWithdrawals) : formatCurrency(0)}
            </div>
             <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Total Transactions
            </CardTitle>
            <ListChecks className="h-5 w-5 text-primary/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {user ? user.totalTransactions : 0}
            </div>
            <p className="text-xs text-muted-foreground">Across your account</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Section B: Income Overview (Interest related) */}
      <InterestSection />

      {/* Section D: Account Info & Wallet Connections */}
      <AccountInfo /> 

      {/* Section C: Recent Transactions (Withdrawals only) */}
      <RecentTransactions />

    </div>
  );
}
