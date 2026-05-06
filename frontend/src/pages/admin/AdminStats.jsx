import { TrendingUp, Users as UsersIcon, FolderKanban, FileCheck2 } from 'lucide-react'

const MONTHS = ['Nov','Déc','Jan','Fév','Mar','Avr']
const SERIES = [120, 180, 230, 310, 280, 410]

const DISCIPLINES = [
  { l:'Architecture', v: 42, c:'#cd5028' },
  { l:'Histoire', v: 28, c:'#824c2b' },
  { l:'Archéologie', v: 18, c:'#bd7d3d' },
  { l:'Urbanisme', v: 8, c:'#67241a' },
  { l:'Autre', v: 4, c:'#3e2417' },
]

export default function AdminStats() {
  const max = Math.max(...SERIES)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Statistiques globales</h1>
        <p className="section-subtitle">Suivi de la performance et de l'activité de la plateforme.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l:'Projets', v:'156', d:'+8%', i:FolderKanban },
          { l:'Utilisateurs', v:'284', d:'+14%', i:UsersIcon },
          { l:'Contributions', v:'4 280', d:'+22%', i:FileCheck2 },
          { l:'Validations / mois', v:'92', d:'+18%', i:TrendingUp },
        ].map((s,i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-terracotta-50 text-terracotta-700 grid place-items-center"><s.i size={20}/></div>
              <div>
                <div className="text-xs uppercase tracking-widest text-sand-500">{s.l}</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-semibold">{s.v}</div>
                  <div className="text-xs text-emerald-700">{s.d}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <section className="card p-5 lg:col-span-2">
          <h3 className="font-semibold">Contributions par mois</h3>
          <div className="mt-6 flex items-end gap-3 h-56">
            {SERIES.map((v,i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-t-lg bg-gradient-to-t from-terracotta-700 to-terracotta-500"
                     style={{ height: `${(v/max)*100}%` }} title={`${v} contributions`}/>
                <div className="text-xs text-sand-600">{MONTHS[i]}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h3 className="font-semibold">Par discipline</h3>
          <ul className="mt-4 space-y-3">
            {DISCIPLINES.map(d => (
              <li key={d.l}>
                <div className="flex justify-between text-sm">
                  <span>{d.l}</span><span className="font-medium">{d.v}%</span>
                </div>
                <div className="h-2 mt-1 bg-sand-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${d.v}%`, background:d.c }}/>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card p-5">
        <h3 className="font-semibold">Activité par région</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {['Alger','Tlemcen','Constantine','Oran','Ghardaïa','Sétif','Annaba','Béjaïa'].map((r,i) => (
            <div key={r} className="p-3 rounded-lg bg-sand-50 border border-sand-100">
              <div className="text-sm font-medium">{r}</div>
              <div className="text-2xl font-semibold mt-1">{Math.floor(Math.random()*40)+5}</div>
              <div className="text-xs text-sand-500">projets</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
