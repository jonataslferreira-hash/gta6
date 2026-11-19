import { readFile, writeFile } from 'node:fs/promises';

const index = new URL('../dist/index.html', import.meta.url);
let html = await readFile(index, 'utf8');
// The public smoke test must wait for the current deployment, not a previously cached entry.
const commit = process.env.GITHUB_SHA;
if (commit && /^[a-f0-9]{40}$/i.test(commit)) {
  html = html.replace('</head>', `<meta name="mare-release" content="${commit}">\n  </head>`);
  await writeFile(index, html);
}
await writeFile(new URL('../dist/jogar.html', import.meta.url), html);
