import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import content from './leaders-content.cjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const filename = resolve(root, 'index.html');
const html = await readFile(filename, 'utf8');
const data = content.readContent(await readFile(resolve(root, 'leaders-data.js'), 'utf8'));
const updated = content.synchronize(html, data);
if (process.argv.includes('--check')) {
  if (updated !== html) throw new Error('Leaders HTML is stale. Run npm run content and commit dist/index.html.');
  console.log('Leaders content is synchronized.');
} else {
  if (updated !== html) await writeFile(filename, updated);
  console.log('Leaders HTML synchronized from dist/leaders-data.js.');
}
