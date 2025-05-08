
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Banknote, CreditCard, User, Mail, Phone, HomeIcon as LucideHomeIcon, Milestone, Info } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { findCurrencyByCode, getDefaultCurrency } from '@/lib/currencies';

const amountSchema = z.object({
  amount: z.coerce
    .number()
    .min(0.01, { message: 'Amount must be at least 0.01.' })
    .max(25000000, { message: 'Amount cannot exceed 25,000,000.' }),
});

const detailsSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  phoneNumber: z.string().min(1, "Phone number is required."),
  email: z.string().email("Invalid email address."),
  city: z.string().min(1, "City is required."),
  state: z.string().min(1, "State/Province is required."),
  zipCode: z.string().min(1, "ZIP/Postal code is required."),
  payoutMethod: z.enum(['Bank Transfer', 'QFS System Card'], { required_error: "Please select a payout method."}),
  accountNumberUS: z.string().optional(),
  routingNumberUS: z.string().optional(),
  ibanINTL: z.string().optional(),
  swiftCodeINTL: z.string().optional(),
  memberIdQFS: z.string().optional(),
  patriotNumberQFS: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.payoutMethod === 'Bank Transfer') {
        const usProvided = data.accountNumberUS && data.routingNumberUS;
        const intlProvided = data.ibanINTL && data.swiftCodeINTL;
        if (!usProvided && !intlProvided) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "For Bank Transfer, provide either US (Account & Routing No.) or International (IBAN & SWIFT) details.", path: ["accountNumberUS"] });
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "For Bank Transfer, provide either US (Account & Routing No.) or International (IBAN & SWIFT) details.", path: ["ibanINTL"] });
        } else if (usProvided && intlProvided) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please provide details for either US or International bank transfer, not both.", path: ["accountNumberUS"] });
        }
    } else if (data.payoutMethod === 'QFS System Card') {
        if (!data.memberIdQFS) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Member ID is required for QFS System Card.", path: ["memberIdQFS"] });
        }
        if (!data.patriotNumberQFS) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Patriot Number is required for QFS System Card.", path: ["patriotNumberQFS"] });
        }
    }
});


type AmountFormValues = z.infer<typeof amountSchema>;
type DetailsFormValues = z.infer<typeof detailsSchema>;

const MAX_WITHDRAWAL = 25000000;

