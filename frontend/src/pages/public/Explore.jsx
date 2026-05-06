import { useMemo, useState } from 'react'
import { Search, List, Map as MapIcon, X } from 'lucide-react'
import { PROJECTS, PERIODS, TYPES, REGIONS } from '../../data/projects.js'
import ProjectCard from '../../components/ProjectCard.jsx'
import MapView from '../../components/MapView.jsx'

export default function Explore() {
  const [q, setQ] = useState('')
  const [period, setPeriod] = useState('')
  const [region, setRegion] = useState('')
  const [type, setType] = useState('')
  const [view, setView] = useState('list')

  const filtered = useMemo(() => PROJECTS.filter(p => {
    const txt = (p.name + ' ' + p.summary + ' ' + p.region + ' ' + p.type).toLowerCase()
    if (q && !txt.includes(q.toLowerCase())) return false
    if (period && p.period !== period) return false
    if (region && p.region !== region) return false
    if (type && p.type !== type) return false
    return true
  }), [q, period, region, type])

  const reset = () => { setQ(''); setPeriod(''); setRegion(''); setType('') }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Explorer le patrimoine</h1>
          <p className="section-subtitle">Parcourez les projets documentés par la communauté.</p>
        </div>
        <div className="inline-flex bg-white rounded-lg border border-sand-200 p-1">
          <button onClick={() => setView('list')} className={`btn ${view==='list'?'bg-terracotta-600 text-white':'text-sand-700'}`}><List size={16}/>Liste</button>
          <button onClick={() => setView('map')} className={`btn ${view==='map'?'bg-terracotta-600 text-white':'text-sand-700'}`}><MapIcon size={16}/>Carte</button>
        </div>
      </div>

      <div className="card p-4 mt-6 grid md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-4">
          <label className="label">Recherche</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400"/>
            <input value={q} onChange={e=>setQ(e.target.value)} className="input pl-9" placeholder="Nom, lieu, type..."/>
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="label">Période</label>
          <select value={period} onChange={e=>setPeriod(e.target.value)} className="input">
            <option value="">Toutes</option>
            {PERIODS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Région</label>
          <select value={region} onChange={e=>setRegion(e.target.value)} className="input">
            <option value="">Toutes</option>
            {REGIONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="label">Type architectural</label>
          <select value={type} onChange={e=>setType(e.target.value)} className="input">
            <option value="">Tous</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="md:col-span-1">
          <button onClick={reset} className="btn-secondary w-full"><X size={16}/></button>
        </div>
      </div>

      <div className="mt-4 text-sm text-sand-600">{filtered.length} projet(s) trouvé(s)</div>

      <div className="mt-4">
        {view === 'list' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => <ProjectCard key={p.id} project={p}/>)}
            {filtered.length === 0 && (
              <div className="col-span-full card p-10 text-center text-sand-600">
                Aucun projet ne correspond à votre recherche.
              </div>
            )}
          </div>
        ) : (
          <MapView projects={filtered}/>
        )}
      </div>
    </div>
  )
}
