'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { findCountryByIsoCode, type Country } from '@/lib/countries';

interface PhoneNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: string; // Raw national digits, e.g., "3245567689" for a US number
  onChange: (value: string) => void; // Returns raw national digits
  countryIsoCode?: string; // e.g., "US", "GB"
}

const applyFormat = (digits: string, country?: Country): string => {
  if (!country) {
    return digits; // No country info, return raw digits as is
  }
  if (!digits) {
    // No digits entered, but we have country info
    return country.dialCode ? `+${country.dialCode}` : ''; // Show country code or empty if no dialCode
  }
  
  const { dialCode, phoneFormat } = country;

  if (!phoneFormat) {
    return `+${dialCode} ${digits}`; // Fallback if no specific format pattern
  }

  const { groups, pattern } = phoneFormat;
  
  let nationalNum = digits;
  let currentPos = 0;
  const groupsValues: string[] = [];

  for (const groupLength of groups) {
    if (currentPos < nationalNum.length) {
      groupsValues.push(nationalNum.substring(currentPos, Math.min(currentPos + groupLength, nationalNum.length)));
      currentPos += groupLength;
    } else {
      break; 
    }
  }
  
  let formatted = pattern.replace('%CC%', dialCode);
  for (let i = 0; i < groupsValues.length; i++) {
    formatted = formatted.replace(`%G${i + 1}%`, groupsValues[i]);
  }
  
  for (let i = groupsValues.length; i < groups.length; i++) {
    const placeholderRegex = new RegExp(` ?%G${i + 1}%`, 'g'); 
    formatted = formatted.replace(placeholderRegex, '');
  }
  
  formatted = formatted.replace(/[\s-()]+$/, ''); 
  if (formatted.endsWith('(') && nationalNum.length > 0) { 
    formatted = formatted.slice(0, -1).trim();
  }
  if (formatted === `+${dialCode} ()` && nationalNum.length === 0) { 
      formatted = `+${dialCode}`;
  }


  return formatted;
};


export const PhoneNumberInput = React.forwardRef<HTMLInputElement, PhoneNumberInputProps>(
  ({ value, onChange, countryIsoCode, className, ...props }, ref) => {
    const [country, setCountry] = useState<Country | undefined>(undefined);
    const [displayedValue, setDisplayedValue] = useState<string>('');

    useEffect(() => {
      const newCountry = countryIsoCode ? findCountryByIsoCode(countryIsoCode) : undefined;
      setCountry(newCountry);
      
      const nationalDigitsFromProp = (value || '').replace(/\D/g, ''); 
      
      const maxLength = newCountry?.phoneFormat?.maxLength ?? 15; 
      const validNationalDigits = nationalDigitsFromProp.slice(0, maxLength);
      
      setDisplayedValue(applyFormat(validNationalDigits, newCountry));
      
      if (value !== validNationalDigits) { 
        onChange(validNationalDigits);
      }
    }, [countryIsoCode, value, onChange]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const currentInputText = event.target.value;
      let newNationalDigits = "";

      if (country) {
        const allDigitsInText = currentInputText.replace(/\D/g, ''); 

        if (country.dialCode && allDigitsInText.startsWith(country.dialCode)) {
          newNationalDigits = allDigitsInText.substring(country.dialCode.length);
        } else {
          newNationalDigits = allDigitsInText;
        }
      } else {
        newNationalDigits = currentInputText.replace(/\D/g, '');
      }
      
      const maxLength = country?.phoneFormat?.maxLength ?? 15; 
      if (newNationalDigits.length > maxLength) {
        newNationalDigits = newNationalDigits.slice(0, maxLength);
      }
      
      onChange(newNationalDigits); 
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const { key, ctrlKey, metaKey } = event;
        if (
            !(/\d/.test(key) || 
            ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'].includes(key) || 
            (ctrlKey || metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) &&
            key.length === 1 
        ) {
            event.preventDefault();
        }
        if (props.onKeyDown) {
          props.onKeyDown(event);
        }
    };
    
    const getPlaceholder = () => {
        if (!country) return 'Enter phone number';
        if (country.phoneFormat) {
            let placeholder = country.phoneFormat.pattern.replace('%CC%', `+${country.dialCode}`);
            for(let i=0; i < country.phoneFormat.groups.length; i++){
                placeholder = placeholder.replace(`%G${i+1}%`, 'x'.repeat(country.phoneFormat.groups[i]));
            }
            return placeholder;
        }
        return `+${country.dialCode} ...`;
    }

    return (
      <Input
        ref={ref}
        type="tel"
        value={displayedValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={getPlaceholder()}
        className={cn(className)}
        suppressHydrationWarning // Added to prevent potential hydration warnings with dynamic values
        {...props}
      />
    );
  }
);

PhoneNumberInput.displayName = 'PhoneNumberInput';
