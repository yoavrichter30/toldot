import { CohortStateView } from '../api/game';

interface Props {
  cohorts: CohortStateView[];
}

function HealthBar({ value }: { value: number }) {
  const hue = Math.round((value / 100) * 120); // 0=red, 120=green
  return (
    <div className="cohort-bar">
      <div className="cohort-bar-rows">
        <span>Health</span>
        <span>{value}</span>
      </div>
      <div className="cohort-bar-track">
        <div
          className="cohort-bar-fill"
          style={{
            width: `${Math.min(100, value)}%`,
            background: `hsl(${hue}, 70%, 42%)`,
          }}
        />
      </div>
    </div>
  );
}

function RetentionBar({ value }: { value: number }) {
  const hue = 210 - Math.round((value / 100) * 60); // 210=blue, 150=teal
  return (
    <div className="cohort-bar">
      <div className="cohort-bar-rows">
        <span>Retention</span>
        <span>{value}</span>
      </div>
      <div className="cohort-bar-track">
        <div
          className="cohort-bar-fill"
          style={{
            width: `${Math.min(100, value)}%`,
            background: `hsl(${hue}, 65%, 45%)`,
          }}
        />
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  queued: '#9e9e9e',
  arrived: '#4caf50',
  assigned: '#2196f3',
  departed: '#f44336',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className="cohort-status-badge"
      style={{ background: STATUS_COLORS[status] || '#9e9e9e' }}
    >
      {status}
    </span>
  );
}

export function CohortPanel({ cohorts }: Props) {
  if (cohorts.length === 0) {
    return (
      <div className="card cohort-panel">
        <h4>Cohorts</h4>
        <p className="empty-state">No immigrant cohorts have arrived yet.</p>
      </div>
    );
  }

  return (
    <div className="card cohort-panel">
      <h4>Cohorts</h4>
      {cohorts.map((cohort) => (
        <div key={cohort.id} className="cohort-entry">
          <div className="cohort-header">
            <strong>{cohort.name}</strong>
            <StatusBadge status={cohort.status} />
          </div>
          <div className="cohort-meta">Size: {cohort.size}</div>
          <HealthBar value={cohort.health} />
          <RetentionBar value={cohort.retention} />
          {cohort.skills.length > 0 && (
            <div className="cohort-skills">
              {cohort.skills.map((skill) => (
                <span key={skill} className="cohort-skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
