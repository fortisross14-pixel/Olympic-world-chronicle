import React, { useEffect, useMemo, useState } from 'react'
import { Icon } from './Icons.jsx'
import {
  advanceHostSelection,
  beginHostSelection,
  confirmHostSelection,
  countryByCode,
  createInitialState,
  delegationStats,
  finalizeQualification,
  formatPerformance,
  getOlympiadArc,
  getRecordRows,
  getRivalryRows,
  simulateDay,
  simulateToEnd,
  sportById,
} from './engine.js'
import { sportCatalog } from './data.js'
import { clearGame, loadGame, saveGame } from './storage.js'


const navItems = [
  ['home', 'Overview', 'home'],
  ['magazine', 'Olympic Magazine', 'news'],
  ['host', 'Host Selection', 'trophy'],
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

function iso2FromFlag(flag = '') {
  const points = [...flag].map((char) => char.codePointAt(0))
  if (points.length !== 2 || points.some((point) => point < 0x1F1E6 || point > 0x1F1FF)) return null
  return points.map((point) => String.fromCharCode(point - 0x1F1E6 + 65)).join('').toLowerCase()
}

function CountryFlag({ country, className = '', size = 'normal' }) {
  if (!country) return <span className={`country-flag flag-fallback ${className}`}>—</span>
  const iso2 = iso2FromFlag(country.flag)
  if (!iso2) return <span className={`country-flag flag-fallback ${className} ${size}`}>{country.code}</span>
  return (
    <span className={`country-flag ${className} ${size}`} title={country.name}>
      <img
        src={`https://flagcdn.com/w40/${iso2}.png`}
        srcSet={`https://flagcdn.com/w80/${iso2}.png 2x`}
        alt={`${country.name} flag`}
        onError={(event) => {
          event.currentTarget.style.display = 'none'
          const fallback = event.currentTarget.nextElementSibling
          if (fallback) fallback.style.display = 'inline-flex'
        }}
      />
      <span className="country-flag-code">{country.code}</span>
    </span>
  )
}

function athleteById(state, id) {
  return state.athletes.find((athlete) => athlete.id === id)
    || state.careerPool?.find((athlete) => athlete.id === id)
    || state.athleteArchive?.find((athlete) => athlete.id === id)
}

function recordsForEventRounds(roundResults = [], eventId) {
  const unique = new Map()
  roundResults
    .filter((round) => round.eventId === eventId)
    .flatMap((round) => round.newRecords || [])
    .forEach((record) => unique.set(record.id, record))
  return [...unique.values()]
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
    setState((current) => beginHostSelection(current))
    setPage('host')
    setToast('Four host bids have entered the race')
  }

  const runHostBallot = () => {
    setState((current) => advanceHostSelection(current))
    setPage('host')
    setToast('The host ballot advances')
  }

  const beginNextCycle = () => {
    setState((current) => confirmHostSelection(current))
    setPage('home')
    setToast('The next Olympic cycle begins')
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
  const theme = state.edition.theme || {}
  const themeStyle = {
    '--host-accent': theme.accent || '#168b97',
    '--host-accent-2': theme.accent2 || '#d4a229',
    '--host-bg': theme.background || '#eef3f7',
    '--host-header': theme.header || '#0c2d42',
    '--host-text': theme.text || '#172033',
    '--host-panel': theme.panel || '#ffffff',
    '--host-font': theme.font || 'Inter, ui-sans-serif, system-ui, sans-serif',
  }

  return (
    <div className="app-shell host-themed" style={themeStyle}>
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
          runHostBallot={runHostBallot}
          beginNextCycle={beginNextCycle}
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
          {page === 'magazine' && <MagazineView state={state} setSelectedAthlete={setSelectedAthlete} setSelectedCountry={setSelectedCountry} setSelectedEvent={setSelectedEvent} />}
          {page === 'host' && <HostSelectionView state={state} runBallot={runHostBallot} beginNextCycle={beginNextCycle} />}
          {page === 'qualification' && <QualificationView state={state} setSelectedCountry={setSelectedCountry} setSelectedAthlete={setSelectedAthlete} />}
          {page === 'games' && (
            <GamesView
              state={state}
              setSelectedEvent={setSelectedEvent}
              setSelectedAthlete={setSelectedAthlete}
              runDay={runDay}
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
        <CountryModal country={activeCountry} state={state} close={() => setSelectedCountry(null)} setSelectedAthlete={setSelectedAthlete} />
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
          <CountryFlag country={countryByCode(edition.countryCode)} className="edition-flag" size="large" />
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

function TopBar({ state, page, openMenu, runDay, runToEnd, nextEdition, runHostBallot, beginNextCycle, resetUniverse, beginGames }) {
  const pageLabel = navItems.find(([id]) => id === page)?.[1] || 'Overview'
  const currentDay = state.phase === 'complete' ? 'Games complete' : state.phase === 'host-selection' ? 'Host ballot' : state.phase === 'host-selected' ? 'Host selected' : state.phase === 'qualification' ? 'Qualification phase' : `Day ${state.currentDay} of ${state.edition.days}`
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
        ) : state.phase === 'games' ? (
          <>
            <button className="secondary-action" onClick={runDay}><Icon name="play" size={17} /> Simulate current day</button>
            <button className="primary-action" onClick={runToEnd}><Icon name="fast" size={17} /> End of Games</button>
          </>
        ) : state.phase === 'complete' ? (
          <button className="primary-action" onClick={nextEdition}><Icon name="trophy" size={17} /> Select next host</button>
        ) : state.phase === 'host-selection' ? (
          <button className="primary-action" onClick={runHostBallot}><Icon name="podium" size={17} /> Run next ballot</button>
        ) : (
          <button className="primary-action" onClick={beginNextCycle}><Icon name="chevron" size={17} /> Begin next cycle</button>
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
  const olympiadArc = getOlympiadArc(state)
  const rivalries = getRivalryRows(state).filter((row) => row.meaningful).slice(0, 5)
  const iconicMoments = (state.iconicMoments || []).filter((moment) => moment.year === state.edition.year).sort((a, b) => b.score - a.score).slice(0, 5)

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="hero-kicker"><Icon name="sparkles" size={17} /> A living history from 1896</div>
          <h2>{state.edition.year === 1896 ? `${state.edition.host} writes the first chapter.` : `${state.edition.host} prepares a new Olympic chapter.`}</h2>
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

      <section className="panel olympiad-arc-panel">
        <SectionTitle icon="calendar" title="The four-year Olympic arc" />
        <p className="section-intro">The Games are the payoff, not the whole story. Each Olympiad now keeps the buildup visible: reset, emergence, qualification pressure and the Olympic year.</p>
        <div className="olympiad-arc-grid">
          {olympiadArc.map((stage) => <article key={`${stage.index}-${stage.year}`} className={`olympiad-stage ${stage.status}`}><div className="arc-stage-head"><span>{stage.index}</span><small>{stage.year}</small></div><h3>{stage.label}</h3><b>{stage.headline}</b><p>{stage.detail}</p><small className="arc-stage-description">{stage.description}</small></article>)}
        </div>
      </section>

      <section className="metric-grid four">
        <Metric icon="users" label="Qualified athletes" value={state.athletes.length.toLocaleString()} detail={`${delegations.length} national delegations`} />
        <Metric icon="medal" label="Medal events" value={`${completed}/${state.events.length}`} detail={`${finalsToday.length} finals on the current day`} />
        <Metric icon="podium" label="Medals awarded" value={totalMedals.toLocaleString()} detail={`${state.medalTable.length} countries on the table`} />
        <Metric icon="record" label="Records established" value={recordRows.length.toLocaleString()} detail={`${recordRows.filter((record) => record.type === 'WR').length} world records`} />
      </section>

      <div className="dashboard-grid lower mythology-dashboard">
        <section className="panel rivalry-panel">
          <SectionTitle icon="trophy" title="Rivalries defining the era" />
          {rivalries.length ? <div className="rivalry-list">{rivalries.map((rivalry) => {
            const a = rivalry.athleteA
            const b = rivalry.athleteB
            return <article key={rivalry.id}><div className="rivalry-event"><span>{sportById(rivalry.sportId)?.name}</span><b>{rivalry.eventName}</b></div><div className="rivalry-matchup"><button onClick={() => setSelectedAthlete(a.id)}>{a.name}</button><strong>{rivalry.aWins}–{rivalry.bWins}</strong><button onClick={() => setSelectedAthlete(b.id)}>{b.name}</button></div><div className="rivalry-meta"><span>{rivalry.meetings} Olympic final meeting{rivalry.meetings === 1 ? '' : 's'}</span><span>{rivalry.closeFinishes} close finish{rivalry.closeFinishes === 1 ? '' : 'es'}</span><span>Story score {rivalry.score}</span></div></article>
          })}</div> : <EmptyState icon="trophy" text="The first great rivalry is still waiting to emerge. Elite and close Olympic finals will build one naturally." />}
        </section>
        <section className="panel iconic-panel">
          <SectionTitle icon="sparkles" title="Iconic moments" action="History" onAction={() => setPage('almanac')} />
          {iconicMoments.length ? <div className="iconic-moment-list">{iconicMoments.map((moment) => <article key={moment.id}><span className={`moment-type ${moment.type}`}>{moment.type.replaceAll('-', ' ')}</span><button onClick={() => moment.athleteIds?.[0] && setSelectedAthlete(moment.athleteIds[0])}><b>{moment.title}</b><small>{moment.eventName} · Day {moment.day}</small></button><p>{moment.body}</p></article>)}</div> : <EmptyState icon="sparkles" text="No moment has crossed the iconic threshold yet. Records, huge upsets, dynasties and historic firsts will be preserved here." />}
        </section>
      </div>

      <section className="panel world-events-panel">
        <SectionTitle icon="news" title="Events shaping the next Games" />
        <p className="section-intro">Six huge developments reach the front page, while roughly 100 mild, significant and major changes continue in the background. Every effect is already included in investment, facilities, qualification depth and athlete generation.</p>
        <div className="world-event-grid">
          {(state.featuredWorldEvents || state.worldEvents?.filter((event) => event.severity === 'huge') || []).map((event) => {
            const country = countryByCode(event.countryCode)
            const sport = sportById(event.sportId)
            return <article className={`world-event-card ${event.tone}`} key={event.id}><div className="world-event-meta"><span><CountryFlag country={country} /> {country?.name}</span><b>{event.severity || event.tone}</b></div><h3>{event.headline}</h3><p>{event.body}</p><div className="world-event-impact"><span><Icon name={sport?.icon || 'medal'} size={15} />{sport?.name}</span><span>{event.impact.overall >= 0 ? '+' : ''}{event.impact.overall} investment</span><span>{event.impact.youth >= 0 ? '+' : ''}{event.impact.youth} youth</span></div></article>
          })}
        </div>
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
                  <span className="athlete-line"><b>{athlete.name}</b><small><CountryFlag country={country} /> {country?.name} · {sport?.name}</small></span>
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

function MagazineView({ state, setSelectedAthlete, setSelectedCountry, setSelectedEvent }) {
  const [tab, setTab] = useState(state.phase === 'complete' ? 'post' : 'pre')
  const magazine = state.magazine || { lifeChanges: {}, preGames: {}, postGames: null }
  const resolve = (id) => athleteById(state, id)
  const spawned = (magazine.lifeChanges?.spawnedIds || []).map(resolve).filter(Boolean)
  const retired = (magazine.lifeChanges?.retiredIds || []).map(resolve).filter(Boolean)
  const finalGames = (magazine.preGames?.finalGamesIds || []).map(resolve).filter(Boolean)
  const failed = (magazine.preGames?.failedQualifierIds || []).map(resolve).filter(Boolean)
  const keyCompetitions = (magazine.preGames?.keyCompetitions || []).map((row) => ({ ...row, event: state.events.find((event) => event.id === row.eventId), athletes: row.athleteIds.map(resolve).filter(Boolean) }))
  const multi = (magazine.postGames?.multiMedalistIds || []).map(resolve).filter(Boolean)
  const surprises = (magazine.postGames?.surprises || []).map((row) => ({ ...row, athlete: resolve(row.athleteId), event: state.events.find((event) => event.id === row.eventId) })).filter((row) => row.athlete)
  const disappointments = (magazine.postGames?.disappointments || []).map((row) => ({ ...row, athlete: resolve(row.athleteId) })).filter((row) => row.athlete)
  const hugeEvents = state.featuredWorldEvents || state.worldEvents?.filter((event) => event.severity === 'huge') || []
  const background = state.worldEvents || []
  const athleteCard = (athlete, detail) => { const country = countryByCode(athlete.countryCode); const sport = sportById(athlete.sportId); return <button className="magazine-athlete-card" key={athlete.id} onClick={() => setSelectedAthlete(athlete.id)}><span className={`athlete-avatar rarity-${athlete.rarity}`}>{athlete.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><b>{athlete.name}</b><small><CountryFlag country={country} /> {country.name} · {sport?.name}</small><em>{detail}</em></span><span className={`rarity-badge ${athlete.rarity}`}>{rarityLabels[athlete.rarity]}</span></button> }
  return <div className="page-stack"><section className="page-heading magazine-heading"><div><span className="eyebrow">The Olympic Chronicle</span><h2>{state.edition.host} {state.edition.year} Magazine</h2><p>The four-year cycle now has its own narrative layer: national shocks, new stars, retirements, qualification failures, events loaded with elite talent, final appearances and the stories that defined the Games.</p></div><div className="heading-badge"><Icon name="news" /><span><b>{background.length}</b><small>cycle developments</small></span></div></section><section className="panel magazine-tabs"><button className={tab === 'cycle' ? 'active' : ''} onClick={() => setTab('cycle')}>World & investment</button><button className={tab === 'life' ? 'active' : ''} onClick={() => setTab('life')}>Athlete life</button><button className={tab === 'pre' ? 'active' : ''} onClick={() => setTab('pre')}>Pre-Games</button><button className={tab === 'post' ? 'active' : ''} onClick={() => setTab('post')}>Post-Games</button></section>
  {tab === 'cycle' && <><section className="metric-grid four"><Metric icon="news" label="Huge events" value={hugeEvents.length} detail="Front-page changes" /><Metric icon="globe" label="Background events" value={Math.max(0, background.length - hugeEvents.length)} detail="Mild to major effects" /><Metric icon="chart" label="Countries affected" value={new Set(background.map((event) => event.countryCode)).size} detail="Across the cycle" /><Metric icon="medal" label="Sports affected" value={new Set(background.map((event) => event.sportId)).size} detail="Investment can shift" /></section><section className="world-event-grid magazine-world-grid">{hugeEvents.map((event) => { const country = countryByCode(event.countryCode); const sport = sportById(event.sportId); return <article className={`world-event-card ${event.tone}`} key={event.id}><div className="world-event-meta"><button onClick={() => setSelectedCountry(event.countryCode)}><CountryFlag country={country} /> {country.name}</button><b>{event.severity}</b></div><h3>{event.headline}</h3><p>{event.body}</p><div className="world-event-impact"><span><Icon name={sport?.icon || 'medal'} size={15} />{sport?.name}</span><span>{event.impact.overall >= 0 ? '+' : ''}{event.impact.overall} investment</span><span>{event.impact.sport >= 0 ? '+' : ''}{event.impact.sport} sport</span></div></article> })}</section></>}
  {tab === 'life' && <div className="dashboard-grid main"><section className="panel"><SectionTitle icon="sparkles" title="Epic+ athletes entering the world" /><div className="magazine-athlete-list">{spawned.map((athlete) => athleteCard(athlete, `Age ${athlete.age} · potential ${athlete.baseSkill}`))}{!spawned.length && <EmptyState icon="users" text="No Epic-or-better athlete spawned in this cycle." />}</div></section><section className="panel"><SectionTitle icon="book" title="Epic+ retirements" /><div className="magazine-athlete-list">{retired.map((athlete) => athleteCard(athlete, `${athlete.appearances} Games · ${athlete.careerMedals.gold} golds`))}{!retired.length && <EmptyState icon="users" text="No major retirement was recorded this cycle." />}</div></section></div>}
  {tab === 'pre' && <><section className="panel"><SectionTitle icon="star" title="Key competitions to watch" /><div className="key-event-grid">{keyCompetitions.map((row) => <button key={row.eventId} onClick={() => setSelectedEvent(row.eventId)}><span className="sport-icon"><Icon name={sportById(row.event?.sportId)?.icon || 'medal'} /></span><span><b>{row.event?.name}</b><small>{row.eliteCount} Epic-or-better contenders</small><em>{row.athletes.slice(0, 3).map((athlete) => athlete.name).join(' · ')}</em></span></button>)}</div></section><div className="dashboard-grid main"><section className="panel"><SectionTitle icon="clock" title="Legends likely at their final Games" /><div className="magazine-athlete-list">{finalGames.map((athlete) => athleteCard(athlete, `Age ${athlete.age} · retirement projected at ${athlete.retirementAge}`))}{!finalGames.length && <EmptyState icon="users" text="No elite athlete is clearly approaching retirement." />}</div></section><section className="panel"><SectionTitle icon="flag" title="Epic+ athletes who failed to qualify" /><div className="magazine-athlete-list">{failed.map((athlete) => athleteCard(athlete, `Rating ${athlete.currentRating} · missed ${state.edition.host}`))}{!failed.length && <EmptyState icon="trophy" text="Every Epic-or-better active athlete qualified." />}</div></section></div></>}
  {tab === 'post' && (state.phase !== 'complete' ? <section className="panel"><EmptyState icon="clock" text="The post-Games edition will publish after the closing ceremony." /></section> : <><div className="dashboard-grid main"><section className="panel"><SectionTitle icon="medal" title="Multiple-medal stars" /><div className="magazine-athlete-list">{multi.map((athlete) => athleteCard(athlete, `${athlete.medals.gold} gold · ${athlete.medals.silver} silver · ${athlete.medals.bronze} bronze`))}</div></section><section className="panel"><SectionTitle icon="sparkles" title="Breakthrough champions" /><div className="magazine-athlete-list">{surprises.map((row) => athleteCard(row.athlete, `${row.event?.name || 'Olympic champion'} · qualified rank ${row.qualificationRank || 'outside top list'}`))}</div></section></div><section className="panel"><SectionTitle icon="chart" title="Qualification favorites who left without a medal" /><div className="magazine-athlete-list horizontal">{disappointments.map((row) => athleteCard(row.athlete, `Qualification rank ${row.rank} · no medal`))}</div></section></>)}</div>
}

function HostSelectionView({ state, runBallot, beginNextCycle }) {
  const selection = state.hostSelection
  const last = state.lastHostSelection
  if (!selection) {
    return (
      <div className="page-stack">
        <section className="page-heading"><div><span className="eyebrow">A procedural Olympic world</span><h2>Host selection</h2><p>After every Games, four cities from a different continent than the current host enter a three-round vote. Infrastructure, public support, national pathways, legacy and bid sports all matter—but the ballot retains enough uncertainty to create surprises.</p></div><div className="heading-badge"><Icon name="trophy" /><span><b>4 → 1</b><small>three ballot rounds</small></span></div></section>
        {last ? <section className="panel last-host-selection"><SectionTitle icon="trophy" title={`Last vote: ${last.year}`} /><div className="host-winner-summary"><CountryFlag country={countryByCode(last.winner.countryCode)} className="huge-flag" size="large" /><div><h3>{last.winner.city} won the Games</h3><p>{countryByCode(last.winner.countryCode)?.name} · {last.winner.continent}. Hosting now provides a large facilities and investment boost that will decay over future cycles.</p></div></div></section> : <section className="panel"><EmptyState icon="trophy" text="Athens 1896 is the only fixed host. Complete the Games to open the first procedural host race for 1900." /></section>}
        <section className="qualification-models host-rule-grid">{[['globe','Continental rotation','The same continent can never host consecutive Summer Games.'],['country','Bid readiness','Facilities, investment and youth pathways establish the technical baseline.'],['medal','Host sports','Each bid proposes era-appropriate sports or disciplines that can enter the programme.'],['chart','Lasting legacy','Winning creates a major national investment boost that fades gradually across later cycles.']].map(([icon,title,text]) => <article key={title}><span><Icon name={icon} /></span><h3>{title}</h3><p>{text}</p></article>)}</section>
      </div>
    )
  }
  const active = selection.candidates.filter((candidate) => candidate.status === 'active')
  const winner = selection.candidates.find((candidate) => candidate.id === selection.winnerId)
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">IOC host election · {selection.year}</span><h2>{winner ? `${winner.city} will host the Games` : `${active.length} bids remain`}</h2><p>The previous host was in {selection.previousContinent}; every candidate below comes from another continent. Run each ballot separately to see the shortlist narrow and the campaign narrative develop.</p></div><div className="heading-badge"><Icon name="trophy" /><span><b>{active.length}</b><small>{winner ? 'winning bid' : 'active candidates'}</small></span></div></section>

      <div className="host-bid-grid">
        {selection.candidates.map((candidate) => {
          const country = countryByCode(candidate.countryCode)
          const isWinner = candidate.id === selection.winnerId
          return <article className={`host-bid-card ${candidate.status} ${isWinner ? 'winner' : ''}`} key={candidate.id} style={{ '--bid-accent': candidate.theme?.accent || '#168b97' }}>
            <div className="bid-card-head"><CountryFlag country={country} className="large-flag" size="large" /><span><b>{candidate.city}</b><small>{country?.name} · {candidate.continent}</small></span>{isWinner ? <span className="winner-stamp">HOST</span> : candidate.status === 'eliminated' ? <span className="eliminated-stamp">OUT R{candidate.eliminatedRound}</span> : <span className="active-stamp">ACTIVE</span>}</div>
            <div className="bid-score"><span>Technical bid score</span><strong>{candidate.bidScore}</strong></div>
            <div className="bid-metrics"><Progress label="Infrastructure" value={candidate.infrastructure} /><Progress label="Athlete pathway" value={candidate.pathway} /><Progress label="Public support" value={candidate.publicSupport} /><Progress label="Legacy plan" value={candidate.legacy} /></div>
            <div className="bid-sports"><small>Proposed programme influence</small><div>{candidate.proposalSports.length ? candidate.proposalSports.map((sportId) => { const sport = sportById(sportId); return <span key={sportId}><Icon name={sport?.icon || 'medal'} size={14} />{sport?.name}</span> }) : <span>Traditional programme only</span>}</div></div>
          </article>
        })}
      </div>

      <section className="panel host-ballot-panel">
        <SectionTitle icon="podium" title="Ballot room" />
        <div className="ballot-actions"><div><b>{selection.complete ? 'The host has been selected.' : `Round ${selection.round + 1} is ready.`}</b><p>{selection.complete ? `${winner?.city} now shapes the visual identity, investment legacy and selected sports of the ${selection.year} Games.` : 'The lowest live score is eliminated. Campaign momentum and voting uncertainty can overturn the technical order.'}</p></div>{selection.complete ? <button className="primary-action" onClick={beginNextCycle}><Icon name="chevron" size={17} /> Begin the {selection.year} Olympic cycle</button> : <button className="primary-action" onClick={runBallot}><Icon name="podium" size={17} /> Run ballot round {selection.round + 1}</button>}</div>
        <div className="ballot-log">{selection.log.map((entry) => <article key={entry.round}><span>{entry.round}</span><div><b>{entry.title}</b><p>{entry.message}</p></div></article>)}{!selection.log.length && <EmptyState icon="clock" text="No votes have been cast yet. The four technical files are ready." />}</div>
      </section>
    </div>
  )
}

function QualificationView({ state, setSelectedCountry, setSelectedAthlete }) {
  const availableSports = [...new Set([
    ...state.athletes.map((athlete) => athlete.sportId),
    ...Object.keys(state.qualificationRankings || {}),
  ])].map(sportById).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
  const defaultSport = availableSports.find((sport) => sport.id === 'athletics')?.id || availableSports[0]?.id || 'all'
  const [sportFilter, setSportFilter] = useState(defaultSport)
  const [mode, setMode] = useState('athletes')
  const [expandedCompetition, setExpandedCompetition] = useState(null)
  const filteredAthletes = sportFilter === 'all' ? state.athletes : state.athletes.filter((athlete) => athlete.sportId === sportFilter)
  const candidateLookup = new Map([...(state.careerPool || []), ...state.athletes].map((athlete) => [athlete.id, athlete]))
  const rankingRows = sportFilter === 'all'
    ? []
    : (state.qualificationRankings?.[sportFilter] || []).map((row) => ({ ...row, athlete: candidateLookup.get(row.athleteId) })).filter((row) => row.athlete)
  const delegationMap = new Map()
  filteredAthletes.forEach((athlete) => {
    const row = delegationMap.get(athlete.countryCode) || { countryCode: athlete.countryCode, athletes: 0, sports: new Set(), generational: 0, legend: 0, epic: 0, returning: 0, averageRating: 0 }
    row.athletes += 1
    row.sports.add(athlete.sportId)
    row.averageRating += athlete.currentRating
    if (['generational', 'legend', 'epic'].includes(athlete.rarity)) row[athlete.rarity] += 1
    if (athlete.appearances > 1) row.returning += 1
    delegationMap.set(athlete.countryCode, row)
  })
  const visibleDelegations = [...delegationMap.values()].map((row) => ({ ...row, sports: row.sports.size, averageRating: row.averageRating / Math.max(1, row.athletes) })).sort((a, b) => b.athletes - a.athletes || b.averageRating - a.averageRating)
  const competitions = (state.qualificationCompetitions || []).filter((competition) => sportFilter === 'all' || competition.sportId === sportFilter)
  const qualificationRecords = getRecordRows(state).filter((record) => record.source === 'qualification' && (sportFilter === 'all' || record.sportId === sportFilter)).sort((a, b) => b.year - a.year)
  const routes = [...new Set(competitions.map((competition) => competition.route))]
  const selectedSport = sportById(sportFilter)
  const qualifiedCount = rankingRows.filter((row) => row.qualified).length
  const eliteMisses = rankingRows.filter((row) => !row.qualified && ['generational', 'legend', 'epic'].includes(row.athlete.rarity)).length

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">Road to {state.edition.host}</span><h2>Olympic qualification</h2><p>Select a sport to follow its complete competitive hierarchy: every active athlete, qualification index, best mark, named competition, places awarded and the exact line separating Olympians from those who missed the Games.</p></div>
        <div className="heading-badge"><Icon name="flag" /><span><b>{state.athletes.length}</b><small>Olympic places</small></span></div>
      </section>

      <section className="panel qualification-toolbar">
        <div className="view-switch">
          <button className={mode === 'athletes' ? 'active' : ''} onClick={() => setMode('athletes')}><Icon name="users" size={16} /> Athlete ranking</button>
          <button className={mode === 'circuit' ? 'active' : ''} onClick={() => setMode('circuit')}><Icon name="calendar" size={16} /> Competitions</button>
          <button className={mode === 'delegations' ? 'active' : ''} onClick={() => setMode('delegations')}><Icon name="globe" size={16} /> Countries</button>
          <button className={mode === 'records' ? 'active' : ''} onClick={() => setMode('records')}><Icon name="record" size={16} /> Records</button>
        </div>
        <label><span>Sport</span><select value={sportFilter} onChange={(event) => { setSportFilter(event.target.value); setMode(event.target.value === 'all' ? 'delegations' : 'athletes') }}><option value="all">All sports — country totals</option>{availableSports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label>
      </section>

      <section className="metric-grid four">
        <Metric icon="users" label="Athletes in pathway" value={rankingRows.length || filteredAthletes.length} detail={selectedSport?.name || 'All qualified athletes'} />
        <Metric icon="flag" label="Qualified" value={sportFilter === 'all' ? filteredAthletes.length : qualifiedCount} detail={`${visibleDelegations.length} countries represented`} />
        <Metric icon="star" label="Elite misses" value={eliteMisses} detail="Epic or better who failed" />
        <Metric icon="record" label="Qualification WRs" value={qualificationRecords.length} detail={`${competitions.length} named competitions`} />
      </section>

      {mode === 'athletes' && sportFilter !== 'all' && (
        <section className="panel table-panel qualification-ranking-panel">
          <SectionTitle icon="chart" title={`${selectedSport?.name} world qualification ranking`} />
          <p className="section-intro">The qualification index combines rating, current form and cycle performance. The mark is the athlete’s best result in their primary discipline. Open any athlete to compare this result with every Olympic round.</p>
          <div className="responsive-table"><table><thead><tr><th className="number">Rank</th><th>Athlete</th><th>Country</th><th>Best discipline / mark</th><th className="number">Index</th><th>Qualification event</th><th>Status</th></tr></thead><tbody>{rankingRows.map((row) => {
            const athlete = row.athlete
            const country = countryByCode(row.countryCode)
            const event = state.events.find((item) => item.id === row.eventId) || state.events.find((item) => item.recordKey === row.eventKey)
            const history = athlete.qualificationHistory?.find((item) => item.editionYear === state.edition.year && item.sportId === sportFilter)
            return <tr key={row.athleteId} onClick={() => setSelectedAthlete(row.athleteId)} className={row.qualified ? 'qualified-row' : 'missed-row'}><td className="number"><span className={`table-rank ${row.rank <= 3 ? `top-${row.rank}` : ''}`}>{row.rank}</span></td><td><span className="athlete-table-cell"><span className={`athlete-avatar rarity-${athlete.rarity}`}>{athlete.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><strong>{athlete.name}</strong><small className="table-subline">Rating {athlete.currentRating} · {rarityLabels[athlete.rarity]}</small></span></span></td><td><span className="country-inline"><CountryFlag country={country} />{country.name}</span></td><td><b>{row.eventName}</b><small className="table-subline">{event && row.value != null ? formatPerformance(row.value, event) : 'No comparable mark'}</small></td><td className="number"><b>{row.qualificationIndex}</b></td><td>{history?.competition || 'Olympic ranking list'}<small className="table-subline">{history ? `${history.hostCity} · rank ${history.rank}` : ''}</small></td><td>{row.qualified ? <span className="status-badge standing">Qualified</span> : <span className="status-badge broken">Missed Games</span>}</td></tr>
          })}</tbody></table></div>
        </section>
      )}

      {mode === 'delegations' && (
        <section className="panel"><SectionTitle icon="globe" title={sportFilter === 'all' ? 'Qualified athletes by country' : `${selectedSport?.name} qualification by country`} /><div className="delegation-ranking">{visibleDelegations.slice(0, 40).map((row, index) => { const country = countryByCode(row.countryCode); const investment = state.investments.find((item) => item.countryCode === row.countryCode); const max = visibleDelegations[0]?.athletes || 1; return <button key={row.countryCode} onClick={() => setSelectedCountry(row.countryCode)}><span className="table-rank">{index + 1}</span><span className="qualification-country"><b><CountryFlag country={country} /> {country.name}</b><small>{sportFilter === 'all' ? `${row.sports} sports` : selectedSport?.name} · avg rating {row.averageRating.toFixed(1)} · facilities {investment?.facilities || 0}</small></span><span className="delegation-total"><b>{row.athletes}</b><small>athletes</small></span><span className="qualification-bar"><i style={{ width: `${Math.min(100, row.athletes / max * 100)}%` }} /></span></button> })}</div></section>
      )}

      {mode === 'circuit' && (
        <section className="qualification-circuit-grid">{competitions.map((competition) => {
          const sport = sportById(competition.sportId)
          const host = countryByCode(competition.hostCountryCode)
          const rows = competition.resultRows || []
          return <article className="panel qualification-event-card" key={competition.id}><div className="qualification-event-head"><span className="sport-icon"><Icon name={sport?.icon || 'medal'} /></span><span><b>{competition.name}</b><small><CountryFlag country={host} /> {competition.hostCity} · {competition.year}</small></span>{competition.recordBreaks.length > 0 && <span className="wr-chip">WR × {competition.recordBreaks.length}</span>}</div><p>{competition.route}</p><div className="qualification-event-stats"><span><b>{competition.participants}</b><small>participants</small></span><span><b>{competition.qualified}</b><small>qualified</small></span><span><b>{competition.countryPlaces?.length || 0}</b><small>countries</small></span></div><button className="qualification-expand-button" onClick={() => setExpandedCompetition(expandedCompetition === competition.id ? null : competition.id)}>{expandedCompetition === competition.id ? 'Hide complete result' : 'Open ranking / bracket result'}</button>{expandedCompetition === competition.id && <div className="qualification-detail-drawer"><div className="responsive-table"><table className="qualification-result-table"><thead><tr><th className="number">Pos.</th><th>Athlete</th><th>Country</th><th>Discipline</th><th>Mark</th><th>Status</th></tr></thead><tbody>{rows.map((row) => { const athlete = candidateLookup.get(row.athleteId); const country = countryByCode(row.countryCode); const event = state.events.find((item) => item.id === row.eventId) || state.events.find((item) => item.recordKey === row.eventKey); return athlete ? <tr key={row.athleteId} onClick={() => setSelectedAthlete(row.athleteId)}><td className="number">{row.competitionRank}</td><td><b>{athlete.name}</b><small className="table-subline">Rating {athlete.currentRating}</small></td><td><span className="country-inline"><CountryFlag country={country} />{country.name}</span></td><td>{row.eventName}</td><td>{event && row.value != null ? <b>{formatPerformance(row.value, event)}</b> : '—'}</td><td>{row.qualified ? <span className="status-badge standing">Q</span> : <span className="status-badge broken">Out</span>}</td></tr> : null })}</tbody></table></div></div>}</article>
        })}</section>
      )}

      {mode === 'records' && <section className="panel table-panel"><div className="responsive-table"><table><thead><tr><th>Competition</th><th>Event</th><th>Record holder</th><th>Country</th><th>Mark</th><th>Year</th><th>Status</th></tr></thead><tbody>{qualificationRecords.map((record) => { const country = countryByCode(record.countryCode); return <tr key={record.id}><td><b>{record.competition || 'Olympic qualifier'}</b><small className="table-subline">{record.host}</small></td><td>{record.event?.name}<small className="table-subline">{sportById(record.sportId)?.name}</small></td><td><button className="text-button" onClick={() => setSelectedAthlete(record.athleteId)}>{record.athlete?.name}</button></td><td><span className="country-inline"><CountryFlag country={country} />{country.name}</span></td><td><strong className="performance-value">{formatPerformance(record.value, record.event)}</strong></td><td>{record.year}</td><td><span className={`status-badge ${record.standing ? 'standing' : 'broken'}`}>{record.standing ? 'Standing' : 'Broken'}</span></td></tr> })}</tbody></table></div>{!qualificationRecords.length && <EmptyState icon="record" text="No world records were set during this qualification cycle." />}</section>}
    </div>
  )
}

function GamesView({ state, setSelectedEvent, setSelectedAthlete, runDay }) {
  const [day, setDay] = useState(Math.min(state.currentDay, state.edition.days))
  const [sportFilter, setSportFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  useEffect(() => setDay(Math.min(state.currentDay, state.edition.days)), [state.currentDay, state.edition.days])
  const availableSports = useMemo(() => [...new Set(state.schedule.map((session) => session.sportId))].map(sportById).filter(Boolean), [state.schedule])
  const sessions = state.schedule.filter((session) => session.day === day && (sportFilter === 'all' || session.sportId === sportFilter) && (stageFilter === 'all' || (stageFilter === 'medals' ? session.isFinal : !session.isFinal)))
  const dayRounds = (state.roundResults || []).filter((result) => result.day === day && (sportFilter === 'all' || result.sportId === sportFilter) && (stageFilter === 'all' || (stageFilter === 'medals' ? result.isFinal : !result.isFinal)))
  const medalEvents = state.results.filter((result) => result.day === day && (sportFilter === 'all' || result.sportId === sportFilter))
  const recordAlerts = dayRounds.flatMap((round) => (round.newRecords || []).map((record) => ({ ...record, round })))
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">The Olympic programme</span><h2>Competition calendar and complete results</h2><p>Every heat, qualification group, bracket round, semifinal and final now retains its full result. Open an event to follow exactly who led each round, who advanced and whether the early leader reproduced the performance in the final.</p></div><div className="heading-badge"><Icon name="calendar" /><span><b>{state.edition.days}</b><small>competition days</small></span></div></section>
      <div className="day-tabs" role="tablist" aria-label="Olympic days">{Array.from({ length: state.edition.days }, (_, index) => index + 1).map((item) => { const completed = item < state.currentDay || state.phase === 'complete'; const roundCount = state.schedule.filter((session) => session.day === item).length; return <button key={item} className={`${day === item ? 'active' : ''} ${completed ? 'completed' : ''}`} onClick={() => setDay(item)}><span>DAY</span><b>{item}</b><small>{roundCount} rounds</small></button> })}</div>
      <section className="panel day-simulation-bar"><div><span className="sport-icon"><Icon name="play" /></span><span><b>{state.phase === 'games' ? `Ready to simulate Day ${state.currentDay}` : state.phase === 'complete' ? 'All Olympic days are complete' : 'The Games have not begun'}</b><small>The button completes every scheduled round on exactly one day and then stops.</small></span></div>{state.phase === 'games' && <button className="primary-action" onClick={runDay}><Icon name="play" size={17} /> Simulate Day {state.currentDay}</button>}</section>
      <section className="panel filters-panel"><label><span>Sport</span><select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}><option value="all">All sports</option>{availableSports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label><label><span>Round type</span><select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="all">All rounds</option><option value="qualifying">Prior rounds</option><option value="medals">Finals</option></select></label><div className="filter-summary"><Icon name="filter" size={17} /><span>{sessions.length} scheduled · {dayRounds.length} completed</span></div></section>
      <div className="session-columns">{['Morning', 'Afternoon', 'Evening'].map((sessionName) => <section className="session-column" key={sessionName}><div className="session-heading"><span>{sessionName}</span><small>{sessions.filter((session) => session.session === sessionName).length} rounds</small></div><div className="session-list">{sessions.filter((session) => session.session === sessionName).map((session) => { const event = state.events.find((item) => item.id === session.eventId); const sport = sportById(session.sportId); const round = (state.roundResults || []).find((item) => item.sessionId === session.id); const leader = round?.results?.[0]; const leaderAthlete = leader ? athleteById(state, leader.athleteId) : null; const leaderCountry = leader ? countryByCode(leader.countryCode) : null; return <button className={`session-card ${session.status}`} key={session.id} onClick={() => setSelectedEvent(session.eventId)}><div className="session-card-top"><span className="sport-icon"><Icon name={sport?.icon || 'medal'} size={19} /></span><small>{sport?.name}</small>{session.isFinal && <b>MEDAL</b>}</div><h3>{event?.name}</h3><div className="round-label">{session.stage}</div>{round ? <div className="round-leader-line"><span className="table-rank top-1">1</span><span><b>{leader?.displayName || leaderAthlete?.name}</b><small><CountryFlag country={leaderCountry} /> {event && leader ? formatPerformance(leader.value, event) : ''}{!session.isFinal ? ` · ${round.qualifiedIds.length} advanced` : ''}</small></span>{round.newRecords?.map((record) => <span key={record.id} className={`result-record-badge ${record.type.toLowerCase()}`}>{record.type}</span>)}</div> : <div className={`session-status ${session.status}`}><span />{day === state.currentDay ? 'Today' : 'Scheduled'}</div>}</button> })}{!sessions.some((session) => session.session === sessionName) && <div className="empty-session">No matching sessions</div>}</div></section>)}</div>
      {recordAlerts.length > 0 && <section className="daily-record-alerts">{recordAlerts.map(({ round, ...record }) => { const event = state.events.find((item) => item.id === round.eventId); const country = countryByCode(record.countryCode); return <article className={record.type === 'WR' ? 'world-record-alert' : 'olympic-record-alert'} key={record.id}><span className="record-burst">{record.type}</span><div><b>{record.type === 'WR' ? 'WORLD RECORD' : 'OLYMPIC RECORD'} · {event?.name}</b><p>{record.athleteName} <CountryFlag country={country} /> records {event ? formatPerformance(record.value, event) : record.value} in the {round.stage} on Day {day}.</p></div></article> })}</section>}
      {dayRounds.length > 0 && <section className="panel"><SectionTitle icon="chart" title={`Day ${day} — every completed round`} /><div className="round-results-grid">{dayRounds.map((round) => { const event = state.events.find((item) => item.id === round.eventId); const sport = sportById(round.sportId); return <article className="round-result-card" key={round.id}><button className="round-result-head" onClick={() => setSelectedEvent(round.eventId)}><span className="sport-icon"><Icon name={sport?.icon || 'medal'} /></span><span><b>{event?.name}</b><small>{round.stage} · {round.session}</small></span><span>{round.results.length} athletes</span></button><div className="round-result-list">{round.results.slice(0, 8).map((row, index) => { const athlete = athleteById(state, row.athleteId); const country = countryByCode(row.countryCode); return <button key={`${round.id}-${row.athleteId}`} onClick={() => setSelectedAthlete(row.athleteId)}><span className={`table-rank ${index < 3 ? `top-${index + 1}` : ''}`}>{index + 1}</span><span><b>{row.displayName || athlete?.name}</b><small><CountryFlag country={country} /> {country.name}</small></span><strong>{event ? formatPerformance(row.value, event) : row.value}</strong>{!round.isFinal && <span className={`advance-chip ${round.qualifiedIds.includes(row.athleteId) ? 'yes' : 'no'}`}>{round.qualifiedIds.includes(row.athleteId) ? 'Q' : 'OUT'}</span>}</button> })}</div>{round.results.length > 8 && <button className="show-all-round" onClick={() => setSelectedEvent(round.eventId)}>Open all {round.results.length} results</button>}</article> })}</div></section>}
      {medalEvents.length > 0 && <section className="panel"><SectionTitle icon="medal" title={`Day ${day} medal results`} /><div className="results-grid">{medalEvents.map((result) => { const event = state.events.find((item) => item.id === result.eventId); return <ResultCard key={result.id} result={result} event={event} state={state} setSelectedAthlete={setSelectedAthlete} setSelectedEvent={setSelectedEvent} /> })}</div></section>}
    </div>
  )
}

function aggregateMedalEvents(events, sportFilter = 'all') {
  const map = new Map()
  events.filter((result) => sportFilter === 'all' || result.sportId === sportFilter).forEach((result) => {
    result.podium.forEach((medalist) => {
      const row = map.get(medalist.countryCode) || { countryCode: medalist.countryCode, gold: 0, silver: 0, bronze: 0, total: 0 }
      row[medalist.medal] += 1
      row.total += 1
      map.set(medalist.countryCode, row)
    })
  })
  return [...map.values()]
}

function MedalEvolutionChart({ editions, countryCodes }) {
  const width = 820
  const height = 280
  const pad = { left: 52, right: 30, top: 22, bottom: 42 }
  if (!editions.length || !countryCodes.length) return <EmptyState icon="chart" text="Complete at least one Games and select countries to draw the historical evolution." />
  const years = editions.map((edition) => edition.year)
  const series = countryCodes.map((countryCode) => {
    let cumulative = 0
    return {
      countryCode,
      values: editions.map((edition) => {
        const row = edition.medalTable.find((item) => item.countryCode === countryCode)
        cumulative += row?.total || 0
        return { year: edition.year, value: cumulative }
      }),
    }
  })
  const max = Math.max(1, ...series.flatMap((row) => row.values.map((point) => point.value)))
  const x = (index) => pad.left + index / Math.max(1, years.length - 1) * (width - pad.left - pad.right)
  const y = (value) => height - pad.bottom - value / max * (height - pad.top - pad.bottom)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(max * ratio))
  return (
    <div className="medal-evolution-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Cumulative Olympic medal evolution by country">
        {ticks.map((tick) => <g key={tick}><line x1={pad.left} x2={width - pad.right} y1={y(tick)} y2={y(tick)} className="chart-grid-line" /><text x={pad.left - 10} y={y(tick) + 4} textAnchor="end">{tick}</text></g>)}
        {years.map((year, index) => (index === 0 || index === years.length - 1 || index % Math.max(1, Math.ceil(years.length / 8)) === 0) ? <text key={year} x={x(index)} y={height - 16} textAnchor="middle">{year}</text> : null)}
        {series.map((row, seriesIndex) => {
          const points = row.values.map((point, index) => `${x(index)},${y(point.value)}`).join(' ')
          const country = countryByCode(row.countryCode)
          const last = row.values.at(-1)
          return <g className={`trend-series series-${seriesIndex + 1}`} key={row.countryCode}><polyline points={points} fill="none" /><circle cx={x(row.values.length - 1)} cy={y(last.value)} r="4" /><text x={x(row.values.length - 1) - 4} y={Math.max(14, y(last.value) - 8)} textAnchor="end">{country?.name}: {last.value}</text></g>
        })}
      </svg>
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
  const [trendCountries, setTrendCountries] = useState([])
  useEffect(() => setTrendCountries([]), [sportFilter])
  const delegations = delegationStats(state)
  const currentMedals = state.results.map((result) => {
    const event = state.events.find((item) => item.id === result.eventId)
    return { year: state.edition.year, host: state.edition.host, eventId: result.eventId, eventKey: result.eventKey, eventName: event?.name || 'Event', sportId: result.sportId, podium: result.podium, newRecords: recordsForEventRounds(state.roundResults, result.eventId) }
  })
  const archiveMedals = state.history.flatMap((entry) => (entry.medalResults || []).map((result) => ({ ...result, year: entry.edition.year, host: entry.edition.host, newRecords: recordsForEventRounds(entry.roundResults, result.eventId) })))
  const medalArchive = [...archiveMedals, ...currentMedals]
  const currentRows = aggregateMedalEvents(currentMedals, sportFilter)
    .filter((row) => countryByCode(row.countryCode)?.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'total' ? b.total - a.total || b.gold - a.gold : b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)
  const historicalRows = aggregateMedalEvents(medalArchive, sportFilter)
    .filter((row) => countryByCode(row.countryCode)?.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'total' ? b.total - a.total || b.gold - a.gold : b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze)
  const editionOptions = [...new Set(medalArchive.map((result) => result.year))].sort((a, b) => b - a)
  const sportOptions = [...new Set([...state.events.map((event) => event.sportId), ...medalArchive.map((result) => result.sportId)])].map(sportById).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
  const countryOptions = [...new Set(medalArchive.flatMap((result) => result.podium.map((row) => row.countryCode)))].map(countryByCode).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
  const archiveRows = medalArchive
    .filter((result) => editionFilter === 'all' || result.year === Number(editionFilter))
    .filter((result) => sportFilter === 'all' || result.sportId === sportFilter)
    .filter((result) => countryFilter === 'all' || result.podium.some((row) => row.countryCode === countryFilter))
    .filter((result) => result.eventName.toLowerCase().includes(eventSearch.toLowerCase()))
    .sort((a, b) => b.year - a.year || sportById(a.sportId).name.localeCompare(sportById(b.sportId).name) || a.eventName.localeCompare(b.eventName))
  const recordHighlights = currentMedals.flatMap((result) => result.newRecords.map((record) => ({ ...record, event: state.events.find((event) => event.id === result.eventId) })))
  const evolutionEditions = [...state.history.map((entry) => ({ year: entry.edition.year, medalTable: entry.medalTable || [] })), ...(state.results.length ? [{ year: state.edition.year, medalTable: aggregateMedalEvents(currentMedals) }] : [])].sort((a, b) => a.year - b.year)
  const defaultTrend = historicalRows.slice(0, 4).map((row) => row.countryCode)
  const selectedTrend = trendCountries.length ? trendCountries : defaultTrend
  const toggleTrend = (code) => setTrendCountries((current) => {
    const base = current.length ? current : defaultTrend
    if (base.includes(code)) return base.filter((item) => item !== code)
    if (base.length >= 4) return [...base.slice(1), code]
    return [...base, code]
  })
  const tableRows = mode === 'historical' ? historicalRows : currentRows

  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">National performance and every medalist</span><h2>Olympic medals</h2><p>Current and historical rankings can be recalculated for one sport, while the permanent archive preserves the athlete and discipline behind every medal.</p></div><div className="heading-badge"><Icon name="podium" /><span><b>{medalArchive.length}</b><small>completed medal events</small></span></div></section>
      <div className="view-switch three-way"><button className={mode === 'table' ? 'active' : ''} onClick={() => setMode('table')}><Icon name="podium" size={16} /> Current table</button><button className={mode === 'historical' ? 'active' : ''} onClick={() => setMode('historical')}><Icon name="chart" size={16} /> Historical ranking</button><button className={mode === 'archive' ? 'active' : ''} onClick={() => setMode('archive')}><Icon name="book" size={16} /> Medal archive</button></div>

      {mode !== 'archive' && <>
        <section className="panel filters-panel medal-ranking-filters"><label className="search-label"><span>Find country</span><div><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search delegation" /></div></label><label><span>Sport ranking</span><select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}><option value="all">All sports</option>{sportOptions.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label><label><span>Ranking</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="gold">Gold-first ranking</option><option value="total">Total medals</option></select></label></section>
        {mode === 'table' && recordHighlights.length > 0 && <section className="medal-record-strip">{recordHighlights.slice(0, 12).map((record) => <article className={record.type === 'WR' ? 'world-record-alert' : 'olympic-record-alert'} key={record.id}><span className="record-burst">{record.type}</span><div><b>{record.event?.name}</b><p>{record.athleteName} · {formatPerformance(record.value, record.event)}</p></div></article>)}</section>}
        {mode === 'historical' && <section className="panel historical-evolution-panel"><SectionTitle icon="chart" title={`${sportFilter === 'all' ? 'All-sport' : sportById(sportFilter)?.name} cumulative medal evolution`} /><p className="section-intro">Select up to four countries. The default is the current all-time top four for the chosen sport.</p><div className="trend-country-picker">{historicalRows.slice(0, 16).map((row) => { const country = countryByCode(row.countryCode); return <button className={selectedTrend.includes(row.countryCode) ? 'active' : ''} key={row.countryCode} onClick={() => toggleTrend(row.countryCode)}><CountryFlag country={country} /> {country?.name}<span>{row.total}</span></button> })}</div><MedalEvolutionChart editions={evolutionEditions.map((edition) => ({ ...edition, medalTable: sportFilter === 'all' ? edition.medalTable : aggregateMedalEvents(medalArchive.filter((result) => result.year === edition.year), sportFilter) }))} countryCodes={selectedTrend} /></section>}
        <section className="panel table-panel"><div className="responsive-table"><table><thead><tr><th>Rank</th><th>Country</th>{mode === 'table' && <th className="number">Athletes</th>}<th className="number gold">Gold</th><th className="number silver">Silver</th><th className="number bronze">Bronze</th><th className="number">Total</th>{mode === 'table' && <th className="number">Per 100 athletes</th>}</tr></thead><tbody>{tableRows.map((row, index) => { const country = countryByCode(row.countryCode); const delegation = delegations.find((item) => item.countryCode === row.countryCode); const efficiency = delegation ? row.total / delegation.athletes * 100 : 0; return <tr key={row.countryCode} onClick={() => setSelectedCountry(row.countryCode)}><td><span className={`table-rank ${index < 3 ? `top-${index + 1}` : ''}`}>{index + 1}</span></td><td><span className="country-cell"><CountryFlag country={country} /><span><strong>{country?.name}</strong><small>{sportFilter === 'all' ? (mode === 'historical' ? 'All-time simulated history' : `${delegation?.sports || 0} sports`) : sportById(sportFilter)?.name}</small></span></span></td>{mode === 'table' && <td className="number">{delegation?.athletes || 0}</td>}<td className="number medal-number">{row.gold}</td><td className="number medal-number">{row.silver}</td><td className="number medal-number">{row.bronze}</td><td className="number total-number">{row.total}</td>{mode === 'table' && <td className="number">{efficiency.toFixed(1)}</td>}</tr> })}</tbody></table></div>{!tableRows.length && <EmptyState icon="podium" text={mode === 'historical' ? 'Complete an Olympic edition to create the historical ranking.' : 'No medals have been awarded in this sport yet.'} />}</section>
      </>}

      {mode === 'archive' && <>
        <section className="panel records-filters medal-archive-filters"><label><span>Edition</span><select value={editionFilter} onChange={(event) => setEditionFilter(event.target.value)}><option value="all">All editions</option>{editionOptions.map((year) => <option key={year} value={year}>{year}</option>)}</select></label><label><span>Sport</span><select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}><option value="all">All sports</option>{sportOptions.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label><label><span>Country</span><select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}><option value="all">All countries</option>{countryOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label><label className="search-label"><span>Event</span><div><Icon name="search" size={17} /><input value={eventSearch} onChange={(event) => setEventSearch(event.target.value)} placeholder="Search event" /></div></label></section>
        <section className="panel table-panel"><div className="responsive-table medal-archive-table"><table><thead><tr><th>Edition</th><th>Event</th><th>Gold</th><th>Silver</th><th>Bronze</th><th>Records</th></tr></thead><tbody>{archiveRows.slice(0, 500).map((result) => <tr key={`${result.year}-${result.eventId}`}><td><b>{result.year}</b><small className="table-subline">{result.host}</small></td><td><button className="text-button" onClick={() => { if (result.year === state.edition.year) setSelectedEvent(result.eventId) }}>{result.eventName}</button><small className="table-subline">{sportById(result.sportId)?.name}</small></td>{['gold','silver','bronze'].map((medal) => { const winner = result.podium.find((row) => row.medal === medal); const country = countryByCode(winner?.countryCode); return <td key={medal}>{winner ? <button className="archive-medalist" onClick={() => winner.athleteId && setSelectedAthlete(winner.athleteId)}><span>{medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : '🥉'}</span><span><b>{winner.displayName || 'Olympic team'}</b><small><CountryFlag country={country} /> {country?.name}</small></span></button> : '—'}</td> })}<td>{result.newRecords?.length ? result.newRecords.map((record) => <span key={record.id} className={`result-record-badge ${record.type.toLowerCase()}`}>{record.type}</span>) : '—'}</td></tr>)}</tbody></table></div>{archiveRows.length > 500 && <div className="table-note">Showing 500 medal events. Refine the filters to narrow the archive.</div>}{!archiveRows.length && <EmptyState icon="medal" text="No medal events match these filters." />}</section>
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
              <div className="country-card-head"><CountryFlag country={country} className="large-flag" size="large" /><span><b>{country?.name}</b><small>{row.athletes} qualified athletes</small></span><span className={`trend ${investment?.trend === 'rising' ? 'up' : investment?.trend === 'falling' ? 'down' : ''}`}><Icon name={investment?.trend === 'rising' ? 'arrowUp' : investment?.trend === 'falling' ? 'arrowDown' : 'minus'} size={15} /></span></div>
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
                    <td><span className="country-inline"><CountryFlag country={country} /> {country?.name}</span></td><td><span className="sport-cell"><Icon name={sport?.icon || 'medal'} size={17} />{sport?.name}</span></td><td><span className={`rarity-badge ${athlete.rarity}`}>{rarityLabels[athlete.rarity]}</span></td><td className="number">{athlete.age}</td><td className="number"><b>{athlete.currentRating}</b><small className="table-subline">potential {athlete.baseSkill}</small></td><td className="number">{(athlete.status === 'retired' ? athlete.careerMedals : athlete.medals).gold}</td><td className="number">{(athlete.status === 'retired' ? athlete.careerMedals : athlete.medals).silver}</td><td className="number">{(athlete.status === 'retired' ? athlete.careerMedals : athlete.medals).bronze}</td>
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
  const [sourceFilter, setSourceFilter] = useState('all')
  const [standingOnly, setStandingOnly] = useState(false)
  const allRecordRows = getRecordRows(state)
  const rows = allRecordRows
    .filter((record) => sportFilter === 'all' || record.sportId === sportFilter)
    .filter((record) => countryFilter === 'all' || record.countryCode === countryFilter)
    .filter((record) => eventFilter === 'all' || (record.eventKey || record.eventId) === eventFilter)
    .filter((record) => typeFilter === 'all' || record.type === typeFilter)
    .filter((record) => sourceFilter === 'all' || (sourceFilter === 'qualification' ? record.source === 'qualification' : record.source !== 'qualification'))
    .filter((record) => !standingOnly || record.standing)
    .sort((a, b) => b.year - a.year || a.event?.name.localeCompare(b.event?.name))

  const longest = [...allRecordRows].sort((a, b) => b.duration - a.duration)[0]
  const mythicStanding = allRecordRows.filter((record) => record.standing && record.type === 'WR').sort((a, b) => b.age - a.age || (b.chasers?.length || 0) - (a.chasers?.length || 0)).slice(0, 6)
  const availableSports = [...new Set(state.records.map((record) => record.sportId))].map(sportById).filter(Boolean)
  const availableCountries = [...new Set(state.records.map((record) => record.countryCode))].map(countryByCode).filter(Boolean)

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">Standards across time</span><h2>World & Olympic records</h2><p>Every record keeps its complete lineage: athlete, country, host edition, previous mark, replacement mark and exactly how many years it survived.</p></div>
        <div className="heading-badge"><Icon name="record" /><span><b>{state.records.length}</b><small>record entries</small></span></div>
      </section>

      <section className="metric-grid three">
        <Metric icon="record" label="Standing records" value={allRecordRows.filter((record) => record.standing).length} detail="Current WR and OR marks" />
        <Metric icon="clock" label="Longest reign" value={longest ? `${longest.duration} yrs` : '—'} detail={longest?.event?.name || 'No record history yet'} />
        <Metric icon="flag" label="Record nations" value={availableCountries.length} detail="Countries represented by record holders" />
      </section>

      <section className="panel record-mythology-panel">
        <SectionTitle icon="star" title="Record mythology & active chases" />
        <p className="section-intro">A record now acquires status as it survives Olympiads. The oldest standing world marks become part of the sport's mythology, while the closest current challengers stay visible.</p>
        {mythicStanding.length ? <div className="record-mythology-grid">{mythicStanding.map((record) => <article key={record.id}><div className="mythology-head"><span className={`record-type ${record.type.toLowerCase()}`}>{record.type}</span><span className="mythology-label">{record.mythology}</span></div><h3>{record.event?.name}</h3><strong>{formatPerformance(record.value, record.event)}</strong><p>{record.athlete?.name} · {countryByCode(record.countryCode)?.name} · standing {record.age} year{record.age === 1 ? '' : 's'}</p>{record.chasers?.length ? <div className="record-chasers"><small>Closest chasers</small>{record.chasers.map((chaser) => <button key={chaser.athleteId} onClick={() => setSelectedAthlete(chaser.athleteId)}><span>{chaser.athlete?.name || 'Challenger'}</span><b>{chaser.gapPct.toFixed(2)}% away</b></button>)}</div> : <small className="no-chaser">No current challenger is close enough to define a chase.</small>}</article>)}</div> : <EmptyState icon="record" text="The record book is still too young for mythology. Long-lived world records will appear here." />}
      </section>

      <section className="panel records-filters">
        <label><span>Sport</span><select value={sportFilter} onChange={(event) => { setSportFilter(event.target.value); setEventFilter('all') }}><option value="all">All sports</option>{availableSports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}</select></label>
        <label><span>Event</span><select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)}><option value="all">All events</option>{[...new Map(allRecordRows.filter((record) => sportFilter === 'all' || record.sportId === sportFilter).map((record) => [record.eventKey || record.eventId, record.event])).entries()].map(([key, event]) => <option key={key} value={key}>{event.name}</option>)}</select></label>
        <label><span>Country</span><select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}><option value="all">All countries</option>{availableCountries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
        <label><span>Type</span><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">WR and OR</option><option value="WR">World records</option><option value="OR">Olympic records</option></select></label>
        <label><span>Where set</span><select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="all">Olympics + qualification</option><option value="olympics">Olympic Games only</option><option value="qualification">Qualification only</option></select></label>
        <label className="check-label"><input type="checkbox" checked={standingOnly} onChange={(event) => setStandingOnly(event.target.checked)} /><span>Standing only</span></label>
      </section>

      <section className="panel table-panel">
        <div className="responsive-table records-table">
          <table>
            <thead><tr><th>Record</th><th>Event</th><th>Performance</th><th>Athlete</th><th>Country</th><th>Competition</th><th>Set</th><th className="number">Duration</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((record) => {
                const country = countryByCode(record.countryCode)
                return (
                  <tr key={record.id}>
                    <td><span className={`record-type ${record.type.toLowerCase()}`}>{record.type}</span></td>
                    <td><button className="text-button" onClick={() => { const currentEvent = state.events.find((item) => (item.recordKey || item.id) === (record.eventKey || record.eventId)); if (currentEvent) setSelectedEvent(currentEvent.id) }}>{record.event?.name}</button><small className="table-subline">{sportById(record.sportId)?.name}</small></td>
                    <td><strong className="performance-value">{record.event ? formatPerformance(record.value, record.event) : record.value.toFixed(2)}</strong></td>
                    <td><button className="text-button" onClick={() => setSelectedAthlete(record.athleteId)}>{record.athlete?.name || 'Historic athlete'}</button></td>
                    <td><span className="country-inline"><CountryFlag country={country} /> {country?.name}</span></td><td><span className={`status-badge ${record.source === 'qualification' ? 'qualification-source' : 'olympic-source'}`}>{record.source === 'qualification' ? 'Qualification' : 'Olympic Games'}</span><small className="table-subline">{record.competition || `${record.host} ${record.year}`}</small></td><td>{record.host} {record.year}</td><td className="number"><b>{record.duration}</b> yrs</td><td><span className={`status-badge ${record.standing ? 'standing' : 'broken'}`}>{record.standing ? 'Standing' : 'Broken'}</span></td>
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
  const hostAddedKeys = new Set((state.programmeChanges?.hostAdded || []).map((event) => event.recordKey))
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
        <div><span className="eyebrow">Era-realistic, host-influenced programme</span><h2>{state.edition.host} {state.edition.year} programme</h2><p>The historical era controls what is plausible, but this is no longer a recreation of the real host sequence. The selected city can accelerate appropriate sports and disciplines, while other events may leave the programme.</p></div>
        <div className="heading-badge"><Icon name="medal" /><span><b>{state.events.length}</b><small>medal events</small></span></div>
      </section>

      <section className="metric-grid four">
        <Metric icon="medal" label="Sports / disciplines" value={sports.length} detail={`${state.edition.events} medal decisions`} />
        <Metric icon="sparkles" label="Added events" value={state.programmeChanges?.added?.length || state.events.length} detail={`${state.programmeChanges?.hostAdded?.length || 0} selected by the host bid`} />
        <Metric icon="arrowDown" label="Removed events" value={state.programmeChanges?.removed?.length || 0} detail={previousYear ? `Not contested since ${previousYear}` : 'No prior Games'} />
        <Metric icon="record" label="Record events" value={state.events.filter((event) => event.recordEligible).length} detail="Timed, measured or scored marks" />
      </section>

      {(state.programmeChanges?.hostAdded?.length || 0) > 0 && <section className="panel host-programme-panel"><SectionTitle icon="trophy" title={`${state.edition.host} programme choices`} /><p>The winning bid used its sporting identity to add these era-appropriate events. Hosting also boosts national investment and facilities beyond this edition.</p><div className="change-chip-list">{state.programmeChanges.hostAdded.map((event) => <span className="host-choice-chip" key={event.recordKey}><Icon name={sportById(event.sportId)?.icon || 'medal'} size={15} />{event.name}</span>)}</div></section>}

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
            <tbody>{rows.map((event) => { const sport = sportById(event.sportId); return <tr key={event.id} onClick={() => setSelectedEvent(event.id)}><td><button className="text-button">{event.name}</button></td><td><span className="sport-cell"><Icon name={sport?.icon || 'medal'} size={17} />{sport?.name}</span></td><td>{event.gender === 'M' ? 'Men' : event.gender === 'F' ? 'Women' : 'Mixed / open'}</td><td>{event.team ? 'Team' : sport?.category}</td><td>{event.recordEligible ? `${event.metric.toUpperCase()} · ${event.unit}` : 'No WR/OR'}</td><td>{hostAddedKeys.has(event.recordKey) ? <span className="status-badge host-choice">Host choice</span> : addedKeys.has(event.recordKey) ? <span className="status-badge standing">New</span> : <span className="status-badge">Continuing</span>}</td></tr> })}</tbody>
          </table>
        </div>
        {!rows.length && <EmptyState icon="medal" text="No events match these programme filters." />}
      </section>
    </div>
  )
}

function AlmanacView({ state }) {
  const history = [...state.history]
  const rivalries = getRivalryRows(state).filter((row) => row.meaningful).slice(0, 12)
  const iconicMoments = [...(state.iconicMoments || [])].sort((a, b) => b.score - a.score || b.year - a.year).slice(0, 24)
  if (state.phase === 'complete' || state.phase === 'host-selection' || state.phase === 'host-selected') {
    history.push({ edition: state.edition, medalTable: state.medalTable, recordsSet: state.records.filter((record) => record.year === state.edition.year && record.source !== 'qualification').length, resultsCount: state.results.length, topAthletes: [...state.athletes].sort((a, b) => medalScore(b.medals) - medalScore(a.medals)).slice(0, 5) })
  }
  const maxYear = Math.max(2028, state.edition.year + 16)
  const years = Array.from({ length: Math.floor((maxYear - 1896) / 4) + 1 }, (_, index) => 1896 + index * 4)
  const playedMap = new Map(history.map((entry) => [entry.edition.year, entry]))
  playedMap.set(state.edition.year, { edition: state.edition, medalTable: state.medalTable, resultsCount: state.results.length, recordsSet: state.records.filter((record) => record.year === state.edition.year && record.source !== 'qualification').length, current: true })
  const programmeEntries = [...history.map((entry) => entry.edition), state.edition].filter((edition, index, rows) => rows.findIndex((item) => item.year === edition.year) === index).sort((a, b) => a.year - b.year)
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">The complete procedural Olympic archive</span><h2>Historical almanac</h2><p>Athens 1896 is fixed; every later host belongs to this universe. Years, technology, participation and plausible sport introductions evolve historically, but cities, host legacies, programme choices, qualification stories and medal outcomes do not recreate real history.</p></div><div className="heading-badge"><Icon name="book" /><span><b>{history.length}</b><small>completed editions</small></span></div></section>
      <section className="panel timeline-panel"><SectionTitle icon="calendar" title="Your Summer Olympic timeline" /><div className="edition-timeline">{years.map((year) => { const played = playedMap.get(year); const edition = played?.edition; const current = state.edition.year === year; return <div key={year} className={`timeline-edition ${played ? 'played' : 'future'} ${current ? 'current' : ''}`}><div className="timeline-dot"><span /></div><div className="timeline-card"><div className="timeline-year"><b>{year}</b>{current && <span>Current</span>}{played && !current && <span>Played</span>}</div>{edition ? <><div className="timeline-host"><CountryFlag country={countryByCode(edition.countryCode)} /> {edition.host}, {edition.country}</div><div className="timeline-stats"><span><b>{edition.events}</b> events</span><span><b>{edition.sports}</b> sports</span><span><b>{edition.athletes.toLocaleString()}</b> athletes</span><span><b>{edition.womenPct}%</b> women</span></div>{played?.resultsCount > 0 && <div className="played-summary"><Icon name="trophy" size={15} /> {played.resultsCount} champions · {played.recordsSet || 0} Olympic records</div>}</> : <><div className="timeline-host">🌍 Host not yet selected</div><p>The host race opens after the previous Games. The same continent cannot win twice consecutively.</p></>}</div></div> })}</div></section>
      {(state.hostSelectionHistory || []).length > 0 && <section className="panel"><SectionTitle icon="trophy" title="Host election archive" /><div className="host-election-history">{state.hostSelectionHistory.map((selection) => <article key={selection.year}><CountryFlag country={countryByCode(selection.winner.countryCode)} className="large-flag" size="large" /><span><b>{selection.winner.city} {selection.year}</b><small>{countryByCode(selection.winner.countryCode)?.name} · defeated {selection.candidates.filter((candidate) => candidate.city !== selection.winner.city).map((candidate) => candidate.city).join(', ')}</small></span></article>)}</div></section>}
      <section className="panel historical-qualification-panel"><SectionTitle icon="flag" title="Historical qualification archive" /><p className="section-intro">Qualification is stored with every completed Olympiad. Open the current cycle under Qualification; this archive shows how many named qualification competitions, places and pre-Games records shaped each past edition.</p><div className="responsive-table"><table><thead><tr><th>Games</th><th>Host</th><th className="number">Qualification events</th><th className="number">Places awarded</th><th className="number">Pre-Games WR/OR</th><th>Notable circuit</th></tr></thead><tbody>{history.slice().sort((a, b) => b.edition.year - a.edition.year).map((entry) => { const competitions = entry.qualificationCompetitions || []; const places = competitions.reduce((total, competition) => total + (competition.places || 0), 0); const records = state.records.filter((record) => record.year === entry.edition.year && record.source === 'qualification'); return <tr key={entry.edition.year}><td><b>{entry.edition.year}</b></td><td><span className="country-inline"><CountryFlag country={countryByCode(entry.edition.countryCode)} /> {entry.edition.host}</span></td><td className="number">{competitions.length}</td><td className="number">{places.toLocaleString()}</td><td className="number">{records.length}</td><td>{competitions.length ? competitions.slice(0, 2).map((competition) => `${competition.name} (${competition.host})`).join(' · ') : 'No archived circuit'}</td></tr> })}</tbody></table></div></section>
      <div className="dashboard-grid lower almanac-mythology-grid">
        <section className="panel"><SectionTitle icon="trophy" title="Great rivalries" />{rivalries.length ? <div className="almanac-rivalries">{rivalries.map((rivalry, index) => <article key={rivalry.id}><span className="rank-number">{index + 1}</span><span><b>{rivalry.athleteA.name} vs {rivalry.athleteB.name}</b><small>{rivalry.eventName} · {rivalry.meetings} meetings · {rivalry.aWins}–{rivalry.bWins}</small></span><strong>{rivalry.score}</strong></article>)}</div> : <EmptyState icon="trophy" text="No rivalry has become historically meaningful yet." />}</section>
        <section className="panel"><SectionTitle icon="sparkles" title="Olympic mythology" />{iconicMoments.length ? <div className="almanac-moments">{iconicMoments.map((moment) => <article key={moment.id}><span>{moment.year}</span><div><b>{moment.title}</b><small>{moment.host} · {moment.eventName}</small><p>{moment.body}</p></div></article>)}</div> : <EmptyState icon="sparkles" text="Iconic moments will accumulate here across generations." />}</section>
      </div>
      <section className="panel programme-evolution"><SectionTitle icon="chart" title="Programme evolution in this universe" /><div className="evolution-chart" aria-label="Olympic event count by simulated edition">{programmeEntries.map((edition) => <div className={`evolution-bar ${edition.year === state.edition.year ? 'current' : ''}`} key={edition.year} title={`${edition.host} ${edition.year}: ${edition.events} events`}><span style={{ height: `${Math.max(5, edition.events / 4)}px` }} /><small>{edition.year}</small></div>)}</div><div className="evolution-caption"><span><b>{programmeEntries[0]?.events || 43}</b> events at Athens 1896</span><span><b>{state.edition.events}</b> events in the current programme</span><span><b>{state.programmeChanges?.hostAdded?.length || 0}</b> current host-selected events</span></div></section>
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
        return <button key={row.countryCode} onClick={() => setSelectedCountry(row.countryCode)}><span>{index + 1}</span><span><CountryFlag country={country} /> <b>{country?.name}</b></span><span>{row.gold}</span><span>{row.silver}</span><span>{row.bronze}</span><span><b>{row.total}</b></span></button>
      })}
      {!rows.length && <EmptyState icon="podium" text="The medal table is waiting for its first champion." />}
    </div>
  )
}

function ResultCard({ result, event, state, setSelectedAthlete, setSelectedEvent }) {
  const sport = sportById(result.sportId)
  const eventRecords = recordsForEventRounds(state.roundResults, event.id)
  return (
    <article className={`result-card ${eventRecords.some((record) => record.type === 'WR') ? 'has-world-record' : ''}`}>
      <button className="result-card-head" onClick={() => setSelectedEvent(event.id)}><span className="sport-icon"><Icon name={sport?.icon || 'medal'} size={19} /></span><span><b>{event.name}</b><small>{sport?.name}</small></span>{eventRecords.map((record) => <span key={record.id} className={`result-record-badge ${record.type.toLowerCase()}`}>{record.type}</span>)}<Icon name="chevron" size={16} /></button>
      <div className="podium-list">
        {result.podium.map((medalist) => {
          const athlete = state.athletes.find((item) => item.id === medalist.athleteId)
          const country = countryByCode(medalist.countryCode)
          return <button key={medalist.athleteId} onClick={() => setSelectedAthlete(medalist.athleteId)}><span className={`podium-medal ${medalist.medal}`}>{medalist.place}</span><span><b>{medalist.displayName || athlete?.name}</b><small><CountryFlag country={country} /> {country?.name}</small></span><strong>{formatPerformance(medalist.value, event)}</strong></button>
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
  const qualificationHistory = [...(athlete.qualificationHistory || [])].sort((a, b) => b.editionYear - a.editionYear)
  const olympicHistory = [...(athlete.competitionHistory || [])].sort((a, b) => b.editionYear - a.editionYear || a.day - b.day)
  const rivalries = getRivalryRows(state).filter((row) => row.meaningful && (row.athleteAId === athlete.id || row.athleteBId === athlete.id)).slice(0, 5)
  const iconicMoments = (state.iconicMoments || []).filter((moment) => moment.athleteIds?.includes(athlete.id)).sort((a, b) => b.score - a.score).slice(0, 8)
  return (
    <ModalShell title={athlete.name} subtitle={<span className="country-inline"><CountryFlag country={country} />{country?.name} · {sport?.name}</span>} close={close} icon="users">
      <div className="profile-hero"><div className={`profile-avatar rarity-${athlete.rarity}`}>{athlete.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div className="profile-main"><span className={`rarity-badge ${athlete.rarity}`}>{rarityLabels[athlete.rarity]}</span><h3>{athlete.currentRating} current rating</h3><p>Age {athlete.age} · peak around {athlete.peakAge} · {athlete.status === 'retired' ? 'retired' : `${yearsRemaining} projected years remaining`}</p></div><div className="profile-medals"><span>🥇<b>{careerMedals.gold}</b></span><span>🥈<b>{careerMedals.silver}</b></span><span>🥉<b>{careerMedals.bronze}</b></span></div></div>
      <div className="modal-stat-grid four-stats"><Metric icon="chart" label="Current rating" value={athlete.currentRating} detail={`${athlete.currentRating >= athlete.baseSkill ? 'At' : 'Below'} full potential`} /><Metric icon="star" label="Career potential" value={athlete.baseSkill} detail="Fixed talent ceiling" /><Metric icon="calendar" label="Appearances" value={athlete.appearances} detail={(athlete.appearanceYears || []).join(' · ') || 'No Olympic appearance'} /><Metric icon="record" label="Records" value={athleteRecords.length} detail="WR and OR entries" /></div>
      {(rivalries.length > 0 || iconicMoments.length > 0) && <section className="modal-section athlete-mythology"><h3>Rivalries & defining moments</h3><div className="athlete-mythology-grid">{rivalries.length > 0 && <div><h4>Rivals</h4>{rivalries.map((rivalry) => { const opponent = rivalry.athleteAId === athlete.id ? rivalry.athleteB : rivalry.athleteA; const ownWins = rivalry.athleteAId === athlete.id ? rivalry.aWins : rivalry.bWins; const oppWins = rivalry.athleteAId === athlete.id ? rivalry.bWins : rivalry.aWins; return <article key={rivalry.id}><b>{opponent.name}</b><small>{rivalry.eventName}</small><strong>{ownWins}–{oppWins}</strong></article> })}</div>}{iconicMoments.length > 0 && <div><h4>Olympic mythology</h4>{iconicMoments.map((moment) => <article key={moment.id}><b>{moment.title}</b><small>{moment.host} {moment.year} · {moment.eventName}</small><span>{moment.type.replaceAll('-', ' ')}</span></article>)}</div>}</div></section>}
      <section className="modal-section"><h3>Career development</h3><div className="career-curve" aria-label="Olympic rating history">{ratingHistory.map((row) => <div key={`${row.year}-${row.age}`} className={row.year === state.edition.year ? 'current' : ''}><span className="curve-value">{row.rating}</span><i style={{ height: `${Math.max(8, row.rating / maxRating * 112)}px` }} /><b>{row.year}</b><small>Age {row.age}</small></div>)}{!ratingHistory.length && <EmptyState icon="chart" text="No rating history has been recorded yet." />}</div><div className="career-window"><span>Debut age <b>{athlete.careerStartAge}</b></span><span>Peak age <b>{athlete.peakAge}</b></span><span>Projected retirement <b>{athlete.retirementAge}</b></span><span>Career span <b>{athlete.retirementAge - athlete.careerStartAge} years</b></span></div></section>
      <section className="modal-section"><h3>Qualification history</h3>{qualificationHistory.length ? <div className="responsive-table athlete-path-table"><table><thead><tr><th>Olympiad</th><th>Competition</th><th>Discipline</th><th className="number">Competition rank</th><th className="number">World rank</th><th>Mark</th><th>Status</th></tr></thead><tbody>{qualificationHistory.map((row, index) => { const event = state.events.find((item) => item.id === row.eventId) || state.events.find((item) => item.recordKey === row.eventKey); return <tr key={`${row.editionYear}-${row.competitionId}-${index}`}><td><b>{row.editionYear}</b></td><td>{row.competition}<small className="table-subline">{row.hostCity} · {row.year}</small></td><td>{row.eventName}</td><td className="number">{row.rank}</td><td className="number">{row.globalRank}</td><td>{event && row.value != null ? <b>{formatPerformance(row.value, event)}</b> : '—'}</td><td>{row.qualified ? <span className="status-badge standing">Qualified</span> : <span className="status-badge broken">Missed Games</span>}</td></tr> })}</tbody></table></div> : <EmptyState icon="flag" text="No qualification history is stored for this athlete yet." />}</section>
      <section className="modal-section"><h3>Olympic round-by-round progression</h3>{olympicHistory.length ? <div className="responsive-table athlete-path-table"><table><thead><tr><th>Games</th><th>Day</th><th>Event</th><th>Round</th><th className="number">Rank</th><th>Performance</th><th>Outcome</th></tr></thead><tbody>{olympicHistory.map((row, index) => { const event = state.events.find((item) => item.id === row.eventId) || state.events.find((item) => item.recordKey === row.eventKey); return <tr key={`${row.editionYear}-${row.eventKey}-${row.stage}-${index}`}><td><b>{row.editionYear}</b><small className="table-subline">{row.host}</small></td><td>Day {row.day}</td><td>{row.eventName}</td><td>{row.stage}</td><td className="number"><b>{row.rank}</b></td><td>{event && row.value != null ? formatPerformance(row.value, event) : row.value?.toFixed?.(2) || '—'}</td><td>{row.medal ? <span className={`medal-detail-badge ${row.medal}`}>{row.medal === 'gold' ? '🥇 Gold' : row.medal === 'silver' ? '🥈 Silver' : '🥉 Bronze'}</span> : row.advanced ? <span className="status-badge standing">Advanced</span> : <span className="status-badge broken">Eliminated</span>}</td></tr> })}</tbody></table></div> : <EmptyState icon="calendar" text="No Olympic round has been completed for this athlete yet." />}</section>
      <section className="modal-section"><h3>Olympic medals</h3>{careerResults.length ? <div className="achievement-list">{careerResults.map((result, index) => <div key={`${result.year}-${result.eventKey}-${index}`}><span>{result.medal === 'gold' ? '🥇' : result.medal === 'silver' ? '🥈' : '🥉'}</span><span><b>{result.eventName}</b><small>{result.host} {result.year}</small></span><strong className="career-edition">{result.year}</strong></div>)}</div> : <EmptyState icon="medal" text="No Olympic medals yet." />}</section>
    </ModalShell>
  )
}

function CountryModal({ country, state, close, setSelectedAthlete }) {
  const [tab, setTab] = useState('history')
  const investment = state.investments.find((item) => item.countryCode === country.code)
  const qualifiedAthletes = state.athletes.filter((athlete) => athlete.countryCode === country.code)
  const activeAthletes = (state.careerPool || []).filter((athlete) => athlete.countryCode === country.code && athlete.status === 'active').sort((a, b) => b.currentRating - a.currentRating)
  const allKnownAthletes = [...state.athletes, ...(state.careerPool || []), ...(state.athleteArchive || [])].filter((athlete, index, rows) => athlete.countryCode === country.code && rows.findIndex((item) => item.id === athlete.id) === index)
  const medalists = allKnownAthletes.filter((athlete) => medalScore(athlete.careerMedals || athlete.medals) > 0).sort((a, b) => medalScore(b.careerMedals || b.medals) - medalScore(a.careerMedals || a.medals) || b.baseSkill - a.baseSkill)
  const currentMedals = state.medalTable.find((row) => row.countryCode === country.code) || { gold: 0, silver: 0, bronze: 0, total: 0 }
  const historyRows = state.history.map((entry) => {
    const row = entry.countryStats?.find((item) => item.countryCode === country.code)
    return row ? { year: entry.edition.year, host: entry.edition.host, ...row } : null
  }).filter(Boolean)
  if (qualifiedAthletes.length || currentMedals.total) historyRows.push({ year: state.edition.year, host: state.edition.host, athletes: qualifiedAthletes.length, sports: new Set(qualifiedAthletes.map((athlete) => athlete.sportId)).size, ...currentMedals })
  const allTime = historyRows.reduce((totals, row) => ({ gold: totals.gold + (row.gold || 0), silver: totals.silver + (row.silver || 0), bronze: totals.bronze + (row.bronze || 0), total: totals.total + (row.total || 0) }), { gold: 0, silver: 0, bronze: 0, total: 0 })
  const historicalMedalEvents = state.history.flatMap((entry) => (entry.medalResults || []).map((result) => ({ ...result, year: entry.edition.year, host: entry.edition.host, newRecords: recordsForEventRounds(entry.roundResults, result.eventId) })))
  const currentMedalEvents = state.results.map((result) => ({ ...result, year: state.edition.year, host: state.edition.host, eventName: state.events.find((event) => event.id === result.eventId)?.name || 'Event', newRecords: recordsForEventRounds(state.roundResults, result.eventId) }))
  const medalDetails = [...historicalMedalEvents, ...currentMedalEvents].flatMap((result) => result.podium.filter((medalist) => medalist.countryCode === country.code).map((medalist) => ({ year: result.year, host: result.host, sportId: result.sportId, eventName: result.eventName, medal: medalist.medal, athleteId: medalist.athleteId, displayName: medalist.displayName }))).sort((a, b) => b.year - a.year || a.sportId.localeCompare(b.sportId) || a.eventName.localeCompare(b.eventName))
  const sportBreakdown = [...new Set(medalDetails.map((row) => row.sportId))].map((sportId) => {
    const rows = medalDetails.filter((row) => row.sportId === sportId)
    return { sportId, gold: rows.filter((row) => row.medal === 'gold').length, silver: rows.filter((row) => row.medal === 'silver').length, bronze: rows.filter((row) => row.medal === 'bronze').length, total: rows.length }
  }).sort((a, b) => b.total - a.total)
  const openAthlete = (id) => { if (!id) return; close(); setSelectedAthlete(id) }
  return (
    <ModalShell title={country.name} subtitle={<span className="country-inline"><CountryFlag country={country} /> National Olympic programme</span>} close={close} icon="globe">
      <div className="country-modal-hero"><CountryFlag country={country} className="huge-flag" size="large" /><div><h3>{qualifiedAthletes.length} qualified athletes in {state.edition.year}</h3><p>{country.firstYear ? `Olympic history since ${country.firstYear}` : 'Olympic delegation'} · {activeAthletes.length} active athletes in the wider national pathway · {medalists.length} known medalists</p></div><div className="profile-medals"><span>🥇<b>{allTime.gold}</b></span><span>🥈<b>{allTime.silver}</b></span><span>🥉<b>{allTime.bronze}</b></span></div></div>
      <div className="modal-stat-grid"><Metric icon="chart" label="Investment" value={investment?.overall || 0} detail={investment?.hostBoost ? `Host legacy +${investment.hostBoost}` : investment?.trend === 'rising' ? 'Programme rising' : investment?.trend === 'falling' ? 'Programme falling' : 'Stable programme'} /><Metric icon="country" label="Facilities" value={investment?.facilities || 0} detail="Training infrastructure" /><Metric icon="users" label="Youth pathway" value={investment?.youth || 0} detail="Future athlete production" /></div>
      <div className="modal-tabs country-modal-tabs"><button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Year breakdown</button><button className={tab === 'medals' ? 'active' : ''} onClick={() => setTab('medals')}>All medals</button><button className={tab === 'athletes' ? 'active' : ''} onClick={() => setTab('athletes')}>Active athletes</button><button className={tab === 'medalists' ? 'active' : ''} onClick={() => setTab('medalists')}>Medalists</button></div>

      {tab === 'history' && <>
        <section className="modal-section"><h3>Priority sports</h3><div className="focus-sport-grid">{investment?.focusSports.map((sportId) => { const sport = sportById(sportId); return <div key={sportId}><span className="sport-icon"><Icon name={sport?.icon || 'medal'} /></span><span><b>{sport?.name}</b><small>Investment {investment.allocations[sportId]}</small></span></div> })}</div></section>
        <section className="modal-section"><h3>Olympic history by edition</h3>{historyRows.length ? <div className="responsive-table compact-history"><table><thead><tr><th>Games</th><th className="number">Athletes</th><th className="number">Sports</th><th className="number">🥇</th><th className="number">🥈</th><th className="number">🥉</th><th className="number">Total</th></tr></thead><tbody>{historyRows.map((row) => <tr key={row.year}><td><b>{row.year}</b><small className="table-subline">{row.host}</small></td><td className="number">{row.athletes || 0}</td><td className="number">{row.sports || 0}</td><td className="number">{row.gold || 0}</td><td className="number">{row.silver || 0}</td><td className="number">{row.bronze || 0}</td><td className="number"><b>{row.total || 0}</b></td></tr>)}</tbody></table></div> : <EmptyState icon="book" text="This delegation has not yet appeared in the simulated history." />}</section>
        <section className="modal-section"><h3>Medals by sport</h3>{sportBreakdown.length ? <div className="responsive-table compact-history"><table><thead><tr><th>Sport</th><th className="number">🥇</th><th className="number">🥈</th><th className="number">🥉</th><th className="number">Total</th></tr></thead><tbody>{sportBreakdown.map((row) => { const sport = sportById(row.sportId); return <tr key={row.sportId}><td><span className="sport-cell"><Icon name={sport?.icon || 'medal'} size={17} />{sport?.name}</span></td><td className="number">{row.gold}</td><td className="number">{row.silver}</td><td className="number">{row.bronze}</td><td className="number"><b>{row.total}</b></td></tr> })}</tbody></table></div> : <EmptyState icon="medal" text="No medals have been won yet." />}</section>
      </>}

      {tab === 'medals' && <section className="modal-section"><h3>Every Olympic medal</h3>{medalDetails.length ? <div className="responsive-table country-medal-detail"><table><thead><tr><th>Year</th><th>Sport</th><th>Discipline / event</th><th>Medal</th><th>Athlete / team</th></tr></thead><tbody>{medalDetails.map((row, index) => { const sport = sportById(row.sportId); return <tr key={`${row.year}-${row.eventName}-${row.medal}-${index}`}><td><b>{row.year}</b><small className="table-subline">{row.host}</small></td><td><span className="sport-cell"><Icon name={sport?.icon || 'medal'} size={16} />{sport?.name}</span></td><td>{row.eventName}</td><td><span className={`medal-detail-badge ${row.medal}`}>{row.medal === 'gold' ? '🥇 Gold' : row.medal === 'silver' ? '🥈 Silver' : '🥉 Bronze'}</span></td><td>{row.athleteId ? <button className="text-button" onClick={() => openAthlete(row.athleteId)}>{row.displayName || 'Olympic team'}</button> : row.displayName || 'Olympic team'}</td></tr> })}</tbody></table></div> : <EmptyState icon="medal" text="No medals have been won yet." />}</section>}

      {tab === 'athletes' && <section className="modal-section"><h3>All active national athletes</h3>{activeAthletes.length ? <div className="responsive-table"><table><thead><tr><th>Athlete</th><th>Sport</th><th>Rarity</th><th className="number">Age</th><th className="number">Rating</th><th>Status</th></tr></thead><tbody>{activeAthletes.map((athlete) => <tr key={athlete.id} onClick={() => openAthlete(athlete.id)}><td><span className="athlete-table-cell"><span className={`athlete-avatar rarity-${athlete.rarity}`}>{athlete.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><strong>{athlete.name}</strong></span></td><td>{sportById(athlete.sportId)?.name}</td><td><span className={`rarity-badge ${athlete.rarity}`}>{rarityLabels[athlete.rarity]}</span></td><td className="number">{athlete.age}</td><td className="number"><b>{athlete.currentRating}</b></td><td>{athlete.qualified ? <span className="status-badge standing">Qualified {state.edition.year}</span> : <span className="status-badge">Active pathway</span>}</td></tr>)}</tbody></table></div> : <EmptyState icon="users" text="No active athletes are retained in the national pathway." />}</section>}

      {tab === 'medalists' && <section className="modal-section"><h3>Permanent medalist register</h3>{medalists.length ? <div className="responsive-table"><table><thead><tr><th>Athlete</th><th>Sport</th><th>Career</th><th className="number">🥇</th><th className="number">🥈</th><th className="number">🥉</th><th className="number">Total</th></tr></thead><tbody>{medalists.map((athlete) => { const medals = athlete.careerMedals || athlete.medals; return <tr key={athlete.id} onClick={() => openAthlete(athlete.id)}><td><span className="athlete-table-cell"><span className={`athlete-avatar rarity-${athlete.rarity}`}>{athlete.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><strong>{athlete.name}</strong></span></td><td>{sportById(athlete.sportId)?.name}</td><td>{athlete.appearanceYears?.join(' · ') || 'Historic Olympian'}</td><td className="number">{medals.gold}</td><td className="number">{medals.silver}</td><td className="number">{medals.bronze}</td><td className="number"><b>{medals.gold + medals.silver + medals.bronze}</b></td></tr> })}</tbody></table></div> : <EmptyState icon="users" text="No medalists have entered the permanent register." />}</section>}
    </ModalShell>
  )
}

function EventModal({ event, state, close, setSelectedAthlete }) {
  const sport = sportById(event.sportId)
  const sessions = state.schedule.filter((session) => session.eventId === event.id)
  const rounds = (state.roundResults || []).filter((round) => round.eventId === event.id)
  const result = state.results.find((item) => item.eventId === event.id)
  const records = getRecordRows(state).filter((record) => (record.eventKey || record.eventId) === (event.recordKey || event.id))
  return (
    <ModalShell title={event.name} subtitle={`${sport?.name} · ${state.edition.host} ${state.edition.year}`} close={close} icon={sport?.icon || 'medal'}>
      <div className="event-format"><span className="sport-icon large"><Icon name={sport?.icon || 'medal'} size={28} /></span><div><h3>{sport?.category?.toUpperCase()} competition engine</h3><p>{sessions.length} rounds are scheduled. Every completed result remains available below, including athletes eliminated before the final.</p></div></div>
      <div className="round-timeline">{sessions.map((session, index) => <div className={session.status} key={session.id}><span>{index + 1}</span><b>{session.stage}</b><small>Day {session.day} · {session.session}</small></div>)}</div>
      <section className="modal-section"><h3>Complete round results</h3>{rounds.length ? <div className="event-round-stack">{rounds.map((round) => <article key={round.id} className="event-round-table"><div className="event-round-title"><span><b>{round.stage}</b><small>Day {round.day} · {round.session} · {round.results.length} competitors</small></span>{round.newRecords?.map((record) => <span className={`result-record-badge ${record.type.toLowerCase()}`} key={record.id}>{record.type}</span>)}</div><div className="responsive-table"><table><thead><tr><th className="number">Rank</th><th>Athlete / team</th><th>Country</th><th>Performance</th><th>Outcome</th></tr></thead><tbody>{round.results.map((row, index) => { const athlete = athleteById(state, row.athleteId); const country = countryByCode(row.countryCode); const medal = result?.podium.find((medalist) => medalist.athleteId === row.athleteId)?.medal; return <tr key={`${round.id}-${row.athleteId}`} onClick={() => setSelectedAthlete(row.athleteId)}><td className="number"><span className={`table-rank ${index < 3 ? `top-${index + 1}` : ''}`}>{index + 1}</span></td><td><b>{row.displayName || athlete?.name}</b><small className="table-subline">Rating {row.rating?.toFixed?.(1) || athlete?.currentRating}</small></td><td><span className="country-inline"><CountryFlag country={country} />{country.name}</span></td><td><b>{formatPerformance(row.value, event)}</b></td><td>{round.isFinal && medal ? <span className={`medal-detail-badge ${medal}`}>{medal === 'gold' ? '🥇 Gold' : medal === 'silver' ? '🥈 Silver' : '🥉 Bronze'}</span> : !round.isFinal && round.qualifiedIds.includes(row.athleteId) ? <span className="status-badge standing">Advanced</span> : <span className="status-badge broken">Eliminated</span>}</td></tr> })}</tbody></table></div></article>)}</div> : <EmptyState icon="clock" text="No round has been simulated yet." />}</section>
      <section className="modal-section"><h3>Record lineage</h3>{records.length ? <div className="record-lineage">{records.map((record) => <div key={record.id}><span className={`record-type ${record.type.toLowerCase()}`}>{record.type}</span><span><b>{formatPerformance(record.value, event)}</b><small>{record.athlete?.name} · {record.competition || record.year} · {record.duration} years</small></span><span className={`status-badge ${record.standing ? 'standing' : 'broken'}`}>{record.standing ? 'Standing' : 'Broken'}</span></div>)}</div> : <EmptyState icon="record" text="No record has been established yet." />}</section>
    </ModalShell>
  )
}

export default App
