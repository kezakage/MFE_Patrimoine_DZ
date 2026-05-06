import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'

export default function ForgotPassword() {
  const [sent, setSent] = useState(false)
  return (
    <div>
      <h1 className="text-2xl font-semibold">Mot de passe oublié</h1>
      <p className="text-sand-600 text-sm mt-1">Saisissez votre email pour recevoir un lien de réinitialisation.</p>

      {sent ? (
        <div className="card p-5 mt-6 bg-emerald-50 border-emerald-200">
          <div className="font-medium text-emerald-800">Email envoyé</div>
          <p className="text-sm text-emerald-700 mt-1">Si un compte existe pour cette adresse, vous recevrez un lien sous quelques minutes.</p>
        </div>
      ) : (
        <form onSubmit={(e)=>{e.preventDefault(); setSent(true)}} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400"/>
              <input type="email" required className="input pl-9" placeholder="vous@exemple.dz"/>
            </div>
          </div>
          <button className="btn-primary w-full">Envoyer le lien</button>
        </form>
      )}

      <div className="mt-6 text-center text-sm">
        <Link to="/connexion" className="text-terracotta-700">← Retour à la connexion</Link>
      </div>
    </div>
  )
}
