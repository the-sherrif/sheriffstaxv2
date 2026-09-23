import { SiteHeader, SiteFooter } from '@/components/site-shell';
import { RegistryPanel } from '@/components/registry-panel';

export function RecruitmentLaunch() {
  return <>
    <SiteHeader/>
    <main id="main-content" className="hq-main wrap">
      <header className="hq-heading">
        <p className="eyebrow">DEPUTY RECRUITMENT / TAX SEASON NOT OPEN</p>
        <h1>Join the Deputy waitlist.</h1>
        <p>Apply with your X username. No wallet or payment required.</p>
      </header>
      <section id="registry" className="hq-workspace" aria-label="Deputy waitlist application">
        <RegistryPanel/>
      </section>
      <p className="hq-footnote">Your application stays saved in this browser.<br/>The first 100 issued badges become Founding Deputies.</p>
    </main>
    <SiteFooter/>
  </>;
}
