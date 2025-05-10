'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: number; 
  onChange: (value: number) => void; 
  currencySymbol?: string;
  maxBeforeDecimal?: number; 
}

const formatNumberToCurrencyString = (num: number, currencySymbol: string): string => {
  if (typeof num !== 'number' || isNaN(num)) {
    num = 0;
  }
  const fixedNum = num.toFixed(2);
  const [dollars, centsPart] = fixedNum.split('.');
  const formattedDollars = parseInt(dollars, 10).toLocaleString('en-US');
  return `${currencySymbol}${formattedDollars}.${centsPart}`;
};

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
    
    const getRawDigitsFromValue = (val: number): string => {
      if (typeof val !== 'number' || isNaN(val)) return '';
      return Math.round(val * 100).toString();
    };
    
    const [rawDigits, setRawDigits] = useState<string>(() => getRawDigitsFromValue(value));

    useEffect(() => {
      setDisplayedValue(formatNumberToCurrencyString(value, currencySymbol));
      setRawDigits(getRawDigitsFromValue(value));
    }, [value, currencySymbol]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      let newRawDigits = inputValue.replace(/\D/g, ''); 

      const maxTotalDigits = maxBeforeDecimal + 2;
      if (newRawDigits.length > maxTotalDigits) {
        newRawDigits = newRawDigits.slice(0, maxTotalDigits);
      }
      
      setRawDigits(newRawDigits); 
      
      const numericValue = parseDigitsToFloat(newRawDigits);
      setDisplayedValue(formatNumberToCurrencyString(numericValue, currencySymbol));
      onChange(numericValue); 
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
          inputMode="decimal" 
          value={displayedValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={cn("text-left", className)}
          suppressHydrationWarning // Added to prevent potential hydration warnings
          {...props}
        />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
