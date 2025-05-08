'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react'; // Removed UserCircle import
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

export function BalanceDisplay() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [currentFontSize, setCurrentFontSize] = useState('text-3xl'); // Default Tailwind class

  const balanceContainerRef = useRef<HTMLDivElement>(null);
  const measuringSpanRef = useRef<HTMLSpanElement>(null);

  if (!user) return null;

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(user.balance);

  useEffect(() => {
    if (!isVisible) {
      // For '••••••••', default size is likely fine.
      setCurrentFontSize('text-3xl');
      return;
    }

    if (measuringSpanRef.current && balanceContainerRef.current && formattedBalance) {
      const measureEl = measuringSpanRef.current;
      const containerEl = balanceContainerRef.current;
      
      // Set the text to be measured on the hidden span
      measureEl.textContent = formattedBalance;

      const availableSizes = ['text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base'];
      // Default to the smallest size if no other size fits.
      let newOptimalSize = availableSizes[availableSizes.length - 1]; 

      for (const sizeClass of availableSizes) {
        // Apply relevant classes for accurate measurement.
        // Ensure only one size class is active.
        measureEl.className = `font-bold whitespace-nowrap ${sizeClass}`;
        
        if (measureEl.scrollWidth <= containerEl.clientWidth) {
          newOptimalSize = sizeClass; // This is the largest size that fits
          break; 
        }
      }
      setCurrentFontSize(newOptimalSize);
    }
  }, [user.balance, isVisible, formattedBalance]);


  return (
    <>
      {/* Hidden span for measurements */}
      <span 
        ref={measuringSpanRef} 
        className="font-bold" // Ensure font-weight matches for accurate measurement
        style={{ position: 'absolute', visibility: 'hidden', height: 'auto', width: 'auto', whiteSpace: 'nowrap' }}
      ></span>

      <Card className="shadow-lg bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            Current Balance
          </CardTitle>
          {/* <UserCircle className="h-5 w-5 text-primary/70" /> Removed icon */}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div ref={balanceContainerRef} className="min-w-0 flex-1"> {/* Ensure container can shrink and provides width for measurement */}
              <div 
                className={`font-bold text-foreground whitespace-nowrap ${currentFontSize} truncate`} // Added truncate as a final fallback
              >
                {isVisible ? formattedBalance : '••••••••'}
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsVisible(!isVisible)} aria-label={isVisible ? "Hide balance" : "Show balance"}>
              {isVisible ? <EyeOff className="h-5 w-5 text-primary/70" /> : <Eye className="h-5 w-5 text-primary/70" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
