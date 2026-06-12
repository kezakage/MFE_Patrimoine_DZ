/**
 * Auto-annotation page — wired to the real CLIP pipeline.
 *
 * Flow:
 *   1. User picks an image (no project required — ai_tags work standalone).
 *   2. We upload via /api/v1/media/ (the post_save signal queues the Celery
 *      `annotate_image` task automatically).
 *   3. We poll GET /api/v1/media/{id}/ every 1.5s until `ai_status` flips
 *      out of "pending".
 *   4. The proposed tags are listed, each acceptable / rejectable. Accepted
 *      tags create a validated `Annotation`; rejected ones are dropped.
 */
import { useEffect, useRef, useState } from 'react'
import { Upload, Sparkles, Check, X, ImagePlus, Loader2, AlertTriangle } from 'lucide-react'
import { api, media as mediaApi, mediaUrl } from '../../lib/api.js'

const POLL_INTERVAL_MS = 1500
const POLL_TIMEOUT_MS = 60_000

export default function AutoAnnotation() {
  const [step, setStep] = useState('upload') // upload | analyze | review | error
  const [errorMsg, setErrorMsg] = useState('')
  const [media, setMedia] = useState(null)
  const [proposals, setProposals] = useState([]) // CLIP: [{label, score, status}]
  const [detections, setDetections] = useState([]) // YOLO: [{label, score, box}]
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  const reset = () => {
    setStep('upload')
    setMedia(null)
    setProposals([])
    setDetections([])
    setErrorMsg('')
  }

  const onFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setErrorMsg("Seules les images sont prises en charge.")
      setStep('error')
      return
    }
    setErrorMsg('')
    setStep('analyze')
    try {
      const fd = new FormData()
      fd.append('file', f)
      fd.append('media_type', 'image')
      const created = await mediaApi.upload(fd)
      setMedia(created)
      await pollUntilDone(created.id)
    } catch (err) {
      setErrorMsg(err.message || "Échec de l'upload.")
      setStep('error')
    } finally {
      if (e.target) e.target.value = ''
    }
  }

  const pollUntilDone = async (mediaId) => {
    const start = Date.now()
    while (Date.now() - start < POLL_TIMEOUT_MS) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
      const m = await api.get(`/media/${mediaId}/`)
      if (m.ai_status === 'done') {
        setMedia(m)
        setProposals(
          (m.ai_tags || []).map((t, i) => ({ ...t, id: i, status: 'pending' })),
        )
        setDetections(m.ai_detections || [])
        setStep('review')
        return
      }
      if (m.ai_status === 'failed') {
        setErrorMsg("L'analyse IA a échoué pour cette image.")
        setStep('error')
        return
      }
      if (m.ai_status === 'skipped') {
        setErrorMsg("Le fichier n'a pas pu être traité comme une image.")
        setStep('error')
        return
      }
    }
    setErrorMsg("L'analyse IA prend trop de temps — réessayez dans un instant.")
    setStep('error')
  }

  const updateStatus = (id, status) =>
    setProposals(prev => prev.map(p => (p.id === id ? { ...p, status } : p)))

  const saveValidated = async () => {
    if (!media) return
    const accepted = proposals.filter(p => p.status === 'accepted')
    if (!accepted.length) {
      setErrorMsg("Validez au moins une proposition avant d'enregistrer.")
      return
    }
    setSaving(true)
    setErrorMsg('')
    try {
      for (const p of accepted) {
        await api.post('/media/annotations/', {
          media: media.id,
          body_text: `${p.label} — ${(p.score * 100).toFixed(0)}% (CLIP)`,
          is_ai_generated: true,
        })
      }
      reset()
    } catch (err) {
      setErrorMsg(err.message || "Échec de l'enregistrement.")
    } finally {
      setSaving(false)
    }
  }

  const pendingCount = proposals.filter(p => p.status === 'pending').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="section-title flex items-center gap-2"><ImagePlus/>Annotation automatique</h1>
        <p className="section-subtitle">
          Uploadez une image — CLIP propose des tags patrimoniaux et YOLOv8 détecte les objets
          (boîtes affichées sur l'image). L'expert valide ensuite les propositions.
        </p>
      </div>

      {step === 'upload' && (
        <div className="card p-10">
          <div className="border-2 border-dashed border-sand-300 rounded-xl p-12 text-center bg-sand-50">
            <Upload className="mx-auto text-sand-500" size={40}/>
            <h3 className="text-lg font-semibold mt-4">Glissez-déposez une image</h3>
            <p className="text-sand-600 mt-1">JPG, PNG — détection zero-shot via CLIP multilingual.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFile}
            />
            <button onClick={() => fileInputRef.current?.click()} className="btn-primary mt-5">
              <Sparkles size={16}/>Sélectionner une image
            </button>
          </div>
        </div>
      )}

      {step === 'analyze' && (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-terracotta-50 grid place-items-center text-terracotta-600 animate-pulse">
            <Sparkles size={28}/>
          </div>
          <div className="mt-4 font-medium">Analyse en cours...</div>
          <p className="text-sand-600 text-sm">
            CLIP classe l'image (28 labels patrimoniaux) — YOLOv8 détecte les objets.
          </p>
          <div className="inline-flex items-center gap-2 mt-3 text-xs text-sand-500">
            <Loader2 className="animate-spin" size={14}/>Première analyse plus longue (chargement des modèles)
          </div>
        </div>
      )}

      {step === 'error' && (
        <div className="card p-8 text-center">
          <AlertTriangle className="mx-auto text-red-500" size={36}/>
          <div className="mt-3 font-semibold text-red-700">{errorMsg || "Une erreur est survenue."}</div>
          <button onClick={reset} className="btn-ghost mt-4">Recommencer</button>
        </div>
      )}

      {step === 'review' && media && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 card p-4">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-sand-100">
              <img
                src={mediaUrl(media.file_url || media.thumbnail_url)}
                alt="Image analysée"
                className="absolute inset-0 w-full h-full object-contain"
              />
              {detections.length > 0 && media.width && media.height && (
                <svg
                  viewBox={`0 0 ${media.width} ${media.height}`}
                  preserveAspectRatio="xMidYMid meet"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  {detections.map((d, i) => {
                    const [x1, y1, x2, y2] = d.box || [0, 0, 0, 0]
                    const w = Math.max(0, x2 - x1)
                    const h = Math.max(0, y2 - y1)
                    return (
                      <g key={i}>
                        <rect
                          x={x1} y={y1} width={w} height={h}
                          fill="none"
                          stroke="#e11d48"
                          strokeWidth={Math.max(2, media.width / 400)}
                        />
                        <rect
                          x={x1}
                          y={Math.max(0, y1 - media.height * 0.04)}
                          width={Math.max(60, (d.label.length + 6) * (media.width / 80))}
                          height={media.height * 0.04}
                          fill="#e11d48"
                        />
                        <text
                          x={x1 + media.width * 0.005}
                          y={Math.max(media.height * 0.03, y1 - media.height * 0.01)}
                          fill="white"
                          fontSize={media.height * 0.028}
                          fontFamily="sans-serif"
                        >
                          {d.label} {Math.round(d.score * 100)}%
                        </text>
                      </g>
                    )
                  })}
                </svg>
              )}
            </div>
            <div className="mt-3 text-xs text-sand-500">
              CLIP : {proposals.length} tag(s) patrimonial(aux).
              {' '}YOLOv8 : {detections.length} objet(s) détecté(s) (boîtes rouges sur l'image).
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Propositions CLIP</h3>
              <span className="chip bg-amber-100 text-amber-800">{pendingCount} à valider</span>
            </div>
            <div className="text-xs text-sand-500 mb-3">Tags patrimoniaux globaux (à valider).</div>
            {proposals.length === 0 ? (
              <div className="text-sand-500 text-sm py-4">Aucune proposition au-dessus du seuil de confiance.</div>
            ) : (
              <ul className="space-y-2">
                {proposals.map(it => (
                  <li key={it.id} className="p-3 rounded-lg bg-sand-50/60 border border-sand-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{it.label}</div>
                        <div className="text-xs text-sand-500">Confiance : {Math.round(it.score * 100)}%</div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateStatus(it.id, 'accepted')}
                          className={`p-1.5 rounded ${it.status === 'accepted' ? 'bg-emerald-600 text-white' : 'bg-white border border-sand-200 text-emerald-700 hover:bg-emerald-50'}`}
                          aria-label="Accepter"
                        >
                          <Check size={14}/>
                        </button>
                        <button
                          onClick={() => updateStatus(it.id, 'rejected')}
                          className={`p-1.5 rounded ${it.status === 'rejected' ? 'bg-red-600 text-white' : 'bg-white border border-sand-200 text-red-700 hover:bg-red-50'}`}
                          aria-label="Rejeter"
                        >
                          <X size={14}/>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={saveValidated}
              disabled={saving || pendingCount === proposals.length}
              className="btn-primary w-full mt-4 disabled:opacity-50"
            >
              {saving && <Loader2 className="animate-spin" size={14}/>}
              Enregistrer les annotations validées
            </button>
            {errorMsg && <div className="text-xs text-red-600 mt-2 text-center">{errorMsg}</div>}
            <p className="text-xs text-sand-500 mt-2 text-center">La validation expert est obligatoire avant publication.</p>

            <div className="mt-5 pt-4 border-t border-sand-100">
              <h3 className="font-semibold text-sm">Détections YOLOv8</h3>
              <div className="text-xs text-sand-500 mb-2">Objets localisés (COCO, 80 classes).</div>
              {detections.length === 0 ? (
                <div className="text-sand-500 text-xs py-2">Aucun objet détecté au-dessus du seuil.</div>
              ) : (
                <ul className="space-y-1">
                  {detections.map((d, i) => (
                    <li key={i} className="flex items-center justify-between text-xs py-1">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-rose-500"/>
                        <span className="font-medium">{d.label}</span>
                      </span>
                      <span className="text-sand-500">{Math.round(d.score * 100)}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
