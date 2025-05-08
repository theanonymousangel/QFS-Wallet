import Image from 'next/image';
import { Building, Gem } from 'lucide-react'; // Using Gem as a placeholder for logo

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background to-accent/30 p-4 auth-background">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center justify-center rounded-full bg-primary p-3">
                 <Gem className="h-10 w-10 text-primary-foreground" />
            </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            QFS Wallet
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your Modern Wallet Experience
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

