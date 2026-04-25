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

  const ownedCount = games.filter((g) => g.owned).length;
  const wishlistCount = games.filter((g) => g.wishlist).length;

  const filtered = games
    .filter((g) => {
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
        <h1>
          <svg className="meeple" viewBox="0 0 512 512" aria-hidden="true">
            <path d="M256 54.99c-27 0-46.418 14.287-57.633 32.23-10.03 16.047-14.203 34.66-15.017 50.962-30.608 15.135-64.515 30.394-91.815 45.994-14.32 8.183-26.805 16.414-36.203 25.26C45.934 218.28 39 228.24 39 239.99c0 5 2.44 9.075 5.19 12.065 2.754 2.99 6.054 5.312 9.812 7.48 7.515 4.336 16.99 7.95 27.412 11.076 15.483 4.646 32.823 8.1 47.9 9.577-14.996 25.84-34.953 49.574-52.447 72.315C56.65 378.785 39 403.99 39 431.99c0 4-.044 7.123.31 10.26.355 3.137 1.256 7.053 4.41 10.156 3.155 3.104 7.017 3.938 10.163 4.28 3.146.345 6.315.304 10.38.304h111.542c8.097 0 14.026.492 20.125-3.43 6.1-3.92 8.324-9.275 12.67-17.275l.088-.16.08-.166s9.723-19.77 21.324-39.388c5.8-9.808 12.097-19.576 17.574-26.498 2.74-3.46 5.304-6.204 7.15-7.754.564-.472.82-.56 1.184-.76.363.2.62.288 1.184.76 1.846 1.55 4.41 4.294 7.15 7.754 5.477 6.922 11.774 16.69 17.574 26.498 11.6 19.618 21.324 39.387 21.324 39.387l.08.165.088.16c4.346 8 6.55 13.323 12.61 17.254 6.058 3.93 11.974 3.45 19.957 3.45H448c4 0 7.12.043 10.244-.304 3.123-.347 6.998-1.21 10.12-4.332 3.12-3.122 3.984-6.997 4.33-10.12.348-3.122.306-6.244.306-10.244 0-28-17.65-53.205-37.867-79.488-17.493-22.74-37.45-46.474-52.447-72.315 15.077-1.478 32.417-4.93 47.9-9.576 10.422-3.125 19.897-6.74 27.412-11.075 3.758-2.168 7.058-4.49 9.81-7.48 2.753-2.99 5.192-7.065 5.192-12.065 0-11.75-6.934-21.71-16.332-30.554-9.398-8.846-21.883-17.077-36.203-25.26-27.3-15.6-61.207-30.86-91.815-45.994-.814-16.3-4.988-34.915-15.017-50.96C302.418 69.276 283 54.99 256 54.99z" />
          </svg>
          Cody's Collection
          <svg className="meeple" viewBox="0 0 512 512" aria-hidden="true">
            <path d="M256 54.99c-27 0-46.418 14.287-57.633 32.23-10.03 16.047-14.203 34.66-15.017 50.962-30.608 15.135-64.515 30.394-91.815 45.994-14.32 8.183-26.805 16.414-36.203 25.26C45.934 218.28 39 228.24 39 239.99c0 5 2.44 9.075 5.19 12.065 2.754 2.99 6.054 5.312 9.812 7.48 7.515 4.336 16.99 7.95 27.412 11.076 15.483 4.646 32.823 8.1 47.9 9.577-14.996 25.84-34.953 49.574-52.447 72.315C56.65 378.785 39 403.99 39 431.99c0 4-.044 7.123.31 10.26.355 3.137 1.256 7.053 4.41 10.156 3.155 3.104 7.017 3.938 10.163 4.28 3.146.345 6.315.304 10.38.304h111.542c8.097 0 14.026.492 20.125-3.43 6.1-3.92 8.324-9.275 12.67-17.275l.088-.16.08-.166s9.723-19.77 21.324-39.388c5.8-9.808 12.097-19.576 17.574-26.498 2.74-3.46 5.304-6.204 7.15-7.754.564-.472.82-.56 1.184-.76.363.2.62.288 1.184.76 1.846 1.55 4.41 4.294 7.15 7.754 5.477 6.922 11.774 16.69 17.574 26.498 11.6 19.618 21.324 39.387 21.324 39.387l.08.165.088.16c4.346 8 6.55 13.323 12.61 17.254 6.058 3.93 11.974 3.45 19.957 3.45H448c4 0 7.12.043 10.244-.304 3.123-.347 6.998-1.21 10.12-4.332 3.12-3.122 3.984-6.997 4.33-10.12.348-3.122.306-6.244.306-10.244 0-28-17.65-53.205-37.867-79.488-17.493-22.74-37.45-46.474-52.447-72.315 15.077-1.478 32.417-4.93 47.9-9.576 10.422-3.125 19.897-6.74 27.412-11.075 3.758-2.168 7.058-4.49 9.81-7.48 2.753-2.99 5.192-7.065 5.192-12.065 0-11.75-6.934-21.71-16.332-30.554-9.398-8.846-21.883-17.077-36.203-25.26-27.3-15.6-61.207-30.86-91.815-45.994-.814-16.3-4.988-34.915-15.017-50.96C302.418 69.276 283 54.99 256 54.99z" />
          </svg>
        </h1>
        <p className="stats">
          {ownedCount} owned &middot; {wishlistCount} wishlisted
        </p>
      </header>

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
                  Lent Out
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
