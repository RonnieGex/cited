export async function auditBrandLogos(page, expected = []) {
  const result = await page.evaluate(() => {
    const names = /(?<![\w])(DeepSeek(?: Harness)?|Claude Code|Codex|Cursor|ElevenLabs|OpenAI|Anthropic|Gemini|Groq|OpenRouter|Ollama|LM[\s\u00a0]Studio|GitHub|Node(?:\.js)?|npm|Next\.js|SQLite|libSQL|Turso|Docker)(?![\w])/g;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const missing = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!parent || parent.closest('pre, code, script, style, svg, .agents-answer, .agents-tool-result, .agents-proof .agents-result, .sr-only')) continue;
      if (!parent.getClientRects().length || getComputedStyle(parent).visibility === 'hidden') continue;
      const matches = node.textContent.match(names);
      if (!matches) continue;
      const group = parent.closest('.brand-name, .agents-client, .harness-label, .agent-tab, .btn');
      if (!group?.querySelector('svg[data-brand]')) missing.push(node.textContent.trim());
    }
    const marks = [...document.querySelectorAll('svg[data-brand]')];
    const ids = marks.flatMap((mark) => [...mark.querySelectorAll('[id]')].map((node) => node.id));
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const brokenReferences = marks.flatMap((mark) => [...mark.querySelectorAll('*')].flatMap((node) => [...node.attributes].flatMap((attribute) => [...attribute.value.matchAll(/url\(#([^)]+)\)/g)].filter((match) => !mark.querySelector(`[id="${match[1]}"]`)).map((match) => match[1]))));
    const collapsedPaint = marks.filter((mark) => ['groq', 'libsql'].includes(mark.dataset.brand)).filter((mark) => {
      if (!mark.getClientRects().length) return false;
      const paints = new Set([...mark.querySelectorAll('path, rect')].filter((node) => !node.closest('defs')).map((node) => getComputedStyle(node).fill));
      return paints.size < 2;
    }).map((mark) => mark.dataset.brand);
    const invalid = marks.filter((mark) => {
      if (!mark.getClientRects().length) return false;
      const box = mark.getBoundingClientRect();
      return box.width < 12 || box.height < 12 || mark.getAttribute('aria-hidden') !== 'true' || mark.getAttribute('focusable') !== 'false';
    }).map((mark) => mark.dataset.brand);
    return { brands: [...new Set(marks.map((mark) => mark.dataset.brand))], count: marks.length, missing, duplicateIds, brokenReferences, collapsedPaint, invalid };
  });
  const absent = expected.filter((brand) => !result.brands.includes(brand));
  if (absent.length || result.missing.length || result.duplicateIds.length || result.brokenReferences.length || result.collapsedPaint.length || result.invalid.length) throw new Error(`Brand audit failed: ${JSON.stringify({ ...result, absent })}`);
  return result;
}
