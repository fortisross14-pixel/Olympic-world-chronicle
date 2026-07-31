import React, { useEffect, useMemo, useState } from 'react'
import { Icon } from './Icons.jsx'
import {
  advanceToNextEdition,
  countryByCode,
  createInitialState,
  delegationStats,
  finalizeQualification,
  formatPerformance,
  getRecordRows,
  simulateDay,
  simulateToEnd,
  sportById,
} from './engine.js'
import { editionBlueprints, sportCatalog } from './data.js'
import { clearGame, loadGame, saveGame } from './storage.js'


const navItems = [
  ['home', 'Overview', 'home'],
  ['qualification', 'Qualification', 'flag'],
  ['games', 'Olympic Games', 'calendar'],
  ['programme', 'Programme', 'medal'],
  ['medals', 'Medal Table', 'podium'],
  ['countries', 'Countries', 'globe'],
  ['athletes', 'Athletes', 'users'],
  ['records', 'Records', 'record'],
  ['almanac', 'Almanac', 'book'],
]

const rarityLabels = {
  generational: 'Generational',
  legend: 'Legend',
  epic: 'Epic',
  rare: 'Rare',
  uncommon: 'Uncommon',
  common: 'Common',
}

function medalScore(medals = {}) {
  return (medals.gold || 0) * 5 + (medals.silver || 0) * 3 + (medals.bronze || 0)
}

