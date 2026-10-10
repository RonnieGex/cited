export function transcriptOf(events, prompt) {
  const calls = events.filter((event) => event.type === 'tool_call')
  const final = events.findLast((event) => event.type === 'final')
  const allResults = events.filter((event) => event.type === 'tool_result')
  const callIds = new Set(calls.map((call) => call.callId))
  if (callIds.size !== calls.length || callIds.has(undefined) || allResults.length !== calls.length || new Set(allResults.map((result) => result.callId)).size !== allResults.length || allResults.some((result) => !callIds.has(result.callId)) || events.filter((event) => event.type === 'final').length !== 1) throw new Error('Expected unique matched calls, results and final answer')
  if (calls.length === 0 || calls.some((call) => !['cited_search', 'cited_ask'].includes(call.tool) || call.truncated)) throw new Error('Expected complete Cited calls')
  const results = calls.map((call) => events.find((event) => event.type === 'tool_result' && event.callId === call.callId))
  if (calls.some((call, i) => events.indexOf(results[i]) <= events.indexOf(call) || events.indexOf(results[i]) >= events.indexOf(final))) throw new Error('Expected calls before results before final answer')
  if (results.some((result) => result?.status !== 'completed' || result.truncated || !result.result)) throw new Error('No complete successful tool result')
  const citations = [...(final?.text ?? '').matchAll(/\[(\d+)\]/g)].map((match) => match[1])
  if (final?.truncated || citations.length === 0 || citations.some((n) => !results.some((result) => new RegExp(`^${n}\\. `, 'm').test(result.result)))) throw new Error('The answer must cite returned passages')
  const exchanges = calls.map((call, i) => `Tool call\n${call.tool} ${JSON.stringify(call.input)}\n\n${call.tool === 'cited_search' ? 'Passages' : 'Tool result'}\n${results[i].result}`).join('\n\n')
  return `Question\n${prompt}\n\n${exchanges}\n\nAnswer\n${final.text}`
}

export function evidenceContractOf(record) {
  return record.language === 'en'
    ? { document: 'bike-workshop-policies.md', source: /^1\. bike-workshop-policies\.md · Guarantee(?: \(position \d+\))?\n([\s\S]*?)(?=^\d+\. |$(?![\s\S]))/m, highlight: 'Every repair carries a 90 day guarantee on the work.', answer: /\b90[ -]+day(?:s)?\b/i }
    : { document: 'cafe-la-horquilla.md', source: /^1\. cafe-la-horquilla\.md · Precios(?: \(position 2\))?\n([\s\S]*?)(?=^\d+\. |$(?![\s\S]))/m, highlight: 'Afinación de bicicleta: 380 pesos.', answer: /380/ }
}

function affirmsGuarantee(text) {
  const answer = text.split(/\n\s*\n/)[0]
  return (answer.match(/[^.!?\n]+[.!?]?/g) ?? []).some((sentence) =>
    /\b90[ -]+days?\b/i.test(sentence) && /\bguarantee\b/i.test(sentence) && /\b(?:repairs?|work)\b/i.test(sentence)
    && /\b(?:carries|carry|has|have|is|are|applies|covers)\b/i.test(sentence)
    && !/\?|\b(?:source|cannot|can't|not|no|never|unable|uncertain|unconfirmed|unknown|without|refuse|refused|may|might|could|would|perhaps|possibly|maybe|assume|suppose|think)\b/i.test(sentence))
}

export function supportedExchangeOf(record, tool) {
  if (record.exitCode !== 0 || record.validationError) return undefined
  try { transcriptOf(record.events, record.prompt) } catch { return undefined }
  const contract = evidenceContractOf(record)
  const final = record.events.findLast((event) => event.type === 'final')
  const answer = final.text.replace(/\*\*|`/g, '')
  if (!/\[1\]/.test(answer) || !contract.answer.test(answer)) return undefined
  if (record.language === 'en' && !affirmsGuarantee(answer)) return undefined
  for (const call of record.events.filter((event) => event.type === 'tool_call' && (!tool || event.tool === tool))) {
    const result = record.events.find((event) => event.type === 'tool_result' && event.callId === call.callId)
    const source = result.result.match(contract.source)
    if (!source?.[1].includes(contract.highlight)) continue
    if (record.language === 'en' && call.tool === 'cited_ask') {
      const toolAnswer = result.result.split('\n\nSources:\n')[0].replace(/\*\*|`/g, '')
      if (!affirmsGuarantee(toolAnswer) || !/\[1\]/.test(toolAnswer)) continue
    }
    return { call, result, final, sourceLine: source[0].split('\n')[0], highlight: contract.highlight }
  }
  return undefined
}

export function hasOwnPassage(record, tool) {
  return Boolean(supportedExchangeOf(record, tool))
}

export function captureEvents(stdout) {
  const events = []
  let malformedLines = 0
  for (const line of stdout.split(/\r?\n/).filter((line) => line.startsWith('{'))) {
    try {
      const event = JSON.parse(line)
      if (['tool_call', 'tool_result', 'final'].includes(event.type)) events.push(event)
    } catch { malformedLines += 1 }
  }
  return { events, validationError: malformedLines ? `${malformedLines} malformed JSON event line(s)` : null }
}

export function canonicalOf(records) {
  return records.find((record) => hasOwnPassage(record, 'cited_ask')) ?? records.find((record) => hasOwnPassage(record, 'cited_search'))
}

export function displayTranscriptOf(record) {
  const exchange = supportedExchangeOf(record, 'cited_ask') ?? supportedExchangeOf(record, 'cited_search')
  if (!exchange) return transcriptOf(record.events, record.prompt)
  return transcriptOf([exchange.call, exchange.result, exchange.final], record.prompt)
}
