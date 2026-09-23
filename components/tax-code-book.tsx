'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, List, Pointer, Star, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination';
import { campaign } from '@/config/campaign';
import './tax-code-book.css';

const dollars = (cents: number) => `$${(cents / 100).toLocaleString('en-US')}`;
const rich = campaign.jurisdictions.TAX_RICH;
const poor = campaign.jurisdictions.TAX_POOR;
const chapters = [
  { title: 'The Experiment', label: 'A voluntary collection', callout: 'Congratulations. You’re being taxed.', paragraphs: [
    `Can the internet voluntarily pay the Sheriff ${dollars(campaign.totalTargetCents)} with no promised financial return? That is the experiment.`,
    'The Decentralized Revenue Service is the world of the Sheriff’s Tax. Participation is your choice. The Sheriff’s jurisdiction is the timeline.',
    'There are two contribution phases. First, Tax the Rich. Then, once its target is reached, Tax the Poor. Deputy recruitment is free and separate from contributing.'
  ] },
  { title: 'Tax the Rich', label: 'Phase I', callout: `${dollars(rich.targetCents)} target`, paragraphs: [
    `The first jurisdiction opens with a target of ${dollars(rich.targetCents)}. Individual contributions range from ${dollars(rich.minCents)} to ${dollars(rich.maxCents)}.`,
    'This is the first phase of Tax Season. The second phase stays locked until this target is reached.',
    'Tax Season is not yet open. Contribution instructions will be published when collection begins. A Deputy badge does not require a contribution.'
  ] },
  { title: 'Tax the Poor', label: 'Phase II', callout: `${dollars(poor.minCents)}–${dollars(poor.maxCents)} per contributor`, paragraphs: [
    `Phase II targets ${dollars(poor.targetCents)} and unlocks only after Phase I reaches ${dollars(rich.targetCents)}.`,
    'Tax Equality is the theme: both groups can take part in the Sheriff’s experiment, within different contribution bands.',
    `Together, the two phases form one ${dollars(campaign.totalTargetCents)} experiment. Phase II is currently locked.`
  ] },
  { title: 'Deputy Orders', label: 'Apply · qualify · recruit', callout: `First ${campaign.foundingLimit} badges: Founding Deputies`, paragraphs: [
    'Apply with your X username. Follow the Sheriff, like the Active Warrant, repost or quote it, and reply beneath it. You may also tag up to three aspiring Deputies in your reply.',
    'Your numbered badge and recruitment link are issued only after qualification. Applying alone does not reserve or issue a Deputy number.',
    'A recruit counts when their badge is issued. Link clicks and unfinished applications do not count as qualified recruits.'
  ] },
  { title: 'Treasury & Reveal', label: 'The sealed envelope', callout: `The envelope opens at ${dollars(campaign.totalTargetCents)}.`, paragraphs: [
    'The treasury tracks verified contributions toward the experiment’s total. Planned contribution assets are ETH and USDG on Robinhood Chain.',
    `The final audit and sealed envelope stay locked until the treasury reaches ${dollars(campaign.totalTargetCents)}. That is the experiment’s reveal.`,
    'The reveal is not a promise of a payout. Curiosity is part of the experiment; a financial return is not promised.'
  ] },
  { title: 'The Fine Print', label: 'Read before taking part', callout: 'Participation is voluntary.', paragraphs: [
    'There is no token promise, APY, equity, guaranteed airdrop, or guaranteed financial return.',
    'Deputy status records participation in recruitment. A badge, rank, or referral link is not a promise of financial rewards.',
    'Tax Season is not yet open. Read the published contribution instructions when it begins, and use the Sheriff’s official channels for updates.'
  ] }
];

