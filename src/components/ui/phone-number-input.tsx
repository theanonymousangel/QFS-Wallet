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
  if (!country || !digits && !country.dialCode) {
    return country && country.dialCode ? `+${country.dialCode}` : digits;
  }
  
  const { dialCode, phoneFormat } = country;

  if (!phoneFormat) {
    return `+${dialCode} ${digits}`;
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
  
  // Replace remaining group placeholders with empty strings or a more subtle placeholder character if desired.
  // For now, just remove them if they are not filled.
  for (let i = groupsValues.length; i < groups.length; i++) {
    const placeholderRegex = new RegExp(` ?%G${i + 1}%`, 'g'); // Also match preceding space
    formatted = formatted.replace(placeholderRegex, '');
  }
  
  // Clean up trailing separators or empty parentheses
  formatted = formatted.replace(/[\s-()]+$/, ''); // Remove trailing spaces, hyphens, or parentheses
  if (formatted.endsWith('(') && nationalNum.length > 0) { // if ends with open paren and has digits
    formatted = formatted.slice(0, -1).trim();
  }
  if (formatted === `+${dialCode} ()` && nationalNum.length === 0) { // Empty like +1 ()
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
      
      const maxLength = newCountry?.phoneFormat?.maxLength ?? 15; // Default max length
      const validNationalDigits = nationalDigitsFromProp.slice(0, maxLength);
      
      setDisplayedValue(applyFormat(validNationalDigits, newCountry));
      
      // If the prop value (raw digits) is different from the processed valid digits,
      // or if the original prop value was not just digits, call onChange to sync.
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
          // Handle cases where user might delete country code part or types without it
          // Assume any digits entered are national part if country code not present or partially deleted
          newNationalDigits = allDigitsInText;
        }
      } else {
        newNationalDigits = currentInputText.replace(/\D/g, '');
      }
      
      const maxLength = country?.phoneFormat?.maxLength ?? 15; 
      if (newNationalDigits.length > maxLength) {
        newNationalDigits = newNationalDigits.slice(0, maxLength);
      }
      
      onChange(newNationalDigits); // This will trigger the useEffect above to reformat and setDisplayedValue
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const { key, ctrlKey, metaKey } = event;
        // Allow digits, navigation, backspace, delete, tab, home, end, and Ctrl/Cmd + A/C/V/X/Z
        // Disallow other characters
        if (
            !(/\d/.test(key) || 
            ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'].includes(key) || 
            (ctrlKey || metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(key.toLowerCase())) &&
            key.length === 1 // Ensure it's a single character entry and not a special key like 'Enter'
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
        type="tel" // Use "tel" for semantic correctness and mobile keyboards
        value={displayedValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={getPlaceholder()}
        className={cn(className)}
        {...props}
      />
    );
  }
);

PhoneNumberInput.displayName = 'PhoneNumberInput';
