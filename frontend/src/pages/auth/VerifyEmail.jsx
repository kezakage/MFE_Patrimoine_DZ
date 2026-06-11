import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Mail, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { auth } from '../../lib/api'

/**
 * /verification-email
 *
 * Two distinct entry paths:
 *  - With ?token=...  → call the backend to confirm the address. Shows success
 *    or invalid/expired, and offers a resend form on failure.
 *  - Without token    → landing page right after sign-up. Tells the user to
 *    check their inbox and offers a resend button (email is in URL state if
 *    Register passed it, otherwise the user types it in).
 */
export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const emailFromUrl = params.get('email') || ''

  const [state, setState] = useState(token ? 'loading' : 'await_inbox')
  const [resendEmail, setResendEmail] = useState(emailFromUrl)
  const [resendMsg, setResendMsg] = useState('')
  const [resendBusy, setResendBusy] = useState(false)

  useEffect(() => {
    if (!token) return
    auth.verifyEmail(token)
      .then(() => setState('success'))
      .catch((err) => {
        const code = err?.data?.code
        setState(code === 'invalid_token' ? 'invalid' : 'error')
      })
  }, [token])

  const handleResend = async (e) => {
    e.preventDefault()
    if (!resendEmail) return
    setResendBusy(true)
    setResendMsg('')
    try {
      await auth.resendVerification(resendEmail)
      setResendMsg("Si un compte non confirmé existe pour cette adresse, un nouveau lien vient d'être envoyé.")
    } catch {
      setResendMsg("Une erreur est survenue. Réessayez dans un instant.")
    } finally {
      setResendBusy(false)
    }
  }

  if (state === 'loading') {
    return (
      <div className="text-center">
        <Loader2 size={32} className="mx-auto animate-spin text-terracotta-600" />
        <p className="mt-4 text-sand-600">Vérification de votre lien…</p>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 grid place-items-center text-emerald-600">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="text-2xl font-semibold mt-4">Email confirmé</h1>
        <p className="text-sand-600 mt-2">
          Votre adresse a été vérifiée avec succès. Vous pouvez maintenant vous connecter.
        </p>
        <Link to="/connexion" className="btn-primary mt-6 inline-block">
          Se connecter
        </Link>
      </div>
    )
  }

  // invalid token, error, or no token at all → ask for an email and offer resend
  const isFailure = state === 'invalid' || state === 'error'
  return (
    <div className="text-center">
      <div className={`w-14 h-14 mx-auto rounded-full grid place-items-center ${
        isFailure ? 'bg-amber-50 text-amber-600' : 'bg-terracotta-50 text-terracotta-600'
      }`}>
        {isFailure ? <AlertTriangle size={28} /> : <Mail size={28} />}
      </div>
      <h1 className="text-2xl font-semibold mt-4">
        {isFailure ? 'Lien invalide ou expiré' : 'Vérifiez votre boîte mail'}
      </h1>
      <p className="text-sand-600 mt-2">
        {isFailure
          ? 'Demandez un nouveau lien de confirmation ci-dessous.'
          : 'Nous vous avons envoyé un lien de confirmation. Cliquez dessus pour activer votre compte.'}
      </p>

      <form onSubmit={handleResend} className="mt-6 flex flex-col gap-2 text-left">
        <label className="text-sm text-sand-700">Adresse email</label>
        <input
          type="email"
          required
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          placeholder="votre@email.com"
          className="input"
        />
        <button type="submit" disabled={resendBusy} className="btn-primary mt-1">
          {resendBusy ? 'Envoi…' : 'Renvoyer le lien'}
        </button>
        {resendMsg && (
          <p className="text-sm text-sand-600 mt-2">{resendMsg}</p>
        )}
      </form>

      <Link to="/connexion" className="btn-ghost mt-4 inline-block">
        Retour à la connexion
      </Link>
    </div>
  )
}
