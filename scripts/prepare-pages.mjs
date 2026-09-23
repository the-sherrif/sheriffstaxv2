import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';

// Pages advanced mode accepts a module named _worker.js. Bundle the generated
// server graph once: its SSR modules import the entry recursively, and copying
// split modules into Pages changes their relative paths during Wrangler bundling.
// Uploading dist/client alone would silently discard signup/referral handlers.
const output = resolve('dist/pages');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp('dist/client', output, { recursive: true });
await build({
  entryPoints: ['dist/server/index.js'],
  outfile: `${output}/_worker.js`,
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  external: ['node:*', 'cloudflare:*', 'workerd:*'],
  minify: true,
});

// The public route is the recruitment launch. Keep the artwork needed by that
// route and its metadata; preserve the rest in GitHub for the later rollout,
// but leave it out of the Pages upload until those routes are enabled.
const unusedUntilRollout = [
  'brand/frontier-timber.webp',
  'brand/ledger-cover-real.webp',
  'brand/ledger-paper-real.webp',
  'brand/sheriff-cutout.png',
  'brand/sheriff-hero.png',
  'brand/sheriff-pfp.png',
  'brand/social/github.svg',
];
for (const path of unusedUntilRollout) await rm(`${output}/${path}`, { force: true });

// Assets bypass the Function; application routes still use the unchanged
// Vinext server. Derive this list from actual public files instead of guessing
// extensions, so a future route containing a dot still reaches the application.
const exclude = ['/_next/*'];
for (const entry of await readdir('public', { withFileTypes: true })) {
  exclude.push(`/${entry.name}${entry.isDirectory() ? '/*' : ''}`);
}
await writeFile(`${output}/_routes.json`, JSON.stringify({ version: 1, include: ['/*'], exclude }, null, 2) + '\n');
// Vite points Wrangler at its Workers-only output. Pages must instead read the
// root Pages config after this explicit packaging command.
await mkdir('.wrangler/deploy', { recursive: true });
await writeFile('.wrangler/deploy/config.json', JSON.stringify({ configPath: '../../wrangler.json' }) + '\n');
console.log('Prepared dist/pages: static assets plus the existing server in _worker.js. No deployment performed.');
