import { useState } from 'react';

interface MapLocation {
  id: string;
  name: string;
  housing?: number;
  water?: number;
  health?: number;
  founded?: number;
  type?: string;
}

interface MapPanelProps {
  locations: MapLocation[];
  onLocationClick: (locationId: string) => void;
  selectedLocationId: string | null;
  activeLocationIds: string[];
}

interface PinCoord {
  id: string;
  x: number;
  y: number;
}

const PIN_COORDS: PinCoord[] = [
  { id: 'metulla', x: 540, y: 50 },
  { id: 'rosh_pinna', x: 525, y: 198 },
  { id: 'kinneret_farm', x: 540, y: 323 },
  { id: 'degamia', x: 500, y: 340 },
  { id: 'sejera', x: 445, y: 320 },
  { id: 'zikhron_yaakov', x: 185, y: 390 },
  { id: 'hadera', x: 157, y: 453 },
  { id: 'kfar_saba', x: 162, y: 578 },
  { id: 'petah_tikva', x: 139, y: 626 },
  { id: 'jaffa', x: 70, y: 640 },
  { id: 'rishon_lezion', x: 93, y: 678 },
  { id: 'rehovot', x: 105, y: 717 },
];

function getLocationCoords(id: string): PinCoord | undefined {
  return PIN_COORDS.find((c) => c.id === id);
}

