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
import { Loader2, UserCircle, Save, ShieldAlert, Edit3, Mail, KeyRound, Trash2, Eye, EyeOff } from 'lucide-react';
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
  phoneNumber: z.string().optional(), 
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  countryIsoCode: z.string().optional(), 
  balance: z.coerce.number().min(0, 'Balance cannot be negative.'),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
  const { user, setUser, loading: authLoading, updateUserBalance, deleteAccount } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [showAdminCodeDialog, setShowAdminCodeDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(undefined);
  const [showPassword, setShowPassword] = useState(false);

  const selectedUserCurrency = user ? (findCurrencyByCode(user.selectedCurrency) || getDefaultCurrency()) : getDefaultCurrency();


  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
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
      const userCountryData = user.country ? COUNTRIES_LIST.find(c => c.name === user.country || c.code === user.country) : undefined;
      
      let userPhoneNumberNational = '';
      if (user.phoneNumber) {
          const countryForPhone = userCountryData ? findCountryByIsoCode(userCountryData.code) : (user.country && !COUNTRIES_LIST.find(c=> c.name === user.country) ? findCountryByIsoCode(user.country) : undefined);
          if (countryForPhone && user.phoneNumber.startsWith(`+${countryForPhone.dialCode}`)) {
              userPhoneNumberNational = user.phoneNumber.substring(`+${countryForPhone.dialCode}`.length).replace(/\D/g, '');
          } else {
              userPhoneNumberNational = user.phoneNumber.replace(/\D/g, '');
          }
      }

      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        countryIsoCode: userCountryData?.code || (COUNTRIES_LIST.find(c=> c.code === user.country) ? user.country : ''), 
        phoneNumber: userPhoneNumberNational,
        addressStreet: user.address?.street || '',
        addressCity: user.address?.city || '',
        addressState: user.address?.state || '',
        addressZip: user.address?.zip || '',
        balance: user.balance,
      });

      if (userCountryData) setSelectedCountry(userCountryData);
      else if (user.country && COUNTRIES_LIST.find(c=> c.code === user.country)) {
        setSelectedCountry(findCountryByIsoCode(user.country));
      }

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

  const handleAdminEditAttempt = () => {
    setShowAdminCodeDialog(true);
  };

  const handleAdminCodeSubmit = async () => {
    if (adminCodeInput === ADMIN_CODE) {
      setIsAdminEditing(true);
      setShowAdminCodeDialog(false);
      setAdminCodeInput(''); 
      toast({ title: "Admin Access Granted", description: "You can now edit protected fields." });
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
    };

    if (isAdminEditing && form.formState.dirtyFields.email) {
        updatedUserFields.email = data.email;
    }

    if (data.countryIsoCode && (form.formState.dirtyFields.countryIsoCode || user.country !== data.countryIsoCode)) {
        updatedUserFields.country = data.countryIsoCode;
    } else if (!data.countryIsoCode && user.country) { 
        updatedUserFields.country = ''; 
    }


    if (form.formState.dirtyFields.phoneNumber || (!user.phoneNumber && data.phoneNumber)) {
      if (data.phoneNumber && data.phoneNumber.trim().length > 0) {
        const targetCountryForPhone = countryData || (user.country ? findCountryByIsoCode(user.country) : undefined);
        if (targetCountryForPhone) {
          updatedUserFields.phoneNumber = `+${targetCountryForPhone.dialCode}${data.phoneNumber.replace(/\D/g, '')}`;
        } else {
          updatedUserFields.phoneNumber = data.phoneNumber.replace(/\D/g, ''); 
        }
      } else {
        updatedUserFields.phoneNumber = '';
      }
    }
    
    const addressCountryName = countryData ? countryData.name : (user.address?.country || (user.country ? findCountryByIsoCode(user.country)?.name : ''));

    updatedUserFields.address = {
      street: data.addressStreet || '',
      city: data.addressCity || '',
      state: data.addressState || '',
      zip: data.addressZip || '',
      country: addressCountryName,
    };
    
    let balanceUpdated = false;
    if (isAdminEditing && form.formState.dirtyFields.balance) {
      if (data.balance !== user.balance) {
        const success = await updateUserBalance(data.balance, ADMIN_CODE); 
        if (success) {
          balanceUpdated = true;
        } else {
          toast({ title: "Balance Update Failed", description: "Could not update balance.", variant: "destructive"});
        }
      }
    }
    
    let passwordChanged = false;
    if (isAdminEditing && data.password && form.formState.dirtyFields.password) {
      console.log("Password change requested (not implemented in AuthContext). New password:", data.password);
      updatedUserFields.password = data.password; 
      passwordChanged = true;
    }


    setUser(prevUser => {
      if (!prevUser) return null;
      
      const userToUpdate = { ...prevUser, ...updatedUserFields }; 

      if (form.formState.dirtyFields.addressStreet || 
          form.formState.dirtyFields.addressCity || 
          form.formState.dirtyFields.addressState || 
          form.formState.dirtyFields.addressZip ||
          form.formState.dirtyFields.countryIsoCode || 
          !prevUser.address ) { 
        userToUpdate.address = updatedUserFields.address;
      }


      if (balanceUpdated) { 
        userToUpdate.balance = data.balance;
      }
      localStorage.setItem('balanceBeamUser', JSON.stringify(userToUpdate));
      return userToUpdate;
    });
    
    if (isAdminEditing) { 
        setIsAdminEditing(false); 
    }

    if (passwordChanged || (data.password && form.formState.dirtyFields.password)) { 
        form.setValue('password', '', { shouldDirty: false, shouldValidate: false });
    }
    
    const newFormValues = {
        ...data, 
        password: '', 
        phoneNumber: data.phoneNumber ? data.phoneNumber.replace(/\D/g, '') : '', 
    };
    
    const finalCountryIsoCodeForReset = data.countryIsoCode || user.country;
    const countryForPhoneReset = finalCountryIsoCodeForReset ? findCountryByIsoCode(finalCountryIsoCodeForReset) : undefined;

    if (countryForPhoneReset && newFormValues.phoneNumber) {
        const countryDialCode = `+${countryForPhoneReset.dialCode}`;
        if (newFormValues.phoneNumber.startsWith(countryDialCode)) {
            newFormValues.phoneNumber = newFormValues.phoneNumber.substring(countryDialCode.length);
        }
    }
    
    form.reset(newFormValues, { keepSubmitSucceeded: true, keepDirtyValues: false, keepValues: false });
    
    setIsLoading(false);
    toast({
      title: 'Settings Updated',
      description: 'Your profile information has been saved.',
    });
  }


  const handleDeleteAccountConfirm = async () => {
    setIsLoading(true);
    await deleteAccount();
    toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
        variant: "destructive",
    });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-3xl bg-muted text-muted-foreground">
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
                      {!isAdminEditing && (
                        <Button variant="ghost" size="sm" onClick={handleAdminEditAttempt} className="ml-2 p-1 h-auto">
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
                        readOnly={!isAdminEditing}
                        aria-readonly={!isAdminEditing}
                        className="text-lg"
                        maxBeforeDecimal={10} 
                      />
                    </FormControl>
                    {!isAdminEditing && <FormDescription>Admin access only.</FormDescription>}
                    {isAdminEditing && <FormDescription className="text-green-600 dark:text-green-500">Balance editing enabled. Use with caution.</FormDescription>}
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
                    <FormLabel className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                        Email Address
                        {!isAdminEditing && (
                            <Button variant="ghost" size="sm" onClick={handleAdminEditAttempt} className="ml-2 p-1 h-auto">
                            <Edit3 className="h-4 w-4 mr-1" /> Edit
                            </Button>
                        )}
                    </FormLabel>
                    <FormControl><Input type="email" {...field} readOnly={!isAdminEditing} aria-readonly={!isAdminEditing} /></FormControl>
                    {!isAdminEditing && <FormDescription>Admin access required to change email.</FormDescription>}
                    {isAdminEditing && <FormDescription className="text-green-600 dark:text-green-500">Email editing enabled.</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="flex items-center">
                        <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
                        New Password
                        {!isAdminEditing && (
                            <Button variant="ghost" size="sm" onClick={handleAdminEditAttempt} className="ml-2 p-1 h-auto">
                            <Edit3 className="h-4 w-4 mr-1" /> Edit
                            </Button>
                        )}
                    </FormLabel>
                    <div className="relative">
                        <FormControl>
                            <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Leave blank to keep current"
                            {...field}
                            readOnly={!isAdminEditing}
                            aria-readonly={!isAdminEditing}
                            className="pr-10"
                            suppressHydrationWarning={true}
                            />
                        </FormControl>
                        {isAdminEditing && (
                            <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={togglePasswordVisibility}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            suppressHydrationWarning={true}
                            >
                            {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                        )}
                    </div>
                    {!isAdminEditing && <FormDescription>Admin access required to change password.</FormDescription>}
                    {isAdminEditing && <FormDescription className="text-green-600 dark:text-green-500">Password editing enabled.</FormDescription>}
                    <FormMessage />
                    </FormItem>
                )}
                />
              
              <FormField
                control={form.control}
                name="countryIsoCode" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country Code</FormLabel>
                     <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('phoneNumber', '', {shouldDirty: true}); 
                        }} 
                        value={field.value || ''} 
                        defaultValue={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country code" />
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
                        countryIsoCode={selectedCountry?.code || (user.country ? findCountryByIsoCode(user.country)?.code : '')}
                        value={field.value || ''} 
                        onChange={(val) => field.onChange(val)}
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
                            <FormLabel>Country/Province</FormLabel>
                            <FormControl><Input placeholder="CA / Ontario" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                     <FormField
                        control={form.control}
                        name="addressZip"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>ZIP/Postal Code</FormLabel>
                            <FormControl><Input placeholder="90210 / M5V 2T6" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>

              <CardFooter className="border-t pt-6 px-0 flex justify-between items-center">
                <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action will permanently delete your account and all associated data. 
                                This cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDeleteAccountConfirm}
                                disabled={isLoading}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, Delete My Account"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                
                <Button type="submit" disabled={isLoading || (!form.formState.isDirty && !isAdminEditing )}>
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
              To edit protected fields (Balance, Email, Password), please enter the administrator code.
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

