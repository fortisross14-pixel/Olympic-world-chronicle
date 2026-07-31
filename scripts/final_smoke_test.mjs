import {
  advanceToNextEdition,
  createInitialState,
  finalizeQualification,
  simulateToEnd,
} from '../src/engine.js'
import { editionBlueprints } from '../src/data.js'

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const playableEditions = editionBlueprints.filter((edition) => edition.status !== 'cancelled')
let state = createInitialState(18960406)
let totalEvents = 0
let totalMedals = 0

for (let index = 0; index < playableEditions.length; index += 1) {
  const expected = playableEditions[index]
  assert(state.edition.year === expected.year, `Expected ${expected.year}; received ${state.edition.year}`)
  assert(state.events.length === expected.events, `${expected.year}: incorrect event count`)
  assert(state.athletes.length === expected.athletes, `${expected.year}: incorrect athlete count`)
  assert(new Set(state.athletes.map((athlete) => athlete.countryCode)).size === expected.nations, `${expected.year}: incorrect delegation count`)

  state = finalizeQualification(state)
  state = simulateToEnd(state)

  assert(state.results.length === expected.events, `${expected.year}: not every final resolved`)
  assert(state.results.every((result) => result.podium.length === 3), `${expected.year}: incomplete podium`)

  totalEvents += state.results.length
  totalMedals += state.results.reduce((sum, result) => sum + result.podium.length, 0)

  if (index < playableEditions.length - 1) state = advanceToNextEdition(state)
}

assert(state.edition.year === 2028, 'Historical test did not finish at Los Angeles 2028')
assert(state.events.length === 351, 'Los Angeles 2028 must contain 351 medal events')
assert(!state.events.some((event) => /break/i.test(`${event.sportId} ${event.name}`)), 'Breaking must not remain in Los Angeles 2028')
assert(state.history.length === playableEditions.length - 1, 'Historical edition archive is incomplete')
assert(state.athletes.some((athlete) => athlete.appearances > 1), 'Returning Olympians were not retained')

let future = advanceToNextEdition(state)
assert(future.edition.year === 2032, 'Procedural continuation did not reach 2032')
future = finalizeQualification(future)
future = simulateToEnd(future)
future = advanceToNextEdition(future)
assert(future.edition.year === 2036, 'Procedural continuation did not reach 2036')

console.log(`PASS: ${playableEditions.length} editions, ${totalEvents.toLocaleString()} events, ${totalMedals.toLocaleString()} podium medals.`)
console.log(`LA28: ${state.athletes.length.toLocaleString()} athletes, ${state.events.length} events, ${state.records.length.toLocaleString()} record-lineage entries.`)
console.log(`Future continuation: ${future.edition.year} ${future.edition.host}.`)
