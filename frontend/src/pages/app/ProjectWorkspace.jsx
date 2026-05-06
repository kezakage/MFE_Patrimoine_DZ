import { useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import {
  ArrowLeft, History, Users as UsersIcon, MessageSquare, Image as ImageIcon,
  Bold, Italic, Underline, List as ListIcon, Heading1, Quote, Table, MapPin,
  AlertTriangle, Save, Eye, Pin, GitCompare, RotateCcw, Plus
} from 'lucide-react'
import { findProject } from '../../data/projects.js'
import StatusBadge from '../../components/StatusBadge.jsx'

const TABS = [
  { k: 'edit', label: 'Éditeur', icon: Bold },
  { k: 'media', label: 'Médias & galerie', icon: ImageIcon },
  { k: 'annotations', label: 'Annotations', icon: Pin },
  { k: 'history', label: 'Historique', icon: History },
  { k: 'discussion', label: 'Discussion', icon: MessageSquare },
]

export default function ProjectWorkspace() {
  const { id } = useParams()
  const project = findProject(id)
  const [tab, setTab] = useState('edit')
  if (!project) return <Navigate to="/app/projets" replace/>

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Link to="/app/projets" className="btn-ghost"><ArrowLeft size={16}/>Projets</Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-display font-semibold">{project.name}</h1>
            <StatusBadge status={project.status}/>
            {project.status === 'en_conflit' && (
              <Link to={`/app/projets/${project.id}/conflits`} className="chip bg-red-50 text-red-700 border border-red-200">
                <AlertTriangle size={12}/>3 sections en désaccord
              </Link>
            )}
          </div>
          <p className="text-sand-600 text-sm mt-1">{project.region} • {project.period} • {project.type}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/projets-publics/${project.id}`} className="btn-secondary"><Eye size={16}/>Aperçu public</Link>
          <button className="btn-primary"><Save size={16}/>Enregistrer</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-sand-200">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.k} onClick={()=>setTab(t.k)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 ${
                tab===t.k ? 'border-terracotta-600 text-terracotta-700' : 'border-transparent text-sand-600 hover:text-sand-900'
              }`}>
              <t.icon size={16}/>{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-5">
          {tab === 'edit' && <Editor project={project}/>}
          {tab === 'media' && <MediaGallery project={project}/>}
          {tab === 'annotations' && <AnnotationsPanel project={project}/>}
          {tab === 'history' && <VersionHistory/>}
          {tab === 'discussion' && <Discussion/>}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold flex items-center gap-2"><UsersIcon size={16}/>Contributeurs</h3>
            <ul className="mt-3 space-y-2">
              {project.contributors.map((c,i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full grid place-items-center text-white text-xs font-semibold"
                       style={{background: ['#824c2b','#cd5028','#67241a','#a56432'][i%4]}}>
                    {c.split(' ').map(s=>s[0]).slice(0,2).join('')}
                  </div>
                  <div className="text-sm">{c}</div>
                </li>
              ))}
            </ul>
            <button className="btn-secondary w-full mt-3 text-sm"><Plus size={14}/>Inviter</button>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold">Statut & métriques</h3>
            <ul className="mt-3 space-y-2 text-sm text-sand-700">
              <li className="flex justify-between"><span>Sections</span><span className="font-medium">8</span></li>
              <li className="flex justify-between"><span>Annotations</span><span className="font-medium">{project.annotations}</span></li>
              <li className="flex justify-between"><span>Médias</span><span className="font-medium">{project.images}</span></li>
              <li className="flex justify-between"><span>Versions</span><span className="font-medium">{project.versions}</span></li>
              <li className="flex justify-between"><span>Dernière maj</span><span className="font-medium">il y a 2h</span></li>
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold flex items-center gap-2"><MapPin size={16}/>Localisation</h3>
            <div className="mt-3 h-32 rounded-lg map-bg relative overflow-hidden">
              <div className="absolute" style={{ top:'40%', left:'45%' }}><MapPin className="text-terracotta-700" size={24}/></div>
            </div>
            <div className="text-xs text-sand-500 mt-2">{project.lat.toFixed(3)}, {project.lng.toFixed(3)}</div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Toolbar() {
  return (
    <div className="flex flex-wrap gap-1 border-b border-sand-200 p-2 bg-sand-50">
      {[Heading1, Bold, Italic, Underline, Quote, ListIcon, Table, ImageIcon].map((Ic, i) => (
        <button key={i} className="p-2 rounded hover:bg-white text-sand-700"><Ic size={16}/></button>
      ))}
      <div className="ml-auto text-xs text-sand-500 self-center pr-2">Auto-sauvegarde activée</div>
    </div>
  )
}

function Editor({ project }) {
  const sections = [
    { t:'Présentation', a:'Dr. Amina Belhadj', body: project.description },
    { t:'Contexte historique', a:'Karim Saadi', body: 'L\'édifice s\'inscrit dans un contexte ottoman tardif. Il témoigne des évolutions stylistiques et fonctionnelles de l\'époque, mêlant influences locales et orientales.' },
    { t:'Description architecturale', a:'Pr. Hocine Mansouri', body: 'Le plan du bâtiment est organisé autour d\'une cour centrale. Les façades présentent un appareillage en pierre de taille...', conflict: true },
    { t:'État de conservation', a:'Dr. Amina Belhadj', body: 'Plusieurs campagnes de restauration ont été menées depuis les années 1970...' },
  ]
  return (
    <div className="card overflow-hidden">
      <Toolbar/>
      <div className="p-6 space-y-6">
        {sections.map((s,i) => (
          <article key={i} className={`group ${s.conflict?'ring-2 ring-red-300 rounded-lg p-3 -m-3 bg-red-50/40':''}`}>
            <header className="flex items-center justify-between mb-2">
              <h3 className="font-display text-xl font-semibold">{s.t}</h3>
              <div className="flex items-center gap-2">
                {s.conflict && <span className="chip bg-red-100 text-red-800"><AlertTriangle size={12}/>conflit</span>}
                <span className="text-xs text-sand-500">par {s.a}</span>
              </div>
            </header>
            <p className="text-sand-800 leading-relaxed" contentEditable suppressContentEditableWarning>
              {s.body}
            </p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex gap-2">
              <button className="btn-ghost text-xs"><Pin size={12}/>Annoter</button>
              <button className="btn-ghost text-xs"><MessageSquare size={12}/>Commenter</button>
            </div>
          </article>
        ))}
        <button className="btn-secondary w-full"><Plus size={16}/>Ajouter une section</button>
      </div>
    </div>
  )
}

function MediaGallery({ project }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Médias du projet ({project.images})</h3>
        <button className="btn-primary text-sm">+ Importer</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_,i) => (
          <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden relative cursor-pointer hover:opacity-90 group"
               style={{ background: `linear-gradient(${135 + i*15}deg, ${project.coverColor}, #3e2417)` }}>
            <div className="absolute inset-0 opacity-20"
                 style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,.6) 0 1px, transparent 1px 10px)' }}/>
            <div className="absolute bottom-2 left-2 text-white text-xs bg-black/30 px-2 py-0.5 rounded">{project.name} — {i+1}</div>
            <div className="absolute top-2 right-2 chip bg-white/90 text-sand-800 opacity-0 group-hover:opacity-100">{Math.floor(Math.random()*5)+1} annotations</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnnotationsPanel({ project }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-5">
        <h3 className="font-semibold">Annotations sur image</h3>
        <div className="mt-3 aspect-[4/3] rounded-lg relative overflow-hidden"
             style={{ background: `linear-gradient(135deg, ${project.coverColor}, #3e2417)` }}>
          {[
            {x:30,y:40,n:1}, {x:60,y:55,n:2}, {x:75,y:25,n:3},
          ].map(p => (
            <div key={p.n} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left:`${p.x}%`, top:`${p.y}%` }}>
              <div className="w-7 h-7 rounded-full bg-terracotta-600 text-white grid place-items-center text-xs font-bold ring-2 ring-white shadow">
                {p.n}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-sand-500 mt-2">Cliquez sur l'image pour ajouter un point d'annotation.</p>
      </div>
      <div className="card p-5">
        <h3 className="font-semibold">Liste des annotations</h3>
        <ul className="mt-3 space-y-2">
          {[
            { n:1, t:'Mihrab orné', a:'Dr. Amina Belhadj', s:'Description architecturale' },
            { n:2, t:'Coupole ottomane', a:'Pr. Hocine Mansouri', s:'Description architecturale' },
            { n:3, t:'Inscription épigraphique', a:'Karim Saadi', s:'Histoire' },
          ].map(a => (
            <li key={a.n} className="flex gap-3 p-3 rounded-lg bg-sand-50 border border-sand-100">
              <div className="w-7 h-7 rounded-full bg-terracotta-600 text-white grid place-items-center text-xs font-bold flex-shrink-0">{a.n}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{a.t}</div>
                <div className="text-xs text-sand-600">Lié à : <span className="text-terracotta-700">{a.s}</span></div>
                <div className="text-xs text-sand-500">par {a.a}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function VersionHistory() {
  const versions = [
    { v: 'v8', a: 'Dr. Amina Belhadj', d: 'il y a 2h', m: 'Ajout de la section "État de conservation"' },
    { v: 'v7', a: 'Karim Saadi', d: 'il y a 1j', m: 'Révision des sources historiques' },
    { v: 'v6', a: 'Pr. Hocine Mansouri', d: 'il y a 3j', m: 'Description architecturale (1ère version)' },
    { v: 'v5', a: 'Dr. Amina Belhadj', d: 'il y a 6j', m: 'Validation des images de couverture' },
  ]
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Historique des versions</h3>
        <div className="flex gap-2">
          <button className="btn-secondary text-sm"><GitCompare size={14}/>Comparer</button>
        </div>
      </div>
      <ul className="relative pl-6 border-l-2 border-sand-200 space-y-5">
        {versions.map((v,i) => (
          <li key={v.v} className="relative">
            <span className="absolute -left-[31px] w-4 h-4 rounded-full bg-terracotta-600 ring-4 ring-white"/>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-medium">{v.v} — {v.m}</div>
                <div className="text-xs text-sand-500">{v.a} • {v.d}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost text-xs"><Eye size={12}/>Voir</button>
                {i>0 && <button className="btn-ghost text-xs text-terracotta-700"><RotateCcw size={12}/>Restaurer</button>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Discussion() {
  const messages = [
    { a:'Dr. Amina Belhadj', d:'il y a 1j', t:'Je propose d\'ajouter une référence à l\'ouvrage de Lézine sur l\'architecture maghrébine.' },
    { a:'Karim Saadi', d:'il y a 22h', t:'D\'accord, je peux compléter cette section ce week-end.' },
    { a:'Pr. Hocine Mansouri', d:'il y a 4h', t:'Attention, la datation proposée pour le minaret est contestée — voir l\'étude de 2014.' },
  ]
  return (
    <div className="card p-5">
      <h3 className="font-semibold">Discussion du projet</h3>
      <ul className="mt-4 space-y-3">
        {messages.map((m,i) => (
          <li key={i} className="flex gap-3">
            <div className="w-9 h-9 rounded-full grid place-items-center text-white text-xs font-semibold"
                 style={{background:['#824c2b','#cd5028','#67241a'][i%3]}}>
              {m.a.split(' ').map(s=>s[0]).slice(0,2).join('')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2"><span className="font-medium text-sm">{m.a}</span><span className="text-xs text-sand-500">{m.d}</span></div>
              <div className="text-sm text-sand-800 mt-0.5">{m.t}</div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <input className="input flex-1" placeholder="Écrire un message..."/>
        <button className="btn-primary">Envoyer</button>
      </div>
    </div>
  )
}
