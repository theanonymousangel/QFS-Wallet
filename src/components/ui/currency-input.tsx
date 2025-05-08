'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number; // Expects the value as a float (e.g., 123.45)
  onChange: (value: number) => void; // Returns value as a float
  currencySymbol?: string;
  maxBeforeDecimal?: number; // Max digits before decimal (e.g., 7 for 9,999,999.xx)
}

// Helper to format a number (float) to a currency string like $1,234.56
const formatNumberToCurrencyString = (num: number, currencySymbol: string): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    num = 0;
  }
  // Always show two decimal places
  const fixedNum = num.toFixed(2);
  const [dollars, centsPart] = fixedNum.split('.');
  const formattedDollars = parseInt(dollars, 10).toLocaleString('en-US');
  return `${currencySymbol}${formattedDollars}.${centsPart}`;
};

// Helper to parse a string of digits (representing value shifted by 2 decimal places) into a float value
// e.g., "1" -> 0.01, "12" -> 0.12, "123" -> 1.23, "12345" -> 123.45
const parseDigitsToFloat = (digits: string): number => {
  if (digits === '') return 0;
  if (digits.length === 1) return parseFloat(`0.0${digits}`);
  if (digits.length === 2) return parseFloat(`0.${digits}`);
  const integerPart = digits.slice(0, -2);
  const decimalPart = digits.slice(-2);
  return parseFloat(`${integerPart}.${decimalPart}`);
};


export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, currencySymbol = '$', className, maxBeforeDecimal = 7, ...props }, ref) => {
    const [displayedValue, setDisplayedValue] = useState<string>(formatNumberToCurrencyString(value, currencySymbol));
    
    // rawDigits stores the digits string as user types, e.g., "12345" for $123.45
    const getRawDigitsFromValue = (val: number): string => {
      if (typeof val !== 'number' || isNaN(val)) return '';
      // Convert to cents, then to string. Handles potential float inaccuracies.
      return Math.round(val * 100).toString();
    };
    
    const [rawDigits, setRawDigits] = useState<string>(() => getRawDigitsFromValue(value));

    useEffect(() => {
      // Sync with external value changes (e.g. form reset)
      setDisplayedValue(formatNumberToCurrencyString(value, currencySymbol));
      setRawDigits(getRawDigitsFromValue(value));
    }, [value, currencySymbol]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      let newRawDigits = inputValue.replace(/\D/g, ''); // Always extract digits from current input

      const maxTotalDigits = maxBeforeDecimal + 2;
      if (newRawDigits.length > maxTotalDigits) {
        newRawDigits = newRawDigits.slice(0, maxTotalDigits);
      }
      
      setRawDigits(newRawDigits); 
      
      const numericValue = parseDigitsToFloat(newRawDigits);
      // Update displayed value immediately based on new raw digits
      setDisplayedValue(formatNumberToCurrencyString(numericValue, currencySymbol));
      onChange(numericValue); // Notify parent (RHF) with the float value
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const { key, ctrlKey, metaKey } = event;
        if (
            (key.length === 1 && !/\d/.test(key)) && 
            !ctrlKey && !metaKey && 
            !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Home', 'End'].includes(key)
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
          type="text" 
          inputMode="decimal" // Changed from numeric to decimal for better mobile keyboard compatibility
          value={displayedValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn("text-left", className)}
          {...props}
        />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
