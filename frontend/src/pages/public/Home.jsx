import { Link } from 'react-router-dom'
import { ArrowRight, Compass, Users, BookOpen, Sparkles, MapPin, Bot } from 'lucide-react'
import { PROJECTS } from '../../data/projects.js'
import ProjectCard from '../../components/ProjectCard.jsx'

export default function Home() {
  const featured = PROJECTS.slice(0, 3)
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10"
             style={{ background: 'linear-gradient(135deg,#3e2417 0%, #67241a 60%, #a56432 100%)' }}/>
        <div className="absolute inset-0 -z-10 opacity-15"
             style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,.5) 0 1px, transparent 1px 18px)' }}/>
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <span className="chip bg-white/15 text-sand-100 backdrop-blur">Plateforme collaborative</span>
            <h1 className="font-display text-4xl md:text-6xl font-bold mt-4 leading-[1.05]">
              Le patrimoine architectural <span className="text-sand-200">algérien</span>, documenté ensemble.
            </h1>
            <p className="mt-5 text-sand-100 text-lg max-w-xl">
              Une plateforme dédiée à la consultation, la collaboration scientifique et la valorisation
              des monuments et sites architecturaux d'Algérie.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/explorer" className="btn-primary bg-white !text-terracotta-700 hover:!bg-sand-100">
                <Compass size={18}/>Explorer le patrimoine
                <ArrowRight size={16}/>
              </Link>
              <Link to="/inscription" className="btn-secondary !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
                Devenir contributeur
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              {[
                { c:'#cd5028', t:'Casbah d\'Alger', s:'Patrimoine UNESCO' },
                { c:'#824c2b', t:'Timgad', s:'Cité romaine' },
                { c:'#bd7d3d', t:'Ghardaïa', s:'Vallée du M\'Zab' },
                { c:'#67241a', t:'Tlemcen', s:'Capitale mérinide' },
              ].map((it,i) => (
                <div key={i} className="rounded-xl overflow-hidden h-32 md:h-40 relative shadow-soft"
                     style={{ background: `linear-gradient(135deg, ${it.c}, #3e2417)` }}>
                  <div className="absolute inset-0 opacity-25"
                       style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,.5) 0 1px, transparent 1px 12px)' }}/>
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="font-display text-lg font-semibold">{it.t}</div>
                    <div className="text-xs text-sand-200">{it.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="section-title text-center">Une plateforme pensée pour la recherche</h2>
        <p className="section-subtitle text-center max-w-2xl mx-auto">Quatre piliers pour produire du contenu scientifique structuré et accessible.</p>
        <div className="grid md:grid-cols-4 gap-5 mt-10">
          {[
            { icon: BookOpen, t:'Consultation publique', d:'Découvrir librement le patrimoine et ses œuvres.' },
            { icon: Users, t:'Collaboration entre experts', d:'Édition partagée, annotations, gestion des conflits.' },
            { icon: Sparkles, t:'Contenu scientifique', d:'Versions, sources, validations et exports PDF.' },
            { icon: Bot, t:'Outils intelligents', d:'Chatbot documentaire et annotation automatique.' },
          ].map((f,i) => (
            <div key={i} className="card p-5">
              <div className="w-10 h-10 rounded-lg bg-terracotta-100 text-terracotta-700 grid place-items-center mb-3">
                <f.icon size={20}/>
              </div>
              <div className="font-semibold text-sand-900">{f.t}</div>
              <p className="text-sm text-sand-600 mt-1">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured projects */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="section-title">Projets à la une</h2>
            <p className="section-subtitle">Aperçu des contributions récentes de la communauté.</p>
          </div>
          <Link to="/explorer" className="btn-secondary">Voir tout <ArrowRight size={16}/></Link>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {featured.map(p => <ProjectCard key={p.id} project={p}/>)}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 my-16">
        <div className="card p-8 md:p-12 text-center bg-gradient-to-br from-sand-100 to-sand-50">
          <MapPin className="mx-auto text-terracotta-600" size={32}/>
          <h2 className="section-title mt-3">Contribuez à la mémoire architecturale du pays</h2>
          <p className="section-subtitle max-w-2xl mx-auto">
            Rejoignez les architectes, historiens et chercheurs qui documentent et préservent notre patrimoine.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/inscription" className="btn-primary">Créer un compte</Link>
            <Link to="/connexion" className="btn-secondary">Se connecter</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
