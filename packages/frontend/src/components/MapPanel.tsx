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
          <filter id="parchmentTexture">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" />
          </filter>
          <linearGradient id="seaGrad" x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#c5dce0" />
            <stop offset="40%" stopColor="#a0c4c8" />
            <stop offset="100%" stopColor="#6a9ca5" />
          </linearGradient>
          <linearGradient id="coastalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dae6c5" />
            <stop offset="50%" stopColor="#cde0b5" />
            <stop offset="100%" stopColor="#b8d0a0" />
          </linearGradient>
          <linearGradient id="foothillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cec09a" />
            <stop offset="100%" stopColor="#b8a888" />
          </linearGradient>
          <radialGradient id="highlandGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#d4c4a0" />
            <stop offset="60%" stopColor="#b8a888" />
            <stop offset="100%" stopColor="#9a8a6a" />
          </radialGradient>
          <radialGradient id="galileeGrad" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#d0c8a8" />
            <stop offset="100%" stopColor="#b0a080" />
          </radialGradient>
          <pattern id="parchment" patternUnits="userSpaceOnUse" width="6" height="6">
            <rect width="6" height="6" fill="#f2e4c8" />
            <rect x="0" y="0" width="2" height="6" fill="#f0e0c0" opacity="0.3" />
            <rect x="4" y="0" width="1" height="6" fill="#f4e8d0" opacity="0.2" />
          </pattern>
        </defs>

        {/* Background */}
        <rect x={0} y={0} width={600} height={800} fill="#f2e4c8" />
        <rect x={0} y={0} width={600} height={800} fill="url(#parchment)" opacity={0.5} />
        <rect x={3} y={3} width={594} height={794} fill="none" stroke="#c4a35a" strokeWidth={1} opacity={0.3} rx={2} />

        {/* Mediterranean Sea */}
        <path
          d="M0,0 L160,0 L140,30 L100,60 L70,90 L50,120 L30,150 L20,180
             L15,210 L10,240 L8,270 L5,300 L3,330 L0,360 L0,400 L0,450
             L0,500 L0,550 L0,600 L0,650 L0,700 L0,800
             L55,800 L70,760 L90,720 L110,680 L130,640
             L150,600 L170,560 L190,520 L205,480
             L220,440 L230,400 L240,360 L250,320
             L260,280 L265,240 L270,200 L275,160
             L280,120 L285,80 L290,40 L300,0 Z"
          fill="url(#seaGrad)" opacity={0.85}
        />
        {/* Sea wave lines */}
        <path d="M80,150 Q100,155 120,150" fill="none" stroke="#b0d0d5" strokeWidth={0.8} opacity={0.4} />
        <path d="M50,250 Q70,255 90,250" fill="none" stroke="#b0d0d5" strokeWidth={0.8} opacity={0.3} />
        <path d="M30,400 Q50,405 70,400" fill="none" stroke="#b0d0d5" strokeWidth={0.8} opacity={0.3} />
        <path d="M20,550 Q40,555 60,550" fill="none" stroke="#b0d0d5" strokeWidth={0.8} opacity={0.3} />

        {/* Coastal Plain */}
        <path
          d="M300,0 L290,40 L285,80 L280,120 L275,160 L270,200 L265,240 L260,280
             L250,320 L240,360 L230,400 L220,440 L205,480 L190,520 L170,560
             L150,600 L130,640 L110,680 L90,720 L70,760 L55,800
             L300,800 L310,780 L320,750 L330,710 L340,670 L350,630
             L355,590 L360,550 L365,510 L370,470 L375,430 L385,400
             L395,370 L405,340 L415,310 L425,280 L435,250 L445,220
             L455,190 L460,160 L465,130 L470,100 L475,70 L480,40 L485,10 L490,0 Z"
          fill="url(#coastalGrad)" opacity={0.7}
        />
        {/* Fields on the plain */}
        <path d="M200,600 Q210,605 220,600" fill="none" stroke="#a0b888" strokeWidth={0.5} opacity={0.3} />
        <path d="M180,650 Q190,655 200,650" fill="none" stroke="#a0b888" strokeWidth={0.5} opacity={0.3} />
        <path d="M220,550 Q230,555 240,550" fill="none" stroke="#a0b888" strokeWidth={0.5} opacity={0.3} />

        {/* Foothills (Shephelah) */}
        <path
          d="M425,280 L415,310 L405,340 L395,370 L385,400 L375,430 L370,470 L365,510
             L360,550 L355,590 L350,630 L340,670 L330,710 L320,750 L310,780 L300,800
             L360,800 L370,770 L380,740 L390,710 L400,680 L410,650 L420,620
             L430,590 L440,560 L445,530 L450,500 L455,470 L460,440
             L465,410 L470,380 L475,350 L480,320 L485,290 L490,260
             L495,230 L498,200 L500,170 L502,140 L505,110 L508,80 L510,50 L515,20 L520,0 Z"
          fill="url(#foothillGrad)" opacity={0.6}
        />

        {/* Highlands */}
        <path
          d="M520,0 L510,50 L508,80 L505,110 L502,140 L500,170 L498,200 L495,230
             L490,260 L485,290 L480,320 L475,350 L470,380 L465,410 L460,440
             L455,470 L450,500 L445,530 L440,560 L430,590 L420,620 L410,650
             L400,680 L390,710 L380,740 L370,770 L360,800
             L570,800 L575,770 L580,740 L582,710 L585,680 L588,650 L590,620
             L592,590 L594,560 L596,530 L598,500 L599,470 L600,440 L600,400
             L600,360 L600,320 L600,280 L600,240 L600,200
             L600,160 L600,120 L600,80 L600,40 L600,0 Z"
          fill="url(#highlandGrad)" opacity={0.8}
        />
        {/* Contour lines */}
        <path d="M530,100 Q560,120 580,160" fill="none" stroke="#8a7a5a" strokeWidth={0.5} opacity={0.2} />
        <path d="M520,200 Q555,230 590,270" fill="none" stroke="#8a7a5a" strokeWidth={0.5} opacity={0.2} />
        <path d="M510,350 Q545,380 590,420" fill="none" stroke="#8a7a5a" strokeWidth={0.5} opacity={0.2} />
        <path d="M500,500 Q540,530 590,560" fill="none" stroke="#8a7a5a" strokeWidth={0.5} opacity={0.2} />

        {/* Lower Galilee hills */}
        <path
          d="M430,160 Q440,140 460,130 Q480,120 500,130 Q520,140 525,160
             Q530,180 520,200 Q510,215 490,220 Q470,225 455,215
             Q440,205 435,185 Q430,175 430,160 Z"
          fill="url(#galileeGrad)" opacity={0.6}
        />

        {/* Carmel Ridge */}
        <path
          d="M200,280 C210,265 230,258 250,265 C270,272 285,285 290,300
             C295,315 290,330 280,340 C270,350 250,355 235,348
             C220,341 208,325 202,308 C198,295 198,286 200,280 Z"
          fill="#c4a86a" opacity={0.65}
        />
        <path
          d="M215,285 C225,275 240,272 255,278 C270,284 280,295 283,308
             C280,318 272,328 258,335 C245,340 230,338 218,328
             C210,320 207,305 215,285 Z"
          fill="#b89850" opacity={0.35}
        />
        <text x={255} y={275} fontSize={6} fill="#8a6a30" fontFamily="serif" opacity={0.6}>Carmel</text>

        {/* Lake Kinneret */}
        <ellipse cx={492} cy={310} rx={30} ry={52} fill="#5a8a8a" opacity={0.75} />
        <ellipse cx={490} cy={308} rx={22} ry={42} fill="#70a0a0" opacity={0.6} />
        <ellipse cx={488} cy={306} rx={14} ry={32} fill="#90c0c0" opacity={0.4} />
        <text x={492} y={370} textAnchor="middle" fontSize={7} fill="#4a6a6a" fontFamily="serif" opacity={0.7}>Kinneret</text>

        {/* Jordan River */}
        <path
          d="M492,362 Q488,385 494,410 Q500,435 492,460 Q484,485 490,510
             Q496,535 488,560 Q480,585 486,610 Q492,635 488,660
             Q484,685 490,710 Q496,735 492,760"
          fill="none" stroke="#4a8a8a" strokeWidth={3.5} opacity={0.65}
        />
        <path
          d="M492,362 Q488,385 494,410 Q500,435 492,460 Q484,485 490,510
             Q496,535 488,560 Q480,585 486,610 Q492,635 488,660
             Q484,685 490,710 Q496,735 492,760"
          fill="none" stroke="#6ab0b0" strokeWidth={1.5} opacity={0.4}
        />
        {/* Tributaries */}
        <path d="M490,420 Q470,430 450,425" fill="none" stroke="#6ab0b0" strokeWidth={1} opacity={0.3} />
        <path d="M488,500 Q460,510 430,505" fill="none" stroke="#6ab0b0" strokeWidth={1} opacity={0.3} />
        <text x={435} y={500} textAnchor="middle" fontSize={6} fill="#4a7a7a" fontFamily="serif" opacity={0.5}>Yarkon</text>

        {/* Dead Sea */}
        <path
          d="M494,645 C504,650 518,662 522,680 C526,700 518,735 505,758
             C492,780 482,788 478,785 C470,778 462,758 458,735
             C454,708 456,678 466,658 C474,646 485,642 494,645 Z"
          fill="#2a6868" opacity={0.85}
        />
        <path
          d="M494,650 C502,655 510,668 513,682 C516,700 510,725 500,745
             C490,765 482,775 478,774 C474,770 467,755 464,738
             C460,712 464,685 472,668 C480,654 487,648 494,650 Z"
          fill="#4a8888" opacity={0.45}
        />
        <text x={492} y={790} textAnchor="middle" fontSize={7} fill="#3a5a5a" fontFamily="serif" opacity={0.6}>Dead Sea</text>

        {/* Title */}
        <rect x={150} y={10} width={300} height={48} rx={6} fill="#f2e4c8" stroke="#c4a35a" strokeWidth={1} opacity={0.88} />
        <text x={300} y={34} textAnchor="middle" fontSize={16} fontWeight="bold" fill="#5a3a1a" fontFamily="serif" letterSpacing={3}>
          Eretz Yisrael
        </text>
        <text x={300} y={48} textAnchor="middle" fontSize={8} fill="#8a6a3a" fontFamily="serif" letterSpacing={2} opacity={0.8}>
          Settlements of the New Yishuv — 1882-1914
        </text>

        {/* Settlement pins */}
        {locations.map((loc) => {
          const coord = getLocationCoords(loc.id);
          if (!coord) return null;
          const { x, y } = coord;
          const isSelected = loc.id === selectedLocationId;
          const isActive = activeLocationIds.includes(loc.id);
          const isHovered = hoveredId === loc.id;
          const radius = isSelected ? 15 : isHovered ? 12 : 10;

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
              {isSelected && (
                <circle cx={x} cy={y} r={radius + 5} fill="none" stroke="#d4a73a" strokeWidth={2} opacity={0.4}>
                  <animate attributeName="r" values={`${radius + 5};${radius + 10};${radius + 5}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <ellipse cx={x + 1} cy={y + 1} rx={radius} ry={radius} fill="#000" opacity={0.15} />
              <circle cx={x} cy={y} r={radius + 1} fill="#8a6a3a" opacity={0.3} />
              <circle
                cx={x} cy={y} r={radius}
                fill={isSelected ? '#d4a73a' : isHovered ? '#c8a44a' : '#b89850'}
                stroke="#fff" strokeWidth={2}
                filter={isSelected ? 'url(#pinShadowSelected)' : 'url(#pinShadow)'}
              />
              <circle cx={x - 2} cy={y - 2} r={radius * 0.35} fill="#fff" opacity={0.35} />
              {isActive && !isSelected && (
                <circle cx={x} cy={y + radius + 4} r={2.5} fill="#d4a73a" opacity={0.7} />
              )}
              <text
                x={x} y={y + radius + 14} textAnchor="middle"
                fontSize={isSelected ? 11 : 10}
                fill="#3a2a1a" fontFamily="serif"
                fontWeight={isSelected ? 'bold' : 'normal'}
              >
                {loc.name}
              </text>
            </g>
          );
        })}

        {/* Compass Rose */}
        <g transform="translate(555, 755)">
          <circle cx={0} cy={0} r={18} fill="#f2e4c8" stroke="#c4a35a" strokeWidth={0.8} opacity={0.85} />
          <polygon points="0,-14 4,-4 -4,-4" fill="#8a5a2b" />
          <polygon points="0,-14 4,-4 -4,-4" fill="#d4a73a" opacity={0.4} />
          <polygon points="0,14 4,4 -4,4" fill="#c4a35a" opacity={0.5} />
          <polygon points="-14,0 -4,-4 -4,4" fill="#c4a35a" opacity={0.5} />
          <polygon points="14,0 4,-4 4,4" fill="#c4a35a" opacity={0.5} />
          <polygon points="-10,-10 -3,-3 -5,-6" fill="#c4a35a" opacity={0.3} />
          <polygon points="10,-10 3,-3 5,-6" fill="#c4a35a" opacity={0.3} />
          <polygon points="-10,10 -3,3 -5,6" fill="#c4a35a" opacity={0.3} />
          <polygon points="10,10 3,3 5,6" fill="#c4a35a" opacity={0.3} />
          <text x={0} y={-20} textAnchor="middle" fontSize={8} fill="#8a5a2b" fontWeight="bold" fontFamily="serif">N</text>
        </g>

        {/* Scale bar */}
        <g transform="translate(470, 755)">
          <rect x={0} y={-8} width={90} height={35} rx={3} fill="#f2e4c8" stroke="#c4a35a" strokeWidth={0.5} opacity={0.8} />
          <line x1={5} y1={6} x2={85} y2={6} stroke="#8a5a2b" strokeWidth={1.5} />
          <line x1={5} y1={2} x2={5} y2={10} stroke="#8a5a2b" strokeWidth={1.5} />
          <line x1={45} y1={2} x2={45} y2={10} stroke="#8a5a2b" strokeWidth={1.5} />
          <line x1={85} y1={2} x2={85} y2={10} stroke="#8a5a2b" strokeWidth={1.5} />
          <text x={25} y={1} textAnchor="middle" fontSize={6} fill="#8a5a2b" fontFamily="serif">20</text>
          <text x={65} y={1} textAnchor="middle" fontSize={6} fill="#8a5a2b" fontFamily="serif">40</text>
          <text x={45} y={20} textAnchor="middle" fontSize={7} fill="#8a5a2b" fontFamily="serif">km</text>
        </g>

        {/* Legend */}
        <g transform="translate(10, 755)">
          <rect x={0} y={0} width={140} height={38} rx={3} fill="#f2e4c8" stroke="#c4a35a" strokeWidth={0.5} opacity={0.85} />
          <circle cx={12} cy={12} r={5} fill="#b89850" stroke="#fff" strokeWidth={1} />
          <text x={22} y={15} fontSize={7} fill="#5a3a1a" fontFamily="serif">Settlement</text>
          <circle cx={12} cy={28} r={5} fill="#d4a73a" stroke="#fff" strokeWidth={1}>
            <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x={22} y={31} fontSize={7} fill="#8a5a2b" fontFamily="serif">Selected</text>
        </g>
      </svg>

      {/* Location detail */}
      {showDetail && (
        <div className="location-detail">
          <button className="location-detail-close" onClick={() => onLocationClick('')} aria-label="Close">&times;</button>
          <h4 style={{ color: '#d4a73a', border: 'none', padding: 0, marginBottom: '0.3rem' }}>{selectedLoc!.name}</h4>
          {selectedLoc!.type && <p style={{ color: '#a89880', fontSize: '0.8rem', marginBottom: '0.2rem' }}>{selectedLoc!.type.replace('_', ' ')}</p>}
          {selectedLoc!.founded !== undefined && selectedLoc!.founded > 0 && (
            <p style={{ color: '#a89880', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Founded {selectedLoc!.founded}</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {['Housing', 'Water', 'Health'].map((stat) => {
              const val = stat === 'Housing' ? selectedLoc!.housing : stat === 'Water' ? selectedLoc!.water : selectedLoc!.health;
              return (
                <div key={stat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#a89880' }}>
                    <span>{stat}</span><span>{val}</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${val ?? 0}%`, height: '100%', background: stat === 'Housing' ? '#4a9e4a' : stat === 'Water' ? '#4a8ad4' : '#d4a73a', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
