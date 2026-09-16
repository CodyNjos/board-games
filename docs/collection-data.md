# Collection data

`src/collection.json` is the whole database: a flat array of entries, hand-maintained
with help from the BGG API. There is no backend — Vite imports the JSON at build time.

As of 2026-09-16: **215 entries** — 186 base games (158 owned, 28 wishlisted) and
29 expansions.

## Entry shape

```jsonc
{
  "objectId": "199561",          // BGG thing id; the primary key
  "name": "Sagrada",
  "yearPublished": "2017",
  "image": "https://cf.geekdo-images.com/…__original/…",
  "thumbnail": "https://cf.geekdo-images.com/…__small/…",
  "owned": true,
  "wishlist": false,
  "numPlays": 10,
  "players": "1-4",              // "min-max", or a bare number, or "" if unknown
  "playTime": "30-45",           // same format, in minutes
  "onLoan": false,
  "loanNote": "…",               // optional; shown as the "Out" badge tooltip
  "note": "Print & Play",        // optional; rendered as a badge
  "expansionOf": ["199561"]      // optional; present only on expansions
}
```

All non-ASCII is `\uXXXX`-escaped with mixed-case hex. If you rewrite the file
programmatically, prefer surgical text edits — a naive `JSON.stringify` round-trip
re-encodes those escapes and produces a needlessly enormous diff.

## Where the data comes from

BGG's internal JSON API, no auth required:

```
https://api.geekdo.com/api/geekitems?objectid=<BGG_ID>&objecttype=thing
```

Everything hangs off the `item` object in the response:

| `collection.json` | Response path |
|---|---|
| `objectId` | `item.objectid` |
| `name` | `item.name` |
| `yearPublished` | `item.yearpublished` |
| `players` | `item.minplayers` + `item.maxplayers` |
| `playTime` | `item.minplaytime` + `item.maxplaytime` |
| `image` | `item.images.original` |
| `thumbnail` | `item.images.thumb` |
| `expansionOf` | `item.links.expandsboardgame[].objectid` |

Note `image` is **`item.images.original`**, not `item.imageurl` — the latter is a
246×300 crop, which looks soft in the detail panel's hero.

`owned`, `wishlist`, `numPlays`, `onLoan`, `loanNote` and `note` have no source in
this endpoint. Three of them come from the collection XML API, which requires auth
as of July 2025 and so can't be fetched from a script — open it in a logged-in
browser and paste the result:

```
https://boardgamegeek.com/xmlapi2/collection?username=pancreass
```

| `collection.json` | Collection XML path |
|---|---|
| `owned` | `item.status@own` |
| `wishlist` | `item.status@wishlist` |
| `numPlays` | `item.numplays` |

`item.comment` holds a hand-written `"2–5 Players Play Time 20–30 Min"` string that
mirrors the `players`/`playTime` values — it is a convenience copy, not the source.
`onLoan`, `loanNote` and `note` exist only in this app and have no BGG equivalent,
so **any refresh must preserve them** rather than rebuilding entries wholesale.

### Refreshing from an export

Diff the export against the file rather than overwriting: match on `objectId`, apply
only `owned` / `wishlist` / `numPlays`, append entries whose `objectId` is new, and
report anything the export dropped. Watch for three traps:

- **The export can list one `objectId` twice.** Owning two versions of a game gives
  two `<item>` rows sharing a thing id — the second carries an `<originalname>` and
  repeats the same `numplays`, because plays are logged against the thing, not the
  version. `objectId` is the primary key here, so the extra row must be skipped, not
  appended. As of 2026-09-16 this affects `163412`, listed as both `Patchwork` and
  `Patchwork: Americana Edition`. Representing owned versions separately would need
  a different key.
- BGG **renames** games, and `collection.json` will still hold the old title —
  `objectId` is the key, never the name. As of the 2026-09-16 export, BGG had
  `46614` as `Triplo` (recorded here as `Nonaga`) and `266524` as `Parks` (recorded
  as `PARKS`); both are intentionally left alone.
- New entries still need `expansionOf` decided — check `subtypes` for
  `boardgameexpansion` before assuming a game is a base game. Don't infer the parent
  from a sibling: the Tanglewoods decks expand both `20 Strong` and
  `20 Strong: Tanglewoods`, but `20 Strong: Solar Sentinels` expands only `20 Strong`.

