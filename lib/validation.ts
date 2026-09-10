export class InputError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.name = 'InputError'; this.status = status; }
}
export function normalizeHandle(value: unknown): string {
  if (typeof value !== 'string') throw new InputError('Enter your X username.');
  const handle = value.trim().replace(/^@/, '').toLowerCase();
  if (!/^[a-z0-9_]{1,15}$/.test(handle)) throw new InputError('Use your X username: up to 15 letters, numbers or underscores.');
  return handle;
}
export function parsePostUrl(value: unknown): { handle: string; id: string; url: string } {
  if (typeof value !== 'string' || value.length > 600) throw new InputError('Paste a full X post link.');
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new InputError('Paste a full link beginning with https://x.com/.'); }
  if (url.protocol !== 'https:' || !['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'].includes(url.hostname.toLowerCase()) || url.username || url.password || url.port) {
    throw new InputError('Use a genuine x.com or twitter.com post link.');
  }
  const match = url.pathname.match(/^\/([a-zA-Z0-9_]{1,15})\/status\/([1-9][0-9]{0,19})\/?$/);
  if (!match || match[1].toLowerCase() === 'i') throw new InputError('Copy a post link containing your username, such as x.com/yourname/status/123.');
  return { handle: match[1].toLowerCase(), id: match[2], url: `https://x.com/${match[1].toLowerCase()}/status/${match[2]}` };
}
export type Orders = { follow: boolean; like: boolean; spreadMode: 'quote' | 'repost'; spreadUrl: string; replyUrl: string };
export function validateOrders(input: unknown, handle: string, warrantUrl: string): Orders {
  if (!warrantUrl) throw new InputError('The first Warrant has not been published. Your application is saved; return when it opens.', 409);
  if (!input || typeof input !== 'object') throw new InputError('Complete your Field Orders.');
  const data = input as Record<string, unknown>;
  if (data.follow !== true || data.like !== true) throw new InputError('Confirm that you have followed the Sheriff and liked the Warrant.');
  if (data.spreadMode !== 'quote' && data.spreadMode !== 'repost') throw new InputError('Choose a repost or a quote post.');
  const warrant = parsePostUrl(warrantUrl);
  const spread = parsePostUrl(data.spreadUrl);
  const reply = parsePostUrl(data.replyUrl);
  if (reply.handle !== handle) throw new InputError('The comment link contains a different username. Submit your own comment link.');
  if (reply.id === warrant.id) throw new InputError('Submit your comment link, not the original Warrant.');
  if (data.spreadMode === 'quote') {
    if (spread.handle !== handle) throw new InputError('The quote link contains a different username. Submit your own quote link.');
    if (spread.id === warrant.id) throw new InputError('Submit your quote post link, not the original Warrant.');
  } else if (spread.id !== warrant.id || spread.handle !== warrant.handle) {
    throw new InputError('For a plain repost, submit the original Warrant link after reposting it.');
  }
  if (spread.id === reply.id) throw new InputError('Use separate links for your quote post and comment.');
  return { follow:true, like:true, spreadMode:data.spreadMode, spreadUrl:spread.url, replyUrl:reply.url };
}
export function deputyNumber(id: number): string { return String(id).padStart(4, '0'); }
