import { useState } from 'react'
import { Upload, Sparkles, Check, X, ImagePlus } from 'lucide-react'

const PROPOSED = [
  { id:'a1', label:'Coupole', confidence: 0.94, x:50, y:25, w:30, h:25 },
  { id:'a2', label:'Minaret', confidence: 0.89, x:18, y:10, w:10, h:60 },
  { id:'a3', label:'Arc en fer à cheval', confidence: 0.81, x:60, y:55, w:25, h:18 },
  { id:'a4', label:'Décor en zellige', confidence: 0.72, x:38, y:65, w:18, h:15 },
]

export default function AutoAnnotation() {
  const [step, setStep] = useState('upload') // upload | analyze | review
  const [items, setItems] = useState(PROPOSED.map(p => ({ ...p, status:'pending' })))

  const start = () => {
    setStep('analyze')
    setTimeout(() => setStep('review'), 1500)
  }

  const updateStatus = (id, status) => setItems(items.map(i => i.id===id ? {...i, status} : i))

  return (
    <div className="space-y-5">
      <div>
        <h1 className="section-title flex items-center gap-2"><ImagePlus/>Annotation automatique</h1>
        <p className="section-subtitle">Uploadez une image — l'IA propose des annotations à valider par un expert.</p>
      </div>

      {step === 'upload' && (
        <div className="card p-10">
          <div className="border-2 border-dashed border-sand-300 rounded-xl p-12 text-center bg-sand-50">
            <Upload className="mx-auto text-sand-500" size={40}/>
            <h3 className="text-lg font-semibold mt-4">Glissez-déposez une image</h3>
            <p className="text-sand-600 mt-1">JPG, PNG — max 10 Mo. Détection optimisée pour les façades et plans.</p>
            <button onClick={start} className="btn-primary mt-5"><Sparkles size={16}/>Lancer l'analyse (démo)</button>
          </div>
        </div>
      )}

      {step === 'analyze' && (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-terracotta-50 grid place-items-center text-terracotta-600 animate-pulse">
            <Sparkles size={28}/>
          </div>
          <div className="mt-4 font-medium">Analyse en cours...</div>
          <p className="text-sand-600 text-sm">Détection d'éléments architecturaux</p>
        </div>
      )}

      {step === 'review' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card p-4">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden"
                 style={{ background: 'linear-gradient(135deg,#cd5028,#3e2417)' }}>
              <div className="absolute inset-0 opacity-15"
                   style={{ backgroundImage:'repeating-linear-gradient(45deg, rgba(255,255,255,.6) 0 1px, transparent 1px 12px)' }}/>
              {items.map(it => (
                <div key={it.id}
                     className={`absolute border-2 rounded ${
                       it.status==='accepted' ? 'border-emerald-400 bg-emerald-400/15' :
                       it.status==='rejected' ? 'border-red-400 bg-red-400/15 opacity-50' :
                       'border-amber-300 bg-amber-300/10'
                     }`}
                     style={{ left:`${it.x}%`, top:`${it.y}%`, width:`${it.w}%`, height:`${it.h}%` }}>
                  <div className="absolute -top-6 left-0 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded">
                    {it.label} • {Math.round(it.confidence*100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Propositions IA</h3>
              <span className="chip bg-amber-100 text-amber-800">{items.filter(i=>i.status==='pending').length} à valider</span>
            </div>
            <ul className="space-y-2">
              {items.map(it => (
                <li key={it.id} className="p-3 rounded-lg bg-sand-50/60 border border-sand-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{it.label}</div>
                      <div className="text-xs text-sand-500">Confiance : {Math.round(it.confidence*100)}%</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>updateStatus(it.id,'accepted')}
                              className={`p-1.5 rounded ${it.status==='accepted'?'bg-emerald-600 text-white':'bg-white border border-sand-200 text-emerald-700 hover:bg-emerald-50'}`}>
                        <Check size={14}/>
                      </button>
                      <button onClick={()=>updateStatus(it.id,'rejected')}
                              className={`p-1.5 rounded ${it.status==='rejected'?'bg-red-600 text-white':'bg-white border border-sand-200 text-red-700 hover:bg-red-50'}`}>
                        <X size={14}/>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <button className="btn-primary w-full mt-4">Enregistrer les annotations validées</button>
            <p className="text-xs text-sand-500 mt-2 text-center">La validation expert est obligatoire avant publication.</p>
          </div>
        </div>
      )}
    </div>
  )
}
