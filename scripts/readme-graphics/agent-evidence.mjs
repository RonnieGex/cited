export function transcriptOf(events, prompt) {
  const calls = events.filter((event) => event.type === 'tool_call')
  const final = events.findLast((event) => event.type === 'final')
  if (calls.length === 0 || calls.some((call) => !['cited_search', 'cited_ask'].includes(call.tool) || call.truncated)) throw new Error('Expected complete Cited calls')
  const results = calls.map((call) => events.find((event) => event.type === 'tool_result' && event.callId === call.callId))
  if (results.some((result) => result?.status !== 'completed' || result.truncated || !result.result)) throw new Error('No complete successful tool result')
  const citations = [...(final?.text ?? '').matchAll(/\[(\d+)\]/g)].map((match) => match[1])
  if (final?.truncated || citations.length === 0 || citations.some((n) => !results.some((result) => new RegExp(`^${n}\\. `, 'm').test(result.result)))) throw new Error('The answer must cite returned passages')
  const exchanges = calls.map((call, i) => `Tool call\n${call.tool} ${JSON.stringify(call.input)}\n\n${call.tool === 'cited_search' ? 'Passages' : 'Tool result'}\n${results[i].result}`).join('\n\n')
  return `Question\n${prompt}\n\n${exchanges}\n\nAnswer\n${final.text}`
}