export default function WithdrawPage() {
  const router = useRouter();
  const { user, setUser, addTransaction, updatePendingWithdrawals } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [withdrawalAmount, setWithdrawalAmount] = useState(0);
  
  const selectedUserCurrency = user ? (findCurrencyByCode(user.selectedCurrency) || getDefaultCurrency()) : getDefaultCurrency();

  const amountForm = useForm<AmountFormValues>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: 0 },
  });

  const detailsForm = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
      email: user?.email || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      zipCode: user?.address?.zip || '',
      payoutMethod: undefined,
      accountNumberUS: '',
      routingNumberUS: '',
      ibanINTL: '',
      swiftCodeINTL: '',
      memberIdQFS: '',
      patriotNumberQFS: '',
    },
  });

  useEffect(() => {
    if (user) {
      detailsForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber || '',
        email: user.email,
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zip || '',
        payoutMethod: detailsForm.getValues('payoutMethod') || undefined, 
        accountNumberUS: detailsForm.getValues('accountNumberUS') || '',
        routingNumberUS: detailsForm.getValues('routingNumberUS') || '',
        ibanINTL: detailsForm.getValues('ibanINTL') || '',
        swiftCodeINTL: detailsForm.getValues('swiftCodeINTL') || '',
        memberIdQFS: detailsForm.getValues('memberIdQFS') || '',
        patriotNumberQFS: detailsForm.getValues('patriotNumberQFS') || '',
      });
    }
  }, [user, detailsForm, step]);


  if (!user) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading user data...</p></div>;
  }
  
  const currentPayoutMethod = detailsForm.watch('payoutMethod');

  const formatCurrencyDisplay = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedUserCurrency.code,
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };


  async function onAmountSubmit(data: AmountFormValues) {
    if (data.amount > user!.balance) {
      toast({
        title: 'Insufficient Balance',
        description: `You do not have enough funds for this withdrawal. Your balance is ${formatCurrencyDisplay(user!.balance)}.`,
        variant: 'destructive',
      });
      return;
    }
    if (data.amount === 0) {
      toast({
        title: 'Invalid Amount',
        description: `Withdrawal amount must be greater than ${formatCurrencyDisplay(0)}.`,
        variant: 'destructive',
      });
      return;
    }
    setWithdrawalAmount(data.amount);
    setStep(2);
  }

  async function onDetailsSubmit(data: DetailsFormValues) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newBalance = user.balance - withdrawalAmount;
    setUser(prevUser => prevUser ? {...prevUser, balance: newBalance } : null);
    updatePendingWithdrawals(withdrawalAmount, 'add');
    
    const transactionDetails: Omit<Transaction, 'id' | 'date' | 'status'> = {
      description: `Withdrawal via ${data.payoutMethod}`,
      amount: -withdrawalAmount, 
      type: 'Withdrawal',
      payoutMethod: data.payoutMethod,
      payoutMethodDetails: {
        fullName: `${data.firstName} ${data.lastName}`,
        phone: data.phoneNumber,
        email: data.email,
        city: data.city,
        state: data.state,
        zip: data.zipCode,
        ...(data.payoutMethod === 'Bank Transfer' && {
            accountNumber: data.accountNumberUS,
            routingNumber: data.routingNumberUS,
            iban: data.ibanINTL,
            swiftCode: data.swiftCodeINTL,
        }),
        ...(data.payoutMethod === 'QFS System Card' && {
            memberId: data.memberIdQFS,
            patriotNumber: data.patriotNumberQFS,
        }),
      }
    };
    addTransaction(transactionDetails);
    
    console.log("ADMIN NOTIFICATION (Simulated): Withdrawal Request", {
        amount: withdrawalAmount,
        currency: selectedUserCurrency.code,
        userDetails: data,
    });

    setIsLoading(false);
    toast({
      title: 'Withdrawal Confirmed',
      description: `Withdrawal of ${formatCurrencyDisplay(withdrawalAmount)} initiated via ${data.payoutMethod}. It is now pending.`,
    });
    router.push('/dashboard'); 
  }


  return (
    <div className="space-y-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">Withdraw Funds</h1>
      
      <Card className="shadow-lg w-full max-w-2xl">
        <CardHeader>
          <CardTitle>
            {step === 1 && "Step 1: Enter Amount"}
            {step === 2 && `Step 2: Withdrawal Details for ${formatCurrencyDisplay(withdrawalAmount)}`}
          </CardTitle>
          <CardDescription>
            {step === 1 && "Enter the amount you wish to withdraw."}
            {step === 2 && "Provide your personal and payout information."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <Form {...amountForm}>
              <form onSubmit={amountForm.handleSubmit(onAmountSubmit)} className="space-y-8">
                <FormField
                  control={amountForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Amount to Withdraw</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          placeholder={`${selectedUserCurrency.symbol}0.00`}
                          value={typeof field.value === 'number' ? field.value : 0}
                          onChange={(val) => field.onChange(val)}
                          onBlur={field.onBlur}
                          currencySymbol={selectedUserCurrency.symbol}
                          className="text-2xl h-16"
                          maxBeforeDecimal={8} 
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-muted-foreground">Max: {formatCurrencyDisplay(MAX_WITHDRAWAL)}</p>
                      <p className="text-sm text-muted-foreground">
                        Current Balance: {formatCurrencyDisplay(user.balance)}
                      </p>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Confirm Amount & Proceed'}
                </Button>
              </form>
            </Form>
          )}

          {step === 2 && (
            <Form {...detailsForm}>
              <form onSubmit={detailsForm.handleSubmit(onDetailsSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={detailsForm.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={detailsForm.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input placeholder="Doe" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <FormField control={detailsForm.control} name="phoneNumber" render={({ field }) => ( <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="555-123-4567" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={detailsForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                
                <CardTitle className="text-lg pt-4 border-t mt-2">Address for Withdrawal</CardTitle>
                 <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField control={detailsForm.control} name="city" render={({ field }) => ( <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="Anytown" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={detailsForm.control} name="state" render={({ field }) => ( <FormItem><FormLabel>State/Province</FormLabel><FormControl><Input placeholder="CA" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={detailsForm.control} name="zipCode" render={({ field }) => ( <FormItem><FormLabel>ZIP/Postal Code</FormLabel><FormControl><Input placeholder="90210" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                </div>

                <FormField
                  control={detailsForm.control}
                  name="payoutMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Payout Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Select a payout method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bank Transfer" className="h-10 text-base"><Banknote className="mr-2 h-4 w-4" />Bank Transfer</SelectItem>
                          <SelectItem value="QFS System Card" className="h-10 text-base"><CreditCard className="mr-2 h-4 w-4" />QFS System Card</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {currentPayoutMethod === 'Bank Transfer' && (
                  <>
                    <FormDescription className="flex items-center gap-1"><Info size={14}/>For US: Account & Routing. For International: IBAN & SWIFT.</FormDescription>
                    <Card className="p-4 border-dashed">
                        <CardTitle className="text-md mb-2">US Bank Details (Optional)</CardTitle>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField control={detailsForm.control} name="accountNumberUS" render={({ field }) => ( <FormItem><FormLabel>Account Number (US)</FormLabel><FormControl><Input placeholder="Your US Account Number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={detailsForm.control} name="routingNumberUS" render={({ field }) => ( <FormItem><FormLabel>Routing Number (US)</FormLabel><FormControl><Input placeholder="Your US Routing Number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                    </Card>
                     <Card className="p-4 border-dashed mt-4">
                        <CardTitle className="text-md mb-2">International Bank Details (Optional)</CardTitle>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField control={detailsForm.control} name="ibanINTL" render={({ field }) => ( <FormItem><FormLabel>IBAN (International)</FormLabel><FormControl><Input placeholder="Your IBAN" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={detailsForm.control} name="swiftCodeINTL" render={({ field }) => ( <FormItem><FormLabel>SWIFT Code (International)</FormLabel><FormControl><Input placeholder="Your SWIFT/BIC Code" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                    </Card>
                  </>
                )}

                {currentPayoutMethod === 'QFS System Card' && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={detailsForm.control} name="memberIdQFS" render={({ field }) => ( <FormItem><FormLabel>Member ID</FormLabel><FormControl><Input placeholder="Your QFS Member ID" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={detailsForm.control} name="patriotNumberQFS" render={({ field }) => ( <FormItem><FormLabel>Patriot Number</FormLabel><FormControl><Input placeholder="Your QFS Patriot Number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )} />
                  </div>
                )}
                
                <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-12 text-lg">Back to Amount</Button>
                    <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Confirm & Submit Withdrawal'}
                    </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

