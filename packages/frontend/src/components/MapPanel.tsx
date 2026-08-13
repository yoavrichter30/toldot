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

// Pin positions computed from real lat/lng mapped onto the 900x1200 canvas.
// Geographic bounds: 33.40°N (top) → 31.30°N (bottom), 34.70°E (coast) → 35.62°E (Jordan).
const DEFAULT_PIN_COORDS: Record<string, [number, number]> = {
  metulla: [557, 104],
  rosh_pinna: [540, 269],
  kinneret_farm: [557, 408],
  degamia: [557, 413],
  sejera: [460, 403],
  zikhron_yaakov: [203, 483],
  hadera: [174, 552],
  kfar_saba: [180, 691],
  petah_tikva: [157, 744],
  jaffa: [89, 760],
  rishon_lezion: [111, 803],
  rehovot: [123, 845],
};

const STORAGE_KEY = 'toldot.pin-coords.v2';

function loadPinCoords(): Record<string, [number, number]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PIN_COORDS };
    const parsed = JSON.parse(raw);
    // Merge over defaults so newly-added locations still get a position
    return { ...DEFAULT_PIN_COORDS, ...parsed };
  } catch {
    return { ...DEFAULT_PIN_COORDS };
  }
}

function savePinCoords(coords: Record<string, [number, number]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
  } catch {
    // ignore persistence failures (private browsing, etc.)
  }
}

export function MapPanel({
  locations,
  onLocationClick,
  selectedLocationId,
  activeLocationIds,
}: MapPanelProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 900, h: 1200 });
  const [isPanning, setIsPanning] = useState(false);
  const [pinCoords, setPinCoords] = useState<Record<string, [number, number]>>(loadPinCoords);

  const panStart = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const drag = useRef<{ id: string; moved: boolean } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedLoc = locations.find((l) => l.id === selectedLocationId);
  const showDetail = selectedLocationId && selectedLoc;

  // Convert a client (mouse) coordinate into SVG viewBox coordinates
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
      // Left-click on the map background pans; pin drags are handled on the pins
      if (e.button === 0) {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
      }
    },
    [viewBox],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (drag.current) {
        // Dragging a pin — update its position live
        const [x, y] = clientToSvg(e.clientX, e.clientY);
        const id = drag.current.id;
        drag.current.moved = true;
        setPinCoords((prev) => ({ ...prev, [id]: [Math.round(x), Math.round(y)] }));
        return;
      }
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
    [isPanning, viewBox.w, viewBox.h, clientToSvg],
  );

  const handleMouseUp = useCallback(() => {
    if (drag.current) {
      savePinCoords(pinCoords);
      drag.current = null;
    }
    setIsPanning(false);
  }, [pinCoords]);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
    drag.current = null;
  }, []);

  const handlePinPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    drag.current = { id, moved: false };
  };

  const handlePinClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    // Ignore clicks that were actually pin drags
    if (drag.current?.moved) return;
    onLocationClick(id);
  };

  const resetPins = () => {
    setPinCoords({ ...DEFAULT_PIN_COORDS });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

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
          const coord = pinCoords[loc.id];
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
              onClick={(e) => handlePinClick(e, loc.id)}
              onPointerDown={(e) => handlePinPointerDown(e, loc.id)}
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
              <circle
                cx={x} cy={y} r={radius}
                fill={isSelected ? '#d4a73a' : isHovered ? '#c8a44a' : '#b89850'}
                stroke="#fff" strokeWidth={2.5}
                filter={isSelected ? 'url(#pinShadowSelected)' : 'url(#pinShadow)'}
              />
              <circle cx={x - 3} cy={y - 3} r={radius * 0.3} fill="#fff" opacity={0.35} />
              <text
                x={x} y={y + radius + 16} textAnchor="middle"
                fontSize={isSelected ? 13 : 11}
                fill="#fff" fontWeight={isSelected ? 'bold' : '600'}
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)', pointerEvents: 'none' }}
              >
                {loc.name}
              </text>
            </g>
          );
        })}

        {/* Reset pins control */}
        <g transform={`translate(10, ${viewBox.y + viewBox.h - 42})`} onClick={(e) => { e.stopPropagation(); resetPins(); }} style={{ cursor: 'pointer' }}>
          <rect x={0} y={0} width={70} height={20} rx={3} fill="#2a2218" stroke="#4a3f30" strokeWidth={0.5} opacity={0.85} />
          <text x={35} y={14} textAnchor="middle" fontSize={9} fill="#a89880" fontFamily="'Heebo',sans-serif">Reset pins</text>
        </g>

        {/* Zoom indicator */}
        <g transform={`translate(8, ${viewBox.y + 20})`} pointerEvents="none">
          <rect x={0} y={0} width={150} height={18} rx={3} fill="#2a2218" opacity={0.6} />
          <text x={75} y={13} textAnchor="middle" fontSize={8} fill="#a89880" fontFamily="'Heebo',sans-serif">
            Drag pins to move · Scroll to zoom · Drag to pan
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
