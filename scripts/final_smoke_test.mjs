import {
  advanceHostSelection,
  beginHostSelection,
  blueprintForYear,
  confirmHostSelection,
  createInitialState,
  finalizeQualification,
  simulateDay,
  simulateToEnd,
} from '../src/engine.js'
import { sportCatalog } from '../src/data.js'
import { WORLD_EVENT_POOL_SIZE } from '../src/worldData.js'

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const sportIntroduction = new Map(sportCatalog.map((sport) => [sport.id, sport.introduced || 1896]))
const expectedYears = Array.from({ length: ((2028 - 1896) / 4) + 1 }, (_, index) => 1896 + index * 4)
let state = createInitialState(18960406)
let totalEvents = 0
let totalMedals = 0
let totalQualificationEvents = 0
let totalWorldEvents = 0
let previousContinent = null
const hosts = []

assert(state.edition.year === 1896, 'Universe must begin at Athens 1896')
assert(state.edition.host === 'Athens', 'Athens must be the only fixed initial host')
assert(WORLD_EVENT_POOL_SIZE >= 100, 'World-event pool must contain at least 100 possibilities')

for (const expectedYear of expectedYears) {
  const expected = blueprintForYear(expectedYear)
  assert(state.edition.year === expectedYear, `Expected ${expectedYear}; received ${state.edition.year}`)
  assert(state.edition.events === state.events.length, `${expectedYear}: edition/event totals disagree`)
  assert(state.athletes.length === expected.athletes, `${expectedYear}: incorrect athlete count`)
  assert(new Set(state.athletes.map((athlete) => athlete.countryCode)).size === expected.nations, `${expectedYear}: incorrect delegation count`)
  assert(state.worldEvents.length === 6, `${expectedYear}: cycle must present six world events`)
  assert(state.qualificationCompetitions.length > 0, `${expectedYear}: missing qualification circuit`)
  assert(state.qualificationCompetitions.reduce((sum, competition) => sum + (competition.qualifiedAthleteIds?.length || 0), 0) === state.athletes.length, `${expectedYear}: qualification places do not reconcile to the athlete field`)
  assert(state.athletes.every((athlete) => athlete.qualificationPath?.competitionId), `${expectedYear}: an athlete is missing a qualification pathway`)
  const coveredQualificationEvents = new Set(state.qualificationCompetitions.flatMap((competition) => competition.eventKeys || []))
  assert(state.events.every((event) => coveredQualificationEvents.has(event.recordKey)), `${expectedYear}: an Olympic discipline has no qualification route`)
  assert(state.events.every((event) => !event.hostAdded || expectedYear >= (sportIntroduction.get(event.sportId) || 1896)), `${expectedYear}: an event appeared before its sport was plausible`)
  assert(state.athletes.every((athlete) => athlete.name && athlete.countryCode && athlete.sportId), `${expectedYear}: malformed procedural athlete`)
  assert(state.athletes.every((athlete) => Number.isFinite(athlete.currentRating) && Number.isFinite(athlete.baseSkill) && Array.isArray(athlete.ratingHistory)), `${expectedYear}: missing career ratings`)

  totalQualificationEvents += state.qualificationCompetitions.length
  totalWorldEvents += state.worldEvents.length

  state = finalizeQualification(state)
  assert(state.phase === 'games', `${expectedYear}: qualification did not open the Games`)

  if (expectedYear === 1896) {
    const beforeResults = state.results.length
    const firstDay = state.currentDay
    state = simulateDay(state, firstDay)
    assert(state.results.length >= beforeResults, 'Day simulation lost results')
    assert(state.currentDay > firstDay || state.phase === 'complete', 'Day simulation did not advance the Olympic calendar')
  }

  state = simulateToEnd(state)
  assert(state.phase === 'complete', `${expectedYear}: Games did not complete`)
  assert(state.results.length === state.events.length, `${expectedYear}: not every final resolved`)
  assert(state.results.every((result) => result.podium.length === 3), `${expectedYear}: incomplete podium`)
  assert(state.results.every((result) => Array.isArray(result.newRecords)), `${expectedYear}: result record notifications missing`)
  assert(state.medalTable.reduce((sum, row) => sum + row.total, 0) === state.events.length * 3, `${expectedYear}: medal table does not reconcile`)

  totalEvents += state.results.length
  totalMedals += state.results.reduce((sum, result) => sum + result.podium.length, 0)
  hosts.push({ year: expectedYear, city: state.edition.host, continent: state.edition.continent })

  if (expectedYear === 2028) break

  let selection = beginHostSelection(state)
  assert(selection.phase === 'host-selection', `${expectedYear}: host election did not start`)
  assert(selection.hostSelection.candidates.length === 4, `${expectedYear}: host election needs four candidates`)
  assert(new Set(selection.hostSelection.candidates.map((candidate) => candidate.city)).size === 4, `${expectedYear}: duplicate host candidate`)
  if (previousContinent || state.edition.continent) {
    const prohibited = state.edition.continent
    assert(selection.hostSelection.candidates.every((candidate) => candidate.continent !== prohibited), `${expectedYear}: consecutive-continent rule violated in candidate list`)
  }

  for (let round = 1; round <= 3; round += 1) {
    selection = advanceHostSelection(selection)
    const eliminated = selection.hostSelection.candidates.filter((candidate) => candidate.status === 'eliminated').length
    assert(eliminated === round, `${expectedYear}: ballot round ${round} did not eliminate exactly one city`)
  }
  assert(selection.phase === 'host-selected', `${expectedYear}: host winner was not selected`)
  const winner = selection.hostSelection.candidates.find((candidate) => candidate.id === selection.hostSelection.winnerId)
  assert(winner, `${expectedYear}: no winning host`)
  assert(winner.continent !== state.edition.continent, `${expectedYear}: winner repeated the previous continent`)
  previousContinent = state.edition.continent
  state = confirmHostSelection(selection)
  assert(state.edition.host === winner.city, `${expectedYear}: selected host was not applied`)
  assert(state.edition.theme?.accent && state.edition.theme?.background, `${state.edition.year}: host theme missing`)
  assert((state.hostLegacy[winner.countryCode] || 0) >= 18, `${state.edition.year}: host investment legacy missing`)
}

