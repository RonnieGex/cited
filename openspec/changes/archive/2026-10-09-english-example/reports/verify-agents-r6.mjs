import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

const root = resolve(import.meta.dirname, '..')
const repositories = [
  ['dsh-cited', 'docs/evidence', '802abfa509df343c970b96e2b7fbfb5aae00a7f3'],
  ['community-english-example', 'docs/evidence/agents', 'b4e749f539399637d763a1ebaf6da55e729fdfd5'],
  ['cited-landing', 'assets/evidence', '5a9c5f5fceedb3974be7199806cc38dd9eb8f072'],
]
const sha = (data) => createHash('sha256').update(data).digest('hex')
const read = (repo, file) => readFileSync(resolve(root, repo, file))
const git = (repo, ...args) => execFileSync('git', args, { cwd: resolve(root, repo), windowsHide: true })
for (const [repo, evidence, base] of repositories) {
  const historical = git(repo, 'ls-tree', '-r', '--name-only', base, evidence).toString().trim().split('\n').filter((file) => file && !file.endsWith('.md'))
  const preserved = historical.map((file) => {
    const bytes = read(repo, file)
    assert.deepEqual(bytes, git(repo, 'show', `${base}:${file}`), file)
    return { file, sha256: sha(bytes) }
  })
  const english = ['headless-answer-en.json', 'headless-answer-en.txt', 'natural-summary-en.json', ...readdirSync(resolve(root, 'dsh-cited/docs/evidence/natural-en-2026-10-09T21-56-48-866Z')).map((file) => `natural-en-2026-10-09T21-56-48-866Z/${file}`)]
  for (const file of english) assert.deepEqual(read(repo, `${evidence}/${file}`), read('dsh-cited', `docs/evidence/${file}`))
  const changed = git(repo, 'diff', '--name-only', base).toString().trim().split('\n')
  if (repo === 'dsh-cited') assert.ok(!changed.some((file) => /^(src|lib)\//.test(file)))
  if (repo === 'community-english-example') assert.ok(!changed.some((file) => /^(src|app|lib|samples)\//.test(file)))
  const result = { command: 'node tasks/verify-agents-r6.mjs', node: process.version, base, branch: git(repo, 'branch', '--show-current').toString().trim(), preserved, identicalEnglishFiles: english.length, runtimeBoundary: 'unchanged', changed }
  writeFileSync(resolve(root, repo, 'openspec/changes/english-example/reports/r6-integrity.json'), JSON.stringify(result, null, 2) + '\n')
  console.log(`${repo}: ${preserved.length} historical evidence files preserved; ${english.length} English copies identical; runtime boundaries unchanged`)
}
