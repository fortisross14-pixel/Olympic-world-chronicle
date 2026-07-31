# Olympics Chronicle — Historical Universe V2

A Vite + React Olympic history simulator beginning with Athens 1896. The universe follows the changing Olympic programme, procedural athletes, national sporting investment, qualification fields, medal tables, records and careers across successive editions.

## What is included

### Historical Olympic world

- Starts in **Athens 1896** and advances through every Summer Olympiad.
- Cancelled 1916, 1940 and 1944 editions remain visible in the historical timeline.
- Medal-event programmes evolve by edition rather than using a modern programme retroactively.
- Historical events can debut, disappear, return, change gender or be replaced.
- The bundled programme contains exact medal-event rows for 1896–2020 and curated Paris 2024 / Los Angeles 2028 programmes.
- Los Angeles 2028 is represented with **351 medal events across 36 sports**, including the approved additional sports and mixed events.
- After 2028, the simulation continues procedurally instead of ending.

### Procedural global athletes

- Athletes can come from **234 current and historical Olympic entities**.
- **228 country-specific name pools** generate names from the appropriate national naming base, with gender-aware given-name pools and fallback handling for small delegations.
- Every athlete has:
  - fixed potential and rarity;
  - current edition rating;
  - age, debut age, peak age and projected retirement;
  - sport/event specialties;
  - Olympic appearances;
  - edition-by-edition rating history;
  - career medals and result history.
- Athletes persist between Olympiads. Ratings develop toward the sport-specific peak and decline afterward.
- Career profiles differ by sport: gymnasts and swimmers tend to peak earlier, while shooters, sailors and equestrian athletes can remain competitive much longer.
- Retired Olympic stars remain available in the historical athlete archive.

### Countries and qualification

- Every edition begins in a qualification phase with a complete qualified field.
- Qualification dashboards show delegation size, sports entered, returning Olympians, elite athletes and country totals.
- Country investment changes over time and affects:
  - facilities;
  - youth development;
  - delegation depth;
  - average athlete level;
  - chances of producing Epic, Legend and Generational athletes;
  - sport-specific national strengths.
- Investment is influential but not deterministic: small countries can still produce historic outliers.

### Olympic Games simulation

- A complete multi-day Olympic calendar with morning, afternoon and evening sessions.
- Reusable event engines support heats, qualification rounds, groups, brackets, repechage-style progression, semifinals and finals.
- Simulate a session, a day or the remainder of the Games.
- Results use event-appropriate formats: times, distances, weights, points or medal decisions.
- Performance curves account for athlete level, specialization, era, gender and event type.
- Team events award one medal in the national medal table while crediting participating athletes in their careers.

### Records and archive

- Persistent **World Record and Olympic Record lineages**.
- Each record stores the athlete, country, event, edition, previous mark and successor.
- The interface shows whether a record still stands and how many years it lasted.
- Records can be filtered by sport, country, event, WR/OR and standing/broken status.
- Permanent medal archive filters by edition, country, sport and event.
- Country pages include edition-by-edition delegation and medal histories.
- Athlete pages include rating curves, appearances, medal histories and career windows.
- The almanac preserves every completed Games, programme changes, top athletes and medal tables.

### UX and persistence

- Responsive football-style web navigation for desktop, tablet and mobile.
- Visual icon system, edition banners, medal cards, country flags, record timelines, career curves and programme-change views.
- IndexedDB persistence instead of storing the full universe in localStorage.
- Save format V2 is intentionally separate from the earlier prototype save.

## Navigation

- Overview
- Qualification
- Olympic Games
- Programme
- Medals
- Countries
- Athletes
- Records
- Almanac

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Full historical engine validation:

```bash
npm test
```

`vite.config.js` uses `base: './'`, allowing the generated `dist` folder to work on GitHub Pages and ordinary static hosting.

## Main files

- `src/historicalData.js` — generated edition programmes, delegations, countries and national name pools.
- `src/data.js` — career profiles, rarity bands, historical eras and sporting traditions.
- `src/engine.js` — qualification, athlete careers, scheduling, performance simulation, records, medal tables and edition advancement.
- `src/App.jsx` — complete application, views, filters, modals and navigation.
- `src/styles.css` — responsive visual system.
- `src/storage.js` — IndexedDB save/load layer.
- `scripts/build_historical_data.py` — reproducible historical-data generator used to create the bundled source module.

## Historical-data boundaries

The simulator is designed as a believable history generator, not as a complete recreation of every federation rule ever used.

- Medal-event programmes for 1896–2020 are generated from historical athlete/event medal-result data.
- Paris 2024 and Los Angeles 2028 are curated to their official headline totals and programme changes.
- Qualification uses reusable ranking, standard, continental, tournament and quota models rather than hundreds of edition-specific federation rulebooks.
- Event scheduling is simulation-friendly and historically scaled; it does not reproduce every original competition timestamp.
- Athlete names are procedural. Historical programme and delegation structure is real, but the competitors and results are fictional.

See `DATA_SOURCES.md` and `FINAL_TEST_REPORT.md` for provenance and validation details.
