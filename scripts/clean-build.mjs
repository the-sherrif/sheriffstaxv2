import { rm } from 'node:fs/promises';

// Vite builds several environments into dist. Clear it once, before all stages,
// so replaced media and obsolete hashed chunks cannot survive into an upload.
await rm(new URL('../dist/', import.meta.url), { recursive: true, force: true });
