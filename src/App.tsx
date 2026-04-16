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
}

type Filter = 'all' | 'owned' | 'wishlist';
type SortBy = 'name' | 'year' | 'plays';

const games: BoardGame[] = collection;

function App() {
  const [filter, setFilter] = useState<Filter>('owned');
  const [sortBy, setSortBy] = useState<SortBy>('name');

  const ownedCount = games.filter((g) => g.owned).length;
  const wishlistCount = games.filter((g) => g.wishlist).length;

  const filtered = games
    .filter((g) => {
      if (filter === 'owned') return g.owned;
      if (filter === 'wishlist') return g.wishlist;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'year') return b.yearPublished.localeCompare(a.yearPublished);
      if (sortBy === 'plays') return b.numPlays - a.numPlays;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="app">
      <header>
        <h1>Bored Jame Collection</h1>
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
        <div className="sort">
          <label htmlFor="sort-select">Sort by</label>
          <select id="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="name">Name</option>
            <option value="year">Year (newest)</option>
            <option value="plays">Most Played</option>
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
