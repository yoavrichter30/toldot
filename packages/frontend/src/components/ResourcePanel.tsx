import { GameResources, FoundationTracks } from '../api/game';

interface Props {
  resources: GameResources;
  foundationTracks: FoundationTracks;
}

function Bar({ label, value, max = 100, color = '#4caf50' }: { label: string; value: number; max?: number; color?: string }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={{ background: '#eee', height: 8, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

export function ResourcePanel({ resources, foundationTracks }: Props) {
  return (
    <div style={{ padding: '1rem', background: '#fff', borderRadius: 8, border: '1px solid #ddd' }}>
      <h4 style={{ margin: '0 0 0.75rem' }}>Resources</h4>
      <Bar label="Funds" value={resources.funds} max={1000} color="#2196f3" />
      <Bar label="People" value={resources.people} max={500} color="#4caf50" />
      <Bar label="Public Trust" value={resources.publicTrust} color="#ff9800" />
      <Bar label="Ottoman Tolerance" value={resources.ottomanTolerance} color="#f44336" />
      <h4 style={{ margin: '1rem 0 0.75rem' }}>Foundation Tracks</h4>
      <Bar label="Settlement Viability" value={foundationTracks.settlementViability} color="#9c27b0" />
      <Bar label="Economic Independence" value={foundationTracks.economicIndependence} color="#3f51b5" />
      <Bar label="Hebrew Public Life" value={foundationTracks.hebrewPublicLife} color="#009688" />
      <Bar label="Self-Organization" value={foundationTracks.selfOrganization} color="#795548" />
    </div>
  );
}