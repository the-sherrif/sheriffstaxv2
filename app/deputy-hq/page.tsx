import type { Metadata } from 'next';
import { RecruitmentLaunch } from '@/components/recruitment-launch';
export const metadata: Metadata = {title: 'Deputy HQ — The Sheriff’s Tax', description: 'Apply for the Deputy waitlist, resume your Field Orders, and access your badge. No wallet or payment required.'};
export default function DeputyHQ(){return <RecruitmentLaunch/>;}
