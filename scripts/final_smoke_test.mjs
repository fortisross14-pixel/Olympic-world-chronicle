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
let totalCycleEvents = 0
let totalRounds = 0
const hosts = []

assert(state.version === 4, 'V4 state version was not created')
assert(state.edition.year === 1896, 'Universe must begin at Athens 1896')
assert(state.edition.host === 'Athens', 'Athens must be the only fixed initial host')
assert(WORLD_EVENT_POOL_SIZE >= 100, 'World-event scenario pool must contain at least 100 possibilities')

for (const expectedYear of expectedYears) {
  const expected = blueprintForYear(expectedYear)
  assert(state.edition.year === expectedYear, `Expected ${expectedYear}; received ${state.edition.year}`)
  assert(state.edition.events === state.events.length, `${expectedYear}: edition/event totals disagree`)
  assert(state.athletes.length === expected.athletes, `${expectedYear}: incorrect athlete count`)
  assert(new Set(state.athletes.map((athlete) => athlete.countryCode)).size === expected.nations, `${expectedYear}: incorrect delegation count`)
  assert(state.worldEvents.length >= 100, `${expectedYear}: background country-event layer is too small`)
  assert(state.featuredWorldEvents.length === 6, `${expectedYear}: magazine must feature six huge events`)
  assert(state.featuredWorldEvents.every((event) => event.severity === 'huge'), `${expectedYear}: a non-huge event reached the front page`)
  assert(state.qualificationCompetitions.length > 0, `${expectedYear}: missing qualification circuit`)
  assert(Object.keys(state.qualificationRankings || {}).length > 0, `${expectedYear}: missing sport rankings`)
  const allRanked = Object.values(state.qualificationRankings || {}).flat()
  assert(allRanked.length >= state.athletes.length, `${expectedYear}: qualification rankings omit the active pathway`)
  assert(allRanked.some((row) => !row.qualified), `${expectedYear}: qualification has no failed athletes to follow`)
  assert(state.qualificationCompetitions.every((competition) => Array.isArray(competition.resultRows) && competition.resultRows.length > 0), `${expectedYear}: a qualifier has no browsable standings`)
  assert(state.qualificationCompetitions.reduce((sum, competition) => sum + (competition.qualifiedAthleteIds?.length || 0), 0) === state.athletes.length, `${expectedYear}: qualification places do not reconcile to the athlete field`)
  assert(state.athletes.every((athlete) => athlete.qualificationPath?.competitionId), `${expectedYear}: an athlete is missing a qualification pathway`)
  const coveredQualificationEvents = new Set(state.qualificationCompetitions.flatMap((competition) => competition.eventKeys || []))
  assert(state.events.every((event) => coveredQualificationEvents.has(event.recordKey)), `${expectedYear}: an Olympic discipline has no qualification route`)
  assert(state.events.every((event) => !event.hostAdded || expectedYear >= (sportIntroduction.get(event.sportId) || 1896)), `${expectedYear}: an event appeared before its sport was plausible`)
  assert(state.magazine?.lifeChanges && state.magazine?.preGames, `${expectedYear}: pre-Games magazine missing`)
  assert(Array.isArray(state.magazine.preGames.keyCompetitions), `${expectedYear}: key competitions missing from magazine`)

  totalQualificationEvents += state.qualificationCompetitions.length
  totalCycleEvents += state.worldEvents.length

  state = finalizeQualification(state)
  assert(state.phase === 'games', `${expectedYear}: qualification did not open the Games`)

  const firstDay = state.currentDay
  const sessionsOnFirstDay = state.schedule.filter((session) => session.day === firstDay).length
  state = simulateDay(state, firstDay)
  const firstDayRounds = state.roundResults.filter((round) => round.day === firstDay)
  assert(firstDayRounds.length === sessionsOnFirstDay, `${expectedYear}: simulate day did not resolve every scheduled round`)
  assert(firstDayRounds.every((round) => round.results.length > 0), `${expectedYear}: a completed round has no athlete results`)
  assert(firstDayRounds.every((round) => round.results.every((row) => Number.isFinite(row.value) && Number.isFinite(row.rank))), `${expectedYear}: malformed round standings`)

  state = simulateToEnd(state)
  assert(state.phase === 'complete', `${expectedYear}: Games did not complete`)
  assert(state.results.length === state.events.length, `${expectedYear}: not every final resolved`)
  assert(state.results.every((result) => result.podium.length === 3), `${expectedYear}: incomplete podium`)
  assert(state.medalTable.reduce((sum, row) => sum + row.total, 0) === state.events.length * 3, `${expectedYear}: medal table does not reconcile`)
  assert(state.roundResults.length === state.schedule.length, `${expectedYear}: not every prior round was retained`)
  assert(state.roundResults.some((round) => !round.isFinal), `${expectedYear}: only medal finals were retained`)
  assert(state.roundResults.every((round) => round.results.length > 0), `${expectedYear}: empty historical round`)
  assert(state.athletes.some((athlete) => (athlete.competitionHistory || []).some((row) => row.editionYear === expectedYear)), `${expectedYear}: athlete progression was not stored`)
  assert(state.magazine.postGames, `${expectedYear}: post-Games magazine missing`)
  assert(Array.isArray(state.magazine.postGames.multiMedalistIds), `${expectedYear}: multi-medalist story list missing`)

  totalEvents += state.results.length
  totalMedals += state.results.reduce((sum, result) => sum + result.podium.length, 0)
  totalRounds += state.roundResults.length
  hosts.push({ year: expectedYear, city: state.edition.host, continent: state.edition.continent, countryCode: state.edition.countryCode })

  if (expectedYear === 2028) break

  let selection = beginHostSelection(state)
  assert(selection.phase === 'host-selection', `${expectedYear}: host election did not start`)
  assert(selection.hostSelection.candidates.length === 4, `${expectedYear}: host election needs four candidates`)
  assert(selection.hostSelection.candidates.every((candidate) => candidate.continent !== state.edition.continent), `${expectedYear}: previous continent entered the candidate list`)

  for (let round = 1; round <= 3; round += 1) {
    selection = advanceHostSelection(selection)
    assert(selection.hostSelection.candidates.filter((candidate) => candidate.status === 'eliminated').length === round, `${expectedYear}: ballot round ${round} failed`)
  }
  const winner = selection.hostSelection.candidates.find((candidate) => candidate.id === selection.hostSelection.winnerId)
  assert(winner, `${expectedYear}: no winning host`)
  const priorEdition = state
  state = confirmHostSelection(selection)
  assert(state.edition.host === winner.city, `${expectedYear}: selected host was not applied`)
  assert(state.edition.countryCode === winner.countryCode, `${state.edition.year}: host country identity mismatch`)
  assert((state.hostLegacy[winner.countryCode] || 0) >= 18, `${state.edition.year}: host investment legacy missing`)
  const hostDelegation = state.athletes.filter((athlete) => athlete.countryCode === winner.countryCode).length
  assert(hostDelegation > 0, `${state.edition.year}: host country has no athletes`)
  if (state.edition.year === 1900 && winner.countryCode !== 'FRA') {
    const france = state.athletes.filter((athlete) => athlete.countryCode === 'FRA').length
    assert(hostDelegation > france, '1900 procedural host did not replace the historical France delegation bias')
  }
  assert(priorEdition.edition.continent !== state.edition.continent, `${state.edition.year}: consecutive host continents detected`)
}

