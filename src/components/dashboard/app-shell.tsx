'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import * as React from 'react';
import {
  Home, Settings, LogOut, Landmark, ArrowRightLeft, Menu, Gem,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("animate-spin", className)}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

export function AppShell({ children }: { children: ReactNode }) {
  const { logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const currentPath = usePathname();

  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  // Load user from localStorage
  React.useEffect(() => {
    const localUser = typeof window !== 'undefined' ? localStorage.getItem('balanceBeamUser') : null;
    if (localUser) {
      try {
        const parsedUser = JSON.parse(localUser);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing localStorage user:', err);
      }
    }
    setLoading(false);
  }, []);

  // Redirect if no user
  React.useEffect(() => {
    if (!loading && !user && typeof window !== 'undefined') {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Loading application...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-foreground">Redirecting...</p>
      </div>
    );
  }

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
    { href: '/withdraw', label: 'Withdrawals', icon: Landmark },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    return '??';
  };

  const userInitials = getInitials(user?.firstName, user?.lastName);

  const sidebarContent = (isMobile?: boolean, inSheetContext?: boolean) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {inSheetContext ? (
        <SheetHeader className="flex h-16 items-center border-b border-sidebar-border px-6 !flex-row !items-center !justify-start !space-y-0 !text-left">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sidebar-primary">
            <Gem className="h-7 w-7" />
            <SheetTitle className="text-xl text-sidebar-primary">Patriot Wallet</SheetTitle>
          </Link>
        </SheetHeader>
      ) : (
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-sidebar-primary">
            <Gem className="h-7 w-7" />
            <span className="text-xl">Patriot Wallet</span>
          </Link>
        </div>
      )}
      <nav className="flex-1 overflow-auto py-4">
        <ul className="grid items-start gap-1 px-4 text-sm font-medium">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground transition-all hover:text-sidebar-primary hover:bg-sidebar-accent',
                  currentPath === item.href && 'bg-sidebar-accent text-sidebar-primary font-semibold'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r border-sidebar-border bg-sidebar lg:block">
        {sidebarContent(false, false)}
      </div>
      <div className="flex flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 bg-sidebar text-sidebar-foreground border-sidebar-border w-[280px]">
              {sidebarContent(true, true)}
            </SheetContent>
          </Sheet>

          <div className="ml-auto flex items-center gap-4">
            <ThemeToggleButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
