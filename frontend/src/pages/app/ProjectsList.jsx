import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Grid as GridIcon, List as ListIcon } from 'lucide-react'
import { PROJECTS, STATUS_LABEL } from '../../data/projects.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import ProjectCard from '../../components/ProjectCard.jsx'

export default function ProjectsList() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [view, setView] = useState('grid')

  const filtered = useMemo(() => PROJECTS.filter(p => {
    if (q && !(p.name + p.summary).toLowerCase().includes(q.toLowerCase())) return false
    if (status && p.status !== status) return false
    return true
  }), [q, status])

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Projets</h1>
          <p className="section-subtitle">Espace collaboratif — projets accessibles à votre compte.</p>
        </div>
        <Link to="/app/projets/nouveau" className="btn-primary"><Plus size={16}/>Nouveau projet</Link>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="label">Recherche</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400"/>
            <input value={q} onChange={e=>setQ(e.target.value)} className="input pl-9" placeholder="Nom, description..."/>
          </div>
        </div>
        <div>
          <label className="label">Statut</label>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="input min-w-[160px]">
            <option value="">Tous</option>
            {Object.entries(STATUS_LABEL).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="inline-flex bg-sand-50 rounded-lg border border-sand-200 p-1">
          <button onClick={()=>setView('grid')} className={`btn ${view==='grid'?'bg-white shadow':'text-sand-600'}`}><GridIcon size={16}/></button>
          <button onClick={()=>setView('list')} className={`btn ${view==='list'?'bg-white shadow':'text-sand-600'}`}><ListIcon size={16}/></button>
        </div>
      </div>

      {view === 'grid' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(p => <ProjectCard key={p.id} project={p} to={`/app/projets/${p.id}`}/>)}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sand-50 text-sand-700">
              <tr>
                <th className="text-left px-4 py-3">Projet</th>
                <th className="text-left px-4 py-3">Région</th>
                <th className="text-left px-4 py-3">Période</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Contributeurs</th>
                <th className="text-left px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t border-sand-100 hover:bg-sand-50">
                  <td className="px-4 py-3">
                    <Link to={`/app/projets/${p.id}`} className="font-medium hover:text-terracotta-700">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3">{p.region}</td>
                  <td className="px-4 py-3">{p.period}</td>
                  <td className="px-4 py-3">{p.type}</td>
                  <td className="px-4 py-3">{p.contributors.length}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
