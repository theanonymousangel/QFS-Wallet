'use client';

import { BalanceDisplay } from '@/components/dashboard/balance-display';
import { IncomeOverview } from '@/components/dashboard/income-overview';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { AccountInfo } from '@/components/dashboard/account-info';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // No longer needed for extra cards
// import { Hourglass, ListChecks } from 'lucide-react'; // No longer needed
// import type { Metadata } from 'next'; // Metadata handled in layout or server page.js
import { useAuth } from '@/contexts/auth-context'; 


// Helper to format currency consistently (can be moved to a utils file if used elsewhere)
// const formatCurrency = (amount: number) => {
//   return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
// };


export default function DashboardPage() {
  const { user } = useAuth(); // user might be used by child components through context, or directly if needed here

  return (
    <div className="space-y-8"> {/* Increased spacing between major sections */}
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2"> {/* Top Section: Balance and Account Info */}
        <div>
          <BalanceDisplay />
        </div>
        <div>
          <AccountInfo /> 
        </div>
      </div>
      
      {/* Middle Section: Income Overview */}
      <IncomeOverview />

      {/* Bottom Section: Recent Transactions */}
      <RecentTransactions />

    </div>
  );
}