export function MapPanel({
  locations,
  onLocationClick,
  selectedLocationId,
  activeLocationIds,
}: MapPanelProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const selectedLoc = locations.find((l) => l.id === selectedLocationId);
  const showDetail = selectedLocationId && selectedLoc;

  return (
    <div className="map-panel">
      <svg
        viewBox="0 0 600 800"
        className="map-svg"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Historical map of Eretz Yisrael"
        role="img"
      >
        <defs>
          <filter id="pinShadow">
            <feDropShadow dx={1} dy={1} stdDeviation={1.5} floodOpacity={0.3} />
          </filter>
          <filter id="pinShadowSelected">
            <feDropShadow dx={0} dy={0} stdDeviation={4} floodOpacity={0.5} floodColor="#d4a73a" />
          </filter>

          <radialGradient id="seaGrad" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#b8e0e0" />
            <stop offset="100%" stopColor="#7ab8b8" />
          </radialGradient>
          <radialGradient id="landGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#dce8c0" />
            <stop offset="100%" stopColor="#c4d4a0" />
          </radialGradient>
          <radialGradient id="hillGrad" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#c4b89a" />
            <stop offset="100%" stopColor="#a89878" />
          </radialGradient>
        </defs>

        {/* Background - parchment */}
        <rect x={0} y={0} width={600} height={800} fill="#f5e6c8" rx={4} />

        {/* Mediterranean Sea - diagonal coastal area */}
        <path
          d="M0,0 L180,0 L140,100 L100,200 L70,300 L50,400 L30,500 L20,600 L0,700 L0,800 L0,800 L50,800 L70,700 L100,600 L130,500 L160,400 L185,300 L210,200 L240,100 L280,0 Z"
          fill="url(#seaGrad)"
          opacity={0.9}
        />

        {/* Coastal plain (lowlands) */}
        <path
          d="M280,0 L240,100 L210,200 L185,300 L160,400 L130,500 L100,600 L70,700 L50,800 L300,800 L280,700 L270,600 L260,500 L250,400 L240,300 L260,200 L290,100 L320,0 Z"
          fill="url(#landGrad)"
          opacity={0.5}
        />

        {/* Carmel ridge */}
        <path
          d="M185,300 C200,290 220,285 240,295 C250,300 255,310 250,320 C240,335 210,340 185,330 C175,325 172,312 185,300 Z"
          fill="#b89850"
          opacity={0.7}
        />
        <ellipse cx={215} cy={318} rx={35} ry={16} fill="#a88840" opacity={0.3} />

        {/* Samarian / Judean highlands */}
        <path
          d="M300,300 C320,280 340,290 360,310 C380,330 400,360 420,400 C440,440 450,480 440,520 C430,560 400,600 370,640 C340,680 320,700 300,720 L300,800 L500,800 L520,800 L510,700 L500,600 L490,500 L480,400 L470,300 L450,260 L400,250 L350,260 L320,280 Z"
          fill="url(#hillGrad)"
          opacity={0.6}
        />

        {/* Lake Kinneret (Sea of Galilee) */}
        <ellipse cx={490} cy={310} rx={28} ry={50} fill="#7ab8b8" opacity={0.85} />
        <ellipse cx={488} cy={310} rx={18} ry={38} fill="#a8d8d9" opacity={0.6} />

        {/* Jordan River (from Kinneret south) */}
        <path
          d="M490,360 Q485,390 492,420 Q498,450 490,480 Q482,510 488,540 Q494,570 490,600 Q486,630 492,660 Q498,690 490,720 Q486,750 490,800"
          fill="none"
          stroke="#6aaeae"
          strokeWidth={3}
          opacity={0.7}
        />

        {/* Dead Sea */}
        <path
          d="M490,650 C500,655 510,665 515,680 C520,700 515,730 505,750 C495,770 485,780 480,780 C475,780 468,765 465,745 C460,715 462,685 470,665 C478,652 485,648 490,650 Z"
          fill="#3a7878"
          opacity={0.8}
        />
        <path
          d="M490,655 C498,660 505,670 508,683 C512,700 508,725 500,743 C492,758 485,770 480,770 C476,770 471,758 468,742 C464,715 465,690 472,672 C478,660 485,654 490,655 Z"
          fill="#5a9898"
          opacity={0.4}
        />

        {/* Rivers and streams */}
        <path
          d="M0,0 Q50,50 100,100 Q150,150 200,200"
          fill="none"
          stroke="#6aaeae"
          strokeWidth={1.5}
          opacity={0.3}
        />

        {/* Title */}
        <text x={300} y={30} textAnchor="middle" fontSize={18} fontWeight="bold" fill="#8a5a2b" fontFamily="serif" letterSpacing={2}>
          Eretz Yisrael
        </text>
        <text x={300} y={44} textAnchor="middle" fontSize={9} fill="#8a5a2b" opacity={0.7} fontFamily="serif">
          1904-1914
        </text>

        {/* Settlement pins */}
        {locations.map((loc) => {
          const coord = getLocationCoords(loc.id);
          if (!coord) return null;
          const { x, y } = coord;
          const isSelected = loc.id === selectedLocationId;
          const isActive = activeLocationIds.includes(loc.id);
          const isHovered = hoveredId === loc.id;
          const radius = isSelected ? 14 : isHovered ? 12 : 10;

          return (
            <g
              key={loc.id}
              className={`map-pin ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
              onClick={() => onLocationClick(loc.id)}
              onMouseEnter={() => setHoveredId(loc.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`${loc.name}${isSelected ? ' (selected)' : ''}`}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onLocationClick(loc.id); }}
            >
              {/* Pin glow for selected */}
              {isSelected && (
                <circle cx={x} cy={y} r={radius + 4} fill="none" stroke="#d4a73a" strokeWidth={2} opacity={0.4}>
                  <animate attributeName="r" values={`${radius + 4};${radius + 8};${radius + 4}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Pin circle */}
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill={isSelected ? '#d4a73a' : '#c4a35a'}
                stroke="#fff"
                strokeWidth={2}
                filter={isSelected ? 'url(#pinShadowSelected)' : 'url(#pinShadow)'}
              />

              {/* Active indicator dot */}
              {isActive && !isSelected && (
                <circle cx={x} cy={y} r={3} fill="#d4a73a" opacity={0.6} />
              )}

              {/* Location label */}
              <text
                x={x}
                y={y + radius + 13}
                textAnchor="middle"
                fontSize={10}
                fill="#5a3a1a"
                fontFamily="serif"
                fontWeight={isSelected ? 'bold' : 'normal'}
              >
                {loc.name}
              </text>
            </g>
          );
        })}

        {/* Scale bar */}
        <g transform="translate(480, 760)">
          <line x1={0} y1={0} x2={80} y2={0} stroke="#8a5a2b" strokeWidth={1.5} />
          <line x1={0} y1={-3} x2={0} y2={3} stroke="#8a5a2b" strokeWidth={1.5} />
          <line x1={80} y1={-3} x2={80} y2={3} stroke="#8a5a2b" strokeWidth={1.5} />
          <text x={40} y={10} textAnchor="middle" fontSize={7} fill="#8a5a2b" fontFamily="serif">
            40 km
          </text>
        </g>

        {/* Compass rose */}
        <g transform="translate(545, 740)">
          <circle cx={0} cy={0} r={14} fill="none" stroke="#8a5a2b" strokeWidth={1} opacity={0.5} />
          <polygon points="0,-12 3,-3 -3,-3" fill="#8a5a2b" />
          <polygon points="0,12 3,3 -3,3" fill="#8a5a2b" opacity={0.4} />
          <polygon points="-12,0 -3,-3 -3,3" fill="#8a5a2b" opacity={0.4} />
          <polygon points="12,0 3,-3 3,3" fill="#8a5a2b" opacity={0.4} />
          <text x={0} y={-18} textAnchor="middle" fontSize={7} fill="#8a5a2b" fontWeight="bold">N</text>
        </g>

        {/* Legend */}
        <g transform="translate(12, 740)">
          <rect x={0} y={0} width={150} height={45} fill="#f5e6c8" stroke="#c4a35a" strokeWidth={0.5} rx={3} opacity={0.85} />
          <text x={75} y={16} textAnchor="middle" fontSize={8} fill="#5a3a1a" fontFamily="serif" fontWeight="bold">
            Settlements of the
          </text>
          <text x={75} y={27} textAnchor="middle" fontSize={8} fill="#5a3a1a" fontFamily="serif" fontWeight="bold">
            New Yishuv
          </text>
          <text x={75} y={38} textAnchor="middle" fontSize={7} fill="#8a5a2b" fontFamily="serif">
            1904-1914
          </text>
        </g>
      </svg>

      {/* Location detail info box */}
      {showDetail && (
        <div className="location-detail card">
          <button
            className="location-detail-close"
            onClick={() => onLocationClick('')}
            aria-label="Close location detail"
          >
            &times;
          </button>
          <h4>{selectedLoc!.name}</h4>
          {selectedLoc!.type && <p className="location-type">{selectedLoc!.type}</p>}
          {selectedLoc!.founded !== undefined && selectedLoc!.founded > 0 && (
            <p className="location-founded">Founded {selectedLoc!.founded}</p>
          )}
          <div className="location-stats">
            <div className="loc-stat">
              <span className="loc-stat-label">Housing</span>
              <div className="bar-track">
                <div
                  className="bar-fill loc-housing"
                  style={{ width: `${selectedLoc!.housing ?? 0}%` }}
                />
              </div>
            </div>
            <div className="loc-stat">
              <span className="loc-stat-label">Water</span>
              <div className="bar-track">
                <div
                  className="bar-fill loc-water"
                  style={{ width: `${selectedLoc!.water ?? 0}%` }}
                />
              </div>
            </div>
            <div className="loc-stat">
              <span className="loc-stat-label">Health</span>
              <div className="bar-track">
                <div
                  className="bar-fill loc-health"
                  style={{ width: `${selectedLoc!.health ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
