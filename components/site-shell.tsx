import { ArrowUpRight } from 'lucide-react';
export function SiteHeader(){return (<header className="header-shell" id="top"><div className="site-header wrap">
      <a className="wordmark" href="/" aria-label="The Sheriff's Tax waitlist"><img src="/brand/sheriff-icon.png" width="46" height="46" alt=""/><span>The Sheriff’s Tax<small>DECENTRALIZED REVENUE SERVICE</small></span></a>
      <nav aria-label="Main navigation"><a href="#registry">Waitlist</a></nav>
      <a className="button outline header-apply" href="#registry">JOIN <ArrowUpRight size={16}/></a>
    </div></header>);}
export function SiteFooter(){return (<footer className="frontier-footer">
      <div className="wrap">
        <div className="footer-main">
          <div className="footer-brand">
            <a className="wordmark" href="/"><img src="/brand/sheriff-icon.png" width="46" height="46" loading="lazy" alt=""/><span>The Sheriff’s Tax<small>DECENTRALIZED REVENUE SERVICE</small></span></a>
            <p className="footer-motto">Jurisdiction:<br/><em>the entire timeline.</em></p>
            <p className="footer-description">Deputy recruitment is open. Join the waitlist before tax season begins. No wallet or payment required.</p>
            <a className="button primary" href="#registry">JOIN THE WAITLIST <ArrowUpRight size={18}/></a>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <h2>THE JURISDICTION</h2>
            <a href="#registry">Deputy waitlist</a>
            
            
          </nav>
          <div className="footer-links">
            <h2>OFFICIAL CHANNELS</h2>
            <div className="social-links"><a href="https://x.com/sheriffstax" target="_blank" rel="noopener noreferrer" aria-label="X (opens in a new tab)" title="X"><img src="/brand/social/x.svg" width="22" height="22" alt=""/></a><a href="https://t.me/+pQ8y3u-i9VkxYmI0" target="_blank" rel="noopener noreferrer" aria-label="Telegram (opens in a new tab)" title="Telegram"><img src="/brand/social/telegram.svg" width="22" height="22" alt=""/></a><a href="https://discord.gg/GztARvCgK" target="_blank" rel="noopener noreferrer" aria-label="Discord (opens in a new tab)" title="Discord"><img src="/brand/social/discord.svg" width="22" height="22" alt=""/></a></div>
            <p className="footer-season">TAX SEASON<br/><strong>Not yet open</strong></p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>Participation is voluntary. No token promise or promised financial return.</p>
          <a href="/">Back to top ↑</a>
        </div>
      </div>
    </footer>);}
