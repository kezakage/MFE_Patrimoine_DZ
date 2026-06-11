import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext.jsx'
import { ALGERIAN_INSTITUTIONS } from '../../data/algerianInstitutions.js'

const DISCIPLINES = ['Architecture', 'Histoire', 'Archéologie', 'Sociologie', 'Urbanisme', 'Conservation', 'Autre']

export default function Register() {
  const { register } = useAuth()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [data, setData] = useState({
    name: '', email: '', password: '', discipline: 'Architecture', institution: '', role: 'chercheur',
  })
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value })
  const [showPassword, setShowPassword] = useState(false)

  // Institution autocomplete
  const [institutionQuery, setInstitutionQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const institutionRef = useRef(null)
  const suggestions = institutionQuery.length >= 2
    ? ALGERIAN_INSTITUTIONS.filter(i =>
        i.toLowerCase().includes(institutionQuery.toLowerCase())
      ).slice(0, 8)
    : []

  const selectInstitution = (name) => {
    setData(d => ({ ...d, institution: name }))
    setInstitutionQuery(name)
    setShowSuggestions(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    await register(data)
    // Forward the email so the verify page can pre-fill the resend form.
    nav(`/verification-email?email=${encodeURIComponent(data.email)}`)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">{t('auth.registerTitle')}</h1>
      <p className="text-sand-600 text-sm mt-1">{t('auth.registerSubtitle')}</p>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div>
          <label className="label">{t('auth.fullName')}</label>
          <input className="input" required value={data.name} onChange={set('name')} placeholder={t('auth.fullNamePlaceholder')}/>
        </div>
        <div>
          <label className="label">{t('auth.professionalEmail')}</label>
          <input type="email" className="input" required value={data.email} onChange={set('email')} placeholder={t('auth.emailPlaceholder')}/>
        </div>
        <div>
          <label className="label">{t('auth.password')}</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} className="input pe-9" required value={data.password} onChange={set('password')}/>
            <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600">
              {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('auth.discipline')}</label>
            <select className="input" value={data.discipline} onChange={set('discipline')}>
              {DISCIPLINES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t('auth.requestedRole')}</label>
            <select className="input" value={data.role} onChange={set('role')}>
              <option value="chercheur">{t('auth.roleResearcher')}</option>
              <option value="expert">{t('auth.roleExpertPending')}</option>
            </select>
          </div>
        </div>
        <div className="relative" ref={institutionRef}>
          <label className="label">{t('auth.institution')}</label>
          <input
            className="input"
            value={institutionQuery}
            onChange={e => {
              setInstitutionQuery(e.target.value)
              setData(d => ({ ...d, institution: e.target.value }))
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={t('auth.institutionPlaceholder')}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-white border border-sand-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map(s => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={() => selectInstitution(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-sand-50 text-sand-800"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <label className="flex items-start gap-2 text-sm text-sand-700">
          <input type="checkbox" required className="mt-1"/>
          {t('auth.termsAccept')}
        </label>
        <button className="btn-primary w-full">{t('auth.submitRegister')}</button>
      </form>

      <div className="mt-6 text-center text-sm text-sand-600">
        {t('auth.hasAccount')} <Link to="/connexion" className="text-terracotta-700 font-medium">{t('auth.submit')}</Link>
      </div>
    </div>
  )
}
