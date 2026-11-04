// Meaningful offline checks without a new test dependency or a running server.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const temporaryRoot = path.resolve('node_modules/.tmp')
await fs.mkdir(temporaryRoot, { recursive: true })
const directory = await fs.mkdtemp(path.join(temporaryRoot, 'oral-session-tests-'))
try {
  for (const name of ['reviewTypes', 'sessionHistory', 'SessionTree']) {
    const extension = name === 'SessionTree' ? '.tsx' : '.ts'
    const source = await fs.readFile(`src/${name}${extension}`, 'utf8')
    const code = ts.transpileModule(source, { compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2023,
    } }).outputText.replaceAll("'./reviewTypes'", "'./reviewTypes.mjs'")
    await fs.writeFile(path.join(directory, `${name}.mjs`), code)
  }
  const { decodeHistory, encodeHistory, isReview } = await import(pathToFileURL(path.join(directory, 'sessionHistory.mjs')))
  const { traceNodes, SessionTree } = await import(pathToFileURL(path.join(directory, 'SessionTree.mjs')))
  const assessment = { support: 'insufficient_evidence', explanation: 'Counts are absent from inspected text.', evidence: [], limitations: ['Abstract only.'] }
  const result = { claim: 'Inspect specimen counts.', paper_ids: ['a'], status: 'insufficient_evidence',
    human_review: 'not_reviewed', source_validation: 'not_checked', assessment, assessment_history: [assessment],
    search_history: [
      { query: 'Counts', paper_ids: ['a'], returned_passage_ids: [1], new_passage_ids: [1] },
      { query: 'Methods counts', paper_ids: ['a'], returned_passage_ids: [1], new_passage_ids: [] },
    ], passages: [{ passage_id: 1, paper_id: 'a', title: '<script>not executable</script>', text: 'Source excerpt', source: 'abstract', truncated: false }],
    errors: [], events: ['scope_checked', 'passages_retrieved', 'assessment_generated', 'sources_checked', 'follow_up_search_completed'],
    model: 'muse-test', usage: { total_tokens: 10 }, provenance_note: 'Synthetic fixture', search_count: 2,
    stop_reason: 'no_new_evidence', warnings: ['No new evidence.'] }
  const turn = { id: 't1', createdAt: '2026-10-30T12:00:00Z', claim: result.claim,
    papers: [{ paper_id: 'a', title: 'Paper A', year: 2024, source: 'abstract' }], state: 'returned', result }
  const threads = [{ id: 'thread1', title: 'First review', createdAt: turn.createdAt, turns: [turn] },
    { id: 'thread2', title: 'Other review', createdAt: turn.createdAt, turns: [{ ...turn, id: 't2', claim: 'Different claim' }] }]
  assert.deepEqual(decodeHistory(encodeHistory(threads)), threads)
  const interrupted = decodeHistory(encodeHistory([{ ...threads[0], turns: [{ ...turn, state: 'running', result: null }] }]))
  assert.equal(interrupted[0].turns[0].state, 'interrupted')
  assert.match(interrupted[0].turns[0].error, /outcome is unknown/)
  assert.equal(threads[0].turns[0].state, 'returned')
  assert.throws(() => decodeHistory('{broken'))
  assert.throws(() => decodeHistory(JSON.stringify({ version: 99, threads: [] })))
  assert.throws(() => decodeHistory(encodeHistory([{ ...threads[0], turns: [{ ...turn, result: {} }] }])))
  assert.equal(isReview({ ...result, usage: { total_tokens: {} } }), false)
  const nodes = traceNodes(turn)
  assert.equal(nodes.filter(n => n.kind === 'assessment').length, 1)
  assert.equal(nodes.find(n => n.id === 'search-2').detail, '1 returned / 0 new passages')
  assert.equal(nodes.at(-1).label, 'insufficient evidence')
  const waiting = traceNodes({ ...turn, state: 'running', result: null })
  assert.equal(waiting.length, 1)
  assert.equal(waiting[0].label, 'Waiting for backend')
  const html = renderToStaticMarkup(createElement(SessionTree, { turn, selected: 'search-2', onSelect() {} }))
  assert.match(html, /Follow-up search/)
  assert.match(html, /seen/)
  assert.match(html, /aria-pressed="true"/)
  assert.doesNotMatch(html, /<script>/)
  console.log('Session history round-trip, interruption recovery, invalid storage, scope snapshots, tree deduplication and render checks passed.')
} finally {
  // Only remove the exact temporary directory created above, inside node_modules/.tmp.
  const relative = path.relative(temporaryRoot, directory)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Unexpected temporary path')
  await fs.rm(directory, { recursive: true, force: true })
}
