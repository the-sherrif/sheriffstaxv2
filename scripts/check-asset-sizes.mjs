import { readdir, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

// Keep replacement assets comfortably below Cloudflare's 25 MiB per-file limit.
const ceiling = 20 * 1024 * 1024;
const roots = process.argv.slice(2);
if (!roots.length) roots.push('public');
let failed = false;
for (const root of roots) {
  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files.push({ path: relative(root, path), bytes: (await stat(path)).size });
      else throw new Error(`Unexpected non-regular deployment file: ${path}`);
    }
  }
  await walk(resolve(root));
  files.sort((a, b) => b.bytes - a.bytes);
  const oversized = files.filter(file => file.bytes >= ceiling);
  console.log(`${root}: ${files.length} files, ${files.reduce((n, f) => n + f.bytes, 0)} bytes total`);
  console.table(files.slice(0, 10));
  if (oversized.length) {
    failed = true;
    console.error('Files must be strictly below 20 MiB:', oversized);
  } else console.log('PASS: every file is below 20 MiB (and Cloudflare’s 25 MiB limit).');
}
if (failed) process.exitCode = 1;
