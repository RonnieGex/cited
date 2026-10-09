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

export function hasOwnPassage(record, tool) {
  if (record.exitCode !== 0 || record.validationError) return false
  try { transcriptOf(record.events, record.prompt) } catch { return false }
  return record.events.some((call) => call.type === 'tool_call' && (!tool || call.tool === tool) && record.events.some((result) => {
    if (result.type !== 'tool_result' || result.callId !== call.callId || result.status !== 'completed' || result.truncated) return false
    const source = result.result?.match(/^1\. cafe-la-horquilla\.md · Precios(?: \(position 2\))?\n([\s\S]*?)(?=^\d+\. |$(?![\s\S]))/m)
    const answer = record.events.findLast((event) => event.type === 'final')?.text ?? ''
    return source?.[1].includes('Afinación de bicicleta: 380 pesos.') && /\[1\]/.test(answer) && /380/.test(answer)
  }))
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
  const call = record.events.find((event) => event.type === 'tool_call' && event.tool === 'cited_ask')
  if (!call || !hasOwnPassage(record, 'cited_ask')) return transcriptOf(record.events, record.prompt)
  const result = record.events.find((event) => event.type === 'tool_result' && event.callId === call.callId)
  return transcriptOf([call, result, record.events.findLast((event) => event.type === 'final')], record.prompt)
}
