# Olympics Chronicle — Procedural Olympic Universe V3

A Vite + React Olympic history simulator beginning in **Athens 1896**. Athens is the only fixed host. Every later Olympiad belongs to a procedural alternate history shaped by host elections, national investment, world events, qualification circuits, athlete careers, programme evolution, medals and records.

## Core universe

- Starts with Athens 1896 and advances every four years, including alternate-universe Games in 1916, 1940 and 1944.
- Four cities compete after every completed Games.
- One city is eliminated per ballot round until a winner remains.
- Consecutive Summer Games can never be held on the same continent.
- Bid strength combines facilities, athlete pathways, public support, sustainability and legacy planning, with enough voting uncertainty to create surprises.
- The winning host changes the Games' visual identity, proposes era-plausible sports and receives a major national investment/facilities legacy that decays over later cycles.
- Historical medal-event data remains the era baseline, but hosts, programme deviations, qualification stories and results do not recreate real Olympic history.

## Programme evolution

- Historical event rows provide the underlying 1896–2028 programme timeline.
- Events can debut, disappear, return, split by gender or change format over time.
- Host-selected additions are limited by sport-introduction and event-era safeguards, preventing combinations such as breaking in 1920.
- The Programme page separates continuing, era-added, removed and host-choice events.
- Post-2028 editions continue procedurally.

## Procedural athletes and careers

- Athletes can emerge from 234 current and historical Olympic entities.
- 228 national naming pools provide country-appropriate, gender-aware procedural names.
- Every athlete has fixed base talent and rarity, plus a changing edition rating.
- Ratings develop toward a sport-specific peak and decline afterward.
- Career windows differ by sport: gymnasts and swimmers usually peak earlier, while shooters, sailors and equestrian athletes can remain competitive much longer.
- Athletes persist across Olympiads with appearances, rating history, medals, records and career results.
- Generational athletes use a red visual identity.

## National development and cycle events

- Investment, facilities, youth pathways and sport-specific allocations evolve every Olympic cycle.
- Hosting creates a large boost with gradual decay instead of an instant one-edition bonus.
- Six developments appear on the Overview before every Games.
- The event engine selects from **144 concrete scenarios**, including economic change, wars and disruption, academies, coaching revolutions, federation crises, women's-sport expansion, technology, diaspora pathways and regional legacies.
- These events directly affect investment, facilities, youth production, sport allocations and, in severe cases, delegation size.

## Qualification

- Every edition opens in a complete qualification phase.
- Every Olympic discipline is assigned to a named qualification competition.
- Every qualified athlete stores their route, competition, year, venue and host country.
- Reusable pathways include standards, rankings, national trials, world championships, continental qualifiers, team tournaments, host places and universality places.
- Qualification competitions contain:
  - disciplines covered;
  - participants and places awarded;
  - country-by-country places;
  - actual qualified athletes;
  - featured stars;
  - records broken at the competition.
- World records can be established or broken outside the Olympic Games and remain in the same permanent record lineage.
- The sport filter recalculates athlete and country totals for the selected sport rather than displaying total delegation size.

## Olympic Games simulation

- Complete Olympic calendar with morning, afternoon and evening sessions.
- Heats, qualifying rounds, groups, brackets, repechage-style rounds, semifinals and finals.
- Simulate exactly one Olympic day or the entire remainder of the Games.
- Daily results show prominent WR and OR alerts.
- Medal-result cards retain record badges.
- Performances use event-appropriate times, distances, weights, scores and medal decisions.

## Medals, countries and records

### Medal Table

Three explicit views:

1. **Current table** — filter the current edition by sport.
2. **Historical ranking** — all-time medal classification, also filterable by sport.
3. **Medal archive** — every medal by edition, country, sport, discipline and athlete.

The Historical ranking includes a cumulative medal graph with up to four selectable countries; the current all-time top four are selected by default.

### Country view

Each country contains:

- edition-by-edition athletes, sports and medals;
- medal totals by sport;
- every medal with year, sport, discipline, medal and athlete/team;
- all active athletes in the national pathway;
- a permanent medalist register;
- current investment, facilities, youth pathway and priority sports.

### Records

- Persistent WR and OR lineages.
- Olympic and qualification source filters.
- Athlete, country, competition, venue, event, mark, year, standing/broken status and lifespan.
- The number of years each record survived is retained.

### Historical navigation

- **Medal Table → Historical ranking**: historical medal classifications.
- **Medal Table → Medal archive**: every individual historical medal.
- **Almanac → Historical qualification archive**: past qualification competition counts, places and pre-Games records.
- **Records → Qualification**: qualification WR lineage.

## Visual system and navigation

- Responsive football-style web navigation.
- Host-country visual themes affect the Olympic Games and Programme experience.
- France uses red icon accents, white surfaces and blue typography; Spain uses a yellow field, red accents and dark type; other hosts use their own restrained national palette.
- Host-sensitive typography, icons, programme chips, record bursts, bid cards, career curves and historical charts.
- Desktop, tablet and mobile layouts.

## Persistence

- IndexedDB stores the universe instead of a single localStorage value.
- V2 saves remain readable. New V3 fields populate fully on the next Olympic cycle.

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

Full alternate-history validation:

```bash
npm test
```

`vite.config.js` uses `base: './'` for GitHub Pages and ordinary static hosting.

## Main files

- `src/historicalData.js` — historical programmes, delegation scales, countries and national name pools.
- `src/data.js` — career profiles, rarity bands, sporting traditions and era factors.
- `src/worldData.js` — host cities, country themes and the 144-scenario cycle-event pool.
- `src/engine.js` — host elections, national development, qualification, athlete careers, scheduling, performances, records, medals and progression.
- `src/App.jsx` — application views, charts, filters, modals and navigation.
- `src/styles.css` — responsive and host-sensitive visual system.
- `src/storage.js` — IndexedDB persistence.
- `scripts/final_smoke_test.mjs` — deterministic full-universe validation.

See `DATA_SOURCES.md`, `RELEASE_NOTES_V3.md` and `FINAL_TEST_REPORT.md` for boundaries and validation.
