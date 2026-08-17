// Expansions live in collection.json alongside base games, tagged with
// `expansionOf` (BGG `expandsboardgame`, filtered to bases in the collection).
// They never get their own grid card -- they surface in a base game's detail
// panel instead. A pack that fits several bases lists all of them, so it shows
// up under each: the Railroad Ink packs work with all four RI editions.
// Data model, provenance, and invariants: docs/collection-data.md

export interface BoardGame {
  objectId: string;
  name: string;
  yearPublished: string;
  image: string;
  thumbnail: string;
  owned: boolean;
  wishlist: boolean;
  numPlays: number;
  players: string;
  playTime: string;
  onLoan: boolean;
  loanNote?: string;
  note?: string;
  expansionOf?: string[];
}

export type PlayerCount = null | 1 | 2 | 3 | 4 | 5 | 6;

export function isExpansion(game: BoardGame): boolean {
  return Array.isArray(game.expansionOf) && game.expansionOf.length > 0;
}

/** Expansions of each base game, keyed by the base game's objectId. */
export function groupExpansions(games: BoardGame[]): Map<string, BoardGame[]> {
  const byBase = new Map<string, BoardGame[]>();
  for (const game of games.filter(isExpansion)) {
    for (const baseId of game.expansionOf!) {
      const siblings = byBase.get(baseId);
      if (siblings) siblings.push(game);
      else byBase.set(baseId, [game]);
    }
  }
  for (const siblings of byBase.values()) {
    siblings.sort((a, b) => a.name.localeCompare(b.name));
  }
  return byBase;
}

export interface PlayerRange {
  min: number;
  max: number;
}

function parsePlayerRange(players: string): PlayerRange | null {
  if (!players) return null;
  const parts = players.split(/[-–]/);
  const min = parseInt(parts[0], 10);
  if (isNaN(min)) return null;
  const max = parts.length > 1 ? parseInt(parts[1], 10) : min;
  return { min, max: isNaN(max) ? min : max };
}

/**
 * A base game's player range widened by the expansions you own -- owning
 * Catan: 5-6 Player Expansion makes Catan a 3-6 player game. Wishlisted
 * expansions don't count; you can't play with a box you don't have.
 */
export function effectivePlayerRange(base: BoardGame, expansions: BoardGame[]): PlayerRange | null {
  const ranges = [base, ...expansions.filter((e) => e.owned)]
    .map((g) => parsePlayerRange(g.players))
    .filter((r): r is PlayerRange => r !== null);
  if (ranges.length === 0) return null;
  return {
    min: Math.min(...ranges.map((r) => r.min)),
    max: Math.max(...ranges.map((r) => r.max)),
  };
}

export function supportsPlayerCount(range: PlayerRange | null, count: PlayerCount): boolean {
  if (count === null || range === null) return true;
  if (count === 6) return range.max >= 6;
  return count >= range.min && count <= range.max;
}

export function formatPlayerRange(range: PlayerRange | null): string {
  if (range === null) return '';
  return range.min === range.max ? String(range.min) : `${range.min}-${range.max}`;
}

/** "1 player", "3-6 players", or "" when the range is unknown. */
export function formatPlayerLabel(range: PlayerRange | null): string {
  if (range === null) return '';
  const plural = range.min === 1 && range.max === 1 ? 'player' : 'players';
  return `${formatPlayerRange(range)} ${plural}`;
}

/**
 * Search matches a base game by its own name or any of its expansions'. The
 * matching expansion name comes back so the card can explain why it appeared
 * -- otherwise searching "Futuristic" silently surfaces four Railroad Ink
 * cards with nothing on them saying so.
 */
export function matchExpansionName(expansions: BoardGame[], search: string): string | null {
  const needle = search.toLowerCase();
  return expansions.find((e) => e.name.toLowerCase().includes(needle))?.name ?? null;
}
