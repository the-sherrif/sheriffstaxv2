import type { Metadata } from 'next';
import { RecruitmentLaunch } from '@/components/recruitment-launch';

export const metadata: Metadata = {
  title: 'Deputy Waitlist — The Sheriff’s Tax',
  description: 'Join The Sheriff’s Tax Deputy waitlist. Apply with your X username—no wallet or payment required.',
};

export default function Home() { return <RecruitmentLaunch/>; }
