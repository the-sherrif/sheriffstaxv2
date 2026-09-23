import { ArrowUpRight } from 'lucide-react';
import { HeroVideo } from '@/components/hero-video';
import { SiteHeader, SiteFooter } from '@/components/site-shell';
export default function SiteHome(){return <><SiteHeader/><main id="main-content">      <section className="hero hero-artwork">
        <HeroVideo/>
        <div className="hero-content wrap">
        <div className="hero-copy">
        <p className="eyebrow hero-label">[ JURISDICTION: THE ENTIRE TIMELINE ]</p>
        <h1>The Sheriff<br/>is <em>recruiting.</em></h1>
        <p className="hero-description">Join the Deputy waitlist. Apply with your X username and earn your place before tax season opens.</p>
        <div className="hero-actions"><a className="button primary" href="/deputy-hq">APPLY FOR A BADGE <ArrowUpRight size={18}/></a><a className="text-link" href="/deputy-hq">RETURN TO MY APPLICATION <ArrowUpRight size={14}/></a></div>
        </div>
        </div>
        <div className="hero-baseline wrap"><span><i className="status-dot"/> RECRUITMENT OPEN</span><span>FREE TO APPLY · NO WALLET REQUIRED</span><span>TAX SEASON / NOT YET OPEN</span></div>
      </section>
<section className="recruitment-brief wrap" aria-labelledby="recruitment-heading"><div><p className="eyebrow">BEFORE THE TAX SEASON</p><h2 id="recruitment-heading">First, the Deputies.</h2><p>The Sheriff’s Tax is an experiment in voluntary taxation, with no token promise or promised financial return. Right now, we’re building the Deputy roster.</p></div><ol className="recruitment-steps"><li><span>01</span><div><h3>Apply</h3><p>Join with your X username. No wallet needed.</p></div></li><li><span>02</span><div><h3>Complete your orders</h3><p>Follow the Sheriff and complete the social tasks tied to the official Warrant when it is published.</p></div></li><li><span>03</span><div><h3>Earn your badge</h3><p>Qualify for your Deputy number and recruitment link. The first 100 issued badges become Founding Deputies.</p></div></li></ol></section></main><SiteFooter/></>;}