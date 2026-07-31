import {
  careerProfiles,
  countries,
  countryTraditions,
  editionBlueprints,
  editionDelegations,
  editionNocs,
  historicalEraFactors,
  historicalPrograms,
  namePools,
  rarityConfig,
  sportCatalog,
} from './data.js'

export const mulberry32 = (seed) => {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const round = (value, decimals = 1) => Number(value.toFixed(decimals))
const pick = (random, arr) => arr[Math.floor(random() * arr.length)]
const between = (random, min, max) => min + Math.floor(random() * (max - min + 1))
const scoreMedals = (m = {}) => (m.gold || 0) * 6 + (m.silver || 0) * 3 + (m.bronze || 0)

function hashText(value = '') {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function getEditionBlueprint(year) {
  return editionBlueprints.find((item) => item.year === year)
}

export function getEditionProgram(year) {
  if (historicalPrograms[String(year)]) return historicalPrograms[String(year)]
  const latest = historicalPrograms['2028'] || historicalPrograms['2024']
  return latest.map((event, index) => ({ ...event, id: `${year}-${event.recordKey}-${index}` }))
}

export function countryByCode(code) {
  return countries.find((country) => country.code === code) || { code, name: code, flag: '🏳️', active: true }
}

export function sportById(id) {
  return sportCatalog.find((sport) => sport.id === id) || { id, name: id, icon: 'medal', category: 'points', infrastructure: 50 }
}

function eraFor(year) {
  return historicalEraFactors.find((era) => year >= era.from && year <= era.to) || historicalEraFactors.at(-1)
}

function careerProfile(sportId) {
  const sport = sportById(sportId)
  return careerProfiles[sportId] || (sport.category === 'team' ? careerProfiles.team : careerProfiles.default)
}

function eventGender(event) {
  return event.gender || 'X'
}

function inferEventProfile(event, year) {
  const name = event.name.toLowerCase()
  const sportId = event.sportId
  const sport = sportById(sportId)
  const individual = !event.team
  let metric = 'score'
  let unit = 'pts'
  let benchmark = 100
  let lowerIsBetter = false
  let decimals = 2
  let recordEligible = individual && !['bracket', 'team'].includes(sport.category)

  const distanceMatch = name.match(/(\d+(?:\.\d+)?)\s*(kilometres?|km|metres?|m)\b/)
  const distance = distanceMatch ? Number(distanceMatch[1]) * (/kilo|km/.test(distanceMatch[2]) ? 1000 : 1) : null

  if (sportId === 'athletics') {
    if (/jump/.test(name)) {
      metric = 'distance'; unit = 'm'; lowerIsBetter = false
      benchmark = /high/.test(name) ? 2.46 : /pole/.test(name) ? 6.22 : /triple/.test(name) ? 18.35 : 8.95
    } else if (/shot put/.test(name)) { metric = 'distance'; unit = 'm'; benchmark = 23.6 }
    else if (/discus/.test(name)) { metric = 'distance'; unit = 'm'; benchmark = 75.5 }
    else if (/hammer/.test(name)) { metric = 'distance'; unit = 'm'; benchmark = 87.0 }
    else if (/javelin/.test(name)) { metric = 'distance'; unit = 'm'; benchmark = year < 1986 ? 104.8 : 99.0 }
    else if (/decathlon|heptathlon|pentathlon/.test(name)) { metric = 'score'; unit = 'pts'; benchmark = /hept/.test(name) ? 7350 : /pent/.test(name) ? 5200 : 9300; decimals = 0 }
    else {
      metric = 'time'; unit = 's'; lowerIsBetter = true
      const d = distance || (/marathon/.test(name) ? 42195 : /cross-country/.test(name) ? 10000 : 100)
      const base = { 60: 6.3, 100: 9.72, 110: 12.75, 200: 19.85, 400: 43.4, 800: 100.2, 1500: 205.5, 3000: 440, 5000: 755, 10000: 1570, 20000: 3380, 42195: 7200 }
      benchmark = base[d] || (d < 800 ? d / 10.2 : d < 5000 ? d / 7.25 : d / 6.45)
      if (/hurdle|steeple/.test(name)) benchmark *= 1.08
      if (/walk/.test(name)) benchmark *= 1.55
      if (/relay/.test(name)) benchmark *= /4 x 100|4 × 100/.test(name) ? 3.75 : 3.82
    }
  } else if (sportId === 'swimming' || sportId === 'marathon-swimming') {
    metric = 'time'; unit = 's'; lowerIsBetter = true
    const d = distance || (sportId === 'marathon-swimming' ? 10000 : 100)
    const pace = /breast/.test(name) ? 0.58 : /butterfly/.test(name) ? 0.52 : /back/.test(name) ? 0.51 : /medley/.test(name) ? 0.515 : 0.465
    benchmark = d * pace * (d > 200 ? 1.055 : 1)
    if (/relay/.test(name)) benchmark *= 0.965
  } else if (['rowing','canoe-sprint','canoe-slalom','canoe-marathon','cycling-road','cycling-track','cycling-mountain-bike','cycling-bmx-racing','triathlon','modern-pentathlon'].includes(sportId)) {
    metric = 'time'; unit = 's'; lowerIsBetter = true
    if (sportId === 'rowing') benchmark = 330
    else if (sportId.startsWith('canoe')) benchmark = distance ? Math.max(35, distance / 4.5) : 100
    else if (sportId === 'cycling-road') benchmark = /time trial/.test(name) ? 3300 : 14000
    else if (sportId === 'cycling-track') benchmark = distance ? Math.max(9.2, distance / 16.5) : 70
    else if (sportId === 'cycling-mountain-bike') benchmark = 5100
    else if (sportId === 'cycling-bmx-racing') benchmark = 31
    else if (sportId === 'triathlon') benchmark = 6200
    else benchmark = 600
  } else if (sportId === 'weightlifting') {
    metric = 'weight'; unit = 'kg'; benchmark = /one hand/.test(name) ? 105 : /two hand/.test(name) ? 185 : /super-heavy|unlimited|heavyweight/.test(name) ? 475 : /light|feather|fly/.test(name) ? 325 : 400; decimals = 0
  } else if (sportId === 'shooting' || sportId === 'archery') {
    metric = 'score'; unit = 'pts'; benchmark = sportId === 'archery' ? 720 : 600; decimals = 0
  } else if (['diving','artistic-gymnastics','rhythmic-gymnastics','trampolining','artistic-swimming','skateboarding','surfing','breaking','cycling-bmx-freestyle','sport-climbing'].includes(sportId)) {
    metric = 'score'; unit = 'pts'; benchmark = 100; recordEligible = false
  } else if (sport.category === 'bracket' || sport.category === 'team') {
    metric = 'wins'; unit = ''; benchmark = 1; recordEligible = false; decimals = 0
  } else {
    metric = sport.category === 'race' ? 'time' : 'score'
    unit = metric === 'time' ? 's' : 'pts'
    lowerIsBetter = metric === 'time'
    benchmark = metric === 'time' ? 100 : 100
    recordEligible = individual && metric !== 'wins'
  }

  if (event.gender === 'F') {
    if (metric === 'time') benchmark *= sportId === 'swimming' ? 1.085 : ['rowing','canoe-sprint','canoe-slalom','cycling-road','cycling-track','triathlon'].includes(sportId) ? 1.075 : 1.10
    if (sportId === 'athletics' && metric === 'distance') {
      if (/high jump/.test(name)) benchmark *= 0.86
      else if (/pole vault/.test(name)) benchmark *= 0.82
      else if (/long jump/.test(name)) benchmark *= 0.82
      else if (/triple jump/.test(name)) benchmark *= 0.86
      else if (/javelin/.test(name)) benchmark *= 0.73
      else if (/hammer/.test(name)) benchmark *= 0.94
      else benchmark *= 0.98
    }
    if (metric === 'weight') benchmark *= 0.78
  }
  const era = eraFor(year)
  return { metric, unit, benchmark, lowerIsBetter, decimals, recordEligible, eraScience: era.science }
}

export function generateEditionEvents(edition) {
  return getEditionProgram(edition.year).map((event, index) => ({
    ...event,
    index,
    ...inferEventProfile(event, edition.year),
  }))
}

function makeFutureEdition(state) {
  const year = state.edition.year + 4
  const hosts = [
    ['Madrid','Spain','🇪🇸'],['Cape Town','South Africa','🇿🇦'],['Istanbul','Türkiye','🇹🇷'],
    ['Buenos Aires','Argentina','🇦🇷'],['Seoul','South Korea','🇰🇷'],['Berlin','Germany','🇩🇪'],
    ['Mumbai','India','🇮🇳'],['Toronto','Canada','🇨🇦'],['Brisbane','Australia','🇦🇺'],
  ]
  const [host, country, flag] = hosts[Math.floor(year / 4) % hosts.length]
  const priorProgram = getEditionProgram(state.edition.year)
  const random = mulberry32(state.seed + year * 31)
  const program = priorProgram.map((event, index) => ({ ...event, id: `${year}-${event.recordKey}-${index}` }))
  if (random() < 0.45 && program.length < 365) {
    const sport = pick(random, sportCatalog.filter((s) => s.introduced <= year))
    const gender = random() < 0.48 ? 'F' : random() < 0.92 ? 'M' : 'X'
    const name = `${gender === 'F' ? 'Women’s' : gender === 'M' ? 'Men’s' : 'Mixed'} New Olympic Format`
    program.push({ id: `${year}-${sport.id}-new-${program.length}`, sportId: sport.id, sportName: sport.name, name, gender, team: sport.category === 'team', recordKey: `${sport.id}-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}` })
  }
  historicalPrograms[String(year)] = program
  return { year, host, country, flag, days: 17, sports: new Set(program.map((e) => e.sportId)).size, events: program.length, nations: 206, athletes: clamp(Math.round(state.edition.athletes + (random() - 0.5) * 500), 9800, 11600), womenPct: 50, status: 'future' }
}

function rarityForTalent(talent) {
  return rarityConfig.find((item) => talent >= item.min)?.id || 'common'
}

function baseCountryPower(code, year) {
  const historic = ['URS','GDR','FRG','TCH','YUG','BOH','ANZ'].includes(code)
  const h = hashText(`${code}-${Math.floor(year / 20)}`)
  const size = 30 + (h % 45)
  return clamp(size + (historic ? 8 : 0), 22, 82)
}

function traditionBonus(code, sportId) {
  const list = countryTraditions[code] || []
  const index = list.indexOf(sportId)
  if (index === -1) return 0
  return 17 - index * 2.5
}

export function createInvestments(year, random) {
  return countries.map((country) => {
    const overall = clamp(Math.round(baseCountryPower(country.code, year) + (random() - 0.5) * 12), 18, 92)
    const facilities = clamp(Math.round(overall + (random() - 0.5) * 14), 12, 96)
    const youth = clamp(Math.round(overall + (random() - 0.5) * 18), 12, 96)
    const focusSports = [...(countryTraditions[country.code] || [])]
    while (focusSports.length < 4) {
      const sport = pick(random, sportCatalog.filter((item) => item.introduced <= year))
      if (!focusSports.includes(sport.id)) focusSports.push(sport.id)
    }
    const allocations = Object.fromEntries(focusSports.slice(0, 6).map((sportId, index) => [sportId, clamp(Math.round(overall + 18 - index * 5 + (random() - 0.5) * 8), 20, 99)]))
    return { countryCode: country.code, overall, facilities, youth, focusSports: focusSports.slice(0, 6), allocations, trend: 'stable', history: [{ year, overall, facilities, youth }] }
  })
}

export function evolveInvestments(previous, year, random, lastHistory = null) {
  return previous.map((investment) => {
    const priorMedals = lastHistory?.countryStats?.find((x) => x.countryCode === investment.countryCode)?.total || 0
    const momentum = priorMedals > 8 ? 2 : priorMedals === 0 ? -1 : 0
    const change = Math.round((random() - 0.47) * 7 + momentum)
    const overall = clamp(investment.overall + change, 15, 98)
    const facilities = clamp(investment.facilities + Math.round(change * 0.55 + (random() - 0.5) * 4), 12, 99)
    const youth = clamp(investment.youth + Math.round(change * 0.7 + (random() - 0.5) * 5), 12, 99)
    const focusSports = [...investment.focusSports]
    if (random() < 0.18) {
      const replacement = pick(random, sportCatalog.filter((item) => item.introduced <= year))?.id
      if (replacement && !focusSports.includes(replacement)) focusSports[focusSports.length - 1] = replacement
    }
    const allocations = { ...investment.allocations }
    focusSports.forEach((sportId, index) => { allocations[sportId] = clamp(Math.round((allocations[sportId] || overall) + change + 3 - index), 15, 99) })
    return { ...investment, overall, facilities, youth, focusSports, allocations, trend: change >= 3 ? 'rising' : change <= -3 ? 'falling' : 'stable', history: [...(investment.history || []), { year, overall, facilities, youth }].slice(-12) }
  })
}

function countrySportStrength(code, sportId, investments) {
  const inv = investments.find((item) => item.countryCode === code)
  if (!inv) return 45
  const allocation = inv.allocations[sportId] || inv.overall
  const infrastructureFit = 100 - Math.max(0, sportById(sportId).infrastructure - inv.facilities) * 0.45
  return clamp(inv.overall * 0.34 + inv.youth * 0.18 + allocation * 0.31 + infrastructureFit * 0.08 + traditionBonus(code, sportId), 15, 99)
}

function repairNamePart(value) {
  const fixes = { Andrs:'Andrés', Prez:'Pérez', Garca:'García', Rodrguez:'Rodríguez', Martnez:'Martínez', Gonzlez:'González', Snchez:'Sánchez', Fernndez:'Fernández', Lpez:'López', Hernndez:'Hernández', Jimnez:'Jiménez', Daz:'Díaz', Muoz:'Muñoz', Vzquez:'Vázquez', Jos:'José', Joo:'João', Mara:'María', ng:'Ng' }
  const fixed = fixes[value] || value
  return /^[a-zà-ž]/u.test(fixed) ? fixed.charAt(0).toLocaleUpperCase() + fixed.slice(1) : fixed
}

function makeName(countryCode, gender, random, usedNames) {
  const pool = namePools[countryCode] || namePools.GLOBAL
  const global = namePools.GLOBAL
  const firstPool = gender === 'F' ? (pool.femaleFirst?.length ? pool.femaleFirst : global.femaleFirst) : (pool.maleFirst?.length ? pool.maleFirst : global.maleFirst)
  const lastPool = pool.last?.length ? pool.last : global.last
  for (let tries = 0; tries < 20; tries += 1) {
    const name = `${repairNamePart(pick(random, firstPool))} ${repairNamePart(pick(random, lastPool))}`
    if (!usedNames.has(`${countryCode}-${name}`)) { usedNames.add(`${countryCode}-${name}`); return name }
  }
  const name = `${repairNamePart(pick(random, firstPool))} ${repairNamePart(pick(random, lastPool))} ${between(random, 2, 99)}`
  usedNames.add(`${countryCode}-${name}`)
  return name
}

function currentRatingFor(athlete, year, random = null) {
  const age = year - athlete.birthYear
  const yearsFromPeak = age - athlete.peakAge
  let curve
  if (yearsFromPeak < 0) {
    const runway = Math.max(3, athlete.peakAge - athlete.careerStartAge)
    curve = 0.79 + 0.21 * clamp((age - athlete.careerStartAge) / runway, 0, 1)
  } else {
    curve = 1 - Math.pow(yearsFromPeak / 8, 1.35) * (athlete.declineRate / 10)
  }
  const seasonShape = random ? 0.94 + random() * 0.08 : 1
  return clamp(Math.round(athlete.baseSkill * curve * seasonShape), 45, 100)
}

function chooseSport(code, eventsBySport, investments, random) {
  const entries = [...eventsBySport.entries()].map(([sportId, events]) => {
    const strength = countrySportStrength(code, sportId, investments)
    const breadth = Math.sqrt(events.length)
    return { sportId, weight: Math.max(1, strength ** 1.7 * breadth) }
  })
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = random() * total
  for (const entry of entries) { roll -= entry.weight; if (roll <= 0) return entry.sportId }
  return entries.at(-1)?.sportId || 'athletics'
}

function eventFamily(event) {
  const name = event.name.toLowerCase()
  if (event.sportId === 'athletics') {
    if (/jump|vault/.test(name)) return 'jumps'
    if (/shot|discus|hammer|javelin|throw/.test(name)) return 'throws'
    if (/decathlon|heptathlon|pentathlon/.test(name)) return 'combined'
    if (/walk/.test(name)) return 'walk'
    if (/marathon|10000|10,000|5000|5,000|3000|3,000|cross-country|steeple/.test(name)) return 'distance'
    if (/800|1500|1,500|mile/.test(name)) return 'middle'
    return 'sprint'
  }
  if (event.sportId === 'swimming') {
    const stroke = /breast/.test(name) ? 'breast' : /butterfly/.test(name) ? 'fly' : /back/.test(name) ? 'back' : /medley/.test(name) ? 'medley' : 'free'
    const distance = Number(name.match(/(\d+)/)?.[1] || 100)
    return `${stroke}-${distance <= 200 ? 'short' : 'distance'}`
  }
  if (event.sportId.startsWith('cycling-')) return event.sportId
  if (event.sportId.startsWith('equestrian-')) return event.sportId
  return event.sportId
}

function athleteEventsFor(sportId, gender, eventsBySport, random) {
  const candidates = (eventsBySport.get(sportId) || []).filter((event) => event.gender === 'X' || event.gender === gender)
  const fallback = eventsBySport.get(sportId) || []
  const list = candidates.length ? candidates : fallback
  if (!list.length) return []
  const sport = sportById(sportId)
  const count = sport.category === 'team' ? 1 : clamp(1 + (random() < 0.42 ? 1 : 0) + (random() < 0.10 ? 1 : 0), 1, 3)
  const first = pick(random, list)
  const family = eventFamily(first)
  const related = list.filter((event) => eventFamily(event) === family)
  const chosen = [first.id]
  while (chosen.length < count && chosen.length < related.length) {
    const event = pick(random, related)
    if (event && !chosen.includes(event.id)) chosen.push(event.id)
  }
  return chosen
}

function createAthlete({ countryCode, gender, sportId, edition, eventsBySport, investments, random, usedNames, serial }) {
  const profile = careerProfile(sportId)
  const debutAge = between(random, profile.debut[0], profile.debut[1])
  const peakAge = between(random, Math.max(debutAge + 1, profile.peak[0]), profile.peak[1])
  const careerSpan = between(random, profile.span[0], profile.span[1])
  const countryStrength = countrySportStrength(countryCode, sportId, investments)
  const eliteFactor = 0.7 + countryStrength / 100
  const roll = random()
  let baseSkill
  let rarity
  if (roll < 0.0022 * eliteFactor) { rarity = 'generational'; baseSkill = between(random, 96, 100) }
  else if (roll < 0.015 * eliteFactor) { rarity = 'legend'; baseSkill = between(random, 91, 95) }
  else if (roll < 0.060 * eliteFactor) { rarity = 'epic'; baseSkill = between(random, 85, 90) }
  else if (roll < 0.22) { rarity = 'rare'; baseSkill = between(random, 79, 84) }
  else if (roll < 0.57) { rarity = 'uncommon'; baseSkill = between(random, 70, 78) }
  else { rarity = 'common'; baseSkill = between(random, 58, 69) }
  const birthYear = edition.year - debutAge - between(random, 0, Math.min(8, Math.max(0, peakAge - debutAge)))
  const careerStartAge = debutAge
  const retirementAge = careerStartAge + careerSpan
  const athlete = {
    id: `ath-${countryCode}-${birthYear}-${serial}`,
    name: makeName(countryCode, gender, random, usedNames),
    countryCode,
    gender,
    sportId,
    birthYear,
    age: edition.year - birthYear,
    careerStartAge,
    peakAge,
    retirementAge,
    declineRate: profile.decline,
    baseSkill,
    currentRating: baseSkill,
    rarity,
    form: round(0.94 + random() * 0.08, 3),
    pressure: round(0.88 + random() * 0.18, 3),
    events: athleteEventsFor(sportId, gender, eventsBySport, random),
    medals: { gold: 0, silver: 0, bronze: 0 },
    careerMedals: { gold: 0, silver: 0, bronze: 0 },
    appearances: 0,
    appearanceYears: [],
    ratingHistory: [],
    careerResults: [],
    status: 'active',
    qualified: true,
  }
  athlete.currentRating = currentRatingFor(athlete, edition.year, random)
  athlete.ratingHistory.push({ year: edition.year, age: athlete.age, rating: athlete.currentRating })
  return athlete
}

function updateAthlete(athlete, edition, eventsBySport, random) {
  const age = edition.year - athlete.birthYear
  const retired = age > athlete.retirementAge || (age > athlete.peakAge + 4 && random() < Math.min(0.72, (age - athlete.peakAge) * 0.055))
  if (retired) return { ...athlete, age, status: 'retired', qualified: false }
  const eventPool = eventsBySport.get(athlete.sportId) || []
  if (!eventPool.length) return { ...athlete, age, currentRating: currentRatingFor(athlete, edition.year, random), qualified: false, status: 'active' }
  const currentRating = currentRatingFor(athlete, edition.year, random)
  return {
    ...athlete,
    age,
    currentRating,
    form: round(0.93 + random() * 0.09, 3),
    pressure: clamp(round(athlete.pressure + (random() - 0.5) * 0.05, 3), 0.82, 1.08),
    events: athleteEventsFor(athlete.sportId, athlete.gender, eventsBySport, random),
    medals: { gold: 0, silver: 0, bronze: 0 },
    qualified: false,
    status: 'active',
    ratingHistory: [...(athlete.ratingHistory || []), { year: edition.year, age, rating: currentRating }].slice(-8),
  }
}

function allocateDelegations(edition, nocs) {
  const source = editionDelegations[String(edition.year)] || editionDelegations['2020'] || {}
  const weights = nocs.map((code) => ({ code, weight: Math.max(1, source[code] || (hashText(`${edition.year}-${code}`) % 14) + 1) }))
  const target = Math.max(nocs.length, edition.athletes)
  const result = Object.fromEntries(nocs.map((code) => [code, 1]))
  const available = target - nocs.length
  const totalWeight = weights.reduce((sum, row) => sum + row.weight, 0)
  const fractions = []
  let assigned = 0
  weights.forEach((row) => {
    const exact = available * row.weight / totalWeight
    const whole = Math.floor(exact)
    result[row.code] += whole
    assigned += whole
    fractions.push({ code: row.code, fraction: exact - whole })
  })
  fractions.sort((a, b) => b.fraction - a.fraction || a.code.localeCompare(b.code))
  for (let i = 0; i < available - assigned; i += 1) result[fractions[i % fractions.length].code] += 1
  return result
}

function generateAthletesForEdition({ edition, events, investments, priorPool = [], seed }) {
  const random = mulberry32(seed + edition.year * 97)
  const usedNames = new Set(priorPool.map((athlete) => `${athlete.countryCode}-${athlete.name}`))
  const eventsBySport = new Map()
  events.forEach((event) => {
    const list = eventsBySport.get(event.sportId) || []
    list.push(event)
    eventsBySport.set(event.sportId, list)
  })
  const sourceNocs = [...(editionNocs[String(edition.year)] || editionNocs['2024'] || countries.filter((c) => c.active).map((c) => c.code))]
  const targetNations = edition.nations || 206
  const eligibleFillers = countries.filter((country) => !sourceNocs.includes(country.code) && country.code !== 'ZZX' && (country.firstYear || 1896) <= edition.year).sort((a,b)=>hashText(`${edition.year}-${a.code}`)-hashText(`${edition.year}-${b.code}`))
  while (sourceNocs.length < targetNations && eligibleFillers.length) sourceNocs.push(eligibleFillers.shift().code)
  const nocs = sourceNocs.slice(0, targetNations)
  const quotas = allocateDelegations(edition, nocs)
  const updatedPool = priorPool.map((athlete) => updateAthlete(athlete, edition, eventsBySport, random))
  const candidatesByCountry = new Map()
  updatedPool.forEach((athlete) => {
    if (athlete.status !== 'active' || !eventsBySport.has(athlete.sportId)) return
    const list = candidatesByCountry.get(athlete.countryCode) || []
    list.push(athlete); candidatesByCountry.set(athlete.countryCode, list)
  })
  candidatesByCountry.forEach((list) => list.sort((a,b)=>(b.currentRating+b.form*8)-(a.currentRating+a.form*8)))
  const qualified = []
  let serial = Math.max(1, ...priorPool.map((a) => Number(String(a.id).split('-').at(-1)) || 0)) + 1

  nocs.forEach((countryCode) => {
    const quota = quotas[countryCode] || 1
    const candidates = candidatesByCountry.get(countryCode) || []
    const returnLimit = Math.min(candidates.length, Math.round(quota * (edition.year <= 1904 ? 0.18 : 0.42)))
    const selected = candidates.slice(0, returnLimit).filter((athlete, index) => index < Math.max(0, quota - 1) && (athlete.currentRating >= 67 || random() < 0.45))
    selected.forEach((athlete) => {
      athlete.qualified = true
      athlete.appearances += 1
      athlete.appearanceYears = [...(athlete.appearanceYears || []), edition.year]
      qualified.push(athlete)
    })
    let countryCount = selected.length
    while (countryCount < quota) {
      const gender = edition.womenPct <= 0 ? 'M' : random() * 100 < edition.womenPct ? 'F' : 'M'
      const sportId = chooseSport(countryCode, eventsBySport, investments, random)
      const athlete = createAthlete({ countryCode, gender, sportId, edition, eventsBySport, investments, random, usedNames, serial })
      serial += 1
      athlete.appearances = 1
      athlete.appearanceYears = [edition.year]
      qualified.push(athlete)
      updatedPool.push(athlete)
      countryCount += 1
    }
  })

  // Ensure every event has depth and at least a few genuine medal-level specialists.
  const eventById = new Map(events.map((event) => [event.id, event]))
  const athleteIndex = new Map()
  qualified.forEach((athlete) => {
    const keys = [`${athlete.sportId}-${athlete.gender}`, `${athlete.sportId}-X`]
    keys.forEach((key) => { const list = athleteIndex.get(key) || []; list.push(athlete); athleteIndex.set(key, list) })
  })
  events.forEach((event) => {
    const key = `${event.sportId}-${event.gender}`
    const broad = athleteIndex.get(key) || athleteIndex.get(`${event.sportId}-X`) || []
    const family = eventFamily(event)
    const specialists = broad.filter((athlete) => athlete.events.some((eventId) => eventFamily(eventById.get(eventId) || event) === family))
    const candidates = (specialists.length >= 8 ? specialists : broad).slice().sort((a,b) => {
      const affinityA = (hashText(`${a.id}-${event.recordKey}`) % 11) - 5
      const affinityB = (hashText(`${b.id}-${event.recordKey}`) % 11) - 5
      return (b.currentRating + affinityB) - (a.currentRating + affinityA)
    })
    const currentIds = new Set(qualified.filter((athlete) => athlete.events.includes(event.id)).map((athlete) => athlete.id))
    const minimum = event.team ? 8 : 12
    const desired = Math.max(minimum, 3)
    candidates.slice(0, desired).forEach((athlete) => {
      if (currentIds.has(athlete.id)) return
      athlete.events = athlete.events.length < 3 ? [...athlete.events, event.id] : [...athlete.events.slice(0, 2), event.id]
      currentIds.add(athlete.id)
    })
  })

  // Keep active non-qualifiers for possible comebacks, but cap save growth.
  const activeUnqualified = updatedPool.filter((athlete) => athlete.status === 'active' && !athlete.qualified)
    .sort((a,b)=>b.currentRating-a.currentRating)
    .slice(0, Math.round(edition.athletes * 0.35))
  const careerPool = [...qualified, ...activeUnqualified]
  const newlyRetired = updatedPool.filter((athlete) => athlete.status === 'retired' && (scoreMedals(athlete.careerMedals) > 0 || athlete.rarity === 'generational' || athlete.rarity === 'legend'))
  return { athletes: qualified, careerPool, newlyRetired }
}

function roundsForEvent(event, fieldSize) {
  const sport = sportById(event.sportId)
  if (sport.category === 'team') return fieldSize > 12 ? ['Group stage','Quarterfinals','Semifinals','Final'] : ['Group stage','Semifinals','Final']
  if (sport.category === 'bracket') return fieldSize > 24 ? ['Round of 32','Round of 16','Quarterfinals','Semifinals','Final'] : ['Round of 16','Quarterfinals','Semifinals','Final']
  if (sport.category === 'race' && fieldSize > 24) return ['Heats','Semifinals','Final']
  if (sport.category === 'judged' && fieldSize > 16) return ['Qualification','Final']
  return ['Qualification','Final']
}

export function createSchedule(edition, events, athletes) {
  const sessions = ['Morning','Afternoon','Evening']
  const schedule = []
  events.forEach((event, index) => {
    const fieldSize = athletes.filter((athlete) => athlete.events.includes(event.id)).length
    const rounds = roundsForEvent(event, fieldSize)
    let finalDay = 1 + ((index * 7 + hashText(event.id)) % edition.days)
    if (sportById(event.sportId).category === 'team') finalDay = Math.max(Math.ceil(edition.days * 0.72), finalDay)
    rounds.forEach((stage, roundIndex) => {
      const day = clamp(finalDay - (rounds.length - 1 - roundIndex) * (rounds.length > 3 ? 2 : 1), 1, edition.days)
      schedule.push({
        id: `${event.id}-r${roundIndex}`,
        eventId: event.id,
        sportId: event.sportId,
        day,
        session: sessions[(index + roundIndex) % sessions.length],
        stage,
        isFinal: roundIndex === rounds.length - 1,
        status: 'scheduled',
      })
    })
  })
  return schedule.sort((a,b)=>a.day-b.day || sessions.indexOf(a.session)-sessions.indexOf(b.session) || a.sportId.localeCompare(b.sportId))
}

function formatClock(totalSeconds, decimals = 2) {
  if (totalSeconds >= 3600) {
    const h = Math.floor(totalSeconds / 3600); const m = Math.floor((totalSeconds % 3600) / 60); const s = totalSeconds % 60
    return `${h}:${String(m).padStart(2,'0')}:${s.toFixed(decimals).padStart(decimals ? 3 + decimals : 2,'0')}`
  }
  if (totalSeconds >= 60) {
    const m = Math.floor(totalSeconds / 60); const s = totalSeconds % 60
    return `${m}:${s.toFixed(decimals).padStart(decimals ? 3 + decimals : 2,'0')}`
  }
  return `${totalSeconds.toFixed(decimals)}s`
}

export function formatPerformance(value, event) {
  if (value == null) return '—'
  if (event.metric === 'time') return formatClock(value, event.decimals ?? 2)
  if (event.metric === 'distance') return `${Number(value).toFixed(event.decimals ?? 2)} ${event.unit}`
  if (event.metric === 'weight') return `${Math.round(value)} kg`
  if (event.metric === 'wins') return 'Medal decision'
  return `${Number(value).toFixed(event.decimals ?? 0)}${event.unit ? ` ${event.unit}` : ''}`
}

function performanceFor(athlete, event, random, editionYear) {
  const rating = athlete.currentRating * athlete.form * athlete.pressure
  const era = eraFor(editionYear)
  const noise = (random() - 0.5) * (event.metric === 'time' ? 0.035 : 0.045)
  if (event.metric === 'time') {
    const historyMultiplier = event.sportId === 'swimming' ? 1.75 : event.sportId.startsWith('cycling-') ? 1.20 : event.sportId === 'rowing' ? 1.05 : 0.65
    const eraPenalty = 1 + (1 - era.science) * historyMultiplier
    const ratingCoefficient = event.sportId === 'swimming' ? 0.0028 : event.sportId === 'athletics' && event.benchmark < 300 ? 0.0023 : 0.0047
    return Math.max(event.benchmark * 0.94, event.benchmark * eraPenalty * (1 + (100 - rating) * ratingCoefficient + noise))
  }
  if (event.metric === 'distance' || event.metric === 'weight') {
    const historyMultiplier = event.metric === 'weight' ? 0.72 : 0.60
    const eraPenalty = 1 - (1 - era.science) * historyMultiplier
    return Math.min(event.benchmark * 1.04, event.benchmark * eraPenalty * (1 - (100 - rating) * 0.0045 + noise))
  }
  if (event.metric === 'score') return Math.min(event.benchmark, event.benchmark * (0.72 + rating / 360 + noise))
  return rating + noise * 20
}

function eventField(event, athletes) {
  const exact = athletes.filter((athlete) => athlete.events.includes(event.id))
  let compatible = exact.length >= 8 ? exact : athletes.filter((athlete) => athlete.sportId === event.sportId && (event.gender === 'X' || athlete.gender === event.gender))
  if (compatible.length < 3) compatible = athletes.filter((athlete) => athlete.sportId === event.sportId)
  if (compatible.length < 3) compatible = [...athletes].sort((a,b)=>b.currentRating-a.currentRating).slice(0,8)
  if (!event.team) return compatible.slice().sort((a,b)=>b.currentRating-a.currentRating).slice(0, 64).map((athlete)=>({ athleteId: athlete.id, memberIds:[athlete.id], countryCode: athlete.countryCode, displayName: athlete.name, rating: athlete.currentRating, athlete }))
  const grouped = new Map()
  compatible.forEach((athlete) => {
    const list = grouped.get(athlete.countryCode) || []
    list.push(athlete); grouped.set(athlete.countryCode,list)
  })
  if (grouped.size < 3) {
    const bestByCountry = new Map()
    athletes.filter((athlete)=>athlete.sportId===event.sportId).sort((a,b)=>b.currentRating-a.currentRating).forEach((athlete)=>{ if(!bestByCountry.has(athlete.countryCode)) bestByCountry.set(athlete.countryCode,[athlete]) })
    for (const [code,members] of bestByCountry) if (!grouped.has(code)) grouped.set(code,members)
  }
  if (grouped.size < 3) {
    athletes.sort((a,b)=>b.currentRating-a.currentRating).forEach((athlete)=>{ if(!grouped.has(athlete.countryCode)) grouped.set(athlete.countryCode,[athlete]) })
  }
  return [...grouped.entries()].map(([countryCode,members])=>{
    const sorted=members.sort((a,b)=>b.currentRating-a.currentRating)
    const roster=sorted.slice(0,18)
    const rating=roster.slice(0,8).reduce((s,a)=>s+a.currentRating,0)/Math.max(1,Math.min(8,roster.length))
    return { athleteId: roster[0]?.id, memberIds: roster.map(a=>a.id), countryCode, displayName: `${countryByCode(countryCode).name} team`, rating, athlete: roster[0] }
  }).filter(x=>x.athleteId).sort((a,b)=>b.rating-a.rating).slice(0,24)
}

function recordIsBetter(event, value, standing) {
  if (!standing) return true
  return event.lowerIsBetter ? value < standing.value : value > standing.value
}

export function simulateFinal({ edition, event, athletes, records, random }) {
  const field = eventField(event, athletes)
  const ranked = field.map((entry) => {
    const proxy = entry.athlete || { currentRating: entry.rating, form: 1, pressure: 1 }
    const value = event.metric === 'wins' ? entry.rating + (random()-0.5)*18 : performanceFor(proxy, event, random, edition.year)
    return { ...entry, value }
  }).sort((a,b)=>event.lowerIsBetter ? a.value-b.value : b.value-a.value)
  const medals = ['gold','silver','bronze']
  const podium = ranked.slice(0,3).map((entry,index)=>({ ...entry, place:index+1, medal:medals[index] }))
  const newRecords=[]
  if (event.recordEligible && podium[0]) {
    for (const type of ['WR','OR']) {
      const standing=records.filter(r=>r.type===type && r.eventKey===event.recordKey).sort((a,b)=>b.year-a.year).find(r=>r.standing!==false) || records.filter(r=>r.type===type && r.eventKey===event.recordKey).at(-1)
      if (recordIsBetter(event,podium[0].value,standing)) {
        newRecords.push({ id:`rec-${type}-${edition.year}-${event.id}`,type,eventKey:event.recordKey,eventId:event.id,eventName:event.name,sportId:event.sportId,eventMetric:event.metric,eventUnit:event.unit,eventBaseline:event.benchmark,value:podium[0].value,athleteId:podium[0].athleteId,athleteName:podium[0].displayName,countryCode:podium[0].countryCode,year:edition.year,host:edition.host })
      }
    }
  }
  return { podium, results: ranked.slice(0,Math.min(16,ranked.length)), newRecords }
}

function medalTableFromResults(results) {
  const table=new Map()
  results.forEach((result)=>result.podium.forEach((medalist)=>{
    const row=table.get(medalist.countryCode)||{countryCode:medalist.countryCode,gold:0,silver:0,bronze:0,total:0}
    row[medalist.medal]+=1;row.total+=1;table.set(medalist.countryCode,row)
  }))
  return [...table.values()].sort((a,b)=>b.gold-a.gold || b.silver-a.silver || b.bronze-a.bronze || a.countryCode.localeCompare(b.countryCode))
}

function makeNews(event,podium,newRecords,edition) {
  if (!podium[0]) return []
  const winner=podium[0]
  const country=countryByCode(winner.countryCode)
  const stories=[{id:`win-${edition.year}-${event.id}`,category:'Olympic Champion',headline:`${winner.displayName} wins ${event.name}`,body:`${country.flag} ${country.name} claims gold in ${sportById(event.sportId).name}${event.metric!=='wins' ? ` with ${formatPerformance(winner.value,event)}` : ''}.`,sportId:event.sportId,countryCode:winner.countryCode}]
  if (newRecords.some(r=>r.type==='WR')) stories.unshift({id:`wr-${edition.year}-${event.id}`,category:'World Record',headline:`A world record falls in ${event.name}`,body:`${winner.displayName} produces ${formatPerformance(winner.value,event)}, rewriting the global record book in ${edition.host}.`,sportId:event.sportId,countryCode:winner.countryCode})
  return stories
}

export function simulateDay(state, dayToSimulate) {
  if (state.phase !== 'games' || state.phase === 'complete') return state
  const random=mulberry32(state.seed + state.edition.year*1000 + dayToSimulate*7919 + state.results.length)
  const athletes=state.athletes.map(a=>({ ...a, medals:{...a.medals},careerMedals:{...a.careerMedals},careerResults:[...(a.careerResults||[])] }))
  const athleteMap=new Map(athletes.map(athlete=>[athlete.id,athlete]))
  let records=[...state.records]
  const results=[...state.results]
  const news=[...state.news]
  const schedule=state.schedule.map(item=>({...item}))
  schedule.filter(item=>item.day===dayToSimulate && item.status==='scheduled').forEach((session)=>{
    session.status='completed'
    if (!session.isFinal) return
    const event=state.events.find(item=>item.id===session.eventId)
    if (!event || results.some(result=>result.eventId===event.id)) return
    const simulation=simulateFinal({edition:state.edition,event,athletes,records,random})
    simulation.podium.forEach((medalist)=>{
      medalist.memberIds.forEach((id)=>{
        const athlete=athleteMap.get(id)
        if (!athlete) return
        athlete.medals[medalist.medal]+=1
        athlete.careerMedals[medalist.medal]+=1
        athlete.careerResults.push({year:state.edition.year,host:state.edition.host,eventName:event.name,eventKey:event.recordKey,sportId:event.sportId,medal:medalist.medal,value:medalist.value})
      })
    })
    records=[...records,...simulation.newRecords]
    results.push({id:`${state.edition.year}-${event.id}`,editionYear:state.edition.year,eventId:event.id,eventKey:event.recordKey,sportId:event.sportId,day:dayToSimulate,podium:simulation.podium.map(({athlete,...m})=>m),fullResults:simulation.results.map(({athlete,...r})=>r)})
    news.unshift(...makeNews(event,simulation.podium,simulation.newRecords,state.edition).map(item=>({...item,day:dayToSimulate})))
  })
  const currentDay=Math.min(state.edition.days+1,dayToSimulate+1)
  const complete=currentDay>state.edition.days || schedule.every(item=>item.status==='completed')
  const updatedPool=state.careerPool.map(poolAthlete=>athleteMap.get(poolAthlete.id)||poolAthlete)
  return {...state,athletes,careerPool:updatedPool,records,results,news,schedule,currentDay:complete?state.edition.days+1:currentDay,phase:complete?'complete':'games',medalTable:medalTableFromResults(results)}
}

export function simulateToEnd(state) {
  let next=state
  for (let day=state.currentDay;day<=state.edition.days;day+=1) next=simulateDay(next,day)
  return next
}

function programmeChanges(year) {
  const index=editionBlueprints.findIndex(e=>e.year===year)
  let priorIndex=index-1
  while (priorIndex>=0 && editionBlueprints[priorIndex].status==='cancelled') priorIndex-=1
  const current=getEditionProgram(year)
  const prior=priorIndex>=0?getEditionProgram(editionBlueprints[priorIndex].year):[]
  const currentKeys=new Set(current.map(e=>e.recordKey));const priorKeys=new Set(prior.map(e=>e.recordKey))
  return { added:current.filter(e=>!priorKeys.has(e.recordKey)), removed:prior.filter(e=>!currentKeys.has(e.recordKey)), previousYear:priorIndex>=0?editionBlueprints[priorIndex].year:null }
}

function buildStateForEdition({edition,seed,priorState=null}) {
  const random=mulberry32(seed+edition.year)
  const lastHistory=priorState?.history?.at(-1)
  const investments=priorState?evolveInvestments(priorState.investments,edition.year,random,lastHistory):createInvestments(edition.year,random)
  const events=generateEditionEvents(edition)
  const generated=generateAthletesForEdition({edition,events,investments,priorPool:priorState?.careerPool||[],seed})
  const schedule=createSchedule(edition,events,generated.athletes)
  const archive=[...(priorState?.athleteArchive||[]),...generated.newlyRetired]
    .sort((a,b)=>scoreMedals(b.careerMedals)-scoreMedals(a.careerMedals)||b.baseSkill-a.baseSkill)
    .filter((a,index,arr)=>arr.findIndex(x=>x.id===a.id)===index).slice(0,2500)
  return {
    version:2,seed,edition,currentDay:1,phase:'qualification',events,athletes:generated.athletes,careerPool:generated.careerPool,athleteArchive:archive,schedule,results:[],records:priorState?.records||[],news:[{id:`opening-${edition.year}`,day:0,category:'Olympiad Preview',headline:`${edition.flag} ${edition.host} prepares to welcome the Olympic world`,body:`${edition.nations} delegations, ${edition.athletes.toLocaleString()} athletes and ${edition.events} medal events define this edition. ${programmeChanges(edition.year).added.length} events have entered the programme since the previous Games.`,sportId:null,countryCode:null}],investments,medalTable:[],history:priorState?.history||[],programmeChanges:programmeChanges(edition.year)
  }
}

export function createInitialState(seed=18960406,demoDays=0) {
  let state=buildStateForEdition({edition:getEditionBlueprint(1896),seed})
  if (demoDays>0) {
    state=finalizeQualification(state)
    for(let day=1;day<=demoDays;day+=1) state=simulateDay(state,day)
  }
  return state
}

function historyEntryFromState(state) {
  const medalTable=state.medalTable
  const countryStats=delegationStats(state).map(row=>({ ...row, ...(medalTable.find(m=>m.countryCode===row.countryCode)||{gold:0,silver:0,bronze:0,total:0}) }))
  const topAthletes=[...state.athletes].sort((a,b)=>scoreMedals(b.medals)-scoreMedals(a.medals)||b.currentRating-a.currentRating).slice(0,12).map(a=>({id:a.id,name:a.name,countryCode:a.countryCode,sportId:a.sportId,medals:a.medals,careerMedals:a.careerMedals,age:a.age,rarity:a.rarity,currentRating:a.currentRating}))
  const medalResults=state.results.map((result)=>{
    const event=state.events.find(item=>item.id===result.eventId)
    return {eventId:result.eventId,eventKey:result.eventKey,eventName:event?.name||'Historic event',sportId:result.sportId,day:result.day,podium:result.podium.map(medalist=>({medal:medalist.medal,place:medalist.place,countryCode:medalist.countryCode,athleteId:medalist.athleteId,displayName:medalist.displayName||state.athletes.find(a=>a.id===medalist.athleteId)?.name||countryByCode(medalist.countryCode).name,value:medalist.value}))}
  })
  return {edition:state.edition,medalTable,recordsSet:state.records.filter(r=>r.year===state.edition.year).length,resultsCount:state.results.length,topAthletes,countryStats,programmeChanges:state.programmeChanges,medalResults}
}

export function advanceToNextEdition(state) {
  const completed=state.phase==='complete'?state:simulateToEnd({...state,phase:'games'})
  const historyEntry=historyEntryFromState(completed)
  const currentIndex=editionBlueprints.findIndex(e=>e.year===completed.edition.year)
  let nextIndex=currentIndex+1
  while(currentIndex >= 0 && nextIndex<editionBlueprints.length && editionBlueprints[nextIndex].status==='cancelled') nextIndex+=1
  const nextEdition=currentIndex >= 0 && nextIndex<editionBlueprints.length ? editionBlueprints[nextIndex] : makeFutureEdition(completed)
  const prior={...completed,history:[...completed.history,historyEntry]}
  return buildStateForEdition({edition:nextEdition,seed:completed.seed+1009,priorState:prior})
}

export function delegationStats(state) {
  const map=new Map()
  state.athletes.forEach((athlete)=>{
    const row=map.get(athlete.countryCode)||{countryCode:athlete.countryCode,athletes:0,sports:new Set(),generational:0,legend:0,epic:0,returning:0,averageRating:0}
    row.athletes+=1;row.sports.add(athlete.sportId);row.averageRating+=athlete.currentRating
    if(['generational','legend','epic'].includes(athlete.rarity)) row[athlete.rarity]+=1
    if(athlete.appearances>1) row.returning+=1
    map.set(athlete.countryCode,row)
  })
  return [...map.values()].map(row=>({...row,sports:row.sports.size,averageRating:round(row.averageRating/row.athletes,1)})).sort((a,b)=>b.athletes-a.athletes)
}

export function getRecordRows(state) {
  return state.records.map((record)=>{
    const event=state.events.find(item=>item.recordKey===record.eventKey)||{id:record.eventId,recordKey:record.eventKey,name:record.eventName,metric:record.eventMetric,unit:record.eventUnit,benchmark:record.eventBaseline,sportId:record.sportId,decimals:record.eventMetric==='time'?2:record.eventMetric==='distance'?2:0}
    const athlete=state.athletes.find(item=>item.id===record.athleteId)||state.careerPool.find(item=>item.id===record.athleteId)||state.athleteArchive.find(item=>item.id===record.athleteId)||{id:record.athleteId,name:record.athleteName,countryCode:record.countryCode}
    const successors=state.records.filter(item=>item.eventKey===record.eventKey && item.type===record.type && (item.year>record.year || (item.year===record.year && item.id!==record.id)))
      .sort((a,b)=>a.year-b.year)
    const next=successors[0]
    const endYear=next?.year||state.edition.year
    return {...record,event,athlete,duration:Math.max(0,endYear-record.year),standing:!next}
  })
}

export function finalizeQualification(state) {
  const returning=state.athletes.filter(a=>a.appearances>1).length
  const debutants=state.athletes.length-returning
  return {...state,phase:'games',currentDay:1,news:[{id:`qualification-${state.edition.year}`,day:0,category:'Qualification Complete',headline:`${state.edition.nations} delegations are ready for ${state.edition.host}`,body:`${state.athletes.length.toLocaleString()} athletes have secured places. ${returning.toLocaleString()} return from a previous Games and ${debutants.toLocaleString()} make their Olympic debut.`,sportId:null,countryCode:null},...state.news]}
}
