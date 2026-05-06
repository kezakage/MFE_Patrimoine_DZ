import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const DISCIPLINES = ['Architecture', 'Histoire', 'Archéologie', 'Sociologie', 'Urbanisme', 'Conservation', 'Autre']

export default function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [data, setData] = useState({
    name: '', email: '', password: '', discipline: 'Architecture', institution: '', role: 'chercheur',
  })
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    await register(data)
    nav('/verification-email')
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Créer un compte</h1>
      <p className="text-sand-600 text-sm mt-1">Inscrivez-vous comme chercheur ou demandez le statut d'expert.</p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div>
          <label className="label">Nom complet</label>
          <input className="input" required value={data.name} onChange={set('name')} placeholder="Dr. Prénom Nom"/>
        </div>
        <div>
          <label className="label">Email professionnel</label>
          <input type="email" className="input" required value={data.email} onChange={set('email')} placeholder="prenom@institution.dz"/>
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input type="password" className="input" required value={data.password} onChange={set('password')}/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Discipline</label>
            <select className="input" value={data.discipline} onChange={set('discipline')}>
              {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Statut demandé</label>
            <select className="input" value={data.role} onChange={set('role')}>
              <option value="chercheur">Chercheur</option>
              <option value="expert">Expert (validation requise)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Institution</label>
          <input className="input" value={data.institution} onChange={set('institution')} placeholder="Université, laboratoire, ministère..."/>
        </div>
        <label className="flex items-start gap-2 text-sm text-sand-700">
          <input type="checkbox" required className="mt-1"/>
          J'accepte la charte scientifique et les conditions d'utilisation de la plateforme.
        </label>
        <button className="btn-primary w-full">Créer mon compte</button>
      </form>

      <div className="mt-6 text-center text-sm text-sand-600">
        Déjà inscrit ? <Link to="/connexion" className="text-terracotta-700 font-medium">Se connecter</Link>
      </div>
    </div>
  )
}
