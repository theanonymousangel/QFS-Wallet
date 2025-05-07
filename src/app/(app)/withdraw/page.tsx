'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Banknote, CreditCard } from 'lucide-react';

const withdrawalFormSchema = z.object({
  amount: z.coerce
    .number()
    .min(1, { message: 'Amount must be at least $1.' })
    .max(25000000, { message: 'Amount cannot exceed $25,000,000.' }),
  method: z.string().min(1, { message: 'Please select a withdrawal method.' }),
});

type WithdrawalFormValues = z.infer<typeof withdrawalFormSchema>;

export default function WithdrawPage() {
  const router = useRouter();
  const { user, setUser } = useAuth(); // Assuming setUser can update balance
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalFormSchema),
    defaultValues: {
      amount: 0,
      method: '',
    },
  });

  if (!user) {
    // Should be handled by layout or HOC
    return <p>Loading user data...</p>;
  }

  async function onSubmit(data: WithdrawalFormValues) {
    setIsLoading(true);
    
    if (data.amount > user!.balance) {
      toast({
        title: 'Insufficient Balance',
        description: 'You do not have enough funds for this withdrawal.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Simulate API call for withdrawal
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update user balance locally (in a real app, this would come from API response)
    if (setUser) {
        const newBalance = user.balance - data.amount;
        setUser(prevUser => prevUser ? {...prevUser, balance: newBalance} : null);
    }
    
    setIsLoading(false);
    toast({
      title: 'Withdrawal Initiated',
      description: `Successfully initiated withdrawal of $${data.amount.toLocaleString()} via ${data.method}.`,
    });
    // Optionally, redirect to a confirmation page or transaction history
    router.push('/dashboard'); 
  }

  const withdrawalMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer', icon: <Banknote className="mr-2 h-4 w-4" /> },
    { value: 'debit_card', label: 'Debit Card', icon: <CreditCard className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Withdraw Funds</h1>
      
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Withdrawal Request</CardTitle>
          <CardDescription>Enter the amount you wish to withdraw and select a method.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Amount to Withdraw</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field} 
                          className="pl-8 text-2xl h-16" // Larger input
                          step="0.01"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">Max: $25,000,000.00</p>
                    <p className="text-sm text-muted-foreground">
                      Current Balance: ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg">Withdrawal Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Select a method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {withdrawalMethods.map(method => (
                          <SelectItem key={method.value} value={method.value} className="h-10 text-base">
                            <div className="flex items-center">
                              {method.icon}
                              {method.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  'Proceed to Withdrawal Details' 
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
