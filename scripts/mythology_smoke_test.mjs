import {
  advanceHostSelection,
  beginHostSelection,
  confirmHostSelection,
  createInitialState,
  finalizeQualification,
  getOlympiadArc,
  getRecordRows,
  getRivalryRows,
  simulateToEnd,
} from '../src/engine.js'

const assert = (condition, message) => { if (!condition) throw new Error(message) }

let state = createInitialState(18960406)
let sawPersistentRivalry = false
let sawMythicRecord = false
let totalMoments = 0

for (let editionIndex = 0; editionIndex < 8; editionIndex += 1) {
  const arc = getOlympiadArc(state)
  assert(arc.length === 4, `${state.edition.year}: Olympiad arc must have four stages`)
  assert(arc[3].label === 'Olympic year', `${state.edition.year}: fourth arc stage is not Olympic year`)

  state = finalizeQualification(state)
  state = simulateToEnd(state)

  const currentMoments = (state.iconicMoments || []).filter((moment) => moment.year === state.edition.year)
  assert(currentMoments.length <= 12, `${state.edition.year}: iconic-moment curation exceeded 12`)
  assert(currentMoments.every((moment) => moment.score >= 78), `${state.edition.year}: weak moment entered permanent mythology`)
  totalMoments += currentMoments.length

  const rivalries = getRivalryRows(state).filter((row) => row.meaningful)
  if (rivalries.some((row) => row.meetings >= 2)) sawPersistentRivalry = true

  const records = getRecordRows(state)
  if (records.some((record) => record.standing && ['Era-defining', 'Untouchable'].includes(record.mythology))) sawMythicRecord = true

  if (editionIndex === 7) break
  let selection = beginHostSelection(state)
  while (selection.phase === 'host-selection') selection = advanceHostSelection(selection)
  state = confirmHostSelection(selection)
}

assert(totalMoments > 0, 'No iconic Olympic moments were generated')
assert(sawPersistentRivalry, 'No rivalry survived into a repeat Olympic-final meeting')
assert(sawMythicRecord, 'No standing record matured into mythology')

console.log(`PASS mythology: ${totalMoments} curated moments; persistent rivalries and mythic records detected.`)
