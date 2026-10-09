import { databaseSnapshot } from '../dsh-cited/scripts/lib/database-snapshot.mjs'
import { readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'

const phase = process.argv[2]
assert.ok(['before', 'after'].includes(phase))
const snapshot = databaseSnapshot(resolve(import.meta.dirname, '../community-readme/.data/katalis.sqlite'))
if (phase === 'after') assert.deepEqual(snapshot, JSON.parse(readFileSync(new URL('r6-database-before.json', import.meta.url))))
writeFileSync(new URL(`r6-database-${phase}.json`, import.meta.url), JSON.stringify(snapshot, null, 2) + '\n')
console.log(`${phase}: ${snapshot.length} tables; ${phase === 'after' ? 'identical counts and hashes' : 'read-only existing public sample state'}`)
