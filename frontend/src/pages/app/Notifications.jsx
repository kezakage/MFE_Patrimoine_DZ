import { useState } from 'react'
import { Bell, AlertTriangle, FileCheck2, Users as UsersIcon, Check } from 'lucide-react'
import { useNotifications } from '../../context/NotificationsContext.jsx'

const ICONS = { contribution: UsersIcon, conflit: AlertTriangle, validation: FileCheck2, systeme: Bell }
const COLORS = {
  contribution: 'bg-blue-50 text-blue-700',
  conflit: 'bg-red-50 text-red-700',
  validation: 'bg-emerald-50 text-emerald-700',
  systeme: 'bg-sand-100 text-sand-700',
}

export default function Notifications() {
  const { items, markAllRead, markRead } = useNotifications()
  const [filter, setFilter] = useState('tous')
  const list = filter === 'tous' ? items : filter === 'non_lus' ? items.filter(i=>!i.read) : items.filter(i => i.type === filter)

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleString('fr-FR', { dateStyle:'medium', timeStyle:'short' })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="section-title flex items-center gap-2"><Bell/>Notifications</h1>
          <p className="section-subtitle">Activité de vos projets et alertes plateforme.</p>
        </div>
        <button onClick={markAllRead} className="btn-secondary"><Check size={16}/>Tout marquer comme lu</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { k:'tous', l:'Tous' },
          { k:'non_lus', l:'Non lus' },
          { k:'contribution', l:'Contributions' },
          { k:'conflit', l:'Conflits' },
          { k:'validation', l:'Validations' },
          { k:'systeme', l:'Système' },
        ].map(t => (
          <button key={t.k} onClick={()=>setFilter(t.k)}
                  className={`chip ${filter===t.k?'bg-terracotta-600 text-white':'bg-sand-100 text-sand-700 hover:bg-sand-200'} cursor-pointer`}>
            {t.l}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-sand-100">
        {list.map(n => {
          const Icon = ICONS[n.type] || Bell
          return (
            <div key={n.id} className={`p-4 flex gap-3 ${n.read?'':'bg-sand-50/60'}`}>
              <div className={`w-10 h-10 rounded-lg grid place-items-center ${COLORS[n.type]||COLORS.systeme} flex-shrink-0`}>
                <Icon size={18}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-medium">{n.title}</div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-terracotta-500"/>}
                </div>
                <div className="text-sm text-sand-700">{n.body}</div>
                <div className="text-xs text-sand-500 mt-1">{formatDate(n.date)}</div>
              </div>
              {!n.read && (
                <button onClick={()=>markRead(n.id)} className="btn-ghost text-xs">Marquer lu</button>
              )}
            </div>
          )
        })}
        {list.length === 0 && <div className="p-10 text-center text-sand-500">Aucune notification.</div>}
      </div>
    </div>
  )
}
