
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
      const userCountryData = user.country ? COUNTRIES_LIST.find(c => c.name === user.country) : undefined;
      
      let userPhoneNumberNational = '';
      if (user.phoneNumber) {
          // Check if country data exists for the user's stored country name
          const countryForPhone = user.country ? findCountryByIsoCode(COUNTRIES_LIST.find(c => c.name === user.country)?.code || '') : undefined;
          if (countryForPhone && user.phoneNumber.startsWith(`+${countryForPhone.dialCode}`)) {
              userPhoneNumberNational = user.phoneNumber.substring(`+${countryForPhone.dialCode}`.length).replace(/\D/g, '');
          } else {
              // Fallback if country code cannot be stripped (e.g. number stored without it or country mismatch)
              userPhoneNumberNational = user.phoneNumber.replace(/\D/g, '');
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

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName && firstName.length > 0 && lastName.length > 0) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName && firstName.length > 0) {
      return `${firstName.substring(0,2)}`.toUpperCase();
    }
    return '??';
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

    const updatedUserFields: Partial<User> = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      // country, phoneNumber, and address.country are handled based on dirty state
    };

    // Handle country update only if changed
    if (form.formState.dirtyFields.countryIsoCode) {
      updatedUserFields.country = countryData?.name || user.country; // Fallback to current if somehow invalid
    }

    // Handle phone number update only if changed
    if (form.formState.dirtyFields.phoneNumber) {
      if (data.phoneNumber && data.phoneNumber.trim().length > 0 && countryData) {
        updatedUserFields.phoneNumber = `+${countryData.dialCode}${data.phoneNumber.replace(/\D/g, '')}`;
      } else if (data.phoneNumber && data.phoneNumber.trim().length > 0 && !countryData && user.country) {
        // Case: phone number changed, but countryIsoCode was not (or was cleared). Use user's existing country for dial code.
        const existingUserCountryData = findCountryByIsoCode(COUNTRIES_LIST.find(c => c.name === user.country)?.code || '');
        if (existingUserCountryData) {
           updatedUserFields.phoneNumber = `+${existingUserCountryData.dialCode}${data.phoneNumber.replace(/\D/g, '')}`;
        } else {
           updatedUserFields.phoneNumber = data.phoneNumber.replace(/\D/g, ''); // No country data, store raw digits
        }
      } else {
        updatedUserFields.phoneNumber = ''; // Set to empty if cleared
      }
    }
    
    // Construct address, considering potential country change
    const addressCountry = (form.formState.dirtyFields.countryIsoCode && countryData)
                           ? countryData.name 
                           : (user.address?.country || user.country);

    updatedUserFields.address = {
      street: data.addressStreet || '',
      city: data.addressCity || '',
      state: data.addressState || '',
      zip: data.addressZip || '',
      country: addressCountry, 
    };
    
    let balanceUpdated = false;
    if (isBalanceEditing && data.balance !== user.balance) {
      // Check if balance field was actually made dirty by the user, even if isBalanceEditing is true
      if (form.formState.dirtyFields.balance) {
        const success = await updateUserBalance(data.balance, ADMIN_CODE); 
        if (success) {
          balanceUpdated = true;
        } else {
          toast({ title: "Balance Update Failed", description: "Could not update balance.", variant: "destructive"});
        }
      }
    }
    
    // This directly updates the user in AuthContext which should persist it to localStorage
    setUser(prevUser => {
      if (!prevUser) return null;
      
      const userToUpdate = { ...prevUser };

      // Conditionally apply updates for fields that might not be in updatedUserFields if not dirty
      if (form.formState.dirtyFields.firstName) userToUpdate.firstName = data.firstName;
      if (form.formState.dirtyFields.lastName) userToUpdate.lastName = data.lastName;
      if (form.formState.dirtyFields.email) userToUpdate.email = data.email;
      
      if (form.formState.dirtyFields.countryIsoCode) {
        userToUpdate.country = countryData?.name || prevUser.country;
      }
      
      if (form.formState.dirtyFields.phoneNumber) {
        // Use the updatedUserFields.phoneNumber which has the full logic from above
        userToUpdate.phoneNumber = updatedUserFields.phoneNumber;
      }
      
      // Address fields are always taken from `data` as they can be empty strings.
      // The address country logic depends on whether countryIsoCode was dirtied.
      const newAddressCountry = (form.formState.dirtyFields.countryIsoCode && countryData)
                                ? countryData.name
                                : (prevUser.address?.country || userToUpdate.country); // Use updated country if changed
      userToUpdate.address = {
        street: data.addressStreet || '',
        city: data.addressCity || '',
        state: data.addressState || '',
        zip: data.addressZip || '',
        country: newAddressCountry,
      };


      if (balanceUpdated) { // This means balance was successfully updated via admin code
        userToUpdate.balance = data.balance;
      }
      return userToUpdate; // AuthContext's setUser will handle localStorage update
    });

    setIsLoading(false);
    toast({
      title: 'Settings Updated',
      description: 'Your profile information has been saved.',
    });
    
    if (balanceUpdated) setIsBalanceEditing(false); 

    if (data.password) { 
        form.setValue('password', '');
        form.setValue('confirmPassword', '');
    }
    // Important: Reset dirty state after successful save, so the button disables correctly
    form.reset(form.getValues(), { keepDirty: false, keepSubmitSucceeded: true });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {/* <AvatarImage src="/placeholder-user.jpg" alt={currentFullName} data-ai-hint="profile picture" /> */}
              <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                {getInitials(user.firstName, user.lastName)}
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
                          form.setValue('phoneNumber', '', {shouldDirty: true}); // Mark as dirty if country changes
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
                        countryIsoCode={selectedCountry?.code || (user.country ? COUNTRIES_LIST.find(c=>c.name === user.country)?.code : '')} // Fallback to user's current country for display if form's country isn't set
                        value={field.value || ''} 
                        onChange={(val) => field.onChange(val)} // Ensure RHF is updated
                        onBlur={field.onBlur}
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
                <Button type="submit" className="ml-auto" disabled={isLoading || (!form.formState.isDirty && !isBalanceEditing )}>
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

