import { useState } from 'react'
import { Search, ShieldCheck, ShieldX, Pause, Trash2, MoreVertical } from 'lucide-react'

const USERS = [
  { id:'u1', name:'Dr. Amina Belhadj', email:'amina.belhadj@univ-alger.dz', role:'expert', discipline:'Architecture', institution:'Univ. Alger', status:'actif', validated:true, contribs:42 },
  { id:'u2', name:'Karim Saadi', email:'karim.saadi@cnrpah.dz', role:'chercheur', discipline:'Histoire', institution:'CNRPAH', status:'actif', validated:false, contribs:18 },
  { id:'u3', name:'Pr. Hocine Mansouri', email:'h.mansouri@epau.dz', role:'expert', discipline:'Architecture', institution:'EPAU', status:'actif', validated:true, contribs:67 },
  { id:'u4', name:'Leïla Bouzid', email:'l.bouzid@epau.dz', role:'chercheur', discipline:'Architecture', institution:'EPAU', status:'en_attente', validated:false, contribs:0 },
  { id:'u5', name:'Riad Hamdi', email:'r.hamdi@univ-cne.dz', role:'chercheur', discipline:'Archéologie', institution:'Univ. Constantine', status:'en_attente', validated:false, contribs:0 },
  { id:'u6', name:'Yacine Hamza', email:'y.hamza@gmail.com', role:'chercheur', discipline:'Sociologie', institution:'—', status:'suspendu', validated:false, contribs:3 },
]

const STATUS_CHIP = {
  actif: 'bg-emerald-100 text-emerald-800',
  en_attente: 'bg-amber-100 text-amber-800',
  suspendu: 'bg-red-100 text-red-800',
}
const STATUS_LABEL = { actif:'Actif', en_attente:'En attente', suspendu:'Suspendu' }

export default function AdminUsers() {
  const [tab, setTab] = useState('tous')
  const [q, setQ] = useState('')
  const list = USERS.filter(u =>
    (tab==='tous' || (tab==='attente' && u.status==='en_attente') || (tab==='experts' && u.role==='expert')) &&
    (!q || (u.name + u.email).toLowerCase().includes(q.toLowerCase()))
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="section-title">Gestion des utilisateurs</h1>
        <p className="section-subtitle">Validez les profils experts, gérez les rôles et l'accès.</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {[
          { k:'tous', l:'Tous' }, { k:'attente', l:'En attente de validation' }, { k:'experts', l:'Experts' }
        ].map(t => (
          <button key={t.k} onClick={()=>setTab(t.k)}
                  className={`chip ${tab===t.k?'bg-terracotta-600 text-white':'bg-sand-100 text-sand-700'} cursor-pointer`}>{t.l}</button>
        ))}
        <div className="ml-auto relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400"/>
          <input value={q} onChange={e=>setQ(e.target.value)} className="input pl-9" placeholder="Rechercher..."/>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand-50">
            <tr>
              <th className="text-left px-4 py-3">Utilisateur</th>
              <th className="text-left px-4 py-3">Rôle</th>
              <th className="text-left px-4 py-3">Discipline</th>
              <th className="text-left px-4 py-3">Institution</th>
              <th className="text-left px-4 py-3">Contributions</th>
              <th className="text-left px-4 py-3">Statut</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(u => (
              <tr key={u.id} className="border-t border-sand-100 hover:bg-sand-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-terracotta-600 text-white grid place-items-center text-xs font-semibold">
                      {u.name.split(' ').map(s=>s[0]).slice(0,2).join('')}
                    </div>
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-sand-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">{u.discipline}</td>
                <td className="px-4 py-3">{u.institution}</td>
                <td className="px-4 py-3">{u.contribs}</td>
                <td className="px-4 py-3"><span className={`chip ${STATUS_CHIP[u.status]}`}>{STATUS_LABEL[u.status]}</span></td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    {u.status === 'en_attente' && (
                      <>
                        <button title="Valider" className="p-1.5 rounded hover:bg-emerald-100 text-emerald-700"><ShieldCheck size={16}/></button>
                        <button title="Refuser" className="p-1.5 rounded hover:bg-red-100 text-red-700"><ShieldX size={16}/></button>
                      </>
                    )}
                    {u.status === 'actif' && (
                      <button title="Suspendre" className="p-1.5 rounded hover:bg-amber-100 text-amber-700"><Pause size={16}/></button>
                    )}
                    <button title="Supprimer" className="p-1.5 rounded hover:bg-red-100 text-red-700"><Trash2 size={16}/></button>
                    <button className="p-1.5 rounded hover:bg-sand-100 text-sand-700"><MoreVertical size={16}/></button>
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