assert(state.edition.year === 2028, 'Long-history test did not finish in 2028')
assert(state.history.length === expectedYears.length - 1, 'Edition archive is incomplete')
assert(state.history.every((entry) => Array.isArray(entry.roundResults) && entry.roundResults.length > 0), 'Historical prior rounds were not archived')
assert(state.history.every((entry) => entry.magazine?.preGames && entry.magazine?.postGames), 'Historical magazine archive missing')
assert(state.athletes.some((athlete) => athlete.appearances > 1), 'Returning Olympians were not retained')
assert(state.records.some((record) => record.source === 'qualification'), 'No records were produced outside the Olympics')
assert(hosts.slice(1).every((host, index) => host.continent !== hosts[index].continent), 'Consecutive host continents detected')

let future = beginHostSelection(state)
while (future.phase === 'host-selection') future = advanceHostSelection(future)
future = confirmHostSelection(future)
assert(future.edition.year === 2032, 'Procedural continuation did not reach 2032')

console.log(`PASS V4: ${expectedYears.length} editions, ${totalEvents.toLocaleString()} medal events and ${totalRounds.toLocaleString()} retained rounds.`)
console.log(`Athlete results: qualification rankings, qualifier standings and Olympic progression retained.`)
console.log(`Narrative: ${totalCycleEvents.toLocaleString()} country developments, six huge stories per cycle, pre/post magazines.`)
console.log(`Hosts: ${state.hostSelectionHistory.length} procedural elections with delegation realignment and no consecutive continents.`)
console.log(`Archive: ${totalMedals.toLocaleString()} podium medals; continuation reached ${future.edition.year} ${future.edition.host}.`)
