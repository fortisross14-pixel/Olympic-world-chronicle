# Historical Data Sources and Method

## Programme data, 1896–2020

The bundled `src/historicalData.js` module was generated from historical Olympic athlete-event result datasets derived from Olympedia and commonly distributed Olympic history data. The generator selects events with medal results and excludes non-sport art competitions and honorary competitions.

The retained programme distinguishes event names, gender, sport/discipline, measurement type and record lineage keys. This allows discontinued events such as rope climbing, tug of war, standing jumps and historical weight classes to exist only during their proper periods.

## Paris 2024

Paris 2024 is curated to:

- 329 medal events;
- 10,763 athletes in the simulation blueprint;
- 206 participating delegations;
- the Paris programme changes, including breaking and the updated mixed-event structure.

## Los Angeles 2028

Los Angeles 2028 is curated to the programme confirmed in 2026:

- 351 medal events;
- 36 sports;
- removal of breaking;
- addition of baseball/softball, cricket, flag football, lacrosse sixes and squash;
- the approved additional mixed events and swimming/coastal-rowing additions.

## Delegations and athlete scale

Historical edition blueprints retain the intended nation and athlete totals. Country quotas are normalized to those totals while preserving the relative historical delegation sizes available in the source rows.

Historical and predecessor entities remain distinct where appropriate, including teams such as the Soviet Union, East Germany, Yugoslavia and Czechoslovakia.

## Procedural names

Country-specific name components are generated from historical Olympic athlete names by NOC and gender. Very small pools use regional/general fallbacks. The game never inserts historical athletes into the procedural universe; it uses the linguistic pools to create fictional competitors.

## Rebuilding the generated module

`scripts/build_historical_data.py` is retained for reproducibility. It expects the source CSVs described in its header/configuration and writes `src/historicalData.js`. The generated file is already included, so rebuilding is not required to run the game.
