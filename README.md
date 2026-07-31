# Olympics Chronicle V4 — Complete Athlete Pathways

A Vite + React alternate-history Olympic simulator beginning in **Athens 1896**. Athens is the only predetermined host. Every later Olympiad develops procedurally through host elections, national investment, world events, qualification circuits, athlete careers, complete Olympic rounds, medals and records.

## What defines V4

V4 moves the game beyond medal-only simulation. Every athlete now has a continuous competitive story:

1. national and international qualification ranking;
2. named qualifying competition and result;
3. qualification or failure;
4. every Olympic heat, preliminary round, group, bracket round, semifinal and final;
5. mark, rank, advancement and medal outcome;
6. permanent athlete career history.

This makes it possible to follow a world-record holder who dominated qualification but lost the final, or an underdog who qualified narrowly and improved through every Olympic round before winning gold.

## Full results and Olympic-day simulation

- All scheduled rounds are simulated and retained, not only medal finals.
- The Olympic Games page shows every completed round for the selected day.
- Each round displays its leader, complete standings, marks and advancement status.
- Event detail opens the complete competition path from first round to final.
- Athlete detail shows qualification and Olympic progression chronologically.
- `Simulate Day` resolves exactly the current Olympic day.
- `Simulate to End` uses the same underlying rounds and produces the same permanent archive.
- WR and OR alerts can occur in heats, semifinals or finals.
- Medal cards inherit record badges from every round of the event, even when the record did not occur in the final.

## Qualification as gameplay

Qualification is now a browsable competitive circuit rather than a final delegation list.

- Select a sport to see every active athlete in that pathway.
- Rankings include both qualified and failed athletes.
- Each athlete has a qualification index, world rank, discipline, best mark and qualification status.
- Named competitions expose complete standings and the athletes who earned places.
- Reusable pathways include standards, rankings, trials, world championships, continental qualifiers, team tournaments, host places and universality places.
- Every Olympic discipline is connected to a qualification event.
- Every Olympic athlete has a named qualification path.
- World records can be broken during qualification and remain in the global record lineage.
- Historical qualification circuits remain summarized in the Almanac.

## Olympic Magazine

The Olympic Chronicle now has four sections:

### World and investment

- Approximately 100 background developments affect countries every cycle.
- Events have four severities: **mild, significant, big and huge**.
- Exactly six huge events reach the magazine front page each cycle.
- Huge developments can radically alter investment, facilities, youth pathways, delegation depth, popularity and priority sports.

### Athlete life

- Epic, Legend and Generational newcomers are announced.
- Epic, Legend and Generational retirements are recorded.
- Athletes remain connected to their complete career profiles.

### Pre-Games

- Key medal events containing multiple Epic-or-better athletes.
- Major legends likely appearing in their final Games.
- Epic-or-better athletes who failed to qualify.
- Qualification records and important pre-Olympic storylines.

### Post-Games

- Multiple medal winners.
- Unexpected champions and breakthroughs.
- Highly ranked qualifiers who failed to medal.
- Record performances and defining stories of the edition.

## Procedural hosts and national alignment

- Athens 1896 is fixed.
- Every later edition uses four candidates and three visible elimination ballots.
- One city is greyed out after every round until a host remains.
- Consecutive Summer Games cannot be held on the same continent.
- Bid strength combines infrastructure, athlete pathways, public support, sustainability and legacy, with uncertainty that permits surprises.
- Winning changes the Games and Programme visual identity.
- Winning adds era-plausible host-choice events.
- Winning creates a large investment and facilities legacy that decays over future cycles.
- Delegation generation is realigned to the procedural host. A Havana, New York or Tokyo edition no longer retains the delegation bias of the historical real-world host for that year.

## Alternate Olympic history

- The universe advances every four years from 1896.
- 1916, 1940 and 1944 become procedural alternate-universe Games rather than forced cancellations.
- Historical programme data controls what is plausible in each era.
- Events can debut, disappear, return, split by gender or change format.
- Anachronistic host choices are prevented; modern sports cannot appear decades before their era.
- Post-2028 editions continue procedurally.

## Athletes and careers

- Procedural athletes can emerge from 234 current and historical Olympic entities.
- 228 national naming pools provide country-appropriate, gender-aware names.
- Fixed talent, rarity and potential.
- Edition-specific rating, form and pressure.
- Sport-dependent debut, peak, decline and retirement ages.
- Persistent appearances, rating history, qualification history, Olympic rounds, records and medals.
- Generational athletes use an unmistakable red visual identity.

## Flags and visual identity

- UI flags no longer depend on operating-system emoji support.
- Flags use image-backed rendering in desktop and mobile browsers.
- A three-letter NOC fallback appears automatically when a flag image is unavailable.
- Host-country themes affect icons, headers, surfaces and typography without compromising navigation.
- Responsive football-style web navigation works across laptop, tablet and mobile layouts.

## Medals, countries and records

### Medal Table

1. **Current table** — filter the current edition by sport.
2. **Historical ranking** — all-time rankings filterable by sport.
3. **Medal archive** — every medal by edition, country, sport, discipline and athlete.

The historical view includes a cumulative medal chart for up to four countries.

### Country pages

- Year-by-year delegation and medal history.
- Medals by sport.
- Every medal with year, discipline, athlete and medal type.
- All active national athletes, including non-qualified pathway athletes.
- Permanent medalist register.
- Investment, facilities, youth pathway and priority sports.

### Records

- Persistent WR and OR lineages.
- Qualification and Olympic sources.
- Holder, country, competition, venue, mark and date.
- Standing or broken status.
- Duration of every record reign.
- Daily and medal-screen notifications.

## Persistence and archive design

- IndexedDB is used instead of localStorage.
- V4 uses a new save slot because the complete-round and qualification-ranking schema is incompatible with V3 saves.
- Current-edition data retains complete readable rows.
- Completed editions use compact historical round rows and reduced qualifier leaderboards to keep a 132-year universe practical.
- Qualified athletes are not duplicated inside the wider active career pool.

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

Full deterministic validation:

```bash
npm test
```

`vite.config.js` uses `base: './'` for GitHub Pages and ordinary static hosting.

## Main files

- `src/historicalData.js` — historical programmes, delegation scales, countries and name pools.
- `src/data.js` — career profiles, rarity bands, sporting traditions and era factors.
- `src/worldData.js` — host cities, national themes and scenario pool.
- `src/engine.js` — qualification rankings, rounds, athlete careers, host elections, records, medals and progression.
- `src/App.jsx` — navigation, magazine, complete results, filters, charts and modals.
- `src/styles.css` — responsive, host-sensitive visual system.
- `src/storage.js` — IndexedDB V4 persistence.
- `scripts/final_smoke_test.mjs` — deterministic 1896–2032 validation.

See `RELEASE_NOTES_V4.md`, `FINAL_TEST_REPORT.md` and `DATA_SOURCES.md` for implementation details and validation boundaries.
