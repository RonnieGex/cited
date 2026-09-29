# Step 5 report - bootstrap: security from the first commit

- Date: 2026-09-28
- Change: bootstrap
- Branch: `feature/bootstrap`
- Agent: deepseek-harness
- Commit: `c429235f89b8cce2af607a377858fd5ce5c3369b` (feat(bootstrap): add secret scanning, the threat model and the
  environment template)

## Files

```
docs/security.md            the threat model of section 3 of the plan, as a living document
.env.example                the planned variable names with empty values
.gitignore                  ignores .env* except .env.example
.gitleaks.toml              extends the default rules
.githooks/pre-commit        scans the staged content before the commit exists
scripts/install-hooks.mjs    points core.hooksPath at .githooks, run by npm run hooks:install
```

## The template carries names and no values

```
Select-String -Path .env.example -Pattern '^[A-Z0-9_]+=.+$'
  -> none: every assignment ends at the equals sign
```

The file declares 26 names: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `VOICE_TOOL_SECRET`, the provider keys
(`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`),
the local endpoints (`OLLAMA_BASE_URL`, `LMSTUDIO_BASE_URL`), the model selection (`CHAT_MODEL`, `EMBEDDING_MODEL`,
`EMBEDDING_API_KEY`), the database (`DATABASE_URL`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`), the voice agent
(`ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`), the limits (`MAX_QUESTION_CHARS`, `RATE_LIMIT_PER_IP_PER_HOUR`,
`DAILY_MODEL_CALL_LIMIT`, `DAILY_VOICE_MINUTE_LIMIT`, `MAX_ANSWER_TOKENS`), the retention
(`CONVERSATION_RETENTION_DAYS`) and the widget origins (`ALLOWED_ORIGINS`). Its header explains that no key is ever
committed, logged or sent to the browser.

## The hook blocks a planted secret

```
Set-Content planted-secret-test.txt 'aws_access_key_id = "AKIAIOSFODNN7EXAMPLE"'
git add planted-secret-test.txt
git commit -m "Add planted secret test"
  -> 5:58PM INF 0 commits scanned.
  -> 5:58PM INF scanned ~42 bytes (42 bytes) in 241ms
  -> 5:58PM WRN leaks found: 1
  -> exit 1
git log --oneline
  -> fatal: your current branch 'feature/bootstrap' does not have any commits yet
```

The commit was not created. The file was removed and unstaged, and the commits of this change passed the same hook
with `no leaks found`.

The detection needed an explicit rule: the default configuration of gitleaks allowlists the AWS example key. Before
the rule was added, the scan of the same content returned `no leaks found` with exit 0. With the
`katalis-planted-example-key` rule, the same content returns `leaks found: 1` with exit 1. That is the honest record
of the difference, and it is why the rule exists.

## The rule does not open a hole in the reports

This report quotes the planted key, so the closing commit of the change was refused by the hook with `leaks found: 1`
over `openspec/changes/bootstrap/reports/2026-09-28-step-5-security-day-one.md`. The finding was real and it was
fixed by scoping the exception to the synthetic rule:

```toml
  [[rules.allowlists]]
  description = "The change reports quote the planted key on purpose, because they document the proof that the hook refuses it. This allows the synthetic rule only: every default rule keeps scanning those files."
  paths = ['''^openspec/changes/.*/reports/''']
```

The exception is per rule, not per path: the default rules keep scanning the reports. It was proved with a probe
inside the reports folder, before the report was committed:

```
planted probe in openspec/changes/bootstrap/reports/planted-probe.md
  github_pat = "ghp_<40 high entropy characters>"
gitleaks dir openspec/changes/bootstrap/reports --redact --no-banner -c .gitleaks.toml
  -> WRN leaks found: 1
  -> exit 1
probe file removed
```

A first probe with a sequential, low entropy value returned `no leaks found`, which is the normal behavior of the
entropy checks of gitleaks and not a gap of the allowlist. The probe that proves the point uses a random value,
because a low entropy string is not a credential in the first place.

## The hook refuses when gitleaks is missing

```
$env:PATH = 'C:\Program Files\Git\bin;C:\Windows\System32'
sh ./.githooks/pre-commit
  -> Secret scan refused this commit: gitleaks is not installed.
  -> Install it and commit again:
  ->   Windows: winget install --id Gitleaks.Gitleaks -e
  ->   macOS:   brew install gitleaks
  ->   Linux:   https://github.com/gitleaks/gitleaks/releases
  -> Then run: npm run hooks:install
  -> exit 1
```

## Installation and configuration

```
npm run hooks:install
  -> Git hooks installed: core.hooksPath points at .githooks
  -> gitleaks is available: every commit will be scanned before it is created.
  -> exit 0

git config core.hooksPath
  -> .githooks
```

`core.hooksPath` is local configuration of the clone, not versioned content: `npm run hooks:install` is what a fresh
clone runs, and `README.md` and `CONTRIBUTING.md` say so.

## The threat model

`docs/security.md` covers the eight areas of section 3 of the plan. Each row states whether the control exists today
or which change builds it:

| Area | Today |
|---|---|
| Secret scanning, ignored environment files, dependency audit, CodeQL, Dependabot, no licensed font | Done in this change |
| `poweredByHeader` off | Done in this change |
| The public endpoint limits, the panel, the balance of the owner | Planned: `pluggable-models-and-ask`, `admin-and-public-ui` |
| The widget and the voice agent | Planned: `admin-and-public-ui`, `elevenlabs-voice-agent` |
| Uploaded content and the RRF query | Planned: `core-libsql-hybrid-search` |
| Headers, retention and zero telemetry | Planned: `security-hardening` |
| HTTPS in the one-click deployments | Planned: `docs-deploy-and-launch` |

It also writes what is deliberately out of the model: what a fork does with its own keys and data, and a flood large
enough to exhaust the host.

## Verdict

PASS. A secret cannot enter the repository through a commit, the environment files are ignored, the template has no
values and the threat model exists with the state of every control.

## Issue

- RISK: the hook protects the machine where `npm run hooks:install` was executed. A clone that never runs it commits
  without the local scan, and only the pipeline catches it. Mitigation: `CONTRIBUTING.md` and
  `docs/development-guide.md` make the command part of the setup, and the `secrets` job of the pipeline is blocking.
