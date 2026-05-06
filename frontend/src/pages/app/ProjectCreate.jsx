import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react'
import { PERIODS, REGIONS, TYPES } from '../../data/projects.js'

const STEPS = ['Informations', 'Médias', 'Structure du contenu']

export default function ProjectCreate() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    name: '', region: 'Alger', period: 'Ottoman', type: 'Mosquée', summary: '',
    sections: ['Présentation', 'Histoire', 'Description architecturale', 'État de conservation'],
  })

  const set = (k) => (e) => setData({ ...data, [k]: e.target.value })

  const submit = () => {
    nav('/app/projets')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={()=>nav(-1)} className="btn-ghost"><ArrowLeft size={16}/>Retour</button>
      <div>
        <h1 className="section-title">Nouveau projet</h1>
        <p className="section-subtitle">Créez la fiche initiale du monument ou du site.</p>
      </div>

      <div className="flex items-center gap-3">
        {STEPS.map((s,i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full grid place-items-center text-xs font-semibold ${i<=step?'bg-terracotta-600 text-white':'bg-sand-200 text-sand-600'}`}>{i+1}</div>
            <div className={`text-sm ${i===step?'font-semibold':'text-sand-600'}`}>{s}</div>
            {i<STEPS.length-1 && <div className="w-12 h-px bg-sand-200"/>}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {step === 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Nom du monument / projet</label>
              <input className="input" required value={data.name} onChange={set('name')} placeholder="Ex. Mosquée de Sidi Boumediene"/>
            </div>
            <div>
              <label className="label">Région</label>
              <select className="input" value={data.region} onChange={set('region')}>
                {REGIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Période</label>
              <select className="input" value={data.period} onChange={set('period')}>
                {PERIODS.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Type architectural</label>
              <select className="input" value={data.type} onChange={set('type')}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Résumé court</label>
              <textarea rows={3} className="input resize-none" value={data.summary} onChange={set('summary')} placeholder="Décrivez brièvement le projet..."/>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <label className="label">Médias (images, plans, documents)</label>
            <div className="border-2 border-dashed border-sand-300 rounded-xl p-10 text-center bg-sand-50">
              <Upload className="mx-auto text-sand-500" size={32}/>
              <p className="mt-3 text-sand-700">Glissez-déposez vos fichiers ou</p>
              <button className="btn-primary mt-3"><ImageIcon size={16}/>Parcourir</button>
              <p className="text-xs text-sand-500 mt-3">JPG, PNG, PDF — max 25 Mo / fichier</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="label">Structure initiale du contenu</label>
            <p className="text-sm text-sand-600 mb-3">Définissez les sections principales de la fiche. Vous pourrez les modifier dans l'éditeur.</p>
            <ul className="space-y-2">
              {data.sections.map((s,i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-6 text-center text-sand-500">{i+1}.</span>
                  <input className="input" value={s} onChange={(e)=>{
                    const next = [...data.sections]; next[i] = e.target.value; setData({...data, sections: next})
                  }}/>
                  <button onClick={()=>setData({...data, sections: data.sections.filter((_,j)=>j!==i)})} className="btn-ghost text-red-600">×</button>
                </li>
              ))}
            </ul>
            <button onClick={()=>setData({...data, sections:[...data.sections, 'Nouvelle section']})} className="btn-secondary mt-3">+ Ajouter une section</button>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button disabled={step===0} onClick={()=>setStep(step-1)} className="btn-secondary">Précédent</button>
        {step < STEPS.length-1 ? (
          <button onClick={()=>setStep(step+1)} className="btn-primary">Suivant</button>
        ) : (
          <button onClick={submit} className="btn-primary">Créer le projet</button>
        )}
      </div>
    </div>
  )
}
