import { Link } from 'react-router-dom'
import { Mail, CheckCircle2 } from 'lucide-react'

export default function VerifyEmail() {
  return (
    <div className="text-center">
      <div className="w-14 h-14 mx-auto rounded-full bg-terracotta-50 grid place-items-center text-terracotta-600">
        <Mail size={28}/>
      </div>
      <h1 className="text-2xl font-semibold mt-4">Vérifiez votre boîte mail</h1>
      <p className="text-sand-600 mt-2">
        Nous vous avons envoyé un lien de confirmation. Cliquez dessus pour activer votre compte.
      </p>

      <div className="card p-4 mt-6 text-left">
        <div className="text-xs uppercase tracking-widest text-sand-500 mb-1">Démo</div>
        <div className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 size={18}/>Email vérifié automatiquement (mode démo)
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <Link to="/app/tableau-de-bord" className="btn-primary">Accéder au tableau de bord</Link>
        <button className="btn-ghost">Renvoyer le lien</button>
      </div>
    </div>
  )
}
