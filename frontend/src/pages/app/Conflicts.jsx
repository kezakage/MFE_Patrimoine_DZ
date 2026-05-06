import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, ThumbsUp, MessageSquare, Check } from 'lucide-react'
import { findProject } from '../../data/projects.js'

const CONFLICTS = [
  {
    id: 'c1',
    section: 'Description architecturale',
    summary: 'Désaccord sur la datation du minaret',
    proposals: [
      { a:'Dr. Amina Belhadj', t:'Le minaret peut être daté du XIVe siècle, comme le suggèrent les similitudes stylistiques avec les minarets mérinides.', votes: 3 },
      { a:'Pr. Hocine Mansouri', t:'L\'étude archéologique de 2014 propose plutôt une datation du XVe siècle, sur la base de l\'analyse des matériaux.', votes: 5 },
    ],
    comments: [
      { a:'Karim Saadi', t:'Les deux hypothèses sont défendables. Pourrait-on présenter les deux datations dans la notice publique ?' },
    ],
  },
  {
    id: 'c2',
    section: 'Histoire',
    summary: 'Source contradictoire sur le commanditaire',
    proposals: [
      { a:'Karim Saadi', t:'Le commanditaire serait le sultan mérinide selon les chroniques de l\'époque.', votes: 2 },
      { a:'Dr. Amina Belhadj', t:'Une inscription épigraphique récemment lue suggère plutôt un dignitaire local.', votes: 4 },
    ],
    comments: [],
  },
]

export default function Conflicts() {
  const { id } = useParams()
  const project = findProject(id)
  if (!project) return <Navigate to="/app/projets" replace/>

  return (
    <div className="space-y-5">
      <Link to={`/app/projets/${id}`} className="btn-ghost"><ArrowLeft size={16}/>Retour au projet</Link>
      <div>
        <h1 className="section-title flex items-center gap-2">
          <AlertTriangle className="text-red-600"/>Conflits éditoriaux
        </h1>
        <p className="section-subtitle">{project.name} — sections en désaccord nécessitant une résolution.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { l:'Conflits ouverts', v:'2', c:'text-red-600' },
          { l:'En cours de résolution', v:'1', c:'text-amber-600' },
          { l:'Résolus ce mois', v:'4', c:'text-emerald-600' },
        ].map((s,i) => (
          <div key={i} className="card p-5">
            <div className="text-xs uppercase tracking-widest text-sand-500">{s.l}</div>
            <div className={`text-3xl font-semibold mt-1 ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {CONFLICTS.map(c => (
          <div key={c.id} className="card p-6 border-l-4 border-red-400">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-sand-500">Section : {c.section}</div>
                <h2 className="text-xl font-semibold mt-1">{c.summary}</h2>
              </div>
              <button className="btn-primary text-sm"><Check size={16}/>Lancer un vote final</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-5">
              {c.proposals.map((p,i) => (
                <div key={i} className="border border-sand-200 rounded-lg p-4 bg-sand-50/40">
                  <div className="text-xs text-sand-500">Proposition de</div>
                  <div className="font-medium">{p.a}</div>
                  <p className="text-sm text-sand-800 mt-2">{p.t}</p>
                  <div className="flex items-center justify-between mt-3">
                    <button className="btn-secondary text-xs"><ThumbsUp size={12}/>Soutenir ({p.votes})</button>
                    <button className="btn-ghost text-xs">Adopter</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-sand-200 pt-4">
              <h3 className="font-medium flex items-center gap-2 mb-3"><MessageSquare size={16}/>Discussion</h3>
              <ul className="space-y-2">
                {c.comments.map((m,i) => (
                  <li key={i} className="text-sm bg-white border border-sand-200 rounded-lg p-3">
                    <div className="flex items-center gap-2"><span className="font-medium">{m.a}</span></div>
                    <div className="text-sand-700 mt-1">{m.t}</div>
                  </li>
                ))}
                {c.comments.length === 0 && <li className="text-sm text-sand-500">Aucun commentaire pour l'instant.</li>}
              </ul>
              <div className="mt-3 flex gap-2">
                <input className="input flex-1" placeholder="Ajouter un commentaire..."/>
                <button className="btn-primary text-sm">Envoyer</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
