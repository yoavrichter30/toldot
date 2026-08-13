interface Props {
  narration: string;
  historicalNotes: string[];
}

export function DMNarrative({ narration, historicalNotes }: Props) {
  return (
    <div className="card narrative-box">
      <div className="dm-label">
        <span className="dm-icon" aria-hidden="true">🜲</span> The Dungeon Master
      </div>
      {narration ? (
        <div className="narration-text">{narration}</div>
      ) : (
        <div className="empty-state">The story begins after your first decision.</div>
      )}
      {historicalNotes.length > 0 && (
        <details className="notes">
          <summary>📜 Lore — what really happened</summary>
          <ul>
            {historicalNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
