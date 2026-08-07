interface Props {
  narration: string;
  historicalNotes: string[];
}

export function DMNarrative({ narration, historicalNotes }: Props) {
  return (
    <div style={{ background: '#f5f0e8', padding: '1.5rem', borderRadius: 8, marginBottom: '1rem' }}>
      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{narration}</div>
      {historicalNotes.length > 0 && (
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', color: '#666', fontWeight: 'bold' }}>Historical Notes</summary>
          <ul style={{ marginTop: '0.5rem' }}>
            {historicalNotes.map((note, i) => (
              <li key={i} style={{ marginBottom: '0.3rem', color: '#555' }}>{note}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}