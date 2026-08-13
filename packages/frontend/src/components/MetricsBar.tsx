import { GameResources, FoundationTracks } from '../api/game';

interface Props {
  resources: GameResources;
  foundationTracks: FoundationTracks;
}

const RESOURCES: { key: keyof GameResources; label: string; icon: string }[] = [
  { key: 'funds', label: 'Funds', icon: '🪙' },
  { key: 'people', label: 'People', icon: '👥' },
  { key: 'publicTrust', label: 'Trust', icon: '🤝' },
  { key: 'ottomanTolerance', label: 'Ottoman', icon: '🏛️' },
];

const TRACKS: { key: keyof FoundationTracks; label: string }[] = [
  { key: 'settlementViability', label: 'Settlement' },
  { key: 'economicIndependence', label: 'Economy' },
  { key: 'hebrewPublicLife', label: 'Hebrew' },
  { key: 'selfOrganization', label: 'Org' },
];

export function MetricsBar({ resources, foundationTracks }: Props) {
  return (
    <div className="metrics-bar">
      <div className="metrics-resources">
        {RESOURCES.map((r) => (
          <span key={r.key} className="metric-chip" title={r.label}>
            <span className="metric-icon" aria-hidden="true">{r.icon}</span>
            <span className="metric-value">{resources[r.key]}</span>
          </span>
        ))}
      </div>
      <div className="metrics-tracks">
        {TRACKS.map((t) => (
          <span key={t.key} className="metric-track" title={t.label}>
            <span className="track-label">{t.label}</span>
            <span className="track-bar">
              <span
                className="track-fill"
                style={{ width: `${Math.min(100, foundationTracks[t.key])}%` }}
              />
            </span>
            <span className="track-value">{foundationTracks[t.key]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
