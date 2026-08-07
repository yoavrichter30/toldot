import { GameResources, FoundationTracks } from '../api/game';

interface Props {
  resources: GameResources;
  foundationTracks: FoundationTracks;
}

function Bar({
  label,
  value,
  max = 100,
  color = '#4caf50',
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  return (
    <div className="bar">
      <div className="bar-rows">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{
            width: `${Math.min(100, (value / max) * 100)}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

export function ResourcePanel({ resources, foundationTracks }: Props) {
  return (
    <div className="card resource-panel">
      <h4>Resources</h4>
      <Bar label="Funds" value={resources.funds} max={1000} color="#2196f3" />
      <Bar label="People" value={resources.people} max={500} color="#4caf50" />
      <Bar label="Public Trust" value={resources.publicTrust} color="#ff9800" />
      <Bar label="Ottoman Tolerance" value={resources.ottomanTolerance} color="#f44336" />
      <h4 className="section-heading">Foundation Tracks</h4>
      <Bar label="Settlement Viability" value={foundationTracks.settlementViability} color="#9c27b0" />
      <Bar label="Economic Independence" value={foundationTracks.economicIndependence} color="#3f51b5" />
      <Bar label="Hebrew Public Life" value={foundationTracks.hebrewPublicLife} color="#009688" />
      <Bar label="Self-Organization" value={foundationTracks.selfOrganization} color="#795548" />
    </div>
  );
}