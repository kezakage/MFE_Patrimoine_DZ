import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Login() {
  const { login, loginAs } = useAuth()
  const [email, setEmail] = useState('amina.belhadj@univ-alger.dz')
  const [password, setPassword] = useState('demo')
  const nav = useNavigate()
  const loc = useLocation()
  const from = loc.state?.from || '/app/tableau-de-bord'

  const submit = async (e) => {
    e.preventDefault()
    await login(email, password)
    nav(from, { replace: true })
  }
  const quick = (role) => { loginAs(role); nav(from, { replace: true }) }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Connexion</h1>
      <p className="text-sand-600 text-sm mt-1">Accédez à votre espace expert / chercheur.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400"/>
            <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="input pl-9"/>
          </div>
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400"/>
            <input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="input pl-9"/>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-sand-700"><input type="checkbox"/>Se souvenir de moi</label>
          <Link to="/mot-de-passe-oublie" className="text-terracotta-700 hover:underline">Mot de passe oublié ?</Link>
        </div>
        <button className="btn-primary w-full">Se connecter <ArrowRight size={16}/></button>
      </form>

      <div className="mt-6 text-center text-sm text-sand-600">
        Pas encore de compte ? <Link to="/inscription" className="text-terracotta-700 font-medium">Créer un compte</Link>
      </div>

      <div className="mt-8 border-t border-sand-200 pt-5">
        <div className="text-xs uppercase tracking-widest text-sand-500 mb-2">Démo — accès rapide</div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={()=>quick('expert')} className="btn-secondary text-xs">Expert</button>
          <button onClick={()=>quick('chercheur')} className="btn-secondary text-xs">Chercheur</button>
          <button onClick={()=>quick('admin')} className="btn-secondary text-xs">Admin</button>
        </div>
      </div>
    </div>
  )
}
