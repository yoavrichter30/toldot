interface Props {
  narration: string;
  historicalNotes: string[];
}

export function DMNarrative({ narration, historicalNotes }: Props) {
  return (
    <div className="card narrative-box">
      {narration ? (
        <div className="narration-text">{narration}</div>
      ) : (
        <div className="empty-state">The story begins after your first action.</div>
      )}
      {historicalNotes.length > 0 && (
        <details className="notes">
          <summary>Historical Notes</summary>
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