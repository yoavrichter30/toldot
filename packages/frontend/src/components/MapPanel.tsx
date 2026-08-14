import { useState, useRef, useCallback } from 'react';

interface MapLocation {
  id: string;
  name: string;
  description?: string;
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

// Pin positions derived from pixel-analysis of the actual map: coast x≈192,
// Kinneret ≈(602,228), Dead Sea ≈(583,953), mapped via real lat/lng.
const PIN_COORDS: Record<string, [number, number]> = {
  metulla: [612, 20],
  rosh_pinna: [597, 120],
  degamia: [618, 290],
  sejera: [530, 262],
  zikhron_yaakov: [313, 347],
  hadera: [288, 421],
  kfar_saba: [293, 568],
  petah_tikva: [274, 624],
  jaffa: [216, 641],
  rishon_lezion: [235, 687],
  rehovot: [245, 732],
};

export function MapPanel({
  locations,
  onLocationClick,
  selectedLocationId,
  activeLocationIds,
}: MapPanelProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 900, h: 1200 });
  const [isPanning, setIsPanning] = useState(false);

  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedLoc = locations.find((l) => l.id === selectedLocationId);
  const showDetail = selectedLocationId && selectedLoc;

  const clientToSvg = useCallback(
    (clientX: number, clientY: number): [number, number] => {
      const svg = svgRef.current;
      if (!svg) return [0, 0];
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * viewBox.w + viewBox.x;
      const y = ((clientY - rect.top) / rect.height) * viewBox.h + viewBox.y;
      return [x, y];
    },
    [viewBox],
  );

  const clampViewBox = useCallback((vb: typeof viewBox) => {
    const minW = 150, minH = 200;
    const w = Math.max(minW, Math.min(900, vb.w));
    const h = Math.max(minH, Math.min(1200, vb.h));
    const x = Math.max(0, Math.min(900 - w, vb.x));
    const y = Math.max(0, Math.min(1200 - h, vb.y));
    return { x, y, w, h };
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.15 : 0.85;
      const [mx, my] = clientToSvg(e.clientX, e.clientY);
      const nw = viewBox.w * factor;
      const nh = viewBox.h * factor;
      const nx = mx - (mx - viewBox.x) * (nw / viewBox.w);
      const ny = my - (my - viewBox.y) * (nh / viewBox.h);
      setViewBox(clampViewBox({ x: nx, y: ny, w: nw, h: nh }));
    },
    [viewBox, clampViewBox, clientToSvg],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
      }
    },
    [viewBox],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const dx = ((e.clientX - panStart.current.x) / rect.width) * viewBox.w;
      const dy = ((e.clientY - panStart.current.y) / rect.height) * viewBox.h;
      setViewBox((prev) => ({
        ...prev,
        x: Math.max(0, Math.min(900 - prev.w, panStart.current.vx - dx)),
        y: Math.max(0, Math.min(1200 - prev.h, panStart.current.vy - dy)),
      }));
    },
    [isPanning, viewBox.w, viewBox.h],
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);
  const handleMouseLeave = useCallback(() => setIsPanning(false), []);

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
        onMouseLeave={handleMouseLeave}
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

        <image href="/assets/map.svg" x={0} y={0} width={900} height={1200} preserveAspectRatio="xMidYMid meet" />

        {/* Settlement pins */}
        {locations.map((loc) => {
          const coord = PIN_COORDS[loc.id];
          if (!coord) return null;
          const [x, y] = coord;
          const isSelected = loc.id === selectedLocationId;
          const isActive = activeLocationIds.includes(loc.id);
          const isHovered = hoveredId === loc.id;
          const radius = isSelected ? 21 : isHovered ? 17 : 14;
          const failing = (loc.housing ?? 0) <= 0 || (loc.water ?? 0) <= 0 || (loc.health ?? 0) <= 0;

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
              {/* Dark halo for contrast against the parchment map */}
              <circle cx={x} cy={y} r={radius + 4} fill="#1a1410" opacity={0.4} />

              <ellipse cx={x + 2} cy={y + 2} rx={radius} ry={radius} fill="#000" opacity={0.25} />
              <circle
                cx={x} cy={y} r={radius}
                fill={isSelected ? '#e0b84a' : failing ? '#d0483a' : isHovered ? '#d4a73a' : '#3d9a4d'}
                stroke="#fff" strokeWidth={3}
                filter={isSelected ? 'url(#pinShadowSelected)' : 'url(#pinShadow)'}
              />
              <circle cx={x - 3} cy={y - 3} r={radius * 0.3} fill="#fff" opacity={0.4} />
              <text
                x={x} y={y + radius + 18} textAnchor="middle"
                fontSize={isSelected ? 15 : 13}
                fill="#fff" fontWeight="700"
                paintOrder="stroke"
                stroke="#1a1410"
                strokeWidth={4}
                style={{ pointerEvents: 'none' }}
              >
                {loc.name}
              </text>
            </g>
          );
        })}

        {/* Zoom/pan hint */}
        <g transform={`translate(8, ${viewBox.y + 20})`} pointerEvents="none">
          <rect x={0} y={0} width={120} height={18} rx={3} fill="#2a2218" opacity={0.6} />
          <text x={60} y={13} textAnchor="middle" fontSize={8} fill="#a89880" fontFamily="'Heebo',sans-serif">
            Scroll to zoom · Drag to pan
          </text>
        </g>
      </svg>

      {/* Location detail */}
      {showDetail && (
        <div className="location-detail" style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', background: '#2a2218', border: '1px solid #d4a73a', borderRadius: 8, padding: '1rem', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h4 style={{ color: '#d4a73a', margin: 0, fontSize: '1rem' }}>{selectedLoc!.name}</h4>
            <button onClick={() => onLocationClick('')} style={{ background: 'none', border: '1px solid #4a3f30', color: '#f0ece0', borderRadius: 4, padding: '0.2rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>&larr; Back</button>
          </div>
          {selectedLoc!.description && <p style={{ color: '#d8cdb0', fontSize: '0.82rem', lineHeight: 1.5, margin: '0 0 0.5rem' }}>{selectedLoc!.description}</p>}
          {selectedLoc!.type && <p style={{ color: '#f0ece0', fontSize: '0.8rem', margin: '0 0 0.2rem' }}>{selectedLoc!.type.replace('_', ' ')}</p>}
          {selectedLoc!.founded !== undefined && selectedLoc!.founded > 0 && <p style={{ color: '#f0ece0', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>Founded {selectedLoc!.founded}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {(['Housing', 'Water', 'Health'] as const).map((stat) => {
              const val = stat === 'Housing' ? selectedLoc!.housing : stat === 'Water' ? selectedLoc!.water : selectedLoc!.health;
              const color = stat === 'Housing' ? '#4a9e4a' : stat === 'Water' ? '#4a8ad4' : '#d4a73a';
              return (
                <div key={stat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#f0ece0' }}><span>{stat}</span><span>{val ?? 0}</span></div>
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
