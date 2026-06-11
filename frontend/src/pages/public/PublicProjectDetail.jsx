import { useEffect, useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import {
  ArrowLeft, MapPin, Calendar, Building2, Users, Lock,
  Image as ImageIcon, Loader2, PenSquare, UserPlus, FileDown, Check,
} from 'lucide-react'
import { resourceToCard } from '../../data/projects.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { heritage, exports_ } from '../../lib/api.js'

export default function PublicProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Expert / logged-in actions
  const [joining, setJoining] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    heritage.resource(id)
      .then((r) => {
        if (cancelled) return
        const card = resourceToCard(r)
        setProject(card)
        setIsMember(Boolean(card.project?.is_member))
      })
      .catch((e) => { if (!cancelled) { if (e.status === 404) setNotFound(true) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  const projectId = project?.project?.id || null
  const images = project?.project?.images || []

  async function handleJoin() {
    if (!projectId) return
    setJoining(true); setActionError(null)
    try {
      await heritage.join(projectId)
      setIsMember(true)
    } catch (e) {
      setActionError(e.message || 'Impossible de rejoindre le projet.')
    } finally {
      setJoining(false)
    }
  }

  async function handleExportPdf() {
    if (!projectId) return
    setExporting(true); setActionError(null); setExportDone(false)
    try {
      await exports_.create({
        project: projectId,
        format: 'pdf',
        options: { images: true, annotations: true, sources: true, history: true },
      })
      setExportDone(true)
    } catch (e) {
      setActionError(e.message || 'La génération du PDF a échoué.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-sand-600 inline-flex items-center gap-2">
        <Loader2 className="animate-spin" size={18}/> Chargement...
      </div>
    )
  }
  if (notFound || !project) return <Navigate to="/explorer" replace/>

  const hasCover = Boolean(project.coverImage)

  return (
    <div>
      {/* Hero — real cover photo when available, gradient fallback otherwise */}
      <div className="relative h-72 md:h-96"
           style={hasCover
             ? undefined
             : { background: `linear-gradient(135deg, ${project.coverColor}, #3e2417)` }}>
        {hasCover && (
          <img src={project.coverImage} alt={project.name}
               className="absolute inset-0 w-full h-full object-cover"/>
        )}
        <div className="absolute inset-0"
             style={{ background: hasCover
               ? 'linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,.15) 55%, transparent)'
               : undefined,
               opacity: hasCover ? 1 : 0.2,
               backgroundImage: hasCover ? undefined
                 : 'repeating-linear-gradient(45deg, rgba(255,255,255,.5) 0 1px, transparent 1px 14px)' }}/>
        <div className="max-w-7xl mx-auto px-4 h-full flex flex-col justify-end pb-6 relative">
          <Link to="/explorer" className="absolute top-4 left-4 btn !bg-white/15 !text-white hover:!bg-white/25 backdrop-blur">
            <ArrowLeft size={16}/>Retour
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={project.status}/>
            <span className="chip bg-white/20 text-white">{project.type}</span>
            <span className="chip bg-white/20 text-white">{project.period}</span>
            {project.classification === 'unesco' && (
              <span className="chip bg-terracotta-600 text-white">UNESCO</span>
            )}
          </div>
          <h1 className="font-display text-white text-4xl md:text-5xl font-bold drop-shadow">{project.name}</h1>
          {project.name_ar && (
            <div dir="rtl" className="text-sand-100 text-2xl font-display mt-1 drop-shadow">{project.name_ar}</div>
          )}
          {project.summary && <p className="text-sand-100 mt-2 max-w-2xl drop-shadow">{project.summary}</p>}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-6">
            <h2 className="text-xl font-semibold">Description</h2>
            <p className="mt-3 text-sand-700 leading-relaxed whitespace-pre-line">
              {project.description || 'Aucune description disponible pour cette ressource.'}
            </p>
          </section>

          {/* Image gallery from the linked project's media */}
          {images.length > 0 && (
            <section className="card p-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <ImageIcon size={18} className="text-terracotta-600"/>
                Galerie <span className="text-sand-500 font-normal">({images.length})</span>
              </h2>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((img) => (
                  <a key={img.id} href={img.url} target="_blank" rel="noreferrer"
                     className="group block rounded-lg overflow-hidden h-32 relative bg-sand-100">
                    <img src={img.url} alt={img.caption || project.name}
                         loading="lazy"
                         className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"/>
                    {img.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <span className="text-white text-xs line-clamp-1">{img.caption}</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Anonymous CTA */}
          {!user && (
            <section className="card p-6 bg-gradient-to-br from-terracotta-50 to-sand-50 border-terracotta-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-terracotta-600 text-white grid place-items-center"><Lock size={18}/></div>
                <div>
                  <h3 className="font-semibold">Fonctionnalités avancées réservées aux utilisateurs connectés</h3>
                  <p className="text-sm text-sand-700 mt-1">
                    Connectez-vous pour accéder à l'éditeur collaboratif, aux annotations détaillées,
                    à l'historique des versions, à la génération de PDF et au système de gestion des conflits.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link to="/connexion" className="btn-primary">Se connecter</Link>
                    <Link to="/inscription" className="btn-secondary">S'inscrire</Link>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold">Informations</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-sand-700"><MapPin size={16} className="text-terracotta-600"/>{project.region || '—'}, Algérie</li>
              <li className="flex items-center gap-2 text-sand-700"><Calendar size={16} className="text-terracotta-600"/>Période {project.period}</li>
              <li className="flex items-center gap-2 text-sand-700"><Building2 size={16} className="text-terracotta-600"/>{project.type}</li>
              {project.classification && (
                <li className="flex items-center gap-2 text-sand-700">
                  <ImageIcon size={16} className="text-terracotta-600"/>Classement: {project.classification}
                </li>
              )}
              {project.project && (
                <li className="flex items-center gap-2 text-sand-700">
                  <Users size={16} className="text-terracotta-600"/>{project.project.member_count} contributeur(s)
                </li>
              )}
            </ul>
          </div>

          {/* Logged-in / expert actions */}
          {user && projectId && (
            <div className="card p-5 space-y-3">
              <h3 className="font-semibold">Espace collaboratif</h3>
              <Link to={`/app/projets/${projectId}`} className="btn-primary w-full justify-center">
                <PenSquare size={16}/>Ouvrir l'éditeur
              </Link>
              {!isMember ? (
                <button onClick={handleJoin} disabled={joining}
                        className="btn-secondary w-full justify-center">
                  {joining ? <Loader2 size={16} className="animate-spin"/> : <UserPlus size={16}/>}
                  Rejoindre le projet
                </button>
              ) : (
                <div className="text-sm text-emerald-700 flex items-center gap-2 justify-center">
                  <Check size={16}/>Vous êtes membre
                </div>
              )}
              <button onClick={handleExportPdf} disabled={exporting}
                      className="btn-secondary w-full justify-center">
                {exporting ? <Loader2 size={16} className="animate-spin"/> : <FileDown size={16}/>}
                Générer un PDF
              </button>
              {exportDone && (
                <p className="text-xs text-emerald-700">
                  PDF en cours de génération.{' '}
                  <Link to="/app/export" className="underline">Centre d'export</Link>
                </p>
              )}
              {actionError && <p className="text-xs text-red-600">{actionError}</p>}
            </div>
          )}

          {/* Real Leaflet map */}
          {(project.lat != null && project.lng != null) && (
            <div className="card p-5">
              <h3 className="font-semibold">Localisation</h3>
              <div className="mt-3 h-56 rounded-lg overflow-hidden border border-sand-200">
                <MapContainer
                  center={[project.lat, project.lng]}
                  zoom={14}
                  scrollWheelZoom={false}
                  className="w-full h-full"
                  style={{ background: '#f5f1e8' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[project.lat, project.lng]}>
                    <Popup>
                      <div className="font-semibold text-sand-900">{project.name}</div>
                      <div className="text-xs text-sand-700">{project.region}, Algérie</div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
              <div className="mt-2 text-xs text-sand-500">
                {project.lat.toFixed(4)}, {project.lng.toFixed(4)}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