The export is also not a complete source for a new entry. It omits `<yearpublished>`
and `<comment>` on some items, and where its `<yearpublished>` differs from the API
it is the *version* year, not the game's: it lists `Machi Koro` (`143884`) as 2019,
the anniversary edition owned here, while the game is 2012. `yearPublished` records
the **game**, so 2012 is correct and the 2019 is deliberately not used.

Take `yearPublished` / `players` / `playTime` from the geekitems endpoint, fall back
to the comment when the API has nothing, and hand-enter what neither has.
`SCHEELSopoly` (`100690`) needs all three routes: BGG gives it no year and a
playtime of 0, so its `playTime` of `60` comes from the comment and its
`yearPublished` of `2010` was supplied by hand. **A refresh must not overwrite
hand-entered values** — this is why the sync touches only `owned` / `wishlist` /
`numPlays` on entries that already exist.

## How expansions work

Expansions live in the same flat array as base games, tagged with `expansionOf` —
an array of the `objectId`s of the base games they expand. An entry is an expansion
if and only if that field is present and non-empty (`isExpansion` in `src/grouping.ts`).

**The link lives on the child, not the parent.** One line per expansion instead of
arrays to keep in sync on both sides, and adding an expansion whose base you don't
own yet doesn't corrupt anything — it just gets dropped (see the invariant below).

**Why an array.** Some expansions genuinely fit several bases. All four Railroad Ink
editions accept the same pack, so `Railroad Ink: Futuristic Expansion Pack` lists
four parents and appears in all four detail panels. 16 of the 28 expansions have
more than one parent; the maximum is 4. This costs nothing visually because
expansions never get their own grid card — see below.

`expansionOf` was **derived, not typed by hand**: fetch every `objectId` in the
collection, keep the ones whose `item.subtypes` contains `boardgameexpansion`, and
record `item.links.expandsboardgame`. That catches expansions whose names don't say
"expansion" — `Sagrada Artisans`, `More Containers` — and, just as usefully, it
declines to flag things that merely look like expansions.

### Rules the app applies

- **Expansions get no card.** The grid renders base games only. They surface inside
  a base game's detail panel (`?g=<objectId>`).
- **Play counts are never summed.** A base card shows its own `numPlays`; each
  expansion's count is shown beside it in the panel. On BGG a play logged against an
  expansion is also a play of the base game, so adding them would double-count.
- **Player ranges widen.** A base game's effective range is the union of its own and
  those of the expansions you **own** — owning `Catan: 5-6 Player Expansion` makes
  Catan a 3–6 player game for filtering and display. Wishlisted expansions don't
  count; you can't play with a box you don't have.
- **Header counts exclude expansions**, which is why it reads `158 owned` and not
  `186`. The expansion total is shown as its own figure.
- **Search matches expansion names** and surfaces the base card with a `matched: …`
  line explaining why it appeared.

### Invariants

1. Every id in `expansionOf` must exist in the collection. Parents not in the
   collection are dropped at derivation time — two Railroad Ink Collector's Editions
   were dropped this way. A dangling id yields an expansion that appears in no panel
   and no grid, i.e. it silently vanishes.
2. **No nesting.** A parent must not itself be an expansion; the panel renders one
   level only. `20 Strong: Tanglewoods` is a base game that other decks expand, which
   is fine — it just must not gain an `expansionOf` of its own.

## Adding to the collection

1. Get the BGG id from the game's URL: `boardgamegeek.com/boardgame/<id>/slug`.
2. Fetch `…/api/geekitems?objectid=<id>&objecttype=thing` and map the fields above.
3. If `item.subtypes` contains `boardgameexpansion`, add `expansionOf` with the
   `expandsboardgame` ids you actually own; otherwise leave it off.
4. Set `owned` / `wishlist` / `numPlays` yourself.

## Known quirks

- `Railroad Ink: Promo Board #1 – Blue Train` is listed **1-7 players** on BGG, so it
  widens Blazing Red and Deep Blue to `1-7` on their cards. Faithful to the source;
  change that entry's `players` to `1-6` if it bothers you.
- **Standalone-playable games that BGG flags as expansions.** `Sagrada Artisans`,
  `Air, Land & Sea: Spies, Lies & Supplies`, `Star Realms: Frontiers`,
  `Clank!: Catacombs` and `Le Havre: The Inland Port` all came back as plain
  `boardgame`, so they kept their own grid cards. If any should also appear inside a
  base game's panel, that needs a new flag — `expansionOf` alone would remove its card.
- `numPlays` is a manual mirror of BGG's play log and drifts. It is the only field
  the app sorts on ("Most Played").
