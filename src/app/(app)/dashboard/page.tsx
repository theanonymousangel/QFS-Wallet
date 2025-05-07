import { BalanceDisplay } from '@/components/dashboard/balance-display';
import { IncomeOverview } from '@/components/dashboard/income-overview';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { AccountInfo } from '@/components/dashboard/account-info';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - BalanceBeam',
  description: 'Your financial overview on BalanceBeam.',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <BalanceDisplay />
        </div>
        <div className="lg:col-span-2">
           <AccountInfo />
        </div>
      </div>

      <IncomeOverview />
      <RecentTransactions />

    </div>
  );
}
