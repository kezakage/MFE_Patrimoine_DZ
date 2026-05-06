import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Edit3, Trash2, Activity } from 'lucide-react'
import { PROJECTS } from '../../data/projects.js'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function AdminProjects() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="section-title">Gestion des projets</h1>
        <p className="section-subtitle">Validez les contenus, supprimez ou modifiez les projets, suivez l'activité.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l:'Total', v: PROJECTS.length },
          { l:'Validés', v: PROJECTS.filter(p=>p.status==='valide').length, c:'text-emerald-600' },
          { l:'En cours', v: PROJECTS.filter(p=>p.status==='en_cours').length, c:'text-amber-600' },
          { l:'En conflit', v: PROJECTS.filter(p=>p.status==='en_conflit').length, c:'text-red-600' },
        ].map((s,i) => (
          <div key={i} className="card p-5">
            <div className="text-xs uppercase tracking-widest text-sand-500">{s.l}</div>
            <div className={`text-3xl font-semibold mt-1 ${s.c||''}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand-50">
            <tr>
              <th className="text-left px-4 py-3">Projet</th>
              <th className="text-left px-4 py-3">Région</th>
              <th className="text-left px-4 py-3">Période</th>
              <th className="text-left px-4 py-3">Contributeurs</th>
              <th className="text-left px-4 py-3">Activité</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {PROJECTS.map(p => (
              <tr key={p.id} className="border-t border-sand-100 hover:bg-sand-50/60">
                <td className="px-4 py-3">
                  <Link to={`/app/projets/${p.id}`} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg" style={{background:`linear-gradient(135deg, ${p.coverColor}, #3e2417)`}}/>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-sand-500">{p.type}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">{p.region}</td>
                <td className="px-4 py-3">{p.period}</td>
                <td className="px-4 py-3">{p.contributors.length}</td>
                <td className="px-4 py-3"><span className="flex items-center gap-1 text-sand-600 text-xs"><Activity size={14}/>il y a {Math.floor(Math.random()*20)+1}h</span></td>
                <td className="px-4 py-3"><StatusBadge status={p.status}/></td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    {p.status !== 'valide' && (
                      <button title="Valider" className="p-1.5 rounded hover:bg-emerald-100 text-emerald-700"><CheckCircle2 size={16}/></button>
                    )}
                    <button title="Modifier" className="p-1.5 rounded hover:bg-sand-100 text-sand-700"><Edit3 size={16}/></button>
                    <button title="Rejeter" className="p-1.5 rounded hover:bg-red-100 text-red-700"><XCircle size={16}/></button>
                    <button title="Supprimer" className="p-1.5 rounded hover:bg-red-100 text-red-700"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
