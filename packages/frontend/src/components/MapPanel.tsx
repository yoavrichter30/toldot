import { useState, useRef, useCallback } from 'react';

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

// 900x1200 coordinates matching the SVG viewBox
const PIN_COORDS: Record<string, [number, number]> = {
  metulla:        [720, 80],
  rosh_pinna:     [700, 290],
  kinneret_farm:  [730, 480],
  degamia:        [670, 510],
  sejera:         [580, 480],
  zikhron_yaakov: [230, 580],
  hadera:         [200, 680],
  kfar_saba:      [210, 860],
  petah_tikva:    [180, 930],
  jaffa:          [90, 950],
  rishon_lezion:  [120, 1010],
  rehovot:        [140, 1060],
};

export function MapPanel({
  locations,
  onLocationClick,
  selectedLocationId,
  activeLocationIds,
}: MapPanelProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  // Pan/zoom state: viewBox = [vx, vy, vw, vh]
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 900, h: 1200 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedLoc = locations.find((l) => l.id === selectedLocationId);
  const showDetail = selectedLocationId && selectedLoc;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.85;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
    const my = ((e.clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;
    const nw = Math.max(200, Math.min(1200, viewBox.w * factor));
    const nh = Math.max(266, Math.min(1600, viewBox.h * factor));
    const nx = mx - (mx - viewBox.x) * (nw / viewBox.w);
    const ny = my - (my - viewBox.y) * (nh / viewBox.h);
    setViewBox({ x: nx, y: ny, w: nw, h: nh });
  }, [viewBox]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.shiftKey) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
    }
  }, [viewBox]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = ((e.clientX - panStart.current.x) / rect.width) * viewBox.w;
    const dy = ((e.clientY - panStart.current.y) / rect.height) * viewBox.h;
    setViewBox(prev => ({ ...prev, x: panStart.current.vx - dx, y: panStart.current.vy - dy }));
  }, [isPanning, viewBox.w, viewBox.h]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  return (
    <div className="map-panel">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="map-svg"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Historical map of Eretz Yisrael"
        role="img"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsPanning(false)}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <defs>
          <filter id="pinShadow">
            <feDropShadow dx={1} dy={1} stdDeviation={1.5} floodOpacity={0.4} />
          </filter>
          <filter id="pinShadowSelected">
            <feDropShadow dx={0} dy={0} stdDeviation={5} floodOpacity={0.6} floodColor="#d4a73a" />
          </filter>
        </defs>

        {/* The user's SVG map as embedded image */}
        <image href="/assets/map.svg" x={0} y={0} width={900} height={1200} preserveAspectRatio="xMidYMid meet" />

        {/* Title */}
        <g>
          <rect x={260} y={15} width={380} height={50} rx={6} fill="#f2e4c8" stroke="#c4a35a" strokeWidth={1} opacity={0.85} />
          <text x={450} y={40} textAnchor="middle" fontSize={18} fontWeight="bold" fill="#5a3a1a" fontFamily="'Palatino','Georgia',serif" letterSpacing={3}>Eretz Yisrael</text>
          <text x={450} y={55} textAnchor="middle" fontSize={9} fill="#8a6a3a" fontFamily="'Palatino','Georgia',serif" letterSpacing={2} opacity={0.8}>New Yishuv Settlements 1882–1914</text>
        </g>

        {/* Zoom indicator */}
        <g transform={`translate(8, ${viewBox.y + viewBox.h - 65})`}>
          <rect x={0} y={0} width={75} height={20} rx={3} fill="#2a2218" stroke="#4a3f30" strokeWidth={0.5} opacity={0.8} />
          <text x={37} y={14} textAnchor="middle" fontSize={9} fill="#a89880" fontFamily="'Helvetica',sans-serif">{Math.round(100 * 900 / viewBox.w)}%</text>
        </g>

        {/* Settlement pins */}
        {locations.map((loc) => {
          const coord = PIN_COORDS[loc.id];
          if (!coord) return null;
          const [x, y] = coord;
          const isSelected = loc.id === selectedLocationId;
          const isActive = activeLocationIds.includes(loc.id);
          const isHovered = hoveredId === loc.id;
          const radius = isSelected ? 18 : isHovered ? 15 : 12;

          return (
            <g
              key={loc.id}
              className={`map-pin ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onLocationClick(loc.id); }}
              onMouseEnter={() => setHoveredId(loc.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ cursor: 'pointer' }}
              role="button"
              aria-label={`${loc.name}${isSelected ? ' (selected)' : ''}`}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onLocationClick(loc.id); } }}
            >
              {isSelected && (
                <circle cx={x} cy={y} r={radius + 6} fill="none" stroke="#d4a73a" strokeWidth={2.5} opacity={0.5}>
                  <animate attributeName="r" values={`${radius + 6};${radius + 12};${radius + 6}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <ellipse cx={x + 2} cy={y + 2} rx={radius} ry={radius} fill="#000" opacity={0.2} />
              <circle cx={x} cy={y} r={radius} fill={isSelected ? '#d4a73a' : isHovered ? '#c8a44a' : '#b89850'} stroke="#fff" strokeWidth={2.5} filter={isSelected ? 'url(#pinShadowSelected)' : 'url(#pinShadow)'} />
              <circle cx={x - 3} cy={y - 3} r={radius * 0.3} fill="#fff" opacity={0.35} />
              <text x={x} y={y + radius + 16} textAnchor="middle" fontSize={isSelected ? 13 : 11} fill="#fff" fontWeight={isSelected ? 'bold' : '600'} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{loc.name}</text>
            </g>
          );
        })}

        {/* Map zoom/pan hint */}
        <g transform={`translate(10, ${viewBox.y + 20})`}>
          <rect x={0} y={0} width={140} height={18} rx={3} fill="#2a2218" opacity={0.6} />
          <text x={70} y={13} textAnchor="middle" fontSize={8} fill="#a89880" fontFamily="'Helvetica',sans-serif">Scroll to zoom · Shift+drag to pan</text>
        </g>
      </svg>

      {/* Location detail info box */}
      {showDetail && (
        <div className="location-detail" style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', background: '#2a2218', border: '1px solid #d4a73a', borderRadius: 8, padding: '1rem', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ color: '#d4a73a', margin: 0, fontSize: '1rem' }}>{selectedLoc!.name}</h4>
            <button onClick={() => onLocationClick('')} style={{ background: 'none', border: '1px solid #4a3f30', color: '#a89880', borderRadius: 4, padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>&larr; Back</button>
          </div>
          {selectedLoc!.type && <p style={{ color: '#a89880', fontSize: '0.8rem', margin: '0 0 0.2rem' }}>{selectedLoc!.type.replace('_', ' ')}</p>}
          {selectedLoc!.founded !== undefined && selectedLoc!.founded > 0 && <p style={{ color: '#a89880', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>Founded {selectedLoc!.founded}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {['Housing', 'Water', 'Health'].map((stat) => {
              const val = stat === 'Housing' ? selectedLoc!.housing : stat === 'Water' ? selectedLoc!.water : selectedLoc!.health;
              const color = stat === 'Housing' ? '#4a9e4a' : stat === 'Water' ? '#4a8ad4' : '#d4a73a';
              return (
                <div key={stat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#e8ddd0' }}><span>{stat}</span><span>{val ?? 0}</span></div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${val ?? 0}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
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
