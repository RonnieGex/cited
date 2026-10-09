import { databaseSnapshot } from '../dsh-cited/scripts/lib/database-snapshot.mjs';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const phase = process.argv[2];
assert.ok(['before', 'after'].includes(phase));
const snapshot = databaseSnapshot(fileURLToPath(new URL('../community-readme/.data/katalis.sqlite', import.meta.url)));
writeFileSync(new URL(`r5-database-${phase}.json`, import.meta.url), JSON.stringify(snapshot, null, 2) + '\n');
if (phase === 'after') assert.deepEqual(snapshot, JSON.parse(readFileSync(new URL('r5-database-before.json', import.meta.url))));
console.log(`${phase}: ${snapshot.length} tables; ${phase === 'after' ? 'identical counts and hashes' : 'read-only baseline'}`);
