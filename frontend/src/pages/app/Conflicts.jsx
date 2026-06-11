import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, AlertTriangle, ThumbsUp, ThumbsDown, MinusCircle,
  MessageSquare, Check, Loader2, ShieldCheck, Clock, Scale,
} from 'lucide-react'
import { heritage, discussions as discApi } from '../../lib/api.js'

// Visual mapping for the weighted-consensus banner returned by /tally/.
// Stored discussion.consensus_state matches one of these keys.
const CONSENSUS_BADGE = {
  approved: { label: 'Consensus : approuvé', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200', Icon: ShieldCheck },
  rejected: { label: 'Consensus : rejeté', cls: 'bg-red-100 text-red-800 border-red-200', Icon: ThumbsDown },
  tie:      { label: 'Quorum atteint, indécis', cls: 'bg-amber-100 text-amber-800 border-amber-200', Icon: Scale },
  pending:  { label: 'En attente de quorum', cls: 'bg-sand-100 text-sand-700 border-sand-200', Icon: Clock },
}

export default function Conflicts() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [draft, setDraft] = useState({})
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    Promise.all([heritage.project(id), discApi.list(id)])
      .then(async ([p, d]) => {
        setProject(p)
        const list = Array.isArray(d) ? d : (d.results || [])
        const enriched = await Promise.all(list.map(async (disc) => {
          const [messages, votes, tally] = await Promise.all([
            discApi.messages(disc.id).catch(() => []),
            discApi.votes(disc.id).catch(() => []),
            discApi.tally(disc.id).catch(() => null),
          ])
          return {
            ...disc,
            messages: Array.isArray(messages) ? messages : (messages.results || []),
            votes: Array.isArray(votes) ? votes : (votes.results || []),
            tally,
          }
        }))
        setItems(enriched)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const sendMessage = async (discId) => {
    const body = draft[discId]
    if (!body?.trim()) return
    setBusyId(discId)
    try {
      await discApi.postMessage(discId, body)
      setDraft({ ...draft, [discId]: '' })
      load()
    } catch (e) { alert(e.message) }
    finally { setBusyId(null) }
  }

  const support = async (discId, choice) => {
    setBusyId(discId)
    try { await discApi.vote(discId, choice); load() }
    catch (e) { alert(e.message) }
    finally { setBusyId(null) }
  }

  const resolve = async (discId) => {
    setBusyId(discId)
    try { await discApi.resolve(discId); load() }
    catch (e) { alert(e.message) }
    finally { setBusyId(null) }
  }

  // A discussion is "resolved" when its persisted status says so. The legacy
  // `is_resolved` flag the previous UI checked never existed on the payload,
  // so the counters above used to always show 0 resolved.
  const isResolved = (d) => d.status === 'resolved'
  const open = items.filter(d => !isResolved(d))
  const resolved = items.filter(isResolved)

  return (
    <div className="space-y-5">
      <Link to={`/app/projets/${id}`} className="btn-ghost"><ArrowLeft size={16}/>Retour au projet</Link>
      <div>
        <h1 className="section-title flex items-center gap-2">
          <AlertTriangle className="text-red-600"/>Conflits éditoriaux
        </h1>
        <p className="section-subtitle">{project?.title || project?.name || ''} — discussions et votes.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {[
          { l:'Conflits ouverts', v: open.length, c:'text-red-600' },
          { l:'Résolus', v: resolved.length, c:'text-emerald-600' },
          { l:'Total', v: items.length, c:'text-sand-700' },
        ].map((s,i) => (
          <div key={i} className="card p-5">
            <div className="text-xs uppercase tracking-widest text-sand-500">{s.l}</div>
            <div className={`text-3xl font-semibold mt-1 ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-sand-600 inline-flex items-center gap-2">
          <Loader2 size={14} className="animate-spin"/>Chargement...
        </div>
      )}
      {error && <div className="card p-3 text-red-700 bg-red-50 text-sm">{error}</div>}
      {!loading && items.length === 0 && (
        <div className="card p-8 text-center text-sand-600">Aucune discussion ouverte sur ce projet.</div>
      )}

      <div className="space-y-5">
        {items.map(c => {
          const done = isResolved(c)
          // Server returns the weighted tally + persisted consensus state on
          // every vote; fall back to the discussion's own field when no votes
          // have been cast yet.
          const consensus = (c.tally?.state) || c.consensus_state || 'pending'
          const badge = CONSENSUS_BADGE[consensus] || CONSENSUS_BADGE.pending
          const BadgeIcon = badge.Icon
          const approveW = c.tally?.approve_weight ?? 0
          const rejectW = c.tally?.reject_weight ?? 0
          const bindingW = approveW + rejectW
          const approvePct = bindingW > 0 ? Math.round((approveW / bindingW) * 100) : 0
          const expertVoices = c.tally?.expert_voices ?? 0
          const quorum = c.tally?.quorum ?? 3
          const autoResolved = c.tally?.auto_resolved || c.consensus_auto_resolved
          return (
          <div key={c.id} className={`card p-6 border-l-4 ${done ? 'border-emerald-400' : 'border-red-400'}`}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs uppercase tracking-widest text-sand-500">{c.type || 'discussion'}</div>
                <h2 className="text-xl font-semibold mt-1">{c.title}</h2>
                {c.body && <p className="text-sm text-sand-700 mt-1">{c.body}</p>}
              </div>
              {!done && (
                <button onClick={()=>resolve(c.id)} disabled={busyId===c.id} className="btn-primary text-sm">
                  <Check size={16}/>Marquer comme résolu
                </button>
              )}
            </div>

            {/* Weighted consensus banner — surfaces the engine's verdict + how
                close the binding side is to the configured threshold. */}
            <div className={`mt-4 flex flex-wrap items-center gap-3 px-3 py-2 rounded-lg border ${badge.cls}`}>
              <BadgeIcon size={16} />
              <span className="text-sm font-medium">{badge.label}</span>
              {autoResolved && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 border border-current">
                  Auto-résolu par consensus
                </span>
              )}
              <span className="text-xs ml-auto opacity-80">
                Voix expertes : <strong>{expertVoices}</strong> / {quorum} (quorum)
              </span>
            </div>

            {/* Weighted ratio bar — emerald for approve, red for reject. */}
            {bindingW > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-sand-600 mb-1">
                  <span>Pondéré : {approveW} approuver · {rejectW} rejeter</span>
                  <span>{approvePct}% approbation</span>
                </div>
                <div className="h-2 rounded-full bg-red-100 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${approvePct}%` }} />
                </div>
              </div>
            )}

            {/* Raw counts kept as quick-glance tiles. */}
            {c.tally && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                {[
                  { k: 'approuver', v: c.tally.approve_count ?? c.tally.approve ?? 0 },
                  { k: 'rejeter', v: c.tally.reject_count ?? c.tally.reject ?? 0 },
                  { k: 'abstention', v: c.tally.abstain_count ?? c.tally.abstain ?? 0 },
                ].map(({ k, v }) => (
                  <div key={k} className="p-2 rounded bg-sand-50 border border-sand-100 text-center">
                    <div className="text-xs text-sand-500 uppercase">{k}</div>
                    <div className="font-semibold">{v}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { value: 'approve',  label: 'Approuver', Icon: ThumbsUp },
                { value: 'reject',   label: 'Rejeter',   Icon: ThumbsDown },
                { value: 'abstain',  label: 'Abstention', Icon: MinusCircle },
              ].map(({ value, label, Icon }) => (
                <button key={value} onClick={()=>support(c.id, value)} disabled={busyId===c.id || done}
                        className="btn-secondary text-xs disabled:opacity-50">
                  <Icon size={12}/>{label}
                </button>
              ))}
            </div>

            <div className="mt-5 border-t border-sand-200 pt-4">
              <h3 className="font-medium flex items-center gap-2 mb-3"><MessageSquare size={16}/>Discussion</h3>
              <ul className="space-y-2">
                {(c.messages || []).map((m) => (
                  <li key={m.id} className="text-sm bg-white border border-sand-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.author?.full_name || m.author?.email || 'Utilisateur'}</span>
                      <span className="text-xs text-sand-500">{m.created_at && new Date(m.created_at).toLocaleString('fr-FR')}</span>
                    </div>
                    <div className="text-sand-700 mt-1 whitespace-pre-line">{m.body}</div>
                  </li>
                ))}
                {(c.messages || []).length === 0 && <li className="text-sm text-sand-500">Aucun commentaire.</li>}
              </ul>
              {!done && (
                <div className="mt-3 flex gap-2">
                  <input className="input flex-1" placeholder="Ajouter un commentaire..."
                         value={draft[c.id] || ''}
                         onChange={(e)=>setDraft({ ...draft, [c.id]: e.target.value })}
                         onKeyDown={(e)=>{ if (e.key==='Enter') sendMessage(c.id) }}/>
                  <button onClick={()=>sendMessage(c.id)} disabled={busyId===c.id} className="btn-primary text-sm">Envoyer</button>
                </div>
              )}
            </div>
          </div>
        )})}
      </div>
    </div>
  )
}
