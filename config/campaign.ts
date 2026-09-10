// Public campaign settings. Keep credentials in runtime secrets, never here.
export type CampaignPhase = 'PRE_LAUNCH' | 'TAX_RICH' | 'TAX_POOR' | 'COMPLETED';
export const campaign = {
  name: 'The Sheriff’s Tax',
  phase: 'PRE_LAUNCH' as CampaignPhase,
  siteUrl: 'https://sheriffs-tax-registry.rhadokrypt.chatgpt.site',
  sheriffHandle: 'sheriffstax',
  githubUrl: 'https://github.com/the-sherrif/sheriffstaxv2',
  foundingLimit: 100,
  referralDays: 30,
  activeWarrant: { number: '001', title: 'Deputy Recruitment', postUrl: '', rulesVersion: 1 },
  jurisdictions: {
    TAX_RICH: { name: 'Tax the Rich', targetCents: 7_500_000, minCents: 75_000, maxCents: 250_000 },
    TAX_POOR: { name: 'Tax the Poor', targetCents: 2_500_000, minCents: 2_500, maxCents: 25_000 },
  },
  totalTargetCents: 10_000_000,
  chain: { name: 'Robinhood Chain', chainId: 4663, assets: ['ETH', 'USDG'], explorer: 'https://robinhoodchain.blockscout.com' },
  paymentsEnabled: false,
} as const;
