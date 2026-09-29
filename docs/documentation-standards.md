---
description: Standards for the technical documentation of this project, its structure, its update process and its language rules.
globs:
alwaysApply: true
---
# Rules and patterns for documentation and AI specs

## Introduction

Technical documentation covers everything that describes how the project is structured, runs and operates: the
README, the development guide, the security document, the standards and the API contracts. AI specs are the
documents that tell the agents how to behave, plan, document and code: the standards and the agent definitions.

## General rules

- ALWAYS WRITE IN ENGLISH, including code comments and any explanation inside a file, for new documentation and for
  updates alike. The only exception in this repository is the Spanish part of `README.md`.
- Documentation states measured facts. A number that was not measured is not written, not even as an estimate.
- A capability that is not built yet is written as planned, with the change that builds it.

## Technical documentation

Before any commit, review which technical documentation the change touches.

When updating documentation:

1. Review the changes of the branch.
2. Identify the affected documents:
   - A new or changed command, port or environment file: `docs/development-guide.md`.
   - A change in the threat model, a limit or a header: `docs/security.md`.
   - A stack, testing or layout change: `docs/backend-standards.md` or `docs/frontend-standards.md`.
   - A change in the working rules: `docs/base-standards.md` or `docs/openspec-tasks-mandatory-steps.md`.
   - What the project is and how to run it: `README.md`, in English and in Spanish.
3. Update each affected document in English, consistent with what exists.
4. Verify that the document describes what the code really does.
5. Report which files were updated.

## README

`README.md` is the only bilingual document. The English part comes first and the Spanish part after it, and the two
say the same. It carries: what the project will be, the state of construction with the change that is open, what a
person needs to run it, the license and the attribution line of Katalis.

## AI specs

This rule establishes a mandatory process for the AI to:

- Learn from the feedback, guidance and corrections that arrive during the work.
- Detect opportunities to improve the development rules.
- Keep its assistance aligned with the needs of the project.
- Propose improvements instead of applying them in silence.

The rule applies after any interaction where Franc or the coordinating agent gives feedback, a correction, new
information or a preference.

### Common pitfalls and anti-patterns

- **Skipping the approval process**: changing a rule without an explicit review and approval first.
- **Unlinked proposals**: proposing a rule change without connecting it to the feedback that produced it.
- **Imprecise modifications**: not naming the exact rule or section to change.
- **Unaddressed feedback**: not starting the review when the feedback could improve a rule.
- **Scope creep**: changing several unrelated rules at once.
- **Unprompted rule changes**: modifying rules with no feedback that justifies them.
- **Missing update confirmation**: not telling the user after an approved rule change was applied.
