import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { RegistryPanel } from '@/components/registry-panel';
import { PublicRecords } from '@/components/public-records';

export default function SiteHome() {
  return <>
    <header className="header-shell"><div className="site-header wrap">
      <a className="wordmark" href="/" aria-label="The Sheriff's Tax home"><img src="/brand/sheriff-icon.png" width="46" height="46" alt=""/><span>The Sheriff’s Tax<small>DECENTRALIZED REVENUE SERVICE</small></span></a>
      <nav aria-label="Main navigation"><a href="#registry">Registry</a><a href="#leaderboard">Deputies</a><a href="#tax-code">Tax code</a></nav>
      <a className="button outline header-apply" href="#registry">APPLY <ArrowUpRight size={16}/></a>
    </div></header>
    <main>
      <section className="hero wrap">
        <p className="eyebrow hero-label">[ JURISDICTION: THE ENTIRE TIMELINE ]</p>
        <h1>Congratulations.<br/>You’re being <em>taxed.</em></h1>
        <p className="hero-description">Can the internet voluntarily pay The Sheriff <strong>$100,000</strong> with no promised financial return?</p>
        <div className="hero-actions"><a className="button primary" href="#registry">APPLY FOR A BADGE <ArrowUpRight size={18}/></a><a className="text-link" href="#tax-code">THE TAX CODE <ArrowDown size={14}/></a></div>
        <div className="sheriff-signature"><span className="signature-note">THE SHERIFF<br/>IS HIRING.</span><img src="/brand/sheriff-cutout.png" width="1254" height="1254" alt="The Sheriff in his black cowboy hat and brass star" fetchPriority="high"/><span className="signature-note">FOLLOW THE ORDERS.<br/>EARN YOUR BADGE.</span></div>
        <div className="hero-baseline"><span><i className="status-dot"/> RECRUITMENT OPEN</span><span>FREE TO APPLY · NO WALLET REQUIRED</span><span>TAX SEASON / NOT YET OPEN</span></div>
      </section>
      <div className="signal-divider"/>
      <section className="registry-section wrap" id="registry">
        <div className="registry-intro"><p className="eyebrow">[ 01 / THE DEPUTY REGISTRY ]</p><h2>Earn your badge.<br/>Enter the <em>jurisdiction.</em></h2><p>You bring the timeline. The Sheriff brings the paperwork.</p><p>Apply with your X username. Complete your Field Orders. Your numbered badge and personal recruitment link arrive when you qualify.</p><div className="registry-note"><img src="/brand/sheriff-icon.png" width="50" height="50" alt=""/><p>The first 100 issued badges become<br/><strong>Founding Deputies.</strong></p></div><p className="workflow-label">APPLY <span>→</span> QUALIFY <span>→</span> RECRUIT</p></div>
        <RegistryPanel/>
      </section>
      <PublicRecords/>
      <section className="tax-code wrap" id="tax-code"><p className="eyebrow">[ THE TAX CODE / ARTICLE 001 ]</p><div className="tax-code-content"><h2>A bold premise.<br/><em>Clearly stated.</em></h2><div><p>Participation is voluntary. There is no token promise, APY, equity, guaranteed airdrop or guaranteed financial return.</p><p>Phase I targets $75,000 with contributions of $750–$2,500. Phase II targets $25,000 with contributions of $25–$250 and stays locked until Phase I reaches its target.</p></div></div></section>
    </main>
    <footer className="wrap"><a className="official-profile" href="https://x.com/sheriffstax" target="_blank" rel="noreferrer"><img src="/brand/sheriff-pfp.png" width="44" height="44" loading="lazy" alt="The Sheriff’s official neon-green profile portrait"/><span>@sheriffstax <ArrowUpRight size={13}/></span></a><span>THE DECENTRALIZED REVENUE SERVICE</span><a href="https://github.com/the-sherrif/sheriffstaxv2" target="_blank" rel="noreferrer">GITHUB <ArrowUpRight size={13}/></a></footer>
  </>;
}
