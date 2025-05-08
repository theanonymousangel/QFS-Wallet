'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
// import { Textarea } from '@/components/ui/textarea'; // No longer used here
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCircle, Save, ShieldAlert, Edit3 } from 'lucide-react';
import type { User } from '@/lib/types';
import { ADMIN_CODE } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { COUNTRIES_LIST, findCountryByIsoCode, type Country } from '@/lib/countries';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { findCurrencyByCode, getDefaultCurrency } from '@/lib/currencies';


const settingsFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().optional().refine(val => !val || val.length >= 6, {
    message: "Password must be at least 6 characters if provided."
  }),
  confirmPassword: z.string().optional(),
  phoneNumber: z.string().optional(), 
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  countryIsoCode: z.string().optional(), 
  balance: z.coerce.number().min(0, 'Balance cannot be negative.'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { user, setUser, loading: authLoading, updateUserBalance } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isBalanceEditing, setIsBalanceEditing] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [showAdminCodeDialog, setShowAdminCodeDialog] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(undefined);

  const selectedUserCurrency = user ? (findCurrencyByCode(user.selectedCurrency) || getDefaultCurrency()) : getDefaultCurrency();


  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressZip: '',
      countryIsoCode: '',
      balance: 0,
    },
  });
  
  const watchedCountryIsoCode = form.watch('countryIsoCode');

  useEffect(() => {
    if (watchedCountryIsoCode) {
      setSelectedCountry(findCountryByIsoCode(watchedCountryIsoCode));
    } else {
      setSelectedCountry(undefined);
    }
  }, [watchedCountryIsoCode]);


  useEffect(() => {
    if (user) {
      const userCountryData = COUNTRIES_LIST.find(c => c.name === user.country);
      
      let userPhoneNumberNational = '';
      if (user.phoneNumber) {
          if (userCountryData && user.phoneNumber.startsWith(`+${userCountryData.dialCode}`)) {
              userPhoneNumberNational = user.phoneNumber.substring(`+${userCountryData.dialCode}`.length).replace(/\D/g, '');
          } else {
              // If dial code doesn't match or isn't present, assume the stored number is already national or needs cleaning
              userPhoneNumberNational = user.phoneNumber.replace(/\D/g, '');
              // Attempt to find country by any leading digits if userCountryData was not found by name
              if (!userCountryData) {
                for (const c of COUNTRIES_LIST) {
                    if (user.phoneNumber.startsWith(`+${c.dialCode}`)) {
                        // Found a potential match by dial code
                        // This part might be complex if dial codes overlap or are subset of others
                        // For now, we assume it was set correctly on signup or previous edit.
                        break;
                    }
                }
              }
          }
      }


      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        countryIsoCode: userCountryData?.code || '',
        phoneNumber: userPhoneNumberNational,
        addressStreet: user.address?.street || '',
        addressCity: user.address?.city || '',
        addressState: user.address?.state || '',
        addressZip: user.address?.zip || '',
        balance: user.balance,
      });
      if (userCountryData) setSelectedCountry(userCountryData);
    }
  }, [user, form]);


  if (authLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading settings...</p>
      </div>
    );
  }

  const getInitials = (name: string = '') => {
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length-1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const currentFullName = `${form.watch('firstName') || user.firstName} ${form.watch('lastName') || user.lastName}`;

  const handleBalanceEditAttempt = () => {
    setShowAdminCodeDialog(true);
  };

  const handleAdminCodeSubmit = async () => {
    if (adminCodeInput === ADMIN_CODE) {
      setIsBalanceEditing(true);
      setShowAdminCodeDialog(false);
      setAdminCodeInput(''); 
      toast({ title: "Admin Access Granted", description: "You can now edit the balance." });
    } else {
      toast({ title: "Admin Access Denied", description: "Incorrect admin code.", variant: "destructive" });
      setAdminCodeInput(''); 
    }
  };


  async function onSubmit(data: SettingsFormValues) {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    const countryData = data.countryIsoCode ? findCountryByIsoCode(data.countryIsoCode) : undefined;
    const fullPhoneNumber = data.phoneNumber && countryData 
        ? `+${countryData.dialCode}${data.phoneNumber.replace(/\D/g, '')}`
        : data.phoneNumber;

    const updatedUserFields: Partial<User> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      country: countryData?.name || user.country, // Preserve if not changed
      phoneNumber: fullPhoneNumber,
      address: {
        street: data.addressStreet || '',
        city: data.addressCity || '',
        state: data.addressState || '',
        zip: data.addressZip || '',
        country: countryData?.name || user.country, 
      },
    };
    
    let balanceUpdated = false;
    if (isBalanceEditing && data.balance !== user.balance) {
      const success = await updateUserBalance(data.balance, ADMIN_CODE); 
      if (success) {
        balanceUpdated = true;
      } else {
        toast({ title: "Balance Update Failed", description: "Could not update balance.", variant: "destructive"});
      }
    }
    
    setUser(prevUser => {
      if (!prevUser) return null;
      // Ensure address object exists before spreading
      const prevAddress = prevUser.address || { street: '', city: '', state: '', zip: '', country: ''};
      const updatedAddress = { ...prevAddress, ...updatedUserFields.address };

      const updatedUser = { 
        ...prevUser, 
        ...updatedUserFields,
        address: updatedAddress
      };

      if (balanceUpdated) {
        updatedUser.balance = data.balance;
      }
      return updatedUser;
    });

    setIsLoading(false);
    toast({
      title: 'Settings Updated',
      description: 'Your profile information has been saved.',
    });
    
    if (balanceUpdated) setIsBalanceEditing(false); 

    // form.reset({}, { keepValues: true }); // This might be problematic with async setUser
    // Reset password fields manually if they were filled
    if (data.password) { 
        form.setValue('password', '');
        form.setValue('confirmPassword', '');
    }
    // Re-sync form with potentially updated user state from setUser
    // This is a bit tricky due to async nature of setUser and local form state
    // A slight delay or a more robust state management for form defaults might be needed
    // For now, let's assume the useEffect on `user` will re-populate correctly
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/placeholder-user.jpg" alt={currentFullName} data-ai-hint="profile picture" />
              <AvatarFallback className="text-3xl">
                {getInitials(currentFullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{currentFullName}</CardTitle>
              <CardDescription>Manage your account settings and profile information.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <FormField
                control={form.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Account Balance
                      {!isBalanceEditing && (
                        <Button variant="ghost" size="sm" onClick={handleBalanceEditAttempt} className="ml-2 p-1 h-auto">
                          <Edit3 className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      )}
                    </FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={typeof field.value === 'number' ? field.value : 0}
                        onChange={(val) => field.onChange(val)}
                        onBlur={field.onBlur}
                        currencySymbol={selectedUserCurrency.symbol}
                        readOnly={!isBalanceEditing}
                        aria-readonly={!isBalanceEditing}
                        className="text-lg"
                        maxBeforeDecimal={10} 
                      />
                    </FormControl>
                    {!isBalanceEditing && <FormDescription>Admin access only.</FormDescription>}
                    {isBalanceEditing && <FormDescription className="text-destructive">Balance editing enabled. Use with caution.</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />


              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>New Password (Optional)</FormLabel>
                        <FormControl><Input type="password" placeholder="Leave blank to keep current" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl><Input type="password" placeholder="Confirm new password" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
              </div>
              
              <FormField
                control={form.control}
                name="countryIsoCode" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                     <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('phoneNumber', ''); 
                        }} 
                        value={field.value || ''} 
                        defaultValue={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES_LIST.map((countryItem) => (
                          <SelectItem key={countryItem.code} value={countryItem.code}>
                            {countryItem.name} (+{countryItem.dialCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <PhoneNumberInput 
                        {...field} 
                        countryIsoCode={selectedCountry?.code}
                        value={field.value || ''} 
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardTitle className="text-xl pt-4 border-t mt-4">Address Details</CardTitle>
                <FormField
                  control={form.control}
                  name="addressStreet"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl><Input placeholder="123 Main St" {...field} value={field.value || ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                     <FormField
                        control={form.control}
                        name="addressCity"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl><Input placeholder="Anytown" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="addressState"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>State / Province</FormLabel>
                            <FormControl><Input placeholder="CA" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="addressZip"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>ZIP / Postal Code</FormLabel>
                            <FormControl><Input placeholder="90210" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>

              <CardFooter className="border-t pt-6 px-0">
                <Button type="submit" className="ml-auto" disabled={isLoading || (!form.formState.isDirty && !isBalanceEditing && !form.formState.dirtyFields.balance)}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog open={showAdminCodeDialog} onOpenChange={setShowAdminCodeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center"><ShieldAlert className="mr-2 h-5 w-5 text-destructive" /> Administrator Access Required</AlertDialogTitle>
            <AlertDialogDescription>
              To edit the account balance, please enter the administrator code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input 
              type="password"
              placeholder="Enter admin code"
              value={adminCodeInput}
              onChange={(e) => setAdminCodeInput(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAdminCodeInput('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAdminCodeSubmit} disabled={!adminCodeInput}>Submit Code</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}