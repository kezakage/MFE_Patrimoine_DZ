import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search as SearchIcon, FileText, Pin, Folder } from 'lucide-react'
import { PROJECTS, PERIODS } from '../../data/projects.js'

const DISCIPLINES = ['Tous', 'Architecture', 'Histoire', 'Archéologie', 'Sociologie', 'Urbanisme']

export default function AdvancedSearch() {
  const [q, setQ] = useState('mosquée')
  const [period, setPeriod] = useState('')
  const [discipline, setDiscipline] = useState('Tous')
  const [author, setAuthor] = useState('')

  const projectResults = useMemo(() => PROJECTS.filter(p =>
    (!q || (p.name + p.summary + p.region + p.type).toLowerCase().includes(q.toLowerCase())) &&
    (!period || p.period === period)
  ), [q, period])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="section-title">Recherche avancée</h1>
        <p className="section-subtitle">Recherche transverse : projets, sections, annotations.</p>
      </div>

      <div className="card p-5">
        <div className="grid md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <label className="label">Recherche textuelle</label>
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400"/>
              <input value={q} onChange={e=>setQ(e.target.value)} className="input pl-9" placeholder="Mots-clés..."/>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="label">Période</label>
            <select className="input" value={period} onChange={e=>setPeriod(e.target.value)}>
              <option value="">Toutes</option>
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="label">Discipline</label>
            <select className="input" value={discipline} onChange={e=>setDiscipline(e.target.value)}>
              {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">Auteur</label>
            <input className="input" value={author} onChange={e=>setAuthor(e.target.value)} placeholder="Nom..."/>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Projects */}
        <section className="card p-5">
          <h3 className="font-semibold flex items-center gap-2"><Folder size={18}/>Projets ({projectResults.length})</h3>
          <ul className="mt-3 space-y-2">
            {projectResults.map(p => (
              <li key={p.id}>
                <Link to={`/app/projets/${p.id}`} className="block p-3 rounded-lg hover:bg-sand-50">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-sand-500">{p.region} • {p.period} • {p.type}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Sections */}
        <section className="card p-5">
          <h3 className="font-semibold flex items-center gap-2"><FileText size={18}/>Sections (12)</h3>
          <ul className="mt-3 space-y-2">
            {[
              { p:'Casbah d\'Alger', s:'Description architecturale', e:'...la mosquée Ketchaoua, située à proximité, témoigne...' },
              { p:'Mosquée Ketchaoua', s:'Histoire', e:'...transformée en cathédrale durant la période coloniale...' },
              { p:'Mansourah (Tlemcen)', s:'Urbanisme', e:'...les vestiges de la mosquée mérinide...' },
              { p:'Médersa El-Eubbad', s:'Présentation', e:'...la mosquée et son mausolée forment un ensemble...' },
            ].map((r,i) => (
              <li key={i} className="p-3 rounded-lg bg-sand-50/60 border border-sand-100">
                <div className="text-xs text-sand-500">{r.p} ›</div>
                <div className="font-medium text-sm">{r.s}</div>
                <div className="text-xs text-sand-700 mt-1">{r.e}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* Annotations */}
        <section className="card p-5">
          <h3 className="font-semibold flex items-center gap-2"><Pin size={18}/>Annotations (7)</h3>
          <ul className="mt-3 space-y-2">
            {[
              { p:'Casbah d\'Alger', a:'Mihrab orné', u:'Dr. Amina Belhadj' },
              { p:'Timgad', a:'Forum romain', u:'Karim Saadi' },
              { p:'Mansourah (Tlemcen)', a:'Minaret monumental', u:'Pr. Hocine Mansouri' },
            ].map((r,i) => (
              <li key={i} className="p-3 rounded-lg bg-sand-50/60 border border-sand-100">
                <div className="text-xs text-sand-500">{r.p}</div>
                <div className="font-medium text-sm">{r.a}</div>
                <div className="text-xs text-sand-600 mt-0.5">par {r.u}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
