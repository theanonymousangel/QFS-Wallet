'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react'; 

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
import { CurrencyInput } from '@/components/ui/currency-input';
import { PhoneNumberInput } from '@/components/ui/phone-number-input';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldAlert } from 'lucide-react';
import { COUNTRIES_LIST, findCountryByIsoCode, type Country } from '@/lib/countries'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SUPPORTED_CURRENCIES, findCurrencyByCode, DEFAULT_CURRENCY_CODE, type Currency } from '@/lib/currencies';
import { ADMIN_CODE } from '@/lib/types';


const signupFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  countryIsoCode: z.string().min(1, { message: 'Country code is required.'}), 
  phoneNumber: z.string().min(1, { message: 'Phone number is required.' }),
  addressStreet: z.string().min(1, { message: 'Street address is required.' }),
  addressCity: z.string().optional(), 
  addressState: z.string().optional(), 
  addressZip: z.string().optional(), 
  selectedCurrency: z.string().min(3, { message: 'Currency is required.' }),
  initialBalance: z.coerce.number().min(0, { message: 'Balance must be a positive number.' }),
  adminPassword: z.string().min(1, { message: 'Admin password is required.' }),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupForm() {
  const router = useRouter();
  const { signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(undefined);
  const [selectedCurrencySymbol, setSelectedCurrencySymbol] = useState<string>(findCurrencyByCode(DEFAULT_CURRENCY_CODE)?.symbol || '$');
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      countryIsoCode: '',
      phoneNumber: '',
      addressStreet: '',
      addressCity: '',
      addressState: '',
      addressZip: '',
      selectedCurrency: DEFAULT_CURRENCY_CODE,
      initialBalance: 0,
      adminPassword: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit', 
  });

  const watchedCountryIsoCode = form.watch('countryIsoCode');
  const watchedCurrencyCode = form.watch('selectedCurrency');

  useEffect(() => {
    if (watchedCountryIsoCode) {
      setSelectedCountry(findCountryByIsoCode(watchedCountryIsoCode));
      // Only validate the phone number field change if the form has already been submitted once.
      // This prevents the "required" message from showing up prematurely.
      form.setValue('phoneNumber', '', {
        shouldValidate: form.formState.isSubmitted, 
        shouldDirty: true,
      });
    } else {
      setSelectedCountry(undefined);
    }
  }, [watchedCountryIsoCode, form]);

  useEffect(() => {
    const currency = findCurrencyByCode(watchedCurrencyCode);
    setSelectedCurrencySymbol(currency?.symbol || (findCurrencyByCode(DEFAULT_CURRENCY_CODE)?.symbol || '$'));
  }, [watchedCurrencyCode]);

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);
    
    const countryData = findCountryByIsoCode(data.countryIsoCode);
    const fullPhoneNumber = data.phoneNumber && countryData 
      ? `+${countryData.dialCode}${data.phoneNumber.replace(/\D/g, '')}` 
      : data.phoneNumber.replace(/\D/g, ''); 

    const countryName = countryData ? countryData.name : data.countryIsoCode; 

    const success = await signup({
      ...data, 
      country: countryName, 
      phoneNumber: fullPhoneNumber,
      addressCity: data.addressCity || '',
      addressState: data.addressState || '',
      addressZip: data.addressZip || '',
      adminAccessPassword: data.adminPassword, 
    }); 
    setIsLoading(false);

    if (success) {
      toast({ title: 'Signup Successful', description: 'Account created. Redirecting to Dashboard...' });
      router.push('/dashboard'); 
    } else {
      toast({
        title: 'Signup Failed',
        description: 'Could not create account. Invalid admin code or other error.',
        variant: 'destructive',
      });
       if (data.adminPassword !== ADMIN_CODE) {
         form.setError('adminPassword', { type: 'manual', message: 'Invalid admin password.' });
       }
    }
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Create User Account</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="adminPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <ShieldAlert className="mr-2 h-4 w-4 text-destructive" />
                      Admin Password
                    </FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter admin code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••" 
                        {...field} 
                        className="pr-10" 
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={togglePasswordVisibility}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  </div>
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
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                    }} 
                    value={field.value || ''} 
                    defaultValue={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country code" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES_LIST.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name} (+{country.dialCode})
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
                        countryIsoCode={selectedCountry?.code}
                        value={field.value || ''}
                        onChange={field.onChange}
                        onBlur={field.onBlur} 
                     />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressStreet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
               <FormField
                control={form.control}
                name="addressCity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                        <Input placeholder="Anytown" {...field} value={field.value || ''} />
                    </FormControl>
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
                    <FormControl>
                        <Input placeholder="CA / Ontario" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="addressZip"
                render={({ field }) => (
                  <FormItem className="relative">
                  <FormLabel 
                     htmlFor={field.name} 
                     className="block text-sm font-medium text-foreground text-center sm:text-left"
                   >
                    ZIP/Postal Code
                  </FormLabel>
                  <FormControl>
                      <Input 
                        placeholder="90210 / M5V 2T6" 
                        {...field} 
                        id={field.name}
                        value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="selectedCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.name} ({currency.symbol})
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
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Account Balance</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      placeholder={`${selectedCurrencySymbol}0.00`}
                      value={typeof field.value === 'number' ? field.value : 0}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      currencySymbol={selectedCurrencySymbol}
                      maxBeforeDecimal={10} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex-col items-center text-sm">
        <p className="text-center text-muted-foreground">
          Already have an account?{' '}
          <Button variant="link" asChild className="p-0 text-primary hover:underline">
            <Link href="/login">Log in</Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
