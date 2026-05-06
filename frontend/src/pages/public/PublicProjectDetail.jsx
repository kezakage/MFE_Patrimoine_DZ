import { useParams, Link, Navigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Building2, Users, Lock, Image as ImageIcon } from 'lucide-react'
import { findProject } from '../../data/projects.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function PublicProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const project = findProject(id)
  if (!project) return <Navigate to="/explorer" replace/>

  return (
    <div>
      <div className="relative h-72 md:h-96"
           style={{ background: `linear-gradient(135deg, ${project.coverColor}, #3e2417)` }}>
        <div className="absolute inset-0 opacity-20"
             style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,.5) 0 1px, transparent 1px 14px)' }}/>
        <div className="max-w-7xl mx-auto px-4 h-full flex flex-col justify-end pb-6 relative">
          <Link to="/explorer" className="absolute top-4 left-4 btn !bg-white/15 !text-white hover:!bg-white/25 backdrop-blur">
            <ArrowLeft size={16}/>Retour
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={project.status}/>
            <span className="chip bg-white/20 text-white">{project.type}</span>
            <span className="chip bg-white/20 text-white">{project.period}</span>
          </div>
          <h1 className="font-display text-white text-4xl md:text-5xl font-bold drop-shadow">{project.name}</h1>
          <p className="text-sand-100 mt-2 max-w-2xl">{project.summary}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-6">
            <h2 className="text-xl font-semibold">Description</h2>
            <p className="mt-3 text-sand-700 leading-relaxed">{project.description}</p>
            <p className="mt-3 text-sand-700 leading-relaxed">
              Cette notice est issue d'un travail collaboratif validé scientifiquement par les contributeurs experts de la plateforme.
              L'historique des versions et les sources complètes sont accessibles aux utilisateurs connectés.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><ImageIcon size={20}/>Galerie</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {Array.from({ length: 6 }).map((_,i) => (
                <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden relative"
                     style={{ background: `linear-gradient(${135 + i*15}deg, ${project.coverColor}, #3e2417)` }}>
                  <div className="absolute inset-0 opacity-20"
                       style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,.6) 0 1px, transparent 1px 10px)' }}/>
                  <div className="absolute bottom-2 left-2 text-white text-xs bg-black/30 px-2 py-0.5 rounded">Vue {i+1}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-semibold">Contributions visibles</h2>
            <ul className="mt-3 space-y-3">
              {[
                { a: 'Dr. Amina Belhadj', d: 'Notice historique principale', date: '2026-04-15' },
                { a: 'Pr. Hocine Mansouri', d: 'Description architecturale validée', date: '2026-04-22' },
              ].map((c,i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-sand-50 border border-sand-100">
                  <div className="w-8 h-8 rounded-full bg-terracotta-600 text-white grid place-items-center text-xs font-semibold">
                    {c.a.split(' ').map(s=>s[0]).slice(0,2).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{c.a}</div>
                    <div className="text-sm text-sand-600">{c.d}</div>
                  </div>
                  <span className="text-xs text-sand-500">{c.date}</span>
                </li>
              ))}
            </ul>
          </section>

          {!user && (
            <section className="card p-6 bg-gradient-to-br from-terracotta-50 to-sand-50 border-terracotta-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-terracotta-600 text-white grid place-items-center"><Lock size={18}/></div>
                <div>
                  <h3 className="font-semibold">Fonctionnalités avancées réservées aux experts</h3>
                  <p className="text-sm text-sand-700 mt-1">
                    Connectez-vous pour accéder à l'éditeur collaboratif, aux annotations détaillées, à l'historique des versions et au système de gestion des conflits.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link to="/connexion" className="btn-primary">Se connecter</Link>
                    <Link to="/inscription" className="btn-secondary">S'inscrire</Link>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold">Informations</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-sand-700"><MapPin size={16} className="text-terracotta-600"/>{project.region}, Algérie</li>
              <li className="flex items-center gap-2 text-sand-700"><Calendar size={16} className="text-terracotta-600"/>Période {project.period}</li>
              <li className="flex items-center gap-2 text-sand-700"><Building2 size={16} className="text-terracotta-600"/>{project.type}</li>
              <li className="flex items-center gap-2 text-sand-700"><Users size={16} className="text-terracotta-600"/>{project.contributors.length} contributeurs</li>
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold">Localisation</h3>
            <div className="mt-3 h-48 rounded-lg map-bg relative overflow-hidden">
              <div className="absolute" style={{ top:'40%', left:'45%' }}>
                <MapPin className="text-terracotta-700" size={28}/>
              </div>
              <div className="absolute bottom-2 left-2 bg-white/90 text-xs px-2 py-1 rounded">
                {project.lat.toFixed(3)}, {project.lng.toFixed(3)}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold">Contributeurs</h3>
            <div className="mt-3 flex -space-x-2">
              {project.contributors.map((c,i) => (
                <div key={i} title={c}
                     className="w-9 h-9 rounded-full ring-2 ring-white grid place-items-center text-white text-xs font-semibold"
                     style={{ background: ['#824c2b','#cd5028','#67241a','#a56432'][i%4] }}>
                  {c.split(' ').map(s=>s[0]).slice(0,2).join('')}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
