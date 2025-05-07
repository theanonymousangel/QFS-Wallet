import type { SVGProps } from 'react';

export function GoogleWalletIcon(props: SVGProps<SVGSVGElement>) {
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
      <path d="M20 6V4H4v2" />
      <path d="M4 18v2h16v-2" />
      <path d="M16.5 6.5l-3 3-1.5-1.5-3 3" />
      <path d="M22 12H2" />
      <path d="M19 12V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v5" />
      <path d="M5 12v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </svg>
  );
}
