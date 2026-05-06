import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

// Simple decorative "map" — uses lat/lng positioned over Algeria's bounding box
const BOX = { latMin: 19, latMax: 37.5, lngMin: -9, lngMax: 12 }

function project(lat, lng) {
  const x = ((lng - BOX.lngMin) / (BOX.lngMax - BOX.lngMin)) * 100
  const y = ((BOX.latMax - lat) / (BOX.latMax - BOX.latMin)) * 100
  return { left: `${x}%`, top: `${y}%` }
}

export default function MapView({ projects }) {
  return (
    <div className="relative w-full h-[520px] rounded-xl border border-sand-200 overflow-hidden map-bg">
      {/* Decorative country outline */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-50">
        <path d="M10,30 L18,18 L35,12 L55,10 L72,15 L82,20 L88,32 L86,50 L78,70 L65,82 L48,88 L32,86 L20,78 L12,60 Z"
              fill="rgba(189,125,61,0.20)" stroke="#824c2b" strokeWidth="0.4"/>
      </svg>

      {projects.map(p => {
        const pos = project(p.lat, p.lng)
        return (
          <Link key={p.id} to={`/projets-publics/${p.id}`} style={pos}
                className="absolute -translate-x-1/2 -translate-y-full group">
            <div className="flex flex-col items-center">
              <div className="bg-terracotta-600 text-white rounded-full p-1.5 shadow group-hover:scale-110 transition-transform">
                <MapPin size={16}/>
              </div>
              <div className="mt-1 text-[10px] font-medium bg-white/90 px-1.5 py-0.5 rounded shadow text-sand-800 whitespace-nowrap">
                {p.name}
              </div>
            </div>
          </Link>
        )
      })}

      <div className="absolute bottom-3 right-3 bg-white/90 px-3 py-1.5 rounded text-xs text-sand-700 shadow">
        Vue carte (illustrative) — {projects.length} projets
      </div>
    </div>
  )
}
