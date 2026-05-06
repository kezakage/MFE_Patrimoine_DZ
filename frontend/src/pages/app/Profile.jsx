import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Building2, GraduationCap, Save, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import Avatar from '../../components/Avatar.jsx'
import { PROJECTS } from '../../data/projects.js'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user.name, discipline: user.discipline, institution: user.institution, bio: ''
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const myContribs = PROJECTS.slice(0, 4)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Mon profil</h1>
        <p className="section-subtitle">Informations personnelles, contributions et paramètres.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="card p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar initials={user.avatar} size={80} color="#824c2b"/>
            <div className="mt-3 font-semibold text-lg">{user.name}</div>
            <div className="text-sm text-sand-600 capitalize">{user.role}</div>
            {user.validated ? (
              <span className="chip bg-emerald-100 text-emerald-800 mt-3"><ShieldCheck size={14}/>Profil validé</span>
            ) : (
              <span className="chip bg-amber-100 text-amber-800 mt-3"><ShieldAlert size={14}/>En attente de validation</span>
            )}
          </div>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex items-center gap-2 text-sand-700"><Mail size={16}/>{user.email}</li>
            <li className="flex items-center gap-2 text-sand-700"><GraduationCap size={16}/>{user.discipline}</li>
            <li className="flex items-center gap-2 text-sand-700"><Building2 size={16}/>{user.institution}</li>
          </ul>
        </section>

        <section className="card p-6 lg:col-span-2">
          <h2 className="font-semibold mb-4">Informations personnelles</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">Nom</label>
              <input className="input" value={form.name} onChange={set('name')}/>
            </div>
            <div>
              <label className="label">Discipline</label>
              <input className="input" value={form.discipline} onChange={set('discipline')}/>
            </div>
            <div className="md:col-span-2">
              <label className="label">Institution</label>
              <input className="input" value={form.institution} onChange={set('institution')}/>
            </div>
            <div className="md:col-span-2">
              <label className="label">Biographie / domaine de recherche</label>
              <textarea rows={4} className="input resize-none" value={form.bio} onChange={set('bio')}
                        placeholder="Décrivez votre champ d'expertise..."/>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-secondary">Annuler</button>
            <button className="btn-primary"><Save size={16}/>Enregistrer</button>
          </div>
        </section>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold mb-4">Mes contributions</h2>
        <ul className="divide-y divide-sand-100">
          {myContribs.map(p => (
            <li key={p.id} className="py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg" style={{background: `linear-gradient(135deg, ${p.coverColor}, #3e2417)`}}/>
              <div className="flex-1 min-w-0">
                <Link to={`/app/projets/${p.id}`} className="font-medium hover:text-terracotta-700">{p.name}</Link>
                <div className="text-xs text-sand-500">{Math.floor(Math.random()*15)+1} sections — {Math.floor(Math.random()*30)+5} annotations</div>
              </div>
              <StatusBadge status={p.status}/>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold mb-4">Paramètres du compte</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Sécurité</h3>
            <button className="btn-secondary w-full">Changer le mot de passe</button>
            <button className="btn-secondary w-full mt-2">Activer la double authentification</button>
          </div>
          <div>
            <h3 className="font-medium mb-2">Notifications</h3>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked/>Email — nouvelles contributions</label>
            <label className="flex items-center gap-2 text-sm mt-1"><input type="checkbox" defaultChecked/>Email — conflits éditoriaux</label>
            <label className="flex items-center gap-2 text-sm mt-1"><input type="checkbox"/>Email — résumé hebdomadaire</label>
          </div>
        </div>
        <div className="mt-6 border-t border-sand-200 pt-4">
          <h3 className="font-medium mb-2 text-red-700">Zone dangereuse</h3>
          <button className="btn-danger">Supprimer mon compte</button>
        </div>
      </section>
    </div>
  )
}
