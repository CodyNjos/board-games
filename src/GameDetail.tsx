import { useEffect, useRef } from 'react';
import {
  BoardGame,
  effectivePlayerRange,
  formatPlayerLabel,
  formatPlayerRange,
} from './grouping';

interface GameDetailProps {
  game: BoardGame;
  expansions: BoardGame[];
  onClose: () => void;
}

function bggUrl(objectId: string): string {
  return `https://boardgamegeek.com/boardgame/${objectId}`;
}

function playLabel(numPlays: number): string {
  return `${numPlays} play${numPlays !== 1 ? 's' : ''}`;
}

function GameDetail({ game, expansions, onClose }: GameDetailProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const range = effectivePlayerRange(game, expansions);
  const ownedExpansions = expansions.filter((e) => e.owned);
  const widened = formatPlayerRange(range) !== game.players && ownedExpansions.length > 0;

  // Escape closes, and the panel takes focus so screen readers and keyboard
  // users land inside it rather than back at the top of the grid.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div className="detail-backdrop" onClick={onClose}>
      <div
        className="detail-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={game.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="detail-close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <div className="detail-hero">
          <img src={game.image} alt={game.name} />
        </div>

        <div className="detail-body">
          <h2>{game.name}</h2>
          <span className="year">{game.yearPublished}</span>

          <div className="detail-meta">
            {range && (
              <span>
                {formatPlayerLabel(range)}
                {widened && <em className="detail-widened"> with expansions</em>}
              </span>
            )}
            {game.playTime && <span>{game.playTime} min</span>}
            <span>{playLabel(game.numPlays)}</span>
          </div>

          {game.note && <p className="detail-note">{game.note}</p>}
          {game.onLoan && (
            <p className="detail-loan">
              Out on loan{game.loanNote ? ` — ${game.loanNote}` : ''}
            </p>
          )}

          {expansions.length > 0 && (
            <div className="detail-expansions">
              <div className="detail-expansions-head">
                <h3>
                  {expansions.length} expansion{expansions.length !== 1 ? 's' : ''}
                </h3>
                <h3 className="expansion-plays-label">Plays</h3>
              </div>
              <ul>
                {expansions.map((expansion) => (
                  <li key={expansion.objectId}>
                    <a
                      href={bggUrl(expansion.objectId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img src={expansion.thumbnail} alt="" loading="lazy" />
                      <span className="expansion-name">
                        {expansion.name}
                        {expansion.wishlist && (
                          <span className="expansion-tag">Wishlist</span>
                        )}
                      </span>
                      <span className="expansion-plays">
                        {expansion.numPlays > 0 ? expansion.numPlays : '—'}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <a
            className="detail-bgg-link"
            href={bggUrl(game.objectId)}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on BoardGameGeek
          </a>
        </div>
      </div>
    </div>
  );
}

export default GameDetail;
