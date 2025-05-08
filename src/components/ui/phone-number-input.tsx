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
  if (!country || !country.phoneFormat || !digits && !country.dialCode) { // if no digits and no dialCode, return empty
    return country && country.dialCode ? `+${country.dialCode}` : digits;
  }
  if (!country || !country.phoneFormat) { // if country but no specific format, just prefix with dialcode
      return country.dialCode ? `+${country.dialCode} ${digits}`: digits;
  }


  const { dialCode, phoneFormat } = country;
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
    const placeholderRegex = new RegExp(`%G${i + 1}%`, 'g');
    // More careful replacement to avoid removing separators if group is empty but others exist
    if (groupsValues.length === 0 && i === 0) { // No groups filled yet, keep first group placeholder visible if pattern expects it
         formatted = formatted.replace(placeholderRegex, ''); // Or some visual cue like '...'
    } else {
        // Remove placeholder and potentially associated separator if it's at the end or makes sense
        // This regex is simplified, might need refinement based on exact pattern structures
        formatted = formatted.replace(new RegExp(`[- (]*%G${i+1}%[- )]*`, 'g'), '').trim();
    }
  }
  // Remove trailing spaces or hyphens if input is partial and ensure no empty parens
  formatted = formatted.replace(/[\s-]+$/, '').replace(/\(\s*\)/g, '()').replace(/\(\)/g, '');
  if (formatted.endsWith('(') && digits.length > 0) formatted = formatted.slice(0,-1).trim();


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
      
      const maxLength = newCountry?.phoneFormat?.maxLength ?? Infinity;
      const validNationalDigits = nationalDigitsFromProp.slice(0, maxLength);
      
      setDisplayedValue(applyFormat(validNationalDigits, newCountry));
      
      if (nationalDigitsFromProp !== validNationalDigits || value !== nationalDigitsFromProp) { 
        onChange(validNationalDigits);
      }
    }, [countryIsoCode, value, onChange]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const currentInputText = event.target.value;
      let newNationalDigits = "";

      if (country) {
        const allDigitsInText = currentInputText.replace(/\D/g, ''); 

        if (allDigitsInText.startsWith(country.dialCode)) {
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
            ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End', '+', '(', ')', '-',' '].includes(key) || 
            (ctrlKey || metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) &&
            key.length === 1 
        ) {
            event.preventDefault();
        }
        if (props.onKeyDown) {
          props.onKeyDown(event);
        }
    };

    return (
      <Input
        ref={ref}
        type="tel"
        value={displayedValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={country ? applyFormat('', country).replace(/%G\d%/g, '').replace(/\s*-\s*$/, '').replace(/\(\s*\)/g, '').trim() : 'Enter phone number'}
        className={cn(className)}
        {...props}
      />
    );
  }
);

PhoneNumberInput.displayName = 'PhoneNumberInput';
