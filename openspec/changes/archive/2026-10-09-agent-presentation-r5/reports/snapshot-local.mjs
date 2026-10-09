import { databaseSnapshot } from './database-snapshot.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const [database, phase] = process.argv.slice(2);
assert.ok(['before', 'after'].includes(phase));
const snapshot = databaseSnapshot(database);
if (phase === 'after') assert.deepEqual(snapshot, JSON.parse(readFileSync(new URL('snapshot-before.json', import.meta.url))));
writeFileSync(new URL(`snapshot-${phase}.json`, import.meta.url), JSON.stringify(snapshot, null, 2) + '\n');
console.log(`${phase}: ${snapshot.length} tables`);