function App() {
  const [state, setState] = useState(() => createInitialState())
  const [hydrated, setHydrated] = useState(false)
  const [page, setPage] = useState('home')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [selectedAthlete, setSelectedAthlete] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    loadGame()
      .then((saved) => {
        if (active && saved) setState(saved)
      })
      .finally(() => {
        if (active) setHydrated(true)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveGame(state)
  }, [state, hydrated])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 2400)
    return () => clearTimeout(timer)
  }, [toast])

  const runDay = () => {
    if (state.phase === 'complete') return
    setState((current) => simulateDay(current, current.currentDay))
    setToast(`Day ${state.currentDay} simulated`)
  }

  const runToEnd = () => {
    if (state.phase === 'complete') return
    setState((current) => simulateToEnd(current))
    setToast(`${state.edition.host} ${state.edition.year} completed`)
  }

  const nextEdition = () => {
    setState((current) => advanceToNextEdition(current))
    setPage('home')
    setToast('New Olympiad generated')
  }

  const resetUniverse = () => {
    clearGame()
    const fresh = createInitialState(Date.now() % 2147483647, 0)
    setState(fresh)
    setPage('home')
    setToast('New 1896 universe created')
  }

  const activeAthlete = state.athletes.find((athlete) => athlete.id === selectedAthlete) || state.careerPool?.find((athlete) => athlete.id === selectedAthlete) || state.athleteArchive?.find((athlete) => athlete.id === selectedAthlete)
  const activeCountry = selectedCountry ? countryByCode(selectedCountry) : null
  const activeEvent = state.events.find((event) => event.id === selectedEvent)

  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        setPage={setPage}
        open={mobileMenu}
        close={() => setMobileMenu(false)}
        edition={state.edition}
      />

      <main className="main-shell">
        <TopBar
          state={state}
          page={page}
          openMenu={() => setMobileMenu(true)}
          runDay={runDay}
          runToEnd={runToEnd}
          nextEdition={nextEdition}
          resetUniverse={resetUniverse}
          beginGames={() => { setState((current) => finalizeQualification(current)); setPage('games'); setToast('Qualification complete — the Games begin') }}
        />

        <div className="content-shell">
          {page === 'home' && (
            <Overview
              state={state}
              setPage={setPage}
              setSelectedAthlete={setSelectedAthlete}
              setSelectedCountry={setSelectedCountry}
              setSelectedEvent={setSelectedEvent}
            />
          )}
          {page === 'qualification' && <QualificationView state={state} setSelectedCountry={setSelectedCountry} setSelectedAthlete={setSelectedAthlete} />}
          {page === 'games' && (
            <GamesView
              state={state}
              setSelectedEvent={setSelectedEvent}
              setSelectedAthlete={setSelectedAthlete}
            />
          )}
          {page === 'programme' && <ProgrammeView state={state} setSelectedEvent={setSelectedEvent} />}
          {page === 'medals' && <MedalView state={state} setSelectedCountry={setSelectedCountry} setSelectedAthlete={setSelectedAthlete} setSelectedEvent={setSelectedEvent} />}
          {page === 'countries' && <CountriesView state={state} setSelectedCountry={setSelectedCountry} />}
          {page === 'athletes' && <AthletesView state={state} setSelectedAthlete={setSelectedAthlete} />}
          {page === 'records' && <RecordsView state={state} setSelectedAthlete={setSelectedAthlete} setSelectedEvent={setSelectedEvent} />}
          {page === 'almanac' && <AlmanacView state={state} />}
        </div>
      </main>

      {activeAthlete && (
        <AthleteModal athlete={activeAthlete} state={state} close={() => setSelectedAthlete(null)} />
      )}
      {activeCountry && (
        <CountryModal country={activeCountry} state={state} close={() => setSelectedCountry(null)} />
      )}
      {activeEvent && (
        <EventModal event={activeEvent} state={state} close={() => setSelectedEvent(null)} setSelectedAthlete={setSelectedAthlete} />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function Sidebar({ page, setPage, open, close, edition }) {
  return (
    <>
      {open && <button className="mobile-scrim" aria-label="Close navigation" onClick={close} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <span /><span /><span /><span /><span />
          </div>
          <div>
            <div className="brand-name">Olympics</div>
            <div className="brand-subtitle">CHRONICLE</div>
          </div>
        </div>

        <div className="edition-chip">
          <span className="edition-flag">{edition.flag}</span>
          <span><b>{edition.host} {edition.year}</b><small>Games of the Olympiad</small></span>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map(([id, label, icon]) => (
            <button
              key={id}
              className={page === id ? 'active' : ''}
              onClick={() => { setPage(id); close() }}
            >
              <Icon name={icon} size={19} />
              <span>{label}</span>
              {page === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="era-label">Historical simulation</div>
          <strong>1896 → procedural future</strong>
          <small>Programmes, records and nations evolve by edition.</small>
        </div>
      </aside>
    </>
  )
}

function TopBar({ state, page, openMenu, runDay, runToEnd, nextEdition, resetUniverse, beginGames }) {
  const pageLabel = navItems.find(([id]) => id === page)?.[1] || 'Overview'
  const currentDay = state.phase === 'complete' ? 'Complete' : state.phase === 'qualification' ? 'Qualification phase' : `Day ${state.currentDay} of ${state.edition.days}`
  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="icon-button menu-button" onClick={openMenu} aria-label="Open navigation"><Icon name="menu" /></button>
        <div>
          <span className="eyebrow">{state.edition.host} {state.edition.year}</span>
          <h1>{pageLabel}</h1>
        </div>
      </div>
      <div className="simulation-strip">
        <div className={`day-status ${state.phase}`}>
          <Icon name={state.phase === 'complete' ? 'trophy' : 'clock'} size={17} />
          <span>{currentDay}</span>
        </div>
        {state.phase === 'qualification' ? (
          <button className="primary-action" onClick={beginGames}><Icon name="flag" size={17} /> Begin Olympic Games</button>
        ) : state.phase !== 'complete' ? (
          <>
            <button className="secondary-action" onClick={runDay}><Icon name="play" size={17} /> Simulate day</button>
            <button className="primary-action" onClick={runToEnd}><Icon name="fast" size={17} /> End of Games</button>
          </>
        ) : (
          <button className="primary-action" onClick={nextEdition}><Icon name="chevron" size={17} /> Next Olympiad</button>
        )}
        <button className="icon-button desktop-reset" onClick={resetUniverse} title="Start a new universe" aria-label="Start a new universe"><Icon name="reset" size={18} /></button>
      </div>
    </header>
  )
}

function Overview({ state, setPage, setSelectedAthlete, setSelectedCountry, setSelectedEvent }) {
  const delegations = delegationStats(state)
  const completed = state.results.length
  const totalMedals = state.medalTable.reduce((sum, row) => sum + row.total, 0)
  const recordRows = getRecordRows(state)
  const stars = [...state.athletes]
    .sort((a, b) => medalScore(b.medals) - medalScore(a.medals) || b.currentRating - a.currentRating)
    .slice(0, 5)
  const today = state.schedule.filter((item) => item.day === Math.min(state.currentDay, state.edition.days))
  const finalsToday = today.filter((item) => item.isFinal)

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="hero-kicker"><Icon name="sparkles" size={17} /> A living history from 1896</div>
          <h2>{state.edition.host} writes the first chapter.</h2>
          <p>
            Follow every delegation, qualifying round, final, medal and record. The Olympic programme expands with history, countries redirect investment, and the athletes who define an era remain forever in the almanac.
          </p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => setPage(state.phase === 'qualification' ? 'qualification' : 'games')}><Icon name={state.phase === 'qualification' ? 'flag' : 'calendar'} size={17} /> {state.phase === 'qualification' ? 'Review qualification' : 'Open today’s programme'}</button>
            <button className="ghost-action" onClick={() => setPage('records')}><Icon name="record" size={17} /> Explore records</button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="flame"><span /><span /><span /></div>
          <div className="year-engraving">{state.edition.year}</div>
          <div className="host-engraving">{state.edition.host.toUpperCase()}</div>
          <div className="hero-rings"><i /><i /><i /><i /><i /></div>
        </div>
      </section>

      <section className="metric-grid four">
        <Metric icon="users" label="Qualified athletes" value={state.athletes.length.toLocaleString()} detail={`${delegations.length} national delegations`} />
        <Metric icon="medal" label="Medal events" value={`${completed}/${state.events.length}`} detail={`${finalsToday.length} finals on the current day`} />
        <Metric icon="podium" label="Medals awarded" value={totalMedals.toLocaleString()} detail={`${state.medalTable.length} countries on the table`} />
        <Metric icon="record" label="Records established" value={recordRows.length.toLocaleString()} detail={`${recordRows.filter((record) => record.type === 'WR').length} world records`} />
      </section>

      <div className="dashboard-grid main">
        <section className="panel daily-programme">
          <SectionTitle icon="calendar" title={state.phase === 'complete' ? 'Games complete' : `Day ${state.currentDay} programme`} action="Full calendar" onAction={() => setPage('games')} />
          {today.length ? (
            <div className="programme-list">
              {today.slice(0, 8).map((session) => {
                const event = state.events.find((item) => item.id === session.eventId)
                const sport = sportById(session.sportId)
                return (
                  <button key={session.id} className={`programme-row ${session.status}`} onClick={() => setSelectedEvent(event.id)}>
                    <div className="sport-icon"><Icon name={sport?.icon || 'medal'} size={20} /></div>
                    <div className="programme-main">
                      <span>{event?.name}</span>
                      <small>{sport?.name} · {session.stage}</small>
                    </div>
                    <div className="programme-meta">
                      <span>{session.session}</span>
                      {session.isFinal && <b>MEDAL</b>}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : <EmptyState icon="calendar" text="No sessions remain in this edition." />}
        </section>

        <section className="panel medal-preview">
          <SectionTitle icon="podium" title="Medal table" action="Full table" onAction={() => setPage('medals')} />
          <MiniMedalTable rows={state.medalTable.slice(0, 8)} setSelectedCountry={setSelectedCountry} />
        </section>
      </div>

      <div className="dashboard-grid lower">
        <section className="panel chronicle-panel">
          <SectionTitle icon="news" title="The Olympic Chronicle" />
          <div className="news-list">
            {state.news.slice(0, 6).map((story, index) => (
              <article className={index === 0 ? 'lead-story' : ''} key={story.id}>
                <div className="story-meta"><span>{story.category}</span><small>{story.day ? `Day ${story.day}` : 'Before the Games'}</small></div>
                <h3>{story.headline}</h3>
                <p>{story.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel stars-panel">
          <SectionTitle icon="star" title="Athletes of the Games" action="All athletes" onAction={() => setPage('athletes')} />
          <div className="star-list">
            {stars.map((athlete, index) => {
              const country = countryByCode(athlete.countryCode)
              const sport = sportById(athlete.sportId)
              return (
                <button key={athlete.id} onClick={() => setSelectedAthlete(athlete.id)}>
                  <span className="rank-number">{index + 1}</span>
                  <span className={`athlete-avatar rarity-${athlete.rarity}`}>{athlete.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                  <span className="athlete-line"><b>{athlete.name}</b><small>{country?.flag} {country?.name} · {sport?.name}</small></span>
                  <span className="mini-medals"><i>🥇 {athlete.medals.gold}</i><i>🥈 {athlete.medals.silver}</i><i>🥉 {athlete.medals.bronze}</i></span>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function QualificationView({ state, setSelectedCountry, setSelectedAthlete }) {
  const [sportFilter, setSportFilter] = useState('all')
  const delegations = delegationStats(state)
  const qualifiedSports = [...new Set(state.athletes.map((athlete) => athlete.sportId))].map(sportById).filter(Boolean)
  const sportRows = qualifiedSports.map((sport) => {
    const athletes = state.athletes.filter((athlete) => athlete.sportId === sport.id)
    return {
      sport,
      athletes: athletes.length,
      nations: new Set(athletes.map((athlete) => athlete.countryCode)).size,
      elite: athletes.filter((athlete) => ['generational','legend','epic'].includes(athlete.rarity)).length,
    }
  }).sort((a, b) => b.athletes - a.athletes)
  const stars = [...state.athletes].sort((a, b) => b.currentRating - a.currentRating).slice(0, 10)
  const visibleDelegations = delegations.filter((row) => sportFilter === 'all' || state.athletes.some((athlete) => athlete.countryCode === row.countryCode && athlete.sportId === sportFilter))

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">Road to {state.edition.host}</span><h2>Olympic qualification</h2><p>The years between Games are compressed into qualification outcomes: standards, rankings, continental quotas, tournaments, host places and universality entries determine the final delegations.</p></div>
        <div className="heading-badge"><Icon name="flag" /><span><b>{state.athletes.length}</b><small>places awarded</small></span></div>
      </section>

      <section className="metric-grid four">
        <Metric icon="globe" label="Qualified nations" value={delegations.length} detail={`${state.edition.nations} historical target`} />
        <Metric icon="users" label="Qualified athletes" value={state.athletes.length.toLocaleString()} detail={`Target field: ${state.edition.athletes.toLocaleString()}`} />
        <Metric icon="medal" label="Sports represented" value={qualifiedSports.length} detail={`${state.edition.events} medal events`} />
        <Metric icon="star" label="Elite qualifiers" value={stars.filter((athlete) => ['generational','legend','epic'].includes(athlete.rarity)).length} detail="Generational, Legend and Epic" />
      </section>

      <section className="qualification-models">
        {[['record','Standards & rankings','Athletics, swimming, judo, tennis and similar sports allocate places through marks or ranking lists.'],['trophy','Qualification tournaments','Team sports and combat events use world and continental qualification tournaments.'],['globe','Continental quotas','Regional places protect global representation without making every field equally strong.'],['flag','Host & universality','Host entries and limited universality places ensure the Games remain genuinely worldwide.']].map(([icon,title,text]) => <article key={title}><span><Icon name={icon} /></span><h3>{title}</h3><p>{text}</p></article>)}
      </section>

      <div className="dashboard-grid main qualification-grid">
        <section className="panel">
          <SectionTitle icon="globe" title="Largest delegations" />
          <div className="qualification-filter"><label><span>Filter by sport</span><select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}><option value="all">All sports</option>{qualifiedSports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label></div>
          <div className="delegation-ranking">
            {visibleDelegations.slice(0, 18).map((row, index) => { const country = countryByCode(row.countryCode); const investment = state.investments.find((item) => item.countryCode === row.countryCode); return <button key={row.countryCode} onClick={() => setSelectedCountry(row.countryCode)}><span className="table-rank">{index + 1}</span><span className="qualification-country"><b>{country?.flag} {country?.name}</b><small>{row.sports} sports · facilities {investment?.facilities || 0}</small></span><span className="delegation-total"><b>{row.athletes}</b><small>athletes</small></span><span className="qualification-bar"><i style={{ width: `${Math.min(100, row.athletes / Math.max(1, visibleDelegations[0]?.athletes) * 100)}%` }} /></span></button> })}
          </div>
        </section>
        <section className="panel">
          <SectionTitle icon="medal" title="Qualification by sport" />
          <div className="sport-qualification-list">{sportRows.map((row) => <div key={row.sport.id}><span className="sport-icon"><Icon name={row.sport.icon || 'medal'} /></span><span><b>{row.sport.name}</b><small>{row.nations} nations</small></span><span><b>{row.athletes}</b><small>athletes</small></span><span><b>{row.elite}</b><small>elite</small></span></div>)}</div>
        </section>
      </div>

      <section className="panel">
        <SectionTitle icon="star" title="Stars who qualified" />
        <div className="qualified-stars">{stars.map((athlete) => { const country = countryByCode(athlete.countryCode); const sport = sportById(athlete.sportId); return <button key={athlete.id} onClick={() => setSelectedAthlete(athlete.id)}><span className={`athlete-avatar rarity-${athlete.rarity}`}>{athlete.name.split(' ').map((part) => part[0]).slice(0,2).join('')}</span><span><b>{athlete.name}</b><small>{country?.flag} {country?.name} · {sport?.name}</small></span><span className={`rarity-badge ${athlete.rarity}`}>{rarityLabels[athlete.rarity]}</span><strong>{athlete.currentRating}</strong></button> })}</div>
      </section>
    </div>
  )
}

function GamesView({ state, setSelectedEvent, setSelectedAthlete }) {
  const [day, setDay] = useState(Math.min(state.currentDay, state.edition.days))
  const [sportFilter, setSportFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')

  useEffect(() => setDay(Math.min(state.currentDay, state.edition.days)), [state.currentDay, state.edition.days])

  const availableSports = useMemo(() => {
    const ids = [...new Set(state.schedule.map((session) => session.sportId))]
    return ids.map(sportById).filter(Boolean)
  }, [state.schedule])

  const sessions = state.schedule.filter((session) => (
    session.day === day &&
    (sportFilter === 'all' || session.sportId === sportFilter) &&
    (stageFilter === 'all' || (stageFilter === 'medals' ? session.isFinal : !session.isFinal))
  ))

  const medalEvents = state.results.filter((result) => result.day === day)

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">The Olympic programme</span><h2>Competition calendar</h2><p>Qualifying rounds, heats, brackets and medal finals are processed through the complete schedule—even when the whole Games are simulated at once.</p></div>
        <div className="heading-badge"><Icon name="calendar" /><span><b>{state.edition.days}</b><small>competition days</small></span></div>
      </section>

      <div className="day-tabs" role="tablist" aria-label="Olympic days">
        {Array.from({ length: state.edition.days }, (_, index) => index + 1).map((item) => {
          const completed = item < state.currentDay || state.phase === 'complete'
          const medalCount = state.schedule.filter((session) => session.day === item && session.isFinal).length
          return (
            <button key={item} className={`${day === item ? 'active' : ''} ${completed ? 'completed' : ''}`} onClick={() => setDay(item)}>
              <span>DAY</span><b>{item}</b><small>{medalCount} finals</small>
            </button>
          )
        })}
      </div>

      <section className="panel filters-panel">
        <label><span>Sport</span><select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}><option value="all">All sports</option>{availableSports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label>
        <label><span>Session type</span><select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="all">All rounds</option><option value="qualifying">Qualifying rounds</option><option value="medals">Medal events</option></select></label>
        <div className="filter-summary"><Icon name="filter" size={17} /><span>{sessions.length} scheduled sessions</span></div>
      </section>

      <div className="session-columns">
        {['Morning', 'Afternoon', 'Evening'].map((sessionName) => (
          <section className="session-column" key={sessionName}>
            <div className="session-heading"><span>{sessionName}</span><small>{sessions.filter((session) => session.session === sessionName).length} events</small></div>
            <div className="session-list">
              {sessions.filter((session) => session.session === sessionName).map((session) => {
                const event = state.events.find((item) => item.id === session.eventId)
                const sport = sportById(session.sportId)
                const result = state.results.find((item) => item.eventId === session.eventId)
                const winner = result ? state.athletes.find((athlete) => athlete.id === result.podium[0]?.athleteId) : null
                const winnerCountry = winner ? countryByCode(winner.countryCode) : null
                return (
                  <button className={`session-card ${session.status}`} key={session.id} onClick={() => setSelectedEvent(session.eventId)}>
                    <div className="session-card-top"><span className="sport-icon"><Icon name={sport?.icon || 'medal'} size={19} /></span><small>{sport?.name}</small>{session.isFinal && <b>MEDAL</b>}</div>
                    <h3>{event?.name}</h3>
                    <div className="round-label">{session.stage}</div>
                    {winner && session.isFinal ? (
                      <div className="winner-line" onClick={(e) => { e.stopPropagation(); setSelectedAthlete(winner.id) }}>
                        <span>🥇</span><span><b>{winner.name}</b><small>{winnerCountry?.flag} {winnerCountry?.name}</small></span>
                      </div>
                    ) : (
                      <div className={`session-status ${session.status}`}><span />{session.status === 'completed' ? 'Completed' : day === state.currentDay ? 'Today' : 'Scheduled'}</div>
                    )}
                  </button>
                )
              })}
              {!sessions.some((session) => session.session === sessionName) && <div className="empty-session">No matching sessions</div>}
            </div>
          </section>
        ))}
      </div>

      {medalEvents.length > 0 && (
        <section className="panel">
          <SectionTitle icon="medal" title={`Day ${day} medal results`} />
          <div className="results-grid">
            {medalEvents.map((result) => {
              const event = state.events.find((item) => item.id === result.eventId)
              return <ResultCard key={result.id} result={result} event={event} state={state} setSelectedAthlete={setSelectedAthlete} setSelectedEvent={setSelectedEvent} />
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function MedalView({ state, setSelectedCountry, setSelectedAthlete, setSelectedEvent }) {
  const [mode, setMode] = useState('table')
  const [sort, setSort] = useState('gold')
  const [search, setSearch] = useState('')
  const [editionFilter, setEditionFilter] = useState('all')
  const [sportFilter, setSportFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [eventSearch, setEventSearch] = useState('')
  const delegations = delegationStats(state)
  const rows = [...state.medalTable]
    .filter((row) => countryByCode(row.countryCode)?.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'total' ? b.total - a.total || b.gold - a.gold : b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)

  const currentMedals = state.results.map((result) => {
    const event = state.events.find((item) => item.id === result.eventId)
    return { year: state.edition.year, host: state.edition.host, eventId: result.eventId, eventKey: result.eventKey, eventName: event?.name || 'Event', sportId: result.sportId, podium: result.podium }
  })
  const archiveMedals = state.history.flatMap((entry) => (entry.medalResults || []).map((result) => ({ ...result, year: entry.edition.year, host: entry.edition.host })))
  const medalArchive = [...archiveMedals, ...currentMedals]
  const editionOptions = [...new Set(medalArchive.map((result) => result.year))].sort((a, b) => b - a)
  const sportOptions = [...new Set(medalArchive.map((result) => result.sportId))].map(sportById).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
  const countryOptions = [...new Set(medalArchive.flatMap((result) => result.podium.map((row) => row.countryCode)))].map(countryByCode).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
  const archiveRows = medalArchive
    .filter((result) => editionFilter === 'all' || result.year === Number(editionFilter))
    .filter((result) => sportFilter === 'all' || result.sportId === sportFilter)
    .filter((result) => countryFilter === 'all' || result.podium.some((row) => row.countryCode === countryFilter))
    .filter((result) => result.eventName.toLowerCase().includes(eventSearch.toLowerCase()))
    .sort((a, b) => b.year - a.year || sportById(a.sportId).name.localeCompare(sportById(b.sportId).name) || a.eventName.localeCompare(b.eventName))

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">National performance and every medalist</span><h2>Olympic medals</h2><p>Use the medal table for the current edition or search the permanent medal archive by edition, country, sport and event.</p></div>
        <div className="heading-badge"><Icon name="podium" /><span><b>{medalArchive.length}</b><small>completed medal events</small></span></div>
      </section>
      <div className="view-switch"><button className={mode === 'table' ? 'active' : ''} onClick={() => setMode('table')}><Icon name="podium" size={16} /> Current medal table</button><button className={mode === 'archive' ? 'active' : ''} onClick={() => setMode('archive')}><Icon name="book" size={16} /> Medal archive</button></div>

      {mode === 'table' ? <>
        <section className="panel filters-panel">
          <label className="search-label"><span>Find country</span><div><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search delegation" /></div></label>
          <label><span>Ranking</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="gold">Gold-first ranking</option><option value="total">Total medals</option></select></label>
        </section>
        <section className="panel table-panel">
          <div className="responsive-table"><table><thead><tr><th>Rank</th><th>Country</th><th className="number">Athletes</th><th className="number gold">Gold</th><th className="number silver">Silver</th><th className="number bronze">Bronze</th><th className="number">Total</th><th className="number">Per 100 athletes</th></tr></thead><tbody>
            {rows.map((row, index) => { const country = countryByCode(row.countryCode); const delegation = delegations.find((item) => item.countryCode === row.countryCode); const efficiency = delegation ? row.total / delegation.athletes * 100 : 0; return <tr key={row.countryCode} onClick={() => setSelectedCountry(row.countryCode)}><td><span className={`table-rank ${index < 3 ? `top-${index + 1}` : ''}`}>{index + 1}</span></td><td><span className="country-cell"><b>{country?.flag}</b><span><strong>{country?.name}</strong><small>{delegation?.sports || 0} sports</small></span></span></td><td className="number">{delegation?.athletes || 0}</td><td className="number medal-number">{row.gold}</td><td className="number medal-number">{row.silver}</td><td className="number medal-number">{row.bronze}</td><td className="number total-number">{row.total}</td><td className="number">{efficiency.toFixed(1)}</td></tr> })}
          </tbody></table></div>
          {!rows.length && <EmptyState icon="podium" text="No medals have been awarded yet." />}
        </section>
      </> : <>
        <section className="panel records-filters medal-archive-filters">
          <label><span>Edition</span><select value={editionFilter} onChange={(event) => setEditionFilter(event.target.value)}><option value="all">All editions</option>{editionOptions.map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
          <label><span>Sport</span><select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}><option value="all">All sports</option>{sportOptions.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label>
          <label><span>Country</span><select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}><option value="all">All countries</option>{countryOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
          <label className="search-label"><span>Event</span><div><Icon name="search" size={17} /><input value={eventSearch} onChange={(event) => setEventSearch(event.target.value)} placeholder="Search event" /></div></label>
        </section>
        <section className="panel table-panel">
          <div className="responsive-table medal-archive-table"><table><thead><tr><th>Edition</th><th>Event</th><th>Gold</th><th>Silver</th><th>Bronze</th></tr></thead><tbody>
            {archiveRows.slice(0, 500).map((result) => <tr key={`${result.year}-${result.eventId}`}><td><b>{result.year}</b><small className="table-subline">{result.host}</small></td><td><button className="text-button" onClick={() => { if (result.year === state.edition.year) setSelectedEvent(result.eventId) }}>{result.eventName}</button><small className="table-subline">{sportById(result.sportId)?.name}</small></td>{['gold','silver','bronze'].map((medal) => { const winner = result.podium.find((row) => row.medal === medal); const country = countryByCode(winner?.countryCode); return <td key={medal}>{winner ? <button className="archive-medalist" onClick={() => winner.athleteId && setSelectedAthlete(winner.athleteId)}><span>{medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : '🥉'}</span><span><b>{winner.displayName || 'Olympic team'}</b><small>{country?.flag} {country?.name}</small></span></button> : '—'}</td> })}</tr>)}
          </tbody></table></div>
          {archiveRows.length > 500 && <div className="table-note">Showing 500 medal events. Refine the filters to narrow the archive.</div>}
          {!archiveRows.length && <EmptyState icon="medal" text="No medal events match these filters." />}
        </section>
      </>}
    </div>
  )
}

function CountriesView({ state, setSelectedCountry }) {
  const [sportFilter, setSportFilter] = useState('all')
  const [search, setSearch] = useState('')
  const stats = delegationStats(state)
  const rows = stats.filter((row) => {
    const country = countryByCode(row.countryCode)
    const investment = state.investments.find((item) => item.countryCode === row.countryCode)
    const matchesSearch = country?.name.toLowerCase().includes(search.toLowerCase())
    const matchesSport = sportFilter === 'all' || (investment?.allocations?.[sportFilter] || 0) > 0
    return matchesSearch && matchesSport
  })

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">Olympic nations</span><h2>Delegations & investment</h2><p>Funding, facilities, youth development and sporting tradition determine qualification depth and the chance to produce exceptional athletes over future cycles.</p></div>
        <div className="heading-badge"><Icon name="globe" /><span><b>{stats.length}</b><small>qualified countries</small></span></div>
      </section>
      <section className="panel filters-panel">
        <label className="search-label"><span>Country</span><div><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search countries" /></div></label>
        <label><span>Sport investment</span><select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}><option value="all">All sports</option>{sportCatalog.filter((sport) => sport.introduced <= state.edition.year).map((sport) => <option value={sport.id} key={sport.id}>{sport.name}</option>)}</select></label>
      </section>
      <div className="country-grid">
        {rows.map((row) => {
          const country = countryByCode(row.countryCode)
          const investment = state.investments.find((item) => item.countryCode === row.countryCode)
          const medals = state.medalTable.find((item) => item.countryCode === row.countryCode) || { gold: 0, silver: 0, bronze: 0, total: 0 }
          const focusNames = investment?.focusSports.map((id) => sportById(id)?.name).filter(Boolean) || []
          return (
            <button className="country-card" key={row.countryCode} onClick={() => setSelectedCountry(row.countryCode)}>
              <div className="country-card-head"><span className="large-flag">{country?.flag}</span><span><b>{country?.name}</b><small>{row.athletes} qualified athletes</small></span><span className={`trend ${investment?.trend === 'rising' ? 'up' : investment?.trend === 'falling' ? 'down' : ''}`}><Icon name={investment?.trend === 'rising' ? 'arrowUp' : investment?.trend === 'falling' ? 'arrowDown' : 'minus'} size={15} /></span></div>
              <div className="country-medals"><span><i>🥇</i><b>{medals.gold}</b></span><span><i>🥈</i><b>{medals.silver}</b></span><span><i>🥉</i><b>{medals.bronze}</b></span><span className="total"><small>Total</small><b>{medals.total}</b></span></div>
              <div className="investment-bars">
                <Progress label="Investment" value={investment?.overall || 0} />
                <Progress label="Facilities" value={investment?.facilities || 0} />
                <Progress label="Youth pathway" value={investment?.youth || 0} />
              </div>
              <div className="focus-line"><Icon name="target" size={15} /><span>{focusNames.join(' · ') || 'Developing programme'}</span></div>
              <div className="talent-line"><span>{row.generational} GEN</span><span>{row.legend} LEG</span><span>{row.epic} EPIC</span></div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function AthletesView({ state, setSelectedAthlete }) {
  const [search, setSearch] = useState('')
  const [sportFilter, setSportFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [rarityFilter, setRarityFilter] = useState('all')
  const [sort, setSort] = useState('medals')
  const [statusFilter, setStatusFilter] = useState('qualified')
  const athleteSource = statusFilter === 'retired' ? (state.athleteArchive || []) : statusFilter === 'all' ? [...state.athletes, ...(state.athleteArchive || [])] : state.athletes

  const rows = [...athleteSource]
    .filter((athlete) => athlete.name.toLowerCase().includes(search.toLowerCase()))
    .filter((athlete) => sportFilter === 'all' || athlete.sportId === sportFilter)
    .filter((athlete) => countryFilter === 'all' || athlete.countryCode === countryFilter)
    .filter((athlete) => rarityFilter === 'all' || athlete.rarity === rarityFilter)
    .sort((a, b) => sort === 'skill' ? b.currentRating - a.currentRating : medalScore(b.medals) - medalScore(a.medals) || b.currentRating - a.currentRating)

  const qualifiedCountries = [...new Set(state.athletes.map((athlete) => athlete.countryCode))].map(countryByCode).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
  const qualifiedSports = [...new Set(state.athletes.map((athlete) => athlete.sportId))].map(sportById).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">The competitors</span><h2>Olympic athletes</h2><p>Every qualified athlete exists in the universe; medalists, finalists, records and elite rarities remain available for long-term historical tracking.</p></div>
        <div className="heading-badge"><Icon name="users" /><span><b>{athleteSource.length}</b><small>{statusFilter === 'retired' ? 'historic athletes' : 'Olympians'}</small></span></div>
      </section>
      <section className="panel athlete-filters">
        <label className="search-label"><span>Search</span><div><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Athlete name" /></div></label>
        <label><span>Sport</span><select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}><option value="all">All sports</option>{qualifiedSports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label>
        <label><span>Country</span><select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}><option value="all">All countries</option>{qualifiedCountries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
        <label><span>Rarity</span><select value={rarityFilter} onChange={(event) => setRarityFilter(event.target.value)}><option value="all">All rarities</option>{Object.entries(rarityLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="qualified">Current qualifiers</option><option value="retired">Notable retired</option><option value="all">Current + retired</option></select></label><label><span>Order</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="medals">Olympic performance</option><option value="skill">Current rating</option></select></label>
      </section>
      <section className="panel table-panel">
        <div className="responsive-table">
          <table>
            <thead><tr><th>Athlete</th><th>Country</th><th>Sport</th><th>Rarity</th><th className="number">Age</th><th className="number">Skill</th><th className="number">🥇</th><th className="number">🥈</th><th className="number">🥉</th></tr></thead>
            <tbody>
              {rows.slice(0, 150).map((athlete) => {
                const country = countryByCode(athlete.countryCode)
                const sport = sportById(athlete.sportId)
                return (
                  <tr key={athlete.id} onClick={() => setSelectedAthlete(athlete.id)}>
                    <td><span className="athlete-table-cell"><span className={`athlete-avatar rarity-${athlete.rarity}`}>{athlete.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</span><strong>{athlete.name}</strong></span></td>
                    <td>{country?.flag} {country?.name}</td><td><span className="sport-cell"><Icon name={sport?.icon || 'medal'} size={17} />{sport?.name}</span></td><td><span className={`rarity-badge ${athlete.rarity}`}>{rarityLabels[athlete.rarity]}</span></td><td className="number">{athlete.age}</td><td className="number"><b>{athlete.currentRating}</b><small className="table-subline">potential {athlete.baseSkill}</small></td><td className="number">{(athlete.status === 'retired' ? athlete.careerMedals : athlete.medals).gold}</td><td className="number">{(athlete.status === 'retired' ? athlete.careerMedals : athlete.medals).silver}</td><td className="number">{(athlete.status === 'retired' ? athlete.careerMedals : athlete.medals).bronze}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {rows.length > 150 && <div className="table-note">Showing the top 150 matching athletes for performance. Refine the filters to find others.</div>}
      </section>
    </div>
  )
}

function RecordsView({ state, setSelectedAthlete, setSelectedEvent }) {
  const [sportFilter, setSportFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [standingOnly, setStandingOnly] = useState(false)
  const rows = getRecordRows(state)
    .filter((record) => sportFilter === 'all' || record.sportId === sportFilter)
    .filter((record) => countryFilter === 'all' || record.countryCode === countryFilter)
    .filter((record) => eventFilter === 'all' || (record.eventKey || record.eventId) === eventFilter)
    .filter((record) => typeFilter === 'all' || record.type === typeFilter)
    .filter((record) => !standingOnly || record.standing)
    .sort((a, b) => b.year - a.year || a.event?.name.localeCompare(b.event?.name))

  const longest = [...getRecordRows(state)].sort((a, b) => b.duration - a.duration)[0]
  const availableSports = [...new Set(state.records.map((record) => record.sportId))].map(sportById).filter(Boolean)
  const availableCountries = [...new Set(state.records.map((record) => record.countryCode))].map(countryByCode).filter(Boolean)

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">Standards across time</span><h2>World & Olympic records</h2><p>Every record keeps its complete lineage: athlete, country, host edition, previous mark, replacement mark and exactly how many years it survived.</p></div>
        <div className="heading-badge"><Icon name="record" /><span><b>{state.records.length}</b><small>record entries</small></span></div>
      </section>

      <section className="metric-grid three">
        <Metric icon="record" label="Standing records" value={getRecordRows(state).filter((record) => record.standing).length} detail="Current WR and OR marks" />
        <Metric icon="clock" label="Longest reign" value={longest ? `${longest.duration} yrs` : '—'} detail={longest?.event?.name || 'No record history yet'} />
        <Metric icon="flag" label="Record nations" value={availableCountries.length} detail="Countries represented by record holders" />
      </section>

      <section className="panel records-filters">
        <label><span>Sport</span><select value={sportFilter} onChange={(event) => { setSportFilter(event.target.value); setEventFilter('all') }}><option value="all">All sports</option>{availableSports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label>
        <label><span>Event</span><select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}><option value="all">All events</option>{[...new Map(getRecordRows(state).filter((record) => sportFilter === 'all' || record.sportId === sportFilter).map((record) => [record.eventKey || record.eventId, record.event])).entries()].map(([key, event]) => <option key={key} value={key}>{event.name}</option>)}</select></label>
        <label><span>Country</span><select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}><option value="all">All countries</option>{availableCountries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
        <label><span>Type</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">WR and OR</option><option value="WR">World records</option><option value="OR">Olympic records</option></select></label>
        <label className="check-label"><input type="checkbox" checked={standingOnly} onChange={(event) => setStandingOnly(event.target.checked)} /><span>Standing only</span></label>
      </section>

      <section className="panel table-panel">
        <div className="responsive-table records-table">
          <table>
            <thead><tr><th>Record</th><th>Event</th><th>Performance</th><th>Athlete</th><th>Country</th><th>Set</th><th className="number">Duration</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((record) => {
                const country = countryByCode(record.countryCode)
                return (
                  <tr key={record.id}>
                    <td><span className={`record-type ${record.type.toLowerCase()}`}>{record.type}</span></td>
                    <td><button className="text-button" onClick={() => { const currentEvent = state.events.find((item) => (item.recordKey || item.id) === (record.eventKey || record.eventId)); if (currentEvent) setSelectedEvent(currentEvent.id) }}>{record.event?.name}</button><small className="table-subline">{sportById(record.sportId)?.name}</small></td>
                    <td><strong className="performance-value">{record.event ? formatPerformance(record.value, record.event) : record.value.toFixed(2)}</strong></td>
                    <td><button className="text-button" onClick={() => setSelectedAthlete(record.athleteId)}>{record.athlete?.name || 'Historic athlete'}</button></td>
                    <td>{country?.flag} {country?.name}</td><td>{record.host} {record.year}</td><td className="number"><b>{record.duration}</b> yrs</td><td><span className={`status-badge ${record.standing ? 'standing' : 'broken'}`}>{record.standing ? 'Standing' : 'Broken'}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState icon="record" text="No records match the selected filters." />}
      </section>
    </div>
  )
}

function ProgrammeView({ state, setSelectedEvent }) {
  const [sportFilter, setSportFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const [changeFilter, setChangeFilter] = useState('all')
  const addedKeys = new Set((state.programmeChanges?.added || []).map((event) => event.recordKey))
  const sports = [...new Set(state.events.map((event) => event.sportId))].map(sportById).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
  const rows = state.events
    .filter((event) => sportFilter === 'all' || event.sportId === sportFilter)
    .filter((event) => genderFilter === 'all' || event.gender === genderFilter)
    .filter((event) => changeFilter === 'all' || (changeFilter === 'new' ? addedKeys.has(event.recordKey) : !addedKeys.has(event.recordKey)))
    .sort((a, b) => sportById(a.sportId).name.localeCompare(sportById(b.sportId).name) || a.name.localeCompare(b.name))
  const bySport = sports.map((sport) => ({ sport, count: state.events.filter((event) => event.sportId === sport.id).length }))
  const previousYear = state.programmeChanges?.previousYear

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">Historically evolving medal programme</span><h2>{state.edition.host} {state.edition.year} programme</h2><p>Every listed event belongs to this edition. Events enter, disappear, change format and return as Olympic history advances; there are no generic “event slots.”</p></div>
        <div className="heading-badge"><Icon name="medal" /><span><b>{state.events.length}</b><small>medal events</small></span></div>
      </section>

      <section className="metric-grid four">
        <Metric icon="medal" label="Sports / disciplines" value={sports.length} detail={`${state.edition.events} medal decisions`} />
        <Metric icon="sparkles" label="Added events" value={state.programmeChanges?.added?.length || state.events.length} detail={previousYear ? `Since ${previousYear}` : 'Inaugural programme'} />
        <Metric icon="arrowDown" label="Removed events" value={state.programmeChanges?.removed?.length || 0} detail={previousYear ? `Not contested since ${previousYear}` : 'No prior Games'} />
        <Metric icon="record" label="Record events" value={state.events.filter((event) => event.recordEligible).length} detail="Timed, measured or scored marks" />
      </section>

      {(state.programmeChanges?.added?.length > 0 || state.programmeChanges?.removed?.length > 0) && (
        <section className="programme-change-grid">
          <article className="panel change-panel added"><SectionTitle icon="arrowUp" title="Entering the programme" /><div className="change-chip-list">{(state.programmeChanges?.added || []).slice(0, 18).map((event) => <span key={event.recordKey}><Icon name={sportById(event.sportId)?.icon || 'medal'} size={15} />{event.name}</span>)}</div>{(state.programmeChanges?.added?.length || 0) > 18 && <small>+{state.programmeChanges.added.length - 18} more additions</small>}</article>
          <article className="panel change-panel removed"><SectionTitle icon="arrowDown" title="Leaving the programme" /><div className="change-chip-list">{(state.programmeChanges?.removed || []).slice(0, 18).map((event) => <span key={event.recordKey}><Icon name={sportById(event.sportId)?.icon || 'medal'} size={15} />{event.name}</span>)}</div>{(state.programmeChanges?.removed?.length || 0) > 18 && <small>+{state.programmeChanges.removed.length - 18} more removals</small>}</article>
        </section>
      )}

      <section className="panel filters-panel programme-filters">
        <label><span>Sport</span><select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}><option value="all">All sports</option>{sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label>
        <label><span>Gender</span><select value={genderFilter} onChange={(event) => setGenderFilter(event.target.value)}><option value="all">All categories</option><option value="M">Men</option><option value="F">Women</option><option value="X">Mixed / open</option></select></label>
        <label><span>Programme status</span><select value={changeFilter} onChange={(event) => setChangeFilter(event.target.value)}><option value="all">All events</option><option value="new">New this edition</option><option value="existing">Continuing events</option></select></label>
      </section>

      <div className="programme-sport-strip">
        {bySport.slice(0, 16).map(({ sport, count }) => <button key={sport.id} className={sportFilter === sport.id ? 'active' : ''} onClick={() => setSportFilter(sportFilter === sport.id ? 'all' : sport.id)}><span className="sport-icon"><Icon name={sport.icon || 'medal'} size={18} /></span><span><b>{sport.name}</b><small>{count} events</small></span></button>)}
      </div>

      <section className="panel table-panel">
        <div className="responsive-table">
          <table>
            <thead><tr><th>Event</th><th>Sport</th><th>Category</th><th>Format</th><th>Records</th><th>Status</th></tr></thead>
            <tbody>{rows.map((event) => { const sport = sportById(event.sportId); return <tr key={event.id} onClick={() => setSelectedEvent(event.id)}><td><button className="text-button">{event.name}</button></td><td><span className="sport-cell"><Icon name={sport?.icon || 'medal'} size={17} />{sport?.name}</span></td><td>{event.gender === 'M' ? 'Men' : event.gender === 'F' ? 'Women' : 'Mixed / open'}</td><td>{event.team ? 'Team' : sport?.category}</td><td>{event.recordEligible ? `${event.metric.toUpperCase()} · ${event.unit}` : 'No WR/OR'}</td><td>{addedKeys.has(event.recordKey) ? <span className="status-badge standing">New</span> : <span className="status-badge">Continuing</span>}</td></tr> })}</tbody>
          </table>
        </div>
        {!rows.length && <EmptyState icon="medal" text="No events match these programme filters." />}
      </section>
    </div>
  )
}

function AlmanacView({ state }) {
  const history = [...state.history]
  if (state.phase === 'complete') {
    history.push({
      edition: state.edition,
      medalTable: state.medalTable,
      recordsSet: state.records.filter((record) => record.year === state.edition.year).length,
      resultsCount: state.results.length,
      topAthletes: [...state.athletes].sort((a, b) => medalScore(b.medals) - medalScore(a.medals)).slice(0, 5),
    })
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">The complete Olympic archive</span><h2>Historical almanac</h2><p>Held and cancelled Olympiads remain in one continuous timeline. Programme size, participation, gender balance and records evolve with the world.</p></div>
        <div className="heading-badge"><Icon name="book" /><span><b>{editionBlueprints.length}</b><small>historical blueprints</small></span></div>
      </section>

      <section className="panel timeline-panel">
        <SectionTitle icon="calendar" title="Evolution of the Summer Games" />
        <div className="edition-timeline">
          {editionBlueprints.map((edition) => {
            const played = history.find((item) => item.edition.year === edition.year)
            const current = state.edition.year === edition.year
            return (
              <div key={edition.year} className={`timeline-edition ${edition.status} ${played ? 'played' : ''} ${current ? 'current' : ''}`}>
                <div className="timeline-dot"><span /></div>
                <div className="timeline-card">
                  <div className="timeline-year"><b>{edition.year}</b>{edition.status === 'cancelled' && <span>Cancelled</span>}{current && <span>Current</span>}</div>
                  <div className="timeline-host">{edition.flag} {edition.host}</div>
                  {edition.status === 'cancelled' ? (
                    <p>{edition.reason}</p>
                  ) : (
                    <div className="timeline-stats"><span><b>{edition.events}</b> events</span><span><b>{edition.sports}</b> sports</span><span><b>{edition.athletes.toLocaleString()}</b> athletes</span><span><b>{edition.womenPct}%</b> women</span></div>
                  )}
                  {played && <div className="played-summary"><Icon name="trophy" size={15} /> {played.resultsCount} champions · {played.recordsSet} records</div>}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel programme-evolution">
        <SectionTitle icon="chart" title="Programme evolution" />
        <div className="evolution-chart" aria-label="Historical Olympic event count">
          {editionBlueprints.filter((edition) => edition.status !== 'cancelled').map((edition) => (
            <div className={`evolution-bar ${edition.year === state.edition.year ? 'current' : ''}`} key={edition.year} title={`${edition.host} ${edition.year}: ${edition.events} events`}>
              <span style={{ height: `${Math.max(5, edition.events / 4)}px` }} /><small>{edition.year % 16 === 0 || edition.year === 1896 || edition.year >= 2020 ? edition.year : ''}</small>
            </div>
          ))}
        </div>
        <div className="evolution-caption"><span><b>43</b> events at Athens 1896</span><span><b>329</b> events at Paris 2024</span><span><b>351</b> planned blueprint for Los Angeles 2028</span></div>
      </section>
    </div>
  )
}

function Metric({ icon, label, value, detail }) {
  return <div className="metric-card"><div className="metric-icon"><Icon name={icon} /></div><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>
}

function SectionTitle({ icon, title, action = null, onAction = null }) {
  return <div className="section-title"><div><Icon name={icon} size={19} /><h2>{title}</h2></div>{action && <button onClick={onAction}>{action}<Icon name="chevron" size={15} /></button>}</div>
}

function Progress({ label, value }) {
  return <div className="progress-row"><div><span>{label}</span><b>{value}</b></div><div className="progress-track"><span style={{ width: `${value}%` }} /></div></div>
}

function EmptyState({ icon, text }) {
  return <div className="empty-state"><Icon name={icon} size={30} /><span>{text}</span></div>
}

function MiniMedalTable({ rows, setSelectedCountry }) {
  return (
    <div className="mini-table">
      <div className="mini-table-head"><span>#</span><span>Country</span><span>🥇</span><span>🥈</span><span>🥉</span><span>Total</span></div>
      {rows.map((row, index) => {
        const country = countryByCode(row.countryCode)
        return <button key={row.countryCode} onClick={() => setSelectedCountry(row.countryCode)}><span>{index + 1}</span><span>{country?.flag} <b>{country?.name}</b></span><span>{row.gold}</span><span>{row.silver}</span><span>{row.bronze}</span><span><b>{row.total}</b></span></button>
      })}
      {!rows.length && <EmptyState icon="podium" text="The medal table is waiting for its first champion." />}
    </div>
  )
}

function ResultCard({ result, event, state, setSelectedAthlete, setSelectedEvent }) {
  const sport = sportById(result.sportId)
  return (
    <article className="result-card">
      <button className="result-card-head" onClick={() => setSelectedEvent(event.id)}><span className="sport-icon"><Icon name={sport?.icon || 'medal'} size={19} /></span><span><b>{event.name}</b><small>{sport?.name}</small></span><Icon name="chevron" size={16} /></button>
      <div className="podium-list">
        {result.podium.map((medalist) => {
          const athlete = state.athletes.find((item) => item.id === medalist.athleteId)
          const country = countryByCode(medalist.countryCode)
          return <button key={medalist.athleteId} onClick={() => setSelectedAthlete(medalist.athleteId)}><span className={`podium-medal ${medalist.medal}`}>{medalist.place}</span><span><b>{medalist.displayName || athlete?.name}</b><small>{country?.flag} {country?.name}</small></span><strong>{formatPerformance(medalist.value, event)}</strong></button>
        })}
      </div>
    </article>
  )
}

function ModalShell({ title, subtitle, close, children, icon = 'info' }) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label={title}>
      <button className="modal-scrim" onClick={close} aria-label="Close dialog" />
      <section className="modal-card">
        <div className="modal-head"><div className="modal-title-icon"><Icon name={icon} /></div><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={close} aria-label="Close"><Icon name="close" /></button></div>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  )
}

function AthleteModal({ athlete, state, close }) {
  const country = countryByCode(athlete.countryCode)
  const sport = sportById(athlete.sportId)
  const athleteRecords = state.records.filter((record) => record.athleteId === athlete.id)
  const careerResults = [...(athlete.careerResults || [])].sort((a, b) => b.year - a.year)
  const ratingHistory = athlete.ratingHistory || []
  const maxRating = Math.max(100, ...ratingHistory.map((row) => row.rating))
  const careerMedals = athlete.careerMedals || athlete.medals
  const yearsRemaining = Math.max(0, athlete.retirementAge - athlete.age)
  return (
    <ModalShell title={athlete.name} subtitle={`${country?.flag} ${country?.name} · ${sport?.name}`} close={close} icon="users">
      <div className="profile-hero">
        <div className={`profile-avatar rarity-${athlete.rarity}`}>{athlete.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div>
        <div className="profile-main"><span className={`rarity-badge ${athlete.rarity}`}>{rarityLabels[athlete.rarity]}</span><h3>{athlete.currentRating} current rating</h3><p>Age {athlete.age} · peak around {athlete.peakAge} · {athlete.status === 'retired' ? 'retired' : `${yearsRemaining} projected years remaining`}</p></div>
        <div className="profile-medals"><span>🥇<b>{careerMedals.gold}</b></span><span>🥈<b>{careerMedals.silver}</b></span><span>🥉<b>{careerMedals.bronze}</b></span></div>
      </div>
      <div className="modal-stat-grid four-stats"><Metric icon="chart" label="Current rating" value={athlete.currentRating} detail={`${athlete.currentRating >= athlete.baseSkill ? 'At' : 'Below'} full potential`} /><Metric icon="star" label="Career potential" value={athlete.baseSkill} detail="Fixed talent ceiling" /><Metric icon="calendar" label="Appearances" value={athlete.appearances} detail={(athlete.appearanceYears || []).join(' · ') || 'Olympic debut'} /><Metric icon="record" label="Records" value={athleteRecords.length} detail="WR and OR entries" /></div>

      <section className="modal-section"><h3>Career development</h3>
        <div className="career-curve" aria-label="Olympic rating history">
          {ratingHistory.map((row) => <div key={`${row.year}-${row.age}`} className={row.year === state.edition.year ? 'current' : ''}><span className="curve-value">{row.rating}</span><i style={{ height: `${Math.max(8, row.rating / maxRating * 112)}px` }} /><b>{row.year}</b><small>Age {row.age}</small></div>)}
          {!ratingHistory.length && <EmptyState icon="chart" text="No rating history has been recorded yet." />}
        </div>
        <div className="career-window"><span>Debut age <b>{athlete.careerStartAge}</b></span><span>Peak age <b>{athlete.peakAge}</b></span><span>Projected retirement <b>{athlete.retirementAge}</b></span><span>Career span <b>{athlete.retirementAge - athlete.careerStartAge} years</b></span></div>
      </section>

      <section className="modal-section"><h3>Olympic career</h3>{careerResults.length ? <div className="achievement-list">{careerResults.map((result, index) => <div key={`${result.year}-${result.eventKey}-${index}`}><span>{result.medal === 'gold' ? '🥇' : result.medal === 'silver' ? '🥈' : '🥉'}</span><span><b>{result.eventName}</b><small>{result.host} {result.year}{result.value != null ? ` · recorded performance` : ''}</small></span><strong className="career-edition">{result.year}</strong></div>)}</div> : <EmptyState icon="medal" text="No Olympic medals yet." />}</section>
      <section className="modal-section"><h3>Specialties this edition</h3><div className="change-chip-list">{(athlete.events || []).map((eventId) => { const event = state.events.find((item) => item.id === eventId); return event ? <span key={eventId}><Icon name={sport?.icon || 'medal'} size={15} />{event.name}</span> : null })}</div></section>
    </ModalShell>
  )
}

function CountryModal({ country, state, close }) {
  const investment = state.investments.find((item) => item.countryCode === country.code)
  const athletes = state.athletes.filter((athlete) => athlete.countryCode === country.code)
  const medals = state.medalTable.find((row) => row.countryCode === country.code) || { gold: 0, silver: 0, bronze: 0, total: 0 }
  const stars = [...athletes].sort((a, b) => medalScore(b.medals) - medalScore(a.medals) || b.currentRating - a.currentRating).slice(0, 8)
  const historyRows = state.history.map((entry) => {
    const row = entry.countryStats?.find((item) => item.countryCode === country.code)
    return row ? { year: entry.edition.year, host: entry.edition.host, ...row } : null
  }).filter(Boolean)
  if (athletes.length || medals.total) historyRows.push({ year: state.edition.year, host: state.edition.host, athletes: athletes.length, sports: new Set(athletes.map((athlete) => athlete.sportId)).size, ...medals })
  const allTime = historyRows.reduce((totals, row) => ({ gold: totals.gold + (row.gold || 0), silver: totals.silver + (row.silver || 0), bronze: totals.bronze + (row.bronze || 0), total: totals.total + (row.total || 0) }), { gold: 0, silver: 0, bronze: 0, total: 0 })
  return (
    <ModalShell title={country.name} subtitle={`${country.flag} National Olympic programme`} close={close} icon="globe">
      <div className="country-modal-hero"><span className="huge-flag">{country.flag}</span><div><h3>{athletes.length} qualified athletes</h3><p>{country.firstYear ? `Olympic history since ${country.firstYear}` : 'Olympic delegation'} · competing across {new Set(athletes.map((athlete) => athlete.sportId)).size} sports in {state.edition.year}</p></div><div className="profile-medals"><span>🥇<b>{allTime.gold}</b></span><span>🥈<b>{allTime.silver}</b></span><span>🥉<b>{allTime.bronze}</b></span></div></div>
      <div className="modal-stat-grid"><Metric icon="chart" label="Investment" value={investment?.overall || 0} detail={investment?.trend === 'rising' ? 'Programme rising' : investment?.trend === 'falling' ? 'Programme falling' : 'Stable programme'} /><Metric icon="country" label="Facilities" value={investment?.facilities || 0} detail="Training infrastructure" /><Metric icon="users" label="Youth pathway" value={investment?.youth || 0} detail="Future athlete production" /></div>
      <section className="modal-section"><h3>Priority sports</h3><div className="focus-sport-grid">{investment?.focusSports.map((sportId) => { const sport = sportById(sportId); return <div key={sportId}><span className="sport-icon"><Icon name={sport?.icon || 'medal'} /></span><span><b>{sport?.name}</b><small>Investment {investment.allocations[sportId]}</small></span></div> })}</div></section>
      <section className="modal-section"><h3>Olympic history</h3>{historyRows.length ? <div className="responsive-table compact-history"><table><thead><tr><th>Games</th><th className="number">Athletes</th><th className="number">Sports</th><th className="number">🥇</th><th className="number">🥈</th><th className="number">🥉</th><th className="number">Total</th></tr></thead><tbody>{historyRows.map((row) => <tr key={row.year}><td><b>{row.year}</b><small className="table-subline">{row.host}</small></td><td className="number">{row.athletes || 0}</td><td className="number">{row.sports || 0}</td><td className="number">{row.gold || 0}</td><td className="number">{row.silver || 0}</td><td className="number">{row.bronze || 0}</td><td className="number"><b>{row.total || 0}</b></td></tr>)}</tbody></table></div> : <EmptyState icon="book" text="This delegation has not yet appeared in the simulated history." />}</section>
      <section className="modal-section"><h3>Leading athletes</h3>{stars.length ? <div className="achievement-list">{stars.map((athlete) => <div key={athlete.id}><span className={`athlete-avatar rarity-${athlete.rarity}`}>{athlete.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><b>{athlete.name}</b><small>{sportById(athlete.sportId)?.name} · {rarityLabels[athlete.rarity]} · Rating {athlete.currentRating}</small></span></div>)}</div> : <EmptyState icon="users" text="No qualified athletes in the current edition." />}</section>
    </ModalShell>
  )
}

function EventModal({ event, state, close, setSelectedAthlete }) {
  const sport = sportById(event.sportId)
  const sessions = state.schedule.filter((session) => session.eventId === event.id)
  const result = state.results.find((item) => item.eventId === event.id)
  const records = getRecordRows(state).filter((record) => (record.eventKey || record.eventId) === (event.recordKey || event.id))
  return (
    <ModalShell title={event.name} subtitle={`${sport?.name} · ${state.edition.host} ${state.edition.year}`} close={close} icon={sport?.icon || 'medal'}>
      <div className="event-format"><span className="sport-icon large"><Icon name={sport?.icon || 'medal'} size={28} /></span><div><h3>{sport?.category?.toUpperCase()} competition engine</h3><p>{sessions.length} scheduled round{sessions.length === 1 ? '' : 's'} from qualification to the medal decision.</p></div></div>
      <div className="round-timeline">{sessions.map((session, index) => <div className={session.status} key={session.id}><span>{index + 1}</span><b>{session.stage}</b><small>Day {session.day} · {session.session}</small></div>)}</div>
      {result ? (
        <section className="modal-section"><h3>Final result</h3><div className="achievement-list podium-achievements">{result.podium.map((medalist) => { const athlete = state.athletes.find((item) => item.id === medalist.athleteId); const country = countryByCode(medalist.countryCode); return <button key={medalist.athleteId} onClick={() => { close(); setSelectedAthlete(medalist.athleteId) }}><span>{medalist.medal === 'gold' ? '🥇' : medalist.medal === 'silver' ? '🥈' : '🥉'}</span><span><b>{medalist.displayName || athlete?.name}</b><small>{country?.flag} {country?.name}</small></span><strong>{formatPerformance(medalist.value, event)}</strong></button> })}</div></section>
      ) : <EmptyState icon="clock" text="This event has not reached its final yet." />}
      <section className="modal-section"><h3>Record lineage</h3>{records.length ? <div className="record-lineage">{records.map((record) => <div key={record.id}><span className={`record-type ${record.type.toLowerCase()}`}>{record.type}</span><span><b>{formatPerformance(record.value, event)}</b><small>{record.athlete?.name} · {record.year} · {record.duration} years</small></span><span className={`status-badge ${record.standing ? 'standing' : 'broken'}`}>{record.standing ? 'Standing' : 'Broken'}</span></div>)}</div> : <EmptyState icon="record" text="The inaugural record will be established in the final." />}</section>
    </ModalShell>
  )
}

export default App
