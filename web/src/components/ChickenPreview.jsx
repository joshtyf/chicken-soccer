export default function ChickenPreview({ bodyColor = '#f0c74a', className = '' }) {
  return (
    <svg
      viewBox="0 0 32 24"
      role="img"
      aria-label="Chicken preview"
      className={`h-[3.1rem] w-[4.2rem] shrink-0 border border-white/15 bg-[rgba(255,255,255,0.02)] p-[0.2rem] ${className}`.trim()}
      shapeRendering="crispEdges"
    >
      <rect x="2" y="20" width="28" height="1" fill="#2a2540" opacity="0.85" />

      <rect x="11" y="5" width="9" height="11" fill={bodyColor} />
      <rect x="9" y="7" width="2" height="7" fill={bodyColor} />
      <rect x="20" y="7" width="2" height="7" fill={bodyColor} />
      <rect x="10" y="15" width="10" height="1" fill={bodyColor} />
      <rect x="12" y="4" width="7" height="1" fill={bodyColor} />

      <rect x="11" y="4" width="1" height="1" fill="#2a2540" />
      <rect x="19" y="4" width="1" height="1" fill="#2a2540" />
      <rect x="10" y="5" width="1" height="2" fill="#2a2540" />
      <rect x="20" y="5" width="1" height="2" fill="#2a2540" />
      <rect x="9" y="7" width="1" height="7" fill="#2a2540" />
      <rect x="21" y="7" width="1" height="7" fill="#2a2540" />
      <rect x="10" y="14" width="1" height="2" fill="#2a2540" />
      <rect x="20" y="14" width="1" height="2" fill="#2a2540" />
      <rect x="11" y="16" width="9" height="1" fill="#2a2540" />

      <rect x="13" y="2" width="5" height="2" fill="#db3f4d" />
      <rect x="14" y="1" width="3" height="1" fill="#db3f4d" />
      <rect x="12" y="3" width="1" height="1" fill="#2a2540" />
      <rect x="18" y="3" width="1" height="1" fill="#2a2540" />

      <rect x="16" y="9" width="1" height="1" fill="#171421" />
      <rect x="18" y="9" width="2" height="1" fill="#cf9b42" />
      <rect x="12" y="11" width="1" height="1" fill="#e8a5b9" opacity="0.85" />
      <rect x="19" y="11" width="1" height="1" fill="#e8a5b9" opacity="0.85" />

      <rect x="12" y="17" width="2" height="3" fill="#cf9b42" />
      <rect x="17" y="17" width="2" height="3" fill="#cf9b42" />
      <rect x="12" y="19" width="2" height="1" fill="#2a2540" />
      <rect x="17" y="19" width="2" height="1" fill="#2a2540" />

      <rect x="8" y="12" width="1" height="6" fill="#8f8aa9" />
    </svg>
  );
}
