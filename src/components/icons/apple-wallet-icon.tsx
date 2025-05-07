import type { SVGProps } from 'react';

export function AppleWalletIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 7V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v1" />
      <path d="M19 17v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1" />
      <path d="M21 12a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" />
      <path d="M12.52 7.06a3.43 3.43 0 0 1-2.52-1.06 3.18 3.18 0 0 0-2.35-1 3.43 3.43 0 0 0-2.52 1.06" />
    </svg>
  );
}
