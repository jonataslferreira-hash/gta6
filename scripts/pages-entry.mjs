import { copyFile } from 'node:fs/promises';

// Use the same compiled entry and assets for the alternate, uncached URL.
await copyFile(new URL('../dist/index.html', import.meta.url), new URL('../dist/jogar.html', import.meta.url));