export function TaxCodeBook() {
  const [mode, setMode] = useState<'cover' | 'book' | 'all'>('cover');
  const [page, setPage] = useState(0);
  const [single, setSingle] = useState(true);
  const [contents, setContents] = useState(false);
  const [turn, setTurn] = useState<{from:number; to:number; forward:boolean} | null>(null);
  const turnLock = useRef(false);
  const turnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touch = useRef<{x: number; y: number} | null>(null);
  const reader = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const sync = () => { if(turnTimer.current) clearTimeout(turnTimer.current); turnLock.current=false; setTurn(null); setSingle(media.matches); if (!media.matches) setPage(p => p - p % 2); };
    sync(); media.addEventListener('change', sync);
    return () => {media.removeEventListener('change', sync); if(turnTimer.current) clearTimeout(turnTimer.current);};
  }, []);
  const step = single ? 1 : 2;
  const end = Math.min(page + step, chapters.length);
  function go(next: number) {
    if (turnLock.current) return;
    const target = Math.max(0, Math.min(chapters.length - step, next));
    if(target === page) return;
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      turnLock.current=true; setTurn({from:page,to:target,forward:target>page});
      turnTimer.current=setTimeout(()=>{setTurn(null);turnLock.current=false;},720);
    }
    setPage(target);
  }
  function cancelTurn(){if(turnTimer.current)clearTimeout(turnTimer.current);turnLock.current=false;setTurn(null);}
  function changeMode(next: 'cover'|'book'|'all'){cancelTurn();setMode(next);}
  function openChapter(index: number) {
    cancelTurn();
    setPage(single ? index : index - index % 2); setMode('book'); setContents(false);
  }
  const range = single ? `Page ${page + 1} of 6` : `Pages ${page + 1}–${end} of 6`;
  function article(index: number, all = false, face = '') {
    const chapter = chapters[index];
    return <article className="ledger-page" key={index} aria-labelledby={`ledger-${face || (all ? 'all' : 'page')}-${index}`} >
      <div className="ledger-running"><span>THE SHERIFF’S TAX</span><Star size={15} aria-hidden="true"/></div>
      <p className="ledger-chapter">ARTICLE {String(index + 1).padStart(2, '0')} / {chapter.label}</p>
      <h3 id={`ledger-${face || (all ? 'all' : 'page')}-${index}`}>{chapter.title}</h3>
      <p className="ledger-callout">{chapter.callout}</p>
      <div className="ledger-prose">{chapter.paragraphs.map(p => <p key={p}>{p}</p>)}</div>
      <div className="ledger-folio"><span>THE OFFICIAL LEDGER</span><span>{String(index + 1).padStart(2, '0')}</span></div>
    </article>;
  }
  return <section className="tax-code ledger-section wrap" id="tax-code" aria-labelledby="ledger-title">
    <div className="ledger-heading"><div><p className="eyebrow">[ THE SHERIFF’S OFFICIAL LEDGER ]</p><h2 id="ledger-title">The Tax Code.</h2></div><p>Every jurisdiction has its rules.<br/>These are ours.</p></div>
    <div className="ledger-toolbar">
      <Dialog open={contents} onOpenChange={setContents}>
        <DialogTrigger className="ledger-tool"><List size={18}/>Contents</DialogTrigger>
        <DialogContent className="ledger-contents"><DialogTitle>Inside the Tax Code</DialogTitle><DialogDescription>Choose an article to open the ledger.</DialogDescription>
          <ol>{chapters.map((c, i) => <li key={c.title}><button type="button" onClick={() => openChapter(i)}><span>{String(i + 1).padStart(2, '0')}</span>{c.title}<ChevronRight size={16}/></button></li>)}</ol>
        </DialogContent>
      </Dialog>
      <button className="ledger-tool" type="button" onClick={() => changeMode(mode === 'all' ? 'book' : 'all')}><BookOpen size={18}/>{mode === 'all' ? 'Book view' : 'Read all'}</button>
      {mode !== 'cover' && <button className="ledger-tool ledger-close" type="button" onClick={() => changeMode('cover')}><X size={18}/>Close book</button>}
    </div>
    {mode === 'cover' ? <div className="ledger-cover-stage"><button className="ledger-cover" type="button" onClick={() => changeMode('book')} aria-label="Open the Tax Code book">
      <Star className="ledger-cover-seal" size={70} strokeWidth={1.2} aria-hidden="true"/>
      <span className="ledger-cover-title">THE SHERIFF’S<br/>TAX CODE</span>
      <span className="ledger-cover-subtitle">OFFICIAL LEDGER · VOL. I</span>
      <span className="ledger-cover-cue" aria-hidden="true"><Pointer className="ledger-pointing-finger" size={48} strokeWidth={1.6}/></span>
    </button></div> : mode === 'all' ? <div className="ledger-read-all">{chapters.map((_, i) => article(i, true))}</div> : <div className="ledger-reader" ref={reader} tabIndex={0} role="region" aria-label="Tax Code book. Use left and right arrow keys to turn pages."
      onKeyDown={e => { if (e.key === 'ArrowRight') {e.preventDefault(); go(page + step);} if (e.key === 'ArrowLeft') {e.preventDefault(); go(page - step);} }}
      onTouchStart={e => {if(e.touches.length === 1) touch.current = {x:e.touches[0].clientX,y:e.touches[0].clientY};}}
      onTouchEnd={e => { const start=touch.current;touch.current=null;if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.5)go(page+(dx<0?step:-step)); }} onTouchCancel={() => {touch.current=null;}}>
      <div className={`ledger-spread ${single ? 'single-page' : 'double-page'} ${turn ? 'is-turning' : ''}`}>
        {Array.from({length:step},(_,i)=>article(page+i))}
        {turn && <div className={`ledger-turning-sheet ${turn.forward ? 'turn-forward' : 'turn-backward'}`} aria-hidden="true">
          <div className="ledger-sheet-face ledger-sheet-front">{article(turn.from + (single || !turn.forward ? 0 : 1), false, 'turn-front')}</div>
          <div className="ledger-sheet-face ledger-sheet-back">{article(turn.to + (single || turn.forward ? 0 : 1), false, 'turn-back')}</div>
        </div>}
        {page>0 && <button className="ledger-corner ledger-corner-left" type="button" onClick={() => go(page-step)} aria-label="Turn to previous pages"><ChevronLeft size={22}/></button>}
        {end<6 && <button className="ledger-corner ledger-corner-right" type="button" onClick={() => go(page+step)} aria-label="Turn to next pages"><ChevronRight size={22}/></button>}
      </div>
      <Pagination className="ledger-pagination" aria-label="Tax Code pages"><PaginationContent>
        <PaginationItem><button type="button" disabled={page===0} onClick={() => go(page-step)}><ChevronLeft size={18}/>Previous</button></PaginationItem>
        <PaginationItem><span role="status" aria-live="polite" aria-atomic="true">{range}</span></PaginationItem>
        <PaginationItem><button type="button" disabled={end===6} onClick={() => go(page+step)}>Next<ChevronRight size={18}/></button></PaginationItem>
      </PaginationContent></Pagination>
      <p className="ledger-hint">{single ? 'Swipe or use the buttons to turn a page.' : 'Use the page corners, buttons, or arrow keys to turn the pages.'}</p>
    </div>}
    <p className="ledger-caption">Voluntary participation. No promised financial return.</p>
  </section>;
}
