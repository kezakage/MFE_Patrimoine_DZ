import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import {
  Mail, Building2, GraduationCap, Save, ShieldCheck, ShieldAlert, Loader2,
  KeyRound, Smartphone, Lock,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext.jsx'
import Avatar from '../../components/Avatar.jsx'
import { auth as authApi, heritage } from '../../lib/api.js'
import { projectToCard } from '../../data/projects.js'
import StatusBadge from '../../components/StatusBadge.jsx'

export default function Profile() {
  const { user, refresh } = useAuth()
  const { t } = useTranslation()
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    institution_name: user?.institution_name || user?.institution || '',
    bio: user?.bio || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [contribs, setContribs] = useState([])
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  useEffect(() => {
    heritage.projects({ mine: true })
      .then((data) => {
        const list = (Array.isArray(data) ? data : (data.results || [])).map(projectToCard)
        setContribs(list.slice(0, 5))
      })
      .catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await authApi.updateMe(user.id, form)
      setSaved(true)
      if (refresh) await refresh()
    } catch (e) {
      setError(e.data ? JSON.stringify(e.data) : e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">{t('profile.title')}</h1>
        <p className="section-subtitle">{t('profile.subtitle')}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="card p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar initials={user.avatar} size={80} color="#824c2b"/>
            <div className="mt-3 font-semibold text-lg">{user.name}</div>
            <div className="text-sm text-sand-600 capitalize">{user.role}</div>
            {user.validated ? (
              <span className="chip bg-emerald-100 text-emerald-800 mt-3"><ShieldCheck size={14}/>{t('profile.validated')}</span>
            ) : (
              <span className="chip bg-amber-100 text-amber-800 mt-3"><ShieldAlert size={14}/>{t('profile.pending')}</span>
            )}
          </div>
          <ul className="mt-5 space-y-2 text-sm">
            <li className="flex items-center gap-2 text-sand-700"><Mail size={16}/>{user.email}</li>
            <li className="flex items-center gap-2 text-sand-700"><GraduationCap size={16}/>{user.discipline || '—'}</li>
            <li className="flex items-center gap-2 text-sand-700"><Building2 size={16}/>{user.institution || '—'}</li>
          </ul>
        </section>

        <section className="card p-6 lg:col-span-2">
          <h2 className="font-semibold mb-4">{t('profile.personalInfo')}</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('profile.firstName')}</label>
              <input className="input" value={form.first_name} onChange={set('first_name')}/>
            </div>
            <div>
              <label className="label">{t('profile.lastName')}</label>
              <input className="input" value={form.last_name} onChange={set('last_name')}/>
            </div>
            <div className="md:col-span-2">
              <label className="label">{t('profile.institution')}</label>
              <input className="input" value={form.institution_name} onChange={set('institution_name')}/>
            </div>
            <div className="md:col-span-2">
              <label className="label">{t('profile.bio')}</label>
              <textarea rows={4} className="input resize-none" value={form.bio} onChange={set('bio')}
                        placeholder={t('profile.bioPlaceholder')}/>
            </div>
          </div>
          {error && <div className="mt-3 card p-3 text-red-700 bg-red-50 text-sm">{error}</div>}
          {saved && <div className="mt-3 card p-3 text-emerald-800 bg-emerald-50 text-sm">{t('profile.saved')}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} {t('profile.save')}
            </button>
          </div>
        </section>
      </div>

      <TwoFactorCard />

      <section className="card p-6">
        <h2 className="font-semibold mb-4">{t('profile.myContributions')}</h2>
        {contribs.length === 0 && <div className="text-sand-500 text-sm">{t('profile.noContributions')}</div>}
        <ul className="divide-y divide-sand-100">
          {contribs.map(p => (
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
    </div>
  )
}

/**
 * TOTP two-factor authentication management.
 *
 * Disabled → "Activer" calls /2fa/setup/ which returns an otpauth:// URI; we
 * render it as a QR code (scanned by Google Authenticator / Authy). The user
 * types the 6-digit code, we POST /2fa/enable/ to confirm and flip it on.
 *
 * Enabled → the user must type a current code to /2fa/disable/ to turn it off,
 * so a hijacked session can't silently strip the protection.
 */
function TwoFactorCard() {
  const { user, refresh } = useAuth()
  const enabled = user?.two_factor_enabled
  const [setup, setSetup] = useState(null)   // { otpauth_url, secret } during enrollment
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [disabling, setDisabling] = useState(false)

  const startSetup = async () => {
    setError(null); setBusy(true)
    try {
      const data = await authApi.twoFactorSetup()
      setSetup(data)
      setCode('')
    } catch (e) {
      setError(e.data?.detail || e.message)
    } finally { setBusy(false) }
  }

  const confirmEnable = async () => {
    setError(null); setBusy(true)
    try {
      await authApi.twoFactorEnable(code.trim())
      setSetup(null); setCode('')
      if (refresh) await refresh()
    } catch (e) {
      setError(e.data?.detail || 'Code invalide.')
    } finally { setBusy(false) }
  }

  const confirmDisable = async () => {
    setError(null); setBusy(true)
    try {
      await authApi.twoFactorDisable(code.trim())
      setDisabling(false); setCode('')
      if (refresh) await refresh()
    } catch (e) {
      setError(e.data?.detail || 'Code invalide.')
    } finally { setBusy(false) }
  }

  return (
    <section className="card p-6">
      <div className="flex items-start gap-3">
        <KeyRound size={20} className="text-terracotta-700 mt-0.5"/>
        <div className="flex-1">
          <h2 className="font-semibold">Authentification à deux facteurs (2FA)</h2>
          <p className="text-sm text-sand-600 mt-0.5">
            Ajoutez une couche de sécurité : un code temporaire généré par une application
            (Google Authenticator, Authy…) sera demandé à chaque connexion.
          </p>
        </div>
        {enabled ? (
          <span className="chip bg-emerald-100 text-emerald-800"><ShieldCheck size={14}/>Activée</span>
        ) : (
          <span className="chip bg-sand-100 text-sand-700"><ShieldAlert size={14}/>Désactivée</span>
        )}
      </div>

      {error && <div className="mt-4 card p-3 text-red-700 bg-red-50 text-sm">{error}</div>}

      {/* ---- Enabling flow ---- */}
      {!enabled && !setup && (
        <div className="mt-4">
          <button onClick={startSetup} disabled={busy} className="btn-primary">
            {busy ? <Loader2 size={16} className="animate-spin"/> : <Smartphone size={16}/>} Activer la 2FA
          </button>
        </div>
      )}

      {!enabled && setup && (
        <div className="mt-5 grid md:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-white rounded-lg border border-sand-200">
              <QRCodeCanvas value={setup.otpauth_url} size={168} marginSize={1}/>
            </div>
            <p className="text-xs text-sand-500 mt-2">Scannez ce QR code avec votre application.</p>
            <p className="text-[11px] text-sand-400 mt-1 break-all">
              Clé manuelle : <code className="bg-sand-100 px-1 rounded">{setup.secret}</code>
            </p>
          </div>
          <div>
            <label className="label">Code de vérification</label>
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="input tracking-[0.4em] text-center text-lg"
              placeholder="000000"
            />
            <div className="mt-3 flex gap-2">
              <button onClick={confirmEnable} disabled={busy || code.length < 6} className="btn-primary">
                {busy ? <Loader2 size={16} className="animate-spin"/> : <ShieldCheck size={16}/>} Confirmer
              </button>
              <button onClick={() => { setSetup(null); setError(null) }} className="btn-ghost">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Disabling flow ---- */}
      {enabled && !disabling && (
        <div className="mt-4">
          <button onClick={() => { setDisabling(true); setError(null); setCode('') }} className="btn-secondary">
            <Lock size={16}/>Désactiver la 2FA
          </button>
        </div>
      )}

      {enabled && disabling && (
        <div className="mt-4 max-w-xs">
          <label className="label">Entrez un code actuel pour confirmer</label>
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            className="input tracking-[0.4em] text-center text-lg"
            placeholder="000000"
          />
          <div className="mt-3 flex gap-2">
            <button onClick={confirmDisable} disabled={busy || code.length < 6} className="btn-danger">
              {busy ? <Loader2 size={16} className="animate-spin"/> : <Lock size={16}/>} Désactiver
            </button>
            <button onClick={() => { setDisabling(false); setError(null) }} className="btn-ghost">Annuler</button>
          </div>
        </div>
      )}
    </section>
  )
}
