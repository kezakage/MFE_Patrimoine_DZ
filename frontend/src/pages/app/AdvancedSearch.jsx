import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search as SearchIcon, Folder, Loader2 } from 'lucide-react'
import { heritage } from '../../lib/api.js'
import { resourceToCard, PERIODS } from '../../data/projects.js'

export default function AdvancedSearch() {
  const [q, setQ] = useState('')
  const [period, setPeriod] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!q) { setResults([]); return }
    let cancelled = false
    setLoading(true)
    setError(null)
    const t = setTimeout(() => {
      heritage.fts(q)
        .then((data) => {
          if (cancelled) return
          let list = (Array.isArray(data) ? data : (data.results || [])).map(resourceToCard)
          if (period) list = list.filter(r => r.periodValue === period || r.period === period)
          setResults(list)
        })
        .catch((e) => { if (!cancelled) setError(e.message) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q, period])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="section-title">Recherche avancée</h1>
        <p className="section-subtitle">Recherche plein texte sur les ressources du patrimoine.</p>
      </div>

      <div className="card p-5">
        <div className="grid md:grid-cols-12 gap-3">
          <div className="md:col-span-9">
            <label className="label">Recherche textuelle</label>
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400"/>
              <input value={q} onChange={e=>setQ(e.target.value)} className="input pl-9" placeholder="Mots-clés..."/>
            </div>
          </div>
          <div className="md:col-span-3">
            <label className="label">Période</label>
            <select className="input" value={period} onChange={e=>setPeriod(e.target.value)}>
              <option value="">Toutes</option>
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-sand-600 inline-flex items-center gap-2">
          <Loader2 size={14} className="animate-spin"/>Recherche...
        </div>
      )}
      {error && <div className="card p-3 text-red-700 bg-red-50 text-sm">{error}</div>}

      <section className="card p-5">
        <h3 className="font-semibold flex items-center gap-2"><Folder size={18}/>Ressources ({results.length})</h3>
        {!loading && q && results.length === 0 && (
          <div className="text-sand-500 text-sm mt-3">Aucun résultat.</div>
        )}
        <ul className="mt-3 space-y-2">
          {results.map(p => (
            <li key={p.id}>
              <Link to={`/explorer/${p.id}`} className="block p-3 rounded-lg hover:bg-sand-50">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-sand-500">{p.region} • {p.period} • {p.type}</div>
                {p.description && <div className="text-sm text-sand-700 mt-1 line-clamp-2">{p.description}</div>}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
