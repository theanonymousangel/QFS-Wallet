
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
  if (!country || !country.phoneFormat || !digits) {
    return country ? `+${country.dialCode} ${digits}` : digits;
  }

  const { dialCode, phoneFormat } = country;
  const { groups, pattern } = phoneFormat;
  
  let nationalNum = digits;
  let currentPos = 0;
  const groupsValues: string[] = []; // Corrected variable declaration

  for (const groupLength of groups) {
    if (currentPos < nationalNum.length) {
      groupsValues.push(nationalNum.substring(currentPos, Math.min(currentPos + groupLength, nationalNum.length)));
      currentPos += groupLength;
    } else {
      break; 
    }
  }
  
  // If not enough digits for all groups, some group values might be partial or empty.
  // The pattern replacement should handle this gracefully.

  let formatted = pattern.replace('%CC%', dialCode);
  for (let i = 0; i < groupsValues.length; i++) {
    formatted = formatted.replace(`%G${i + 1}%`, groupsValues[i]);
  }
  
  // Clean up any remaining placeholders if not all groups were filled
  for (let i = groupsValues.length; i < groups.length; i++) {
    formatted = formatted.replace(/ \(%G\d+%\)/, '').replace(/\(%G\d+%\)/, '').replace(/%G\d+%-/, '').replace(/-%G\d+%/, '').replace(/%G\d+%\s/, '').replace(/\s%G\d+%/, '').replace(/%G\d+%/, '');
  }
  // Remove trailing spaces or hyphens if input is partial
  formatted = formatted.replace(/[\s-]+$/, '').replace(/\(\s*\)/, '');


  return formatted;
};


export const PhoneNumberInput = React.forwardRef<HTMLInputElement, PhoneNumberInputProps>(
  ({ value, onChange, countryIsoCode, className, ...props }, ref) => {
    const [country, setCountry] = useState<Country | undefined>(undefined);
    const [displayedValue, setDisplayedValue] = useState<string>('');

    useEffect(() => {
      const newCountry = countryIsoCode ? findCountryByIsoCode(countryIsoCode) : undefined;
      setCountry(newCountry);
      // When country changes, re-evaluate current value with new format or clear if incompatible
      const rawDigits = value.replace(/\D/g, '');
      const maxLength = newCountry?.phoneFormat?.maxLength ?? Infinity;
      const validDigits = rawDigits.slice(0, maxLength);
      
      setDisplayedValue(applyFormat(validDigits, newCountry));
      if(rawDigits !== validDigits) { // If value was truncated
        onChange(validDigits);
      }

    }, [countryIsoCode, value, onChange]); // Added value and onChange to re-format/validate on external value changes

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      let inputValue = event.target.value;
      
      // Attempt to extract digits intelligently, considering the prefix may already be there
      const prefix = country ? `+${country.dialCode}` : '';
      let nationalDigits = '';

      if (country && inputValue.startsWith(prefix)) {
        nationalDigits = inputValue.substring(prefix.length).replace(/\D/g, '');
      } else if (inputValue.startsWith('+')) { // User might be typing a different country code
        // For now, we simplify: if countryIsoCode is set, we only care about national part.
        // If + is typed but not matching current country, it will be stripped if not a digit.
        // This part could be more sophisticated to allow changing country by typing its code.
        nationalDigits = inputValue.replace(/\D/g, ''); 
        // if countryIsoCode is defined, we assume the typed digits are national, unless they start with *this* country's code.
      } else {
         nationalDigits = inputValue.replace(/\D/g, '');
      }
      
      const maxLength = country?.phoneFormat?.maxLength ?? Infinity;
      if (nationalDigits.length > maxLength) {
        nationalDigits = nationalDigits.slice(0, maxLength);
      }
      
      onChange(nationalDigits); // Propagate raw national digits
      setDisplayedValue(applyFormat(nationalDigits, country)); // Update display
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const { key, ctrlKey, metaKey } = event;
        // Allow control keys, navigation, backspace, delete, tab, numbers
        if (
            !(/\d/.test(key) || 
            ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End', '+'].includes(key) || // Allow plus sign
            (ctrlKey || metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) &&
            key.length === 1 // check for actual typed character keys
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
        type="tel" // Use "tel" for better mobile keyboard
        value={displayedValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={country ? applyFormat('', country).replace(/\s\S*$/, '...').trim() : 'Enter phone number'}
        className={cn(className)}
        {...props}
      />
    );
  }
);

PhoneNumberInput.displayName = 'PhoneNumberInput';

