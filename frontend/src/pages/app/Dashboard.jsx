import { Link } from 'react-router-dom'
import {
  FolderKanban, AlertTriangle, CheckCircle2, Activity, Sparkles,
  Users as UsersIcon, FileCheck2, BarChart3, ArrowRight, Bell
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useNotifications } from '../../context/NotificationsContext.jsx'
import { PROJECTS } from '../../data/projects.js'
import StatusBadge from '../../components/StatusBadge.jsx'

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg grid place-items-center bg-terracotta-50 text-terracotta-700">
          <Icon size={20}/>
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs text-sand-500 uppercase tracking-widest">{label}</div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { items: notifs } = useNotifications()
  const isAdmin = user.role === 'admin'

  if (isAdmin) return <AdminDashboard notifs={notifs}/>
  return <ExpertDashboard user={user} notifs={notifs}/>
}

function ExpertDashboard({ user, notifs }) {
  const myProjects = PROJECTS.slice(0, 3)
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title">Tableau de bord</h1>
          <p className="section-subtitle">Vue d'ensemble de vos projets et activités.</p>
        </div>
        <Link to="/app/projets/nouveau" className="btn-primary">+ Nouveau projet</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Mes projets" value="6"/>
        <StatCard icon={CheckCircle2} label="Validés" value="3"/>
        <StatCard icon={AlertTriangle} label="En conflit" value="1"/>
        <StatCard icon={FileCheck2} label="Contributions" value="42"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Mes projets en cours</h2>
            <Link to="/app/projets" className="text-sm text-terracotta-700 flex items-center gap-1">Tous <ArrowRight size={14}/></Link>
          </div>
          <ul className="divide-y divide-sand-100">
            {myProjects.map(p => (
              <li key={p.id} className="py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg" style={{background: `linear-gradient(135deg, ${p.coverColor}, #3e2417)`}}/>
                <div className="flex-1 min-w-0">
                  <Link to={`/app/projets/${p.id}`} className="font-medium hover:text-terracotta-700">{p.name}</Link>
                  <div className="text-xs text-sand-500">{p.region} • {p.period}</div>
                </div>
                <StatusBadge status={p.status}/>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><Activity size={18}/>Activité récente</h2>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              { t: 'Vous avez ajouté 3 photos à Casbah d\'Alger', d: 'il y a 2h' },
              { t: 'Karim a commenté votre annotation', d: 'il y a 5h' },
              { t: 'Nouvelle version validée sur Timgad', d: 'hier' },
              { t: 'Conflit ouvert sur Mansourah', d: 'il y a 2 jours' },
            ].map((a,i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="w-2 h-2 mt-2 rounded-full bg-terracotta-500"/>
                <div className="flex-1">
                  <div>{a.t}</div>
                  <div className="text-xs text-sand-500">{a.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="font-semibold flex items-center gap-2"><Sparkles size={18} className="text-terracotta-600"/>Suggestions</h2>
          <p className="text-sm text-sand-600 mt-1">Projets que vous pourriez compléter selon votre discipline.</p>
          <ul className="mt-3 space-y-2">
            {PROJECTS.slice(3,6).map(p => (
              <li key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-sand-50 border border-sand-100">
                <div>
                  <Link to={`/app/projets/${p.id}`} className="font-medium hover:text-terracotta-700">{p.name}</Link>
                  <div className="text-xs text-sand-500">{p.type} — {p.region}</div>
                </div>
                <Link to={`/app/projets/${p.id}`} className="btn-ghost text-sm">Compléter</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold flex items-center gap-2"><Bell size={18}/>Notifications</h2>
          <ul className="mt-3 space-y-2">
            {notifs.slice(0,4).map(n => (
              <li key={n.id} className="flex gap-3 p-3 rounded-lg bg-sand-50 border border-sand-100">
                <div className={`w-2 mt-1 rounded-full ${n.read?'bg-sand-300':'bg-terracotta-500'}`} style={{height:8}}/>
                <div className="flex-1">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-sand-600">{n.body}</div>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/app/notifications" className="text-sm text-terracotta-700 mt-3 inline-flex items-center gap-1">Voir tout <ArrowRight size={14}/></Link>
        </section>
      </div>
    </div>
  )
}

function AdminDashboard({ notifs }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Tableau de bord — Administration</h1>
        <p className="section-subtitle">Vue d'ensemble de l'activité de la plateforme.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={UsersIcon} label="Utilisateurs" value="284"/>
        <StatCard icon={FolderKanban} label="Projets" value="156"/>
        <StatCard icon={AlertTriangle} label="Conflits ouverts" value="7"/>
        <StatCard icon={FileCheck2} label="À valider" value="12"/>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card p-5">
          <h2 className="font-semibold">Demandes de validation expert</h2>
          <ul className="divide-y divide-sand-100 mt-2">
            {[
              { n:'Karim Saadi', i:'CNRPAH', d:'Histoire' },
              { n:'Leïla Bouzid', i:'EPAU', d:'Architecture' },
              { n:'Riad Hamdi', i:'Univ. Constantine', d:'Archéologie' },
            ].map((u,i) => (
              <li key={i} className="py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-terracotta-600 text-white grid place-items-center font-semibold">
                  {u.n.split(' ').map(s=>s[0]).slice(0,2).join('')}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{u.n}</div>
                  <div className="text-xs text-sand-500">{u.d} • {u.i}</div>
                </div>
                <button className="btn-secondary text-xs">Refuser</button>
                <button className="btn-primary text-xs">Valider</button>
              </li>
            ))}
          </ul>
          <Link to="/app/admin/utilisateurs" className="text-sm text-terracotta-700 mt-3 inline-flex items-center gap-1">Tout gérer <ArrowRight size={14}/></Link>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold flex items-center gap-2"><BarChart3 size={18}/>Statistiques globales</h2>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[
              { l:'Contributions / mois', v:'1 240', d:'+12%'},
              { l:'Nouveaux utilisateurs', v:'48', d:'+8%' },
              { l:'Validations ce mois', v:'92', d:'+22%' },
              { l:'Conflits résolus', v:'14', d:'+5%' },
            ].map((k,i) => (
              <div key={i} className="p-3 rounded-lg bg-sand-50 border border-sand-100">
                <div className="text-xs text-sand-500 uppercase tracking-widest">{k.l}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <div className="text-2xl font-semibold">{k.v}</div>
                  <div className="text-xs text-emerald-700">{k.d}</div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/app/admin/statistiques" className="text-sm text-terracotta-700 mt-4 inline-flex items-center gap-1">Voir le détail <ArrowRight size={14}/></Link>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="font-semibold flex items-center gap-2"><AlertTriangle size={18} className="text-amber-600"/>Alertes récentes</h2>
        <ul className="mt-3 space-y-2">
          {notifs.map(n => (
            <li key={n.id} className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
              <span className="chip bg-white border border-amber-200 text-amber-800 capitalize">{n.type}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-sand-600">{n.body}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
