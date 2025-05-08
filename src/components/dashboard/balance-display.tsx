
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { findCurrencyByCode, getDefaultCurrency } from '@/lib/currencies';

export function BalanceDisplay() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [currentFontSize, setCurrentFontSize] = useState('text-3xl'); 

  const balanceContainerRef = useRef<HTMLDivElement>(null);
  const measuringSpanRef = useRef<HTMLSpanElement>(null);

  if (!user) return null;

  const selectedUserCurrency = findCurrencyByCode(user.selectedCurrency) || getDefaultCurrency();

  const formattedBalance = new Intl.NumberFormat('en-US', { // 'en-US' for number formatting style
    style: 'currency',
    currency: selectedUserCurrency.code, // Use the user's selected currency code
    currencyDisplay: 'symbol', // Ensure symbol is used
  }).format(user.balance);

  useEffect(() => {
    if (!isVisible) {
      setCurrentFontSize('text-3xl');
      return;
    }

    if (measuringSpanRef.current && balanceContainerRef.current && formattedBalance) {
      const measureEl = measuringSpanRef.current;
      const containerEl = balanceContainerRef.current;
      
      measureEl.textContent = formattedBalance;

      const availableSizes = ['text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base'];
      let newOptimalSize = availableSizes[availableSizes.length - 1]; 

      for (const sizeClass of availableSizes) {
        measureEl.className = `font-bold whitespace-nowrap ${sizeClass}`;
        
        if (measureEl.scrollWidth <= containerEl.clientWidth) {
          newOptimalSize = sizeClass; 
          break; 
        }
      }
      setCurrentFontSize(newOptimalSize);
    }
  }, [user.balance, isVisible, formattedBalance, user.selectedCurrency]);


  return (
    <>
      <span 
        ref={measuringSpanRef} 
        className="font-bold" 
        style={{ position: 'absolute', visibility: 'hidden', height: 'auto', width: 'auto', whiteSpace: 'nowrap' }}
      ></span>

      <Card className="shadow-lg"> {/* Removed gradient and specific border */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground"> {/* Changed text color to muted-foreground */}
            Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div ref={balanceContainerRef} className="min-w-0 flex-1"> 
              <div 
                className={`font-bold text-foreground whitespace-nowrap ${currentFontSize} truncate`}
              >
                {isVisible ? formattedBalance : '••••••••'}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsVisible(!isVisible)} aria-label={isVisible ? "Hide balance" : "Show balance"}>
              {isVisible ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />} {/* Changed icon color to muted-foreground */}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

