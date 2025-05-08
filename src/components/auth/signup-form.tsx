
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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
import { Loader2 } from 'lucide-react';
import { COUNTRIES_LIST, findCountryByIsoCode, type Country } from '@/lib/countries'; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


const signupFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  countryIsoCode: z.string().min(1, { message: 'Country is required.'}), // Storing ISO code
  phoneNumber: z.string().optional(),
  addressStreet: z.string().min(1, { message: 'Street address is required.' }),
  addressCity: z.string().min(1, { message: 'City is required.' }),
  addressState: z.string().min(1, { message: 'State/Province is required.' }),
  addressZip: z.string().min(1, { message: 'ZIP/Postal code is required.' }),
  initialBalance: z.coerce.number().min(0, { message: 'Balance must be a positive number.' }),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export function SignupForm() {
  const router = useRouter();
  const { signup } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | undefined>(undefined);

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
      initialBalance: 0,
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

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);
    
    // Construct the full phone number with country code before sending to signup
    const countryData = findCountryByIsoCode(data.countryIsoCode);
    const fullPhoneNumber = data.phoneNumber && countryData 
      ? `+${countryData.dialCode}${data.phoneNumber.replace(/\D/g, '')}` 
      : data.phoneNumber; // Fallback or if no country data

    const countryName = countryData ? countryData.name : data.countryIsoCode; // Send full country name

    const success = await signup({
      ...data,
      country: countryName, // Use the full country name
      phoneNumber: fullPhoneNumber, // Use the potentially prefixed phone number
    }); 
    setIsLoading(false);

    if (success) {
      toast({ title: 'Signup Successful', description: 'Account created. Redirecting to Home...' });
      router.push('/dashboard'); 
    } else {
      toast({
        title: 'Signup Failed',
        description: 'Could not create account. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Create User Account</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="countryIsoCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('phoneNumber', ''); // Reset phone number when country changes
                    }} 
                    value={field.value || ''} 
                    defaultValue={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
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
                  <FormLabel>Phone Number (Optional)</FormLabel>
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
                    <FormLabel>State / Province</FormLabel>
                    <FormControl>
                        <Input placeholder="California" {...field} value={field.value || ''} />
                    </FormControl>
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
                    <FormControl>
                        <Input placeholder="90210" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="initialBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Account Balance</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      placeholder="$0.00"
                      value={typeof field.value === 'number' ? field.value : 0}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
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

