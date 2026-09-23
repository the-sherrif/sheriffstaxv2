import type { Metadata } from 'next';
import { SiteBackground } from '@/components/site-background';
import './globals.css';
import './direction.css';
import './checklist.css';
const title = 'Deputy Waitlist — The Sheriff’s Tax';
const description = 'The Sheriff is recruiting. Join the Deputy waitlist with your X username—no wallet or payment required.';
const socialImage = 'https://sherifftax.xyz/brand/sheriff-social.jpg';
const imageAlt = 'The Sheriff wearing a black cowboy hat and gold sheriff badges.';
export const metadata: Metadata = {
  title,
  description,
  icons: { icon: '/brand/sheriff-icon.png', apple: '/brand/sheriff-icon.png' },
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    url: 'https://sherifftax.xyz/',
    siteName: 'The Sheriff’s Tax',
    title,
    description,
    images: [{ url: socialImage, width: 1472, height: 1536, type: 'image/jpeg', alt: imageAlt }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@sheriffstax',
    title,
    description,
    images: [{ url: socialImage, alt: imageAlt }],
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><SiteBackground/><a className="sr-only focus:not-sr-only" href="#main-content">Skip to content</a>{children}</body></html>; }
