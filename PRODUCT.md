# Product

## Register

product

## Users

**The owner** of a small business (a café, a dental lab, a workshop, a clinic) who is not technical. They open the
panel from a laptop between other tasks, want their own documents to answer their customers, and will not touch a
server, a terminal or an environment file. They bring an API key they just created in a provider's site, a handful of
documents (PDF, Word, text), and doubts about whether the AI will invent things. Their job: go from nothing to a public
page that answers with sources, and trust it enough to share the link.

**The visitor**, a customer of that business, who lands on the public page or the widget from the business's site or a
message, asks one or two questions in English or Spanish, and wants a short answer they can verify.

**The installer** (Katalis, or whoever deploys a fork) only starts the container; everything after that belongs to
the owner and happens in the browser.

## Product Purpose

Cited turns a business's own documents into answers with the passage they came from, on a public page, an embeddable
widget and a voice agent, and says "the documents don't say" instead of inventing. It is free and open source
(Apache 2.0); Katalis offers a better hosted version as a paid product. Success: an owner with no technical background
goes from the first visit to a correct, cited answer to a question about their own business in under five minutes, and
the visitor can always see where each answer came from.

## Brand Personality

**Honest, clear, guided.** The product leads the owner step by step, shows what it understood from each document,
proves every step works before moving on, and states plainly what it knows and what it does not. Plain language, no
jargon: "Connect your AI", not `CHAT_PROVIDER`. English first, Spanish equal. Built by Katalis, shown with the real
flame, never louder than the business's own brand on the public page.

References: **Stripe** (the guided setup where each step is tested and turns green), **Notion** (the content at the
center: adding and seeing your own information feels natural).

## Anti-references

- **A developer console**: environment variable names, `MISSING` badges in capitals, lists of settings with no next
  step. The current setup page is the example to leave behind.
- **A generic SaaS dashboard**: big metric cards, gradients, decorative charts.
- **A toy chatbot**: bubbles with emoji, a robot avatar, answers without visible sources.
- **A node editor** in the style of Dify or Flowise is out of scope: power at the cost of complexity.

## Design Principles

1. **Practice what we preach: show the source.** Every answer, in the panel and on the public page, shows the passage
   and the document it came from; the owner sees what the system understood from each file.
2. **Never a dead end.** Every screen says what to do next; an empty state is an invitation with one action, an error
   says what happened and how to fix it in the owner's words.
3. **Prove each step.** Connecting a provider tests it; uploading a document shows its passages; publishing shows the
   live link. Green means verified, never assumed.
4. **Secrets stay secret.** A key is entered once, tested, stored encrypted and never shown again, only its last four
   characters and its status.
5. **The business first on the public page.** The visitor sees the business's name, color and words; Cited and Katalis
   stay in the footer.

## Accessibility & Inclusion

WCAG 2.2 AA: text contrast 4.5:1, controls 3:1, visible keyboard focus, full keyboard operation, screen-reader labels
for every control and live regions for answers and progress, `prefers-reduced-motion` respected, touch targets of at
least 44 px on mobile. Both languages complete, including errors and empty states.
