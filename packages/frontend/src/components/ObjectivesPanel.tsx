interface Props {
  goal: string;
  objectives: string[];
  turn: number;
  maxTurns: number;
  date: string;
}

export function ObjectivesPanel({ goal, objectives, turn, maxTurns, date }: Props) {
  if (!goal && objectives.length === 0) return null;

  return (
    <div className="card objectives-panel">
      <div className="objectives-label">Your Mission</div>
      {goal && <p className="goal-text">{goal}</p>}
      {objectives.length > 0 && (
        <ul className="objectives-list">
          {objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      )}
      <div className="objectives-progress">
        Round {turn}/{maxTurns} · {date}
      </div>
    </div>
  );
}