assert(state.edition.year === 2028, 'Long-history test did not finish in 2028')
assert(state.history.length === expectedYears.length - 1, 'Edition archive is incomplete')
assert(state.athletes.some((athlete) => athlete.appearances > 1), 'Returning Olympians were not retained')
assert(state.records.some((record) => record.source === 'qualification'), 'No world records were produced outside the Olympics')
assert(state.history.every((entry) => Array.isArray(entry.medalResults) && Array.isArray(entry.qualificationCompetitions)), 'Historical medal or qualification archive missing')
assert(hosts.slice(1).every((host, index) => host.continent !== hosts[index].continent), 'Consecutive host continents detected')

let future = beginHostSelection(state)
while (future.phase === 'host-selection') future = advanceHostSelection(future)
future = confirmHostSelection(future)
assert(future.edition.year === 2032, 'Procedural continuation did not reach 2032')
future = finalizeQualification(future)
future = simulateToEnd(future)
future = beginHostSelection(future)
while (future.phase === 'host-selection') future = advanceHostSelection(future)
future = confirmHostSelection(future)
assert(future.edition.year === 2036, 'Procedural continuation did not reach 2036')

console.log(`PASS: ${expectedYears.length} editions, ${totalEvents.toLocaleString()} events, ${totalMedals.toLocaleString()} podium medals.`)
console.log(`Qualification: ${totalQualificationEvents.toLocaleString()} circuit events and ${totalWorldEvents.toLocaleString()} cycle events.`)
console.log(`Host elections: ${state.hostSelectionHistory.length} completed votes; no consecutive continents.`)
console.log(`2028 universe: ${state.edition.host}, ${state.athletes.length.toLocaleString()} athletes, ${state.events.length} events, ${state.records.length.toLocaleString()} record-lineage entries.`)
console.log(`Future continuation: ${future.edition.year} ${future.edition.host}.`)
