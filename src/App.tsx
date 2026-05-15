// Collection data source: BGG internal JSON API (no auth).
//   https://api.geekdo.com/api/geekitems?objectid=<BGG_ID>&objecttype=thing
// Returns a single game's metadata as JSON. Used to populate entries in
// collection.json — fields mapped: objectid, yearpublished, minplayers/
// maxplayers, minplaytime/maxplaytime, imageurl (image), images.thumb
// (thumbnail). The xmlapi2 collection endpoint (requires auth since Jul 2025):
//   https://boardgamegeek.com/xmlapi2/collection?username=pancreass
import { useState } from 'react';
import collection from './collection.json';

interface BoardGame {
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
}

type Filter = 'all' | 'owned' | 'wishlist';
type SortBy = 'name' | 'year' | 'plays' | 'playTime';
type PlayerCount = null | 1 | 2 | 3 | 4 | 5 | 6;

const PLAYER_OPTIONS: { label: string; value: PlayerCount }[] = [
  { label: 'Any', value: null },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6+', value: 6 },
];

function supportsPlayerCount(players: string, count: PlayerCount): boolean {
  if (count === null || !players) return true;
  const parts = players.split(/[-–]/);
  const min = parseInt(parts[0], 10);
  const max = parts.length > 1 ? parseInt(parts[1], 10) : min;
  if (isNaN(min)) return true;
  if (count === 6) return max >= 6;
  return count >= min && count <= max;
}

const games: BoardGame[] = collection;

function App() {
  const [filter, setFilter] = useState<Filter>('owned');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [playerCount, setPlayerCount] = useState<PlayerCount>(null);
  const [search, setSearch] = useState('');

  const ownedCount = games.filter((g) => g.owned).length;
  const wishlistCount = games.filter((g) => g.wishlist).length;

  const filtered = games
    .filter((g) => {
      if (search) {
        return g.name.toLowerCase().includes(search.toLowerCase());
      }
      if (filter === 'owned') return g.owned;
      if (filter === 'wishlist') return g.wishlist;
      return true;
    })
    .filter((g) => supportsPlayerCount(g.players, playerCount))
    .sort((a, b) => {
      if (sortBy === 'year') return b.yearPublished.localeCompare(a.yearPublished);
      if (sortBy === 'plays') return b.numPlays - a.numPlays;
      if (sortBy === 'playTime') {
        const aTime = parseInt(a.playTime.split(/[-–]/)[0], 10) || 0;
        const bTime = parseInt(b.playTime.split(/[-–]/)[0], 10) || 0;
        return aTime - bTime;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="app">
      <header>
        <a
          className="bgg-badge"
          href="https://boardgamegeek.com/user/pancreass"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img className="bgg-tag" src="/profile/badge.png" alt="Play Abstract" />
          <div className="bgg-avatar-frame">
            <img className="bgg-avatar" src="/profile/avatar.gif" alt="Cody's BGG avatar" />
          </div>
          <div className="bgg-username-row">
            <span className="bgg-username">PATRON</span>
            <span className="bgg-level">26</span>
          </div>
          <div className="bgg-microbadges">
            <img src="/profile/mb1.png" alt="microbadge" />
            <img src="/profile/mb2.gif" alt="microbadge" />
            <img src="/profile/mb3.gif" alt="microbadge" />
            <img src="/profile/mb_4.png" alt="microbadge" />
            <img src="/profile/mb_5.gif" alt="microbadge" />
          </div>
        </a>
        <p className="stats">
          {ownedCount} owned &middot; {wishlistCount} wishlisted
        </p>
      </header>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search">
            &times;
          </button>
        )}
      </div>

      <div className="controls">
        <div className="filters">
          {(['owned', 'wishlist'] as const).map((f) => (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f === 'owned' ? `Owned (${ownedCount})` : `Wishlist (${wishlistCount})`}
            </button>
          ))}
        </div>
        <div className="player-filter">
          <span className="player-label">Players</span>
          <div className="player-options">
            {PLAYER_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                className={playerCount === opt.value ? 'active' : ''}
                onClick={() => setPlayerCount(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="sort">
          <label htmlFor="sort-select">Sort by</label>
          <select id="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="name">Name</option>
            <option value="year">Year (newest)</option>
            <option value="plays">Most Played</option>
            <option value="playTime">Play Time (shortest)</option>
          </select>
        </div>
      </div>

      <div className="grid">
        {filtered.map((game) => (
          <a
            key={game.objectId}
            className="card"
            href={`https://boardgamegeek.com/boardgame/${game.objectId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="card-image">
              <img src={game.image} alt={game.name} loading="lazy" />
              {game.onLoan && (
                <span className="badge loan-badge" title={game.loanNote || undefined}>
                  Out
                </span>
              )}
              {game.wishlist && <span className="badge wishlist-badge">Wishlist</span>}
              {game.numPlays > 0 && (
                <span className="badge plays-badge">
                  {game.numPlays} play{game.numPlays !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="card-info">
              <h2>{game.name}</h2>
              <span className="year">{game.yearPublished}</span>
              <div className="meta">
                {game.players && <span>{game.players} players</span>}
                {game.playTime && <span>{game.playTime} min</span>}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default App;
