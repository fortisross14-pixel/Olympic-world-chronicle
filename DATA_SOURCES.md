# Historical Data Sources and Simulation Method

## Historical programme baseline, 1896–2028

The bundled `src/historicalData.js` module was generated from historical Olympic athlete/event result data and later curated programme rows. It supplies the **era baseline**: event names, disciplines, gender, measurement type, delegation scale, athlete totals and record-lineage keys.

The V3 universe does not replay the real host sequence after Athens 1896. Instead, the baseline answers questions such as:

- Which sports and event formats are plausible in a given era?
- Which discontinued competitions can still exist?
- How large should the athlete field and delegation count be?
- What performance and participation environment belongs to that period?

The host-election engine can then add or remove a small number of era-appropriate events without introducing clearly anachronistic sports.

## Early and discontinued events

The source programme distinguishes historical disciplines and formats, allowing rope climbing, tug of war, standing jumps, old weight classes, open events and discontinued team competitions to exist during appropriate periods rather than applying a modern programme retroactively.

## Modern baseline

The 2024 and 2028 rows provide a curated modern scale and event structure. In V3 they are not promises that a procedural 2024 or 2028 edition will have the same host or exact event total: the winning host bid can make limited programme changes.

## Alternate 1916, 1940 and 1944 editions

Those years had no historical Summer Games. V3 creates plausible alternate-universe editions by interpolating the surrounding participation scale and using the most recent available era programme as a base. Their hosts, events, athletes and results are procedural.

## Delegations and athlete scale

Historical edition blueprints retain the intended nation and athlete totals for held editions. Country quotas are normalized to those totals while preserving relative delegation strength, investment, host legacy, world-event modifiers and era participation.

Historical and predecessor entities remain distinct where appropriate, including teams such as the Soviet Union, East Germany, Yugoslavia and Czechoslovakia.

## Procedural names

Country-specific name components are generated from historical Olympic athlete names by NOC and gender. Small pools use regional/general fallbacks. Historical athletes are not inserted into the universe; the name components are used to create fictional competitors.

## Qualification

The simulator uses reusable qualification families—standards, rankings, trials, world championships, continental events, team tournaments, host places and universality entries—rather than reproducing every federation rulebook. Every discipline and every final athlete is nevertheless attached to a concrete generated competition, venue and route.

## Rebuilding the generated module

`scripts/build_historical_data.py` is retained for reproducibility. It expects the source CSVs described in its configuration and writes `src/historicalData.js`. The generated module is already bundled, so rebuilding is not required to run the game.
