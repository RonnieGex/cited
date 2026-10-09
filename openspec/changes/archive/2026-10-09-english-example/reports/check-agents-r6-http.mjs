import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'

const root = resolve(import.meta.dirname, '..')
const temporary = mkdtempSync(join(tmpdir(), 'cited-r6-http-'))
const routes = new Map([
  ['/agents-light.png', 'community-english-example/docs/images/agents-light.png'],
  ['/agents-dark.png', 'community-english-example/docs/images/agents-dark.png'],
  ['/agents-es-light.png', 'community-english-example/docs/images/agents-es-light.png'],
  ['/agents-es-dark.png', 'community-english-example/docs/images/agents-es-dark.png'],
  ['/headless-answer-en.txt', 'community-english-example/docs/evidence/agents/headless-answer-en.txt'],
  ['/headless-answer.txt', 'community-english-example/docs/evidence/agents/headless-answer.txt'],
])
const server = createServer((request, response) => {
  const file = routes.get(request.url)
  if (!file) return response.writeHead(404).end()
  response.writeHead(200).end(readFileSync(resolve(root, file)))
})
await new Promise((done) => server.listen(4186, '127.0.0.1', done))
const results = []
const checks = [
  ...[...routes].map(([url, file]) => [`http://127.0.0.1:4186${url}`, file]),
  ...[['/', 'index.html'], ['/es/', 'es/index.html'], ['/assets/evidence/headless-answer-en.txt', 'assets/evidence/headless-answer-en.txt'], ['/assets/evidence/headless-answer.txt', 'assets/evidence/headless-answer.txt'], ['/assets/evidence/headless-answer-en.json', 'assets/evidence/headless-answer-en.json'], ['/assets/evidence/headless-answer.json', 'assets/evidence/headless-answer.json']].map(([url, file]) => [`http://localhost:4176${url}`, `cited-landing/dist/${file}`]),
]
try {
  for (const [index, [url, file]] of checks.entries()) {
    const output = join(temporary, `response-${index}`)
    const status = await new Promise((done, reject) => {
      const child = spawn('curl.exe', ['--silent', '--show-error', '--max-time', '20', '--output', output, '--write-out', '%{http_code}', url], { windowsHide: true })
      let text = ''
      child.stdout.on('data', (chunk) => { text += chunk })
      child.once('error', reject)
      child.once('close', (code) => code === 0 ? done(Number(text)) : reject(new Error(`curl exited ${code}`)))
    })
    assert.equal(status, 200, url)
    const bytes = readFileSync(output)
    assert.deepEqual(bytes, readFileSync(resolve(root, file)), `Exact served bytes: ${url}`)
    results.push({ url, file, status, sha256: createHash('sha256').update(bytes).digest('hex') })
  }
} finally { await new Promise((done) => server.close(done)) }
writeFileSync(new URL('r6-http.json', import.meta.url), JSON.stringify({ command: 'node tasks/check-agents-r6-http.mjs', curl: 'curl.exe --silent --show-error --max-time 20 --output <temporary-response> --write-out %{http_code} <url>', results }, null, 2) + '\n')
console.log(`HTTP: ${results.length} endpoints returned 200 with exact asset/evidence bytes; asset server stopped`)
