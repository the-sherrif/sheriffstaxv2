import type { Metadata } from 'next';
import './globals.css';
import './sheriff.css';
export const metadata: Metadata = { title: 'The Sheriff’s Tax — The Deputy Registry', description: 'The Sheriff is hiring Deputies. A $100,000 experiment in voluntary taxation. No token promise. No promised financial return.', icons: { icon: '/brand/sheriff-icon.png', apple: '/brand/sheriff-icon.png' }, robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><a className="sr-only focus:not-sr-only" href="#registry">Skip to the Deputy Registry</a>{children}</body></html>; }
